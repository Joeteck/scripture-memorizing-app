// src/lib/backgroundBackup.ts
//
// src/lib/backup.ts's maybeAutoBackup() only ever runs when the app is
// open (on launch and on foreground). That covers most real usage, but
// it means someone who backs up weekly and doesn't open the app for two
// weeks won't get a backup until they happen to open it again. This file
// registers a real OS-level background task (via expo-task-manager +
// expo-background-task) so the check also runs periodically without the
// app being open at all — the same mechanism apps like weather or mail
// clients use for periodic background refresh.
//
// Both iOS and Android treat "minimum interval" as a floor, not a
// guarantee — the OS decides the actual timing based on battery, network,
// and usage patterns. That's expected and fine here: the task's own job
// is just "is a backup due yet?", so running somewhat later than
// requested just means the backup itself runs a bit later, never that it
// silently stops working.
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";

import { supabase } from "@/lib/supabase";
import { maybeAutoBackup } from "@/lib/backup";
import { logError, logMessage } from "@/lib/monitoring";

export const BACKGROUND_BACKUP_TASK = "scripture-memory-background-backup";

// defineTask must run at module scope (not inside a component) so it's
// registered before the JS engine hands control back to the OS for a
// background launch.
TaskManager.defineTask(BACKGROUND_BACKUP_TASK, async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    await maybeAutoBackup(session.user.id);
    logMessage("Background backup task ran", { userId: session.user.id });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    logError(error, { where: "backgroundBackupTask" });
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Call once a signed-in user has Backup & Restore enabled (app/backup.tsx
 * does this on toggle-on, and app/_layout.tsx does it on launch if it's
 * already on). Safe to call repeatedly — re-registering an already
 * registered task is a no-op.
 */
export async function registerBackgroundBackupTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_BACKUP_TASK);
    if (isRegistered) return;

    // Minutes, per expo-background-task's API. 12 hours is a reasonable
    // floor even for the "daily" frequency option — the OS will often
    // run it less often than this in practice, which is fine since
    // maybeAutoBackup() only actually backs up when the schedule says
    // it's due anyway.
    await BackgroundTask.registerTaskAsync(BACKGROUND_BACKUP_TASK, {
      minimumInterval: 12 * 60,
    });
  } catch (error) {
    // Background execution isn't available in every environment (e.g.
    // Expo Go on some platforms, or an OS that's restricted it) — the
    // app still works correctly via the foreground check in
    // maybeAutoBackup(), so this is a soft failure.
    logError(error, { where: "registerBackgroundBackupTask" });
  }
}

/** Call when the user turns Backup & Restore off. */
export async function unregisterBackgroundBackupTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_BACKUP_TASK);
    if (!isRegistered) return;
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_BACKUP_TASK);
  } catch (error) {
    logError(error, { where: "unregisterBackgroundBackupTask" });
  }
}
