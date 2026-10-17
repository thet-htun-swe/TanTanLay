import { LineRasterizer, RasterImage } from "@/utils/escPos";

// Turns text into receipt pictures using a hidden WebView (see
// components/ReceiptTextRenderer.tsx). The WebView draws with the phone's own
// fonts, so Myanmar text is shaped exactly like on screen.

const RENDER_TIMEOUT_MS = 10000;

type Pending = {
  resolve: (image: RasterImage) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

let inject: ((script: string) => void) | null = null;
let ready = false;
let nextId = 1;
const pending = new Map<number, Pending>();
let readyWaiters: (() => void)[] = [];

export const attachTextRenderer = (injectScript: (script: string) => void) => {
  inject = injectScript;
  ready = false;
};

export const detachTextRenderer = () => {
  inject = null;
  ready = false;
  for (const [id, request] of pending) {
    clearTimeout(request.timer);
    request.reject(new Error("Receipt text renderer closed"));
    pending.delete(id);
  }
};

const base64ToBytes = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const handleTextRendererMessage = (raw: string) => {
  let message: {
    type: string;
    id?: number;
    width?: number;
    height?: number;
    data?: string;
    message?: string;
  };
  try {
    message = JSON.parse(raw);
  } catch {
    return;
  }

  if (message.type === "ready") {
    ready = true;
    const waiters = readyWaiters;
    readyWaiters = [];
    waiters.forEach((wake) => wake());
    return;
  }

  const request = message.id ? pending.get(message.id) : undefined;
  if (!request || !message.id) return;
  pending.delete(message.id);
  clearTimeout(request.timer);

  if (message.type === "result" && message.data && message.width && message.height) {
    request.resolve({
      width: message.width,
      height: message.height,
      data: base64ToBytes(message.data),
    });
  } else {
    request.reject(new Error(message.message || "Could not draw receipt text"));
  }
};

const waitUntilReady = () =>
  new Promise<void>((resolve, reject) => {
    if (ready) return resolve();
    const timer = setTimeout(() => {
      readyWaiters = readyWaiters.filter((wake) => wake !== onReady);
      reject(new Error("Receipt text renderer is not ready. Please try again."));
    }, RENDER_TIMEOUT_MS);
    const onReady = () => {
      clearTimeout(timer);
      resolve();
    };
    readyWaiters.push(onReady);
  });

export const rasterizeLine: LineRasterizer = async (text, options) => {
  if (!inject) {
    throw new Error("Could not prepare Myanmar text for printing. Please restart the app.");
  }
  await waitUntilReady();

  const id = nextId++;
  return new Promise<RasterImage>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("Drawing receipt text took too long. Please try again."));
    }, RENDER_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });

    const args = JSON.stringify({
      id,
      text,
      width: options.width,
      bold: !!options.bold,
      center: !!options.center,
    });
    inject?.(`window.renderReceiptLine(${args}); true;`);
  });
};

// Page loaded in the hidden WebView: draws a line on a canvas and sends back
// the black/white dots packed 8 per byte (base64).
export const TEXT_RENDERER_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body>
<script>
  var FONT_SIZE = 24;

  function post(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  // Break long text to fit the paper. Never break before a combining mark or
  // after the Myanmar stacking sign (U+1039), so syllables stay whole.
  function canBreakBefore(chars, i) {
    return !/\\p{M}/u.test(chars[i]) && chars[i - 1] !== "\\u1039";
  }

  function wrap(ctx, text, maxWidth) {
    var lines = [];
    var chars = Array.from(text);
    while (chars.length) {
      if (ctx.measureText(chars.join("")).width <= maxWidth) {
        lines.push(chars.join(""));
        break;
      }
      var cut = 0, lastSpace = 0;
      for (var i = 1; i <= chars.length; i++) {
        if (ctx.measureText(chars.slice(0, i).join("")).width > maxWidth) break;
        if (i < chars.length && canBreakBefore(chars, i)) {
          cut = i;
          if (chars[i] === " ") lastSpace = i;
        }
      }
      if (lastSpace > 0) cut = lastSpace;
      if (cut === 0) cut = Math.max(1, i - 1);
      lines.push(chars.slice(0, cut).join(""));
      chars = chars.slice(cut);
      while (chars[0] === " ") chars.shift();
    }
    return lines;
  }

  window.renderReceiptLine = function (args) {
    try {
      var width = args.width;
      var font = (args.bold ? "bold " : "") + FONT_SIZE + "px sans-serif";
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      ctx.font = font;

      var lines = wrap(ctx, args.text, width);
      var ascent = FONT_SIZE * 0.9, descent = FONT_SIZE * 0.4;
      lines.forEach(function (line) {
        var m = ctx.measureText(line);
        if (m.actualBoundingBoxAscent) ascent = Math.max(ascent, m.actualBoundingBoxAscent);
        if (m.actualBoundingBoxDescent) descent = Math.max(descent, m.actualBoundingBoxDescent);
      });
      var lineHeight = Math.ceil(ascent + descent) + 6;

      canvas.width = width;
      canvas.height = lineHeight * lines.length;
      ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.font = font;
      ctx.textBaseline = "alphabetic";
      lines.forEach(function (line, index) {
        var x = args.center ? Math.max(0, (width - ctx.measureText(line).width) / 2) : 0;
        ctx.fillText(line, x, index * lineHeight + 3 + ascent);
      });

      var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      var bytesPerRow = width / 8;
      var packed = new Uint8Array(bytesPerRow * canvas.height);
      for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < width; x++) {
          var p = (y * width + x) * 4;
          var light = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
          // A little darker than half-grey so thin strokes are kept
          if (light < 170) packed[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
        }
      }

      var binary = "";
      for (var b = 0; b < packed.length; b++) binary += String.fromCharCode(packed[b]);
      post({ type: "result", id: args.id, width: width, height: canvas.height, data: btoa(binary) });
    } catch (error) {
      post({ type: "error", id: args.id, message: String(error) });
    }
  };

  post({ type: "ready" });
</script>
</body></html>`;
