// src/lib/monitoring.ts
//
// Thin wrapper around Sentry so the rest of the app never imports
// @sentry/react-native directly. This keeps error reporting:
//   - a single place to configure,
//   - safe to call even when no DSN is set (e.g. local dev without
//     Sentry credentials — everything below becomes a harmless no-op
//     and falls back to a plain console.warn in dev),
//   - easy to swap for a different provider later without touching
//     every call site.
//
// Setup required before this actually reports anything: create a free
// project at sentry.io, then set EXPO_PUBLIC_SENTRY_DSN in your .env
// (see .env.example). Until that's set, initMonitoring() is a no-op.
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const DSN =
  Constants.expoConfig?.extra?.sentryDsn ??
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  "";

let initialized = false;

/** Call once, as early as possible (top of app/_layout.tsx). */
export function initMonitoring() {
  if (!DSN) {
    if (__DEV__) {
      console.warn(
        "[monitoring] EXPO_PUBLIC_SENTRY_DSN is not set — crash reporting is disabled. " +
          "See PRODUCTION_AUDIT_REPORT.md for setup steps."
      );
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    debug: __DEV__,
    enabled: !__DEV__, // avoid noisy dev-machine crashes cluttering the dashboard
    tracesSampleRate: 0.2,
    environment: __DEV__ ? "development" : "production",
  });

  initialized = true;
}

/**
 * Report a caught error. Use this in place of `console.error` for
 * anything that represents a real, unexpected failure (failed network
 * call, unexpected null, thrown exception) — not for expected
 * conditions like "no internet" that the UI already handles gracefully.
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error("[error]", error, context ?? "");
  }
  if (initialized) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}

/** Report a non-fatal, informational event worth tracking in Sentry. */
export function logMessage(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.warn("[event]", message, context ?? "");
  }
  if (initialized) {
    Sentry.captureMessage(message, context ? { extra: context } : undefined);
  }
}

/** Attach non-PII identifying info so crash reports can be grouped by user. */
export function setMonitoringUser(userId: string | null) {
  if (!initialized) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

export { Sentry };
