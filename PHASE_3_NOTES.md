# Phase 3: Notification Bug Fix, Subscription Payments, Contrast Audit, Design Consolidation

## The duplicate-notification bug — root cause and fix

**Root cause found:** `app/_layout.tsx` had a `useEffect` that scheduled/topped-up reminders,
with `learning` (the array of in-progress verses from `useVerses()`) in its dependency array.
`useVerses` returns a **new array reference on every store mutation** — adding a verse, marking
one mastered, deleting one, anywhere in the app — because the shared store's `verses` array is
replaced wholesale each time (`src/hooks/useVerses.ts`). That meant this effect tore down and
recreated the AppState subscription, and re-ran its "just came to foreground" top-up logic, on
**every single verse mutation app-wide**, not just real foreground transitions. A verse whose
reminder batch had just been scheduled seconds earlier by an unrelated action could get caught by
another top-up pass before its own scheduling had settled — exactly the kind of overlap that
produces two notifications for what should be one occurrence.

**Fix (defense in depth, four layers):**
1. `app/_layout.tsx` — the effect now depends on `[appReady, session]` only. It reads the latest
   verse list via a `ref` (`learningRef.current`) instead of depending on the array itself, so it
   subscribes once per session and no longer fires on unrelated mutations.
2. `src/lib/notifications.ts` — added a 30-second per-verse cooldown (`recentlyScheduledAt`) so
   even if something *does* call `scheduleVerseReminder` twice in quick succession for the same
   verse, the second call is a no-op instead of racing the first.
3. `src/lib/notifications.ts` — before scheduling a new batch, it now also cross-checks the
   actual OS-level pending notification list (`getAllScheduledNotificationsAsync`) for this
   verse's id and cancels any stray ones, not just the ones in our own SQLite bookkeeping — so
   local bookkeeping and native state can't silently drift apart.
4. `src/lib/db.ts` — `saveNotificationIds` now deletes-then-inserts inside one transaction
   instead of blindly appending, so stale rows can never accumulate even if a future caller
   doesn't follow the expected cancel-then-save order.

**Honest limitation:** I can't run this on a device to watch notifications fire and confirm the
symptom is gone — layer 1 is the change I'm most confident is the actual root cause (it's an
objectively real, over-triggering effect regardless of exactly how it manifested as duplicates);
layers 2–4 are real hardening that closes off the mechanism regardless. Please test on a real
device and let me know if it recurs — if it does, that'll narrow down whether there's a second,
different cause.

## Subscription payments — RevenueCat

Real payment gateway integration, not a stub:

- **`react-native-purchases` (RevenueCat)**, not a payment processor like Paystack/Flutterwave —
  Apple's Guideline 3.1.1 and Google Play's equivalent require in-app purchase (StoreKit/Play
  Billing) for subscriptions unlocking digital app functionality, which premium backup is.
  RevenueCat wraps both platforms' native purchase APIs behind one interface. This is a **native
  module** — it needs your existing custom dev client build (you already have `expo-dev-client`),
  not plain Expo Go.
- `src/lib/purchases.ts` — configure, fetch offerings, purchase, restore, and check the
  `premium_backup` entitlement.
- `app/paywall.tsx` — new screen showing whatever packages are configured in your current
  RevenueCat offering (no hardcoded pricing), with Subscribe and Restore Purchases.
- `src/hooks/useSubscription.ts` — rewritten to check RevenueCat's real-time on-device
  entitlement first, falling back to the Supabase-synced columns if RevenueCat isn't configured
  in this environment (e.g. no API key set yet).
- `app/backup.tsx` — every real cloud action (enable, back up now, restore, and turning on
  scheduled backups) now routes to the paywall if the user isn't entitled. Browsing the screen
  itself is never blocked.
- **`supabase/functions/revenuecat-webhook`** — new edge function; RevenueCat calls it on every
  purchase/renewal/cancellation/expiration event, and it updates `profiles.subscription_tier` /
  `subscription_status`. This is the backend record `useSubscription`'s fallback reads — see the
  setup comment at the top of that file for the exact deploy + secret commands.
- `src/lib/backup.ts` — `maybeAutoBackup` (both the foreground check and the real background task
  from Phase 2) now re-checks entitlement before running, so a lapsed subscription stops silent
  auto-backups without the user having to manually toggle anything off.

### What you still need to do (can't be done from here)
1. Create the products in App Store Connect and Play Console (e.g. monthly + annual auto-renewing
   subscriptions).
2. Create a RevenueCat account, add both apps, link them to the store products, and create an
   entitlement named exactly `premium_backup` (or change `PREMIUM_ENTITLEMENT_ID` in
   `src/lib/purchases.ts` to whatever you name it) attached to those products, and an **offering**
   with the packages you want shown on the paywall.
3. Set `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (from
   RevenueCat's dashboard) as EAS build env vars.
4. Deploy the webhook (`supabase functions deploy revenuecat-webhook --no-verify-jwt`), set
   `REVENUECAT_WEBHOOK_SECRET` as a Supabase secret, and point RevenueCat's dashboard webhook URL
   + Authorization header at it.
5. Build with EAS (not Expo Go) to actually test purchases — sandbox/test accounts on each store.

Until step 3 is done, `app/paywall.tsx` shows a clear in-app notice that purchases aren't
available yet rather than crashing or silently failing.

## Contrast audit — computed, not estimated

I wrote a script that computes actual WCAG relative-luminance contrast ratios from the theme's
real hex values (not a visual guess), and checked every color pairing used in the app. Found and
fixed real failures:

- **White button text on the dark-mode accent color failed AA (3.11:1, needs 4.5:1)** — the
  accent (`#7C8EDB`) is intentionally light for legibility as foreground text/icons, but that
  same lightness makes it a bad *fill* for white text on top. Added a proper `theme.onAccent`
  token (white in light mode, dark ink in dark mode — verified at 5.76:1) and applied it
  everywhere white text/icons sat on `theme.accent`: `PrimaryButton`, the Add Verse search button
  and translation badge, `SmartReferenceInput`'s mode toggle, the Today screen's quiz icon, the
  mastered-verse `Seal` badge, the onboarding CTA, and the auth-callback error screen's button.
- **3 of 8 avatar palette colors failed with white initials text** (`#C98A3E` at 2.92:1,
  `#EA580C` at 3.56:1, `#5B8266` at 4.35:1). Added `getReadableTextColor()`
  (`src/theme/contrast.ts`) — computes real contrast against both white and near-black candidates
  and picks whichever passes, so this is correct for *any* color, not just the current palette.
  Applied to `AvatarButton` and `DrawerMenu`'s avatar initials, and to `CategoryPill` (which
  renders arbitrary per-category custom colors, not just the theme accent).
- **The mastered-amber color failed as text** (2.92:1 on white) though it was fine as an icon
  accent. Added `theme.masteredText` — a darker amber (5.29:1) for the one place it was actually
  used as text (the "Mastered" swipe-action label in `SwipeDeck`); `theme.mastered` is unchanged
  everywhere it's used as an icon or fill color, where it was already fine.
- **Dark mode's error-red text on `errorSurface` measured 4.41:1**, just under 4.5 — affects the
  "Verse Not Found" title, the quiz stats' "Correct answers" label, and "Delete Account" in
  Profile. Darkened `errorSurface` slightly (`#3A1F1D` → `#331B19`, now 4.69:1) — a
  barely-perceptible change that clears the threshold.

Also removed `src/components/VersePickerModal.tsx` — found while auditing (it had the same
white-on-accent issue) that it isn't imported anywhere; genuinely dead code, not patched.

**Not done:** VoiceOver/TalkBack walkthrough on a real device — computed contrast ratios are a
real, objective check, but they don't replace testing with actual assistive technology.

## Design consolidation — one header component instead of three

Auditing About/Donate/Feedback/Quiz alongside Profile/Backup surfaced that the app had **three
different hand-rolled modal-header patterns** coexisting: a bare chevron with no button styling
(About, Donate, Feedback, Privacy Policy, Terms, Quiz ×2), a circular icon button (Backup, from
Phase 1), and yet another circular-but-differently-styled version (Profile). Consolidated all of
them into one `src/components/ModalHeader.tsx`, used identically on all 9 modal screens (About,
Donate, Feedback, Privacy Policy, Terms, Quiz, Profile, Backup, Paywall). This also deleted a
meaningful amount of duplicated header markup and dead styles across those files.

Other concrete fixes made during this pass:
- `app/donate.tsx` had hardcoded hex colors (`#FFF0F0`, `#E74C3C`) for its heart icon instead of
  theme tokens — meant it looked wrong in dark mode (a light pink circle against a dark
  background). Now uses `theme.errorSoft`/`theme.error`, which are already dark-mode aware.
- `app/feedback.tsx` had a local `const [type, setType]` state variable shadowing the imported
  `type` typography tokens from `@/theme` — not currently causing a bug since `type.*` wasn't
  referenced in that file, but a real footgun waiting to break the next edit. Renamed to
  `feedbackType`. Also gave the screen the same card-based layout used on Add Verse/Backup instead
  of its previous flatter, sparser one.
- The avatar color palette (`AVATAR_COLORS`) was duplicated verbatim in `AvatarButton.tsx` and
  `DrawerMenu.tsx`. Extracted to `src/theme/avatarColors.ts`, imported by both.

**Not done:** Quiz, Profile, About, Donate, Feedback's *content* layouts weren't restructured
beyond the header consolidation and the specific fixes above — they were already reasonably
designed (as noted in Phase 2), and a full re-layout of each wasn't warranted without a more
specific brief on what should change beyond consistency and correctness.

## Setup required for this phase
1. `npm install` — added `react-native-purchases`.
2. Deploy the new edge function and set its secret (see the Subscription section above).
3. Run no new SQL — the webhook uses the `subscription_tier`/`subscription_status` columns
   already added to `profiles` in Phase 1.
4. `npx tsc --noEmit` passes clean.

## What's still genuinely not done
- **Performance profiling** — a few more components got memoized (`VerseCard`, on top of
  `CategoryPill` from Phase 2), but there's still no real profiler run, startup-time measurement,
  or bundle-size analysis. That needs a running build.
- **App-store submission** — icons, screenshots, listing copy, and the actual EAS build + review
  process are unchanged from Phase 2's status: they need a human with a device and your store
  accounts.
- **Full auth-flow security review** (token refresh edge cases, session handling) — not done this
  pass either.
