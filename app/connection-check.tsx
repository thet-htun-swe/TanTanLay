import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  ConnectionTest,
  connectionTestGroups,
  customServerTests,
  normalizeServerUrl,
} from "@/constants/connectionTests";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabaseConfig, supabaseHost } from "@/lib/supabase";
import { CHECK_TIMEOUT_MS, CheckResult, runConnectionTest } from "@/services/connectionCheck";

type TestState = CheckResult | "running";

const STATUS_TEXT = { ok: "Reachable", timeout: "Timed out", failed: "Failed" } as const;
const STATUS_MARK = { ok: "✓", timeout: "⏱", failed: "✕" } as const;

// Login / Settings > "Check connection": which addresses the APP can reach on
// this network (the phone browser can take a different route), to choose a
// proxy that works before paying for one. Works signed in or out.
export default function ConnectionCheckScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const groups = useMemo(
    () => connectionTestGroups(supabaseConfig.url).filter((group) => group.tests.length > 0),
    [],
  );
  const [results, setResults] = useState<Record<string, TestState>>({});
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  // "Test another address"
  const [customInput, setCustomInput] = useState("");
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const allTests = groups.flatMap((group) => group.tests);
  const customTests = customUrl ? customServerTests(customUrl) : [];
  const anyRunning = (tests: ConnectionTest[]) => tests.some((test) => results[test.id] === "running");
  const isRunning = anyRunning(allTests);
  const isCustomRunning = anyRunning(customTests);
  const done = (id: string) => {
    const state = results[id];
    return state && state !== "running" ? state : null;
  };

  const runAll = async () => {
    setCheckedAt(new Date());
    setResults(Object.fromEntries(allTests.map((test) => [test.id, "running" as const])));
    await Promise.all(
      allTests.map(async (test) => {
        const result = await runConnectionTest(test, supabaseConfig.key);
        setResults((current) => ({ ...current, [test.id]: result }));
      }),
    );
  };

  const runCustom = async () => {
    const url = normalizeServerUrl(customInput);
    if (!url) {
      setCustomError("Enter an address like abc123.cloudfront.net or api.example.com");
      return;
    }
    setCustomError(null);
    setCustomUrl(url);
    if (!checkedAt) setCheckedAt(new Date());
    const tests = customServerTests(url);
    setResults((current) => ({
      ...current,
      ...Object.fromEntries(tests.map((test) => [test.id, "running" as const])),
    }));
    await Promise.all(
      tests.map(async (test) => {
        const result = await runConnectionTest(test, supabaseConfig.key);
        setResults((current) => ({ ...current, [test.id]: result }));
      }),
    );
  };

  // Short plain-language summary once the main tests are finished
  const summary = (() => {
    const group = (title: string) => groups.find((g) => g.title === title)?.tests ?? [];
    const serverResults = group("This app's server").map((t) => done(t.id));
    const cloudflareResults = group("Cloudflare with own domains").map((t) => done(t.id));
    if (!checkedAt || serverResults.some((r) => !r) || cloudflareResults.some((r) => !r)) return [];

    const lines: { tone: "good" | "bad" | "info"; text: string }[] = [];
    if (serverResults.every((r) => r?.status === "ok")) {
      lines.push({ tone: "good", text: "This network can reach the app's server." });
    } else {
      lines.push({ tone: "bad", text: "The app's server cannot be reached properly on this network." });
      if (cloudflareResults.every((r) => r?.status === "ok")) {
        lines.push({
          tone: "info",
          text: "Other Cloudflare sites work, so a custom domain on Cloudflare will likely work.",
        });
      } else if (cloudflareResults.every((r) => r?.status !== "ok")) {
        lines.push({ tone: "info", text: "Cloudflare sites look blocked on this network too." });
      }
    }
    const reachableHosting = group("Other hosting")
      .filter((t) => done(t.id)?.status === "ok")
      .map((t) => t.name.split(" (")[0]);
    if (reachableHosting.length) {
      lines.push({ tone: "info", text: `Also reachable: ${reachableHosting.join(", ")}.` });
    }
    return lines;
  })();

  const shareResults = async () => {
    const lineFor = (test: ConnectionTest) => {
      const result = done(test.id);
      return result
        ? `${STATUS_MARK[result.status]} ${test.name}: ${STATUS_TEXT[result.status]} - ${result.detail} (${(result.ms / 1000).toFixed(1)} s)`
        : `- ${test.name}: not run`;
    };
    const text = [
      `${Constants.expoConfig?.name ?? "App"} - connection check`,
      `${checkedAt?.toLocaleString() ?? ""} · app ${Constants.expoConfig?.version ?? "-"}`,
      `Server: ${supabaseHost}`,
      ...(customUrl ? ["", `[Tested address: ${customUrl}]`, ...customTests.map(lineFor)] : []),
      ...groups.flatMap((group) => ["", `[${group.title}]`, ...group.tests.map(lineFor)]),
      ...(summary.length ? ["", ...summary.map((line) => line.text)] : []),
    ].join("\n");
    try {
      await Share.share({ message: text });
    } catch (error) {
      Alert.alert("Share", error instanceof Error ? error.message : "Could not share the results");
    }
  };

  const statusColor = (state: TestState | undefined) =>
    !state || state === "running"
      ? theme.muted
      : state.status === "ok"
        ? theme.success
        : state.status === "timeout"
          ? theme.warning
          : theme.danger;

  const renderRow = (test: ConnectionTest, index: number) => {
    const state = results[test.id];
    const result = done(test.id);
    return (
      <View
        key={test.id}
        style={[
          styles.testRow,
          index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
        ]}
      >
        <View style={styles.statusIcon}>
          {state === "running" ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : (
            <Ionicons
              name={
                !result
                  ? "ellipse-outline"
                  : result.status === "ok"
                    ? "checkmark-circle"
                    : result.status === "timeout"
                      ? "time-outline"
                      : "close-circle"
              }
              size={20}
              color={statusColor(state)}
            />
          )}
        </View>
        <View style={styles.testText}>
          <ThemedText style={styles.testName}>{test.name}</ThemedText>
          {result && (
            <Text style={[styles.testDetail, { color: theme.muted }]} numberOfLines={3}>
              {result.detail} · {(result.ms / 1000).toFixed(1)} s
            </Text>
          )}
        </View>
        {result && (
          <Text style={[styles.statusText, { color: statusColor(state) }]}>
            {STATUS_TEXT[result.status]}
          </Text>
        )}
      </View>
    );
  };

  const customFinished = customTests.length > 0 && customTests.every((test) => done(test.id));
  const customPassed = customFinished && customTests.every((test) => done(test.id)?.status === "ok");

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={[styles.intro, { color: theme.muted }]}>
          Tests which addresses this app can reach on the current network (Wi-Fi or mobile
          data). Turn off any VPN first. Each test waits up to {CHECK_TIMEOUT_MS / 1000} seconds.
        </ThemedText>
        <ThemedText style={[styles.server, { color: theme.muted }]}>Server: {supabaseHost}</ThemedText>

        <Button
          title={isRunning ? "Checking..." : checkedAt ? "Run again" : "Run check"}
          onPress={runAll}
          disabled={isRunning}
        />

        {summary.length > 0 && (
          <Card style={styles.summary}>
            {summary.map((line) => (
              <View key={line.text} style={styles.summaryRow}>
                <Ionicons
                  name={line.tone === "good" ? "checkmark-circle" : line.tone === "bad" ? "alert-circle" : "information-circle"}
                  size={18}
                  color={line.tone === "good" ? theme.success : line.tone === "bad" ? theme.danger : theme.tint}
                />
                <ThemedText style={styles.summaryText}>{line.text}</ThemedText>
              </View>
            ))}
          </Card>
        )}

        {/* Test a new proxy address (custom domain, CloudFront...) without a new build */}
        <Card>
          <ThemedText style={styles.groupTitle}>Test another address</ThemedText>
          <ThemedText style={[styles.groupHint, { color: theme.muted }]}>
            Check a new proxy address before the app uses it. It must pass all three tests.
          </ThemedText>
          <Input
            value={customInput}
            onChangeText={(text) => {
              setCustomInput(text);
              setCustomError(null);
            }}
            placeholder="e.g. abc123.cloudfront.net"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={runCustom}
            error={customError ?? undefined}
            containerStyle={styles.customInput}
          />
          <Button
            title={isCustomRunning ? "Testing..." : "Test this address"}
            variant="secondary"
            onPress={runCustom}
            disabled={isCustomRunning || !customInput.trim()}
          />
          {customUrl && (
            <>
              <ThemedText style={[styles.testedUrl, { color: theme.muted }]} numberOfLines={1}>
                {customUrl}
              </ThemedText>
              {customTests.map(renderRow)}
              {customFinished && (
                <View style={styles.summaryRow}>
                  <Ionicons
                    name={customPassed ? "checkmark-circle" : "alert-circle"}
                    size={18}
                    color={customPassed ? theme.success : theme.danger}
                  />
                  <ThemedText style={styles.summaryText}>
                    {customPassed
                      ? "This address works on this network."
                      : "This address does not fully work on this network."}
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </Card>

        {groups.map((group) => (
          <Card key={group.title}>
            <ThemedText style={styles.groupTitle}>{group.title}</ThemedText>
            <ThemedText style={[styles.groupHint, { color: theme.muted }]}>{group.hint}</ThemedText>
            {group.tests.map(renderRow)}
          </Card>
        ))}

        {checkedAt && !isRunning && !isCustomRunning && (
          <Button title="Share results" variant="secondary" onPress={shareResults} style={styles.share} />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
  },
  server: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 14,
  },
  summary: {
    marginTop: 14,
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  groupHint: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  statusIcon: {
    width: 22,
    alignItems: "center",
  },
  testText: {
    flex: 1,
  },
  testName: {
    fontSize: 15,
  },
  testDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  customInput: {
    marginBottom: 12,
  },
  testedUrl: {
    fontSize: 12,
    marginTop: 12,
  },
  share: {
    marginTop: 8,
  },
});
