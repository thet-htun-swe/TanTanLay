/**
 * Simple UUID generator for React Native that doesn't rely on crypto.getRandomValues()
 * This is a workaround for the Hermes JavaScript engine which doesn't support the Web Crypto API
 */

export function generateUUID(): string {
  // Use Math.random() to generate random values
  const randomValues = [];
  for (let i = 0; i < 16; i++) {
    randomValues.push(Math.floor(Math.random() * 256));
  }

  // Set the version (4) and variant bits
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40; // version 4
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80; // variant 10

  // Convert to hex string
  const hexDigits = [];
  for (let i = 0; i < 16; i++) {
    hexDigits.push(randomValues[i].toString(16).padStart(2, '0'));
  }

  // Format as UUID
  return [
    hexDigits.slice(0, 4).join(''),
    hexDigits.slice(4, 6).join(''),
    hexDigits.slice(6, 8).join(''),
    hexDigits.slice(8, 10).join(''),
    hexDigits.slice(10, 16).join('')
  ].join('-');
}
