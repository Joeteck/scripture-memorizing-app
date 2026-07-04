// src/lib/monitoring.ts
//
// Custom error handling — no third-party crash reporting service, no DSN
// to configure, no dashboard to set up. Errors go to three places:
//
//   1. console (dev only) — immediate feedback while you're building.
//   2. a local SQLite queue (src/lib/db.ts: error_log_queue) — every
//      error lands here first, so nothing is lost if the device is
//      offline when it happens.
//   3. a Supabase table (error_logs) — synced from the local queue
//      whenever the app has a connection. This is how you "see" critical
//      errors: open Supabase Studio -> Table Editor -> error_logs, or
//      run a query like:
//
//        select severity, message, context, app_version, created_at
//        from error_logs
//        where severity = 'fatal'
//        order by created_at desc;
//
//      Run supabase/schema.sql once (adds the error_logs table) if you
//      haven't already.
//
// Every call site that used to import logError/logMessage/setMonitoringUser
// from this file keeps working unchanged — only the internals changed.
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  queueErrorLog,
  getQueuedErrorLogs,
  deleteQueuedErrorLogs,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";

type Severity = "fatal" | "error" | "warning";

const APP_VERSION =
  Constants.expoConfig?.version ?? "unknown";

let currentUserId: string | null = null;

// Soft cap on how many syncs we attempt per app session — protects
// against a tight error loop (e.g. something failing on every render)
// hammering the Supabase table. Errors still queue locally past this
// limit and get synced next session; they're just not spammed live.
const MAX_SYNCS_PER_SESSION = 40;
let syncsThisSession = 0;

/** Call once, as early as possible (top of app/_layout.tsx). */
export function initMonitoring() {
  // Nothing to initialize eagerly — the local queue table is created by
  // initDb(), and Supabase is already set up in src/lib/supabase.ts.
  // Kick off a best-effort flush of anything left over from a previous
  // offline session.
  flushErrorLogs().catch(() => {});
}

function safeStringifyContext(context?: Record<string, unknown>): string | null {
  if (!context) return null;
  try {
    return JSON.stringify(context);
  } catch {
    return JSON.stringify({ note: "context was not serializable" });
  }
}

async function record(severity: Severity, message: string, stack: string | null, context?: Record<string, unknown>) {
  try {
    await queueErrorLog({
      severity,
      message,
      stack,
      context: safeStringifyContext(context),
    });
  } catch {
    // If even the local queue fails (e.g. disk full), there's nothing
    // further we can do — swallow rather than crash the app over a
    // logging failure.
  }

  flushErrorLogs().catch(() => {});
}

/**
 * Report a caught error. Use this in place of `console.error` for
 * anything that represents a real, unexpected failure (failed network
 * call, unexpected null, thrown exception) — not for expected
 * conditions like "no internet" that the UI already handles gracefully.
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));

  if (__DEV__) {
    console.error("[error]", err, context ?? "");
  }

  record("error", err.message, err.stack ?? null, context);
}

/** Report a non-fatal, informational event worth tracking. */
export function logMessage(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.warn("[event]", message, context ?? "");
  }

  record("warning", message, null, context);
}

/** Report a fatal, app-crashing error (used by ErrorBoundary). */
export function logFatal(error: unknown, context?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));

  if (__DEV__) {
    console.error("[fatal]", err, context ?? "");
  }

  record("fatal", err.message, err.stack ?? null, context);
}

/** Attach non-PII identifying info so error rows can be grouped by user. */
export function setMonitoringUser(userId: string | null) {
  currentUserId = userId;
}

/**
 * Push everything sitting in the local queue up to Supabase, deleting
 * each row locally once it's confirmed synced. Safe to call often —
 * it's a no-op if the queue is empty, and any failure (offline, RLS,
 * etc.) just leaves rows queued for the next attempt.
 */
export async function flushErrorLogs() {
  if (syncsThisSession >= MAX_SYNCS_PER_SESSION) return;

  let rows;
  try {
    rows = await getQueuedErrorLogs(20);
  } catch {
    return;
  }

  if (!rows || rows.length === 0) return;

  const synced: number[] = [];

  for (const row of rows) {
    if (syncsThisSession >= MAX_SYNCS_PER_SESSION) break;

    try {
      const { error } = await supabase.from("error_logs").insert({
        user_id: currentUserId,
        severity: row.severity,
        message: row.message,
        stack: row.stack,
        context: row.context ? JSON.parse(row.context) : null,
        platform: Platform.OS,
        app_version: APP_VERSION,
      });

      if (!error) {
        synced.push(row.id);
        syncsThisSession += 1;
      }
    } catch {
      // Offline or request failed — stop this pass, row stays queued.
      break;
    }
  }

  if (synced.length > 0) {
    await deleteQueuedErrorLogs(synced).catch(() => {});
  }
}
