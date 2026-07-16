# Phase 2: Accessibility, Background Backup, Security, Performance, Subscription Architecture, Cleanup, Store Prep

## Accessibility
- `accessibilityRole`/`accessibilityLabel` added to: all 8 modal back buttons (About, Donate,
  Feedback, Privacy Policy, Profile, Quiz ×2, Terms, Backup), `PrimaryButton` (with
  `accessibilityState` for disabled/busy), `CategoryPill`, every `DrawerMenu` item + Sign Out,
  the Quick Add Category modal's close button and name field, the feedback message field, and
  both reset-password fields (plus the show/hide toggle).
- `CategoryPill` got a `hitSlop={6}` — its visual size stays compact (a deliberate design choice
  for dense pill rows) but the tappable area now clears the ~44pt minimum touch target guideline
  without changing how anything looks.
- Dynamic font scaling: audited for any `allowFontScaling={false}` — there is none anywhere in
  the app, so every `<Text>` already respects the system font size setting by React Native's
  default behavior. Nothing to change here; noting it since it was explicitly asked for.
- Not done: a full numeric color-contrast audit against WCAG AA, and VoiceOver/TalkBack
  walkthroughs on a real device. The theme's tokens (`src/theme/colors.ts`) look reasonable by
  inspection but this needs actual assistive-tech testing, which isn't possible from here.

## Background backup scheduling
- `src/lib/backgroundBackup.ts` — real OS-level background task via `expo-task-manager` +
  `expo-background-task`, registered when the user turns Backup & Restore on (`app/backup.tsx`)
  or on launch if it was already on (`app/_layout.tsx`), unregistered when turned off. This is
  in addition to (not instead of) the foreground check from Phase 1 — between the two, a
  scheduled backup runs whether or not the user happens to open the app.
- `app.config.js` — added the iOS entitlements (`UIBackgroundModes: [...,"processing"]`,
  `BGTaskSchedulerPermittedIdentifiers`) this requires.
- Real limitation, stated plainly: both platforms treat the requested interval as a floor the
  OS may push back based on battery/usage — normal background-task behavior, not a bug.

## Security
- **Optional passphrase-protected backups** (new): `app/backup.tsx` has an "Extra Passphrase
  Protection" toggle. Off (default): backup key is derived from the account id, as in Phase 1 —
  convenient, and strong against "someone dumps the database" but not against a fully
  compromised Supabase project. On: the key is derived from a passphrase the user enters and
  that's never stored anywhere — meaningfully stronger, at the cost of scheduled/background
  backups pausing (there's no one present to type it), which the UI states directly.
- Reviewed RLS policies added in Phase 1 (`backup_metadata`, `backup_snapshots`,
  `device_registrations`, `sync_history`) — all scoped to `auth.uid() = user_id`, matching the
  existing pattern from `verses`/`categories`. No gaps found.
- `deleteAccount()` (Phase 1) already clears local SQLite; confirmed the cloud-side cascade
  covers all four new tables via `on delete cascade` in `supabase/schema.sql`.
- Not done: penetration testing, dependency vulnerability scanning (`npm audit` is worth running
  after `npm install`, on your machine, before a release build), and a review of the Supabase
  project's own dashboard-level access controls — none of that is visible or actionable from a
  static read of this codebase.

## Performance
- `CategoryPill` memoized with `React.memo` — it's rendered in tight lists (every category,
  translation, and reminder-interval pill) that re-render together on every parent state change;
  now each pill only re-renders when its own props actually change.
- `useVerses` (Phase 1) was already restructured as a shared module-level store with a listener
  set, which avoids the alternative of every one of the 5 always-mounted tab screens holding an
  independent copy of the same data and re-fetching it — worth calling out here since it's a
  meaningful win that happened as a side effect of the local-first rewrite, not a separate pass.
- Not done: a real profiling pass (React DevTools Profiler / Flipper on an actual low-end Android
  device), startup-time measurement, or bundle-size analysis — these need to be run against a
  built app, not inferred from source.

## Subscription architecture
- `src/hooks/useSubscription.ts` — reads `subscription_tier`/`subscription_status` from
  `profiles` (added in Phase 1). `isPremium` is deliberately permissive right now (no billing
  provider is wired up, matching the brief), with a comment on exactly which line to change once
  one is.
- `app/backup.tsx` shows a non-blocking "this is part of our premium plan, currently free while
  we finish billing" note when tier is `free` — sets user expectations without gating anything.
- Not done: any actual payment provider integration (RevenueCat, Stripe, native IAP) — the brief
  explicitly scoped that out of this phase.

## Cleanup
- Removed `src/components/BibleReferenceInput.tsx` — superseded by `SmartReferenceInput`
  (used in the Phase 1 Add Verse redesign) and referenced by nothing else in the codebase.
- Confirmed zero remaining `Alert.alert()` calls anywhere in the app (the themed confirm/toast
  system already fully replaced it before this phase).

## App Store / Play Store prep
- `app.config.js` reviewed: bundle identifiers, Android permissions (with their justification
  comments), and deep-link intent filters were already in good shape from earlier work; added
  the background-task entitlements noted above.
- What's genuinely left, and can't be done from here — these require a human with the app
  running on a device/simulator and access to the App Store Connect / Play Console accounts:
  - App icon / splash / adaptive icon final artwork review (files exist in `/assets`; not
    regenerated or redesigned here).
  - Screenshots for each required device size.
  - Store listing copy (title, subtitle/short description, full description, keywords) — happy
    to draft this text in a follow-up if useful.
  - Privacy "nutrition label" answers (App Store) / Data Safety form (Play Console) — based on
    this codebase that's: account email (auth), verse content (local + optional encrypted
    backup), and anonymized error logs. Worth transcribing into the actual forms during
    submission.
  - EAS Build production builds, TestFlight/internal testing rounds, and the actual submission +
    review process.

## Setup required for this phase
1. `npm install` — added `expo-task-manager` and `expo-background-task`.
2. No new Supabase migration needed (backup passphrase protection is entirely client-side).
3. `npx tsc --noEmit` passes clean as of this pass.
