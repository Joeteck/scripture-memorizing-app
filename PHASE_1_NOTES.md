# Phase 1: Global Navigation, Verse Preview, Local-First Storage & Backup

## What changed

### 1. Global persistent navigation
- `src/lib/drawer.tsx` — new app-wide context (`useDrawer()`) so any screen can open the
  side menu. Previously the drawer only existed inside `dashboard.tsx`; every other screen
  had no way to reach it.
- `src/components/AppHeader.tsx` — one reusable header (menu button + title) now used on
  Today, Dashboard, Add, Categories, and History, replacing five slightly different
  hand-rolled title rows.
- `src/components/DrawerMenu.tsx` — expanded to the full set from the brief: Home, Profile,
  Settings, **Backup & Restore**, Send Feedback, Donate, About, Privacy Policy, Terms of
  Service.
- `app/_layout.tsx` — renders the single `DrawerMenu` instance once, globally.

### 2. Add Verse: search → preview → add
- `src/components/SmartReferenceInput.tsx` — added an `onSubmit` prop wired to the
  keyboard's search/return key.
- `app/(tabs)/add.tsx` — rewritten. Pressing search/enter fetches the verse and shows it in
  a preview card directly under the field (works for both single verses and ranges, since
  `fetchVerse` already handles both). Not found → a themed inline error card, never a system
  alert. **Add** only becomes available once a verse is previewed, and saves the exact text
  that was previewed (no second network call).

### 3. Local-first storage
- `src/lib/db.ts` — added `local_verses` / `local_categories` tables plus full CRUD
  (`insertLocalVerse`, `updateLocalVerse`, `deleteLocalVerse`, `insertLocalCategory`,
  `deleteLocalCategory`, `replaceAllLocalData`), and a one-time `migrateLegacyCacheIfNeeded`
  that copies anyone's existing cached verses into the new tables on first launch after
  upgrading. Removed the now-dead read-through cache functions (`cacheVerses`,
  `getCachedVerses`, `cacheVerse`, `removeCachedVerse`, `clearVerseCache`) — nothing calls
  them anymore now that local storage isn't just a cache.
- `src/hooks/useVerses.ts` — rewritten. Every add/edit/delete/mark-as-mastered writes to
  SQLite only. No Supabase call anywhere on that path, so the whole app works with the
  network off. The only remaining network dependency is fetching a *new* verse's text the
  first time (there's no bundled copy of the whole Bible) — already-saved verses never need
  it again.
- `src/lib/auth.ts` — `deleteAccount()` now also wipes local SQLite data (previously it only
  deleted the cloud-side row, which would've left a "deleted" account's verses sitting on
  the device).

### 4. Backup & Restore (the new premium surface)
- `src/lib/backup.ts` — builds an encrypted snapshot (AES via `crypto-js`) of local
  verses/categories, uploads it to `backup_snapshots`, and can restore it back into local
  storage. `maybeAutoBackup()` checks on launch/foreground whether a scheduled backup
  (daily/weekly/monthly) is due — see the note in that file about why this is "catch up on
  next open" rather than a true background task, and what upgrading that would take.
- `app/backup.tsx` — new screen: enable/disable, frequency (Daily/Weekly/Monthly), last
  backup date, manual "Back Up Now", and "Restore Previous Backup" (behind a confirm
  dialog, since it overwrites local data).
- `src/lib/preferences.ts` — added the local settings backing the screen above.
- `supabase/schema.sql` — added `backup_metadata`, `backup_snapshots`, `device_registrations`,
  `sync_history`, and `subscription_tier` / `subscription_status` on `profiles` (unused
  today, but there so a future paywall is a billing integration, not a schema change). The
  original `verses` / `categories` tables are left in place for backward compatibility but
  the app no longer writes to them directly.

### 5. Cleanup
- Removed `App.tsx` and `index.ts` — leftovers from before this was an Expo Router app
  (`main` in `package.json` is `expo-router/entry`; these files weren't reachable code, and
  `App.tsx` also hardcoded a live Sentry DSN even though Sentry was already replaced by the
  SQLite-based logger in `src/lib/monitoring.ts`).

## Setup required before this runs
1. `npm install` — added `crypto-js` (+ `@types/crypto-js`) for backup encryption.
2. Run the new section of `supabase/schema.sql` (everything from "Local-first architecture:
   cloud-side tables" down) in the Supabase SQL Editor. It's additive/idempotent — safe to
   run even if you're not sure what's already there.
3. Everything type-checks clean (`npx tsc --noEmit`) as of this pass.

## What's next (not in this pass — see the chat message for why)
- Full screen-by-screen design-system audit (spacing/typography/empty states/loading
  states/animations) across Quiz, Profile, About, Donate, Feedback.
- True background backup scheduling (`expo-task-manager` / `expo-background-fetch`) so
  backups can run without the app being opened.
- Accessibility pass (screen reader labels, dynamic type, contrast, touch targets).
- Performance profiling (re-renders, startup time, bundle size).
- Security review of RLS policies, auth flows, and the backup encryption key derivation
  (documented as a known simplification in `src/lib/backup.ts`).
- Subscription/paywall wiring against `subscription_tier`.
- App-store submission prep (icons, screenshots, store listings, privacy nutrition labels).
