# Phase 4: Shrinking the App for Direct-Download Distribution (No Play Console)

## Is this possible? Yes, for Android. Not really for iOS.

**Android**: distributing an APK via a direct link instead of the Play Store is completely
normal — it's called sideloading, and it's how F-Droid, most emulator/beta-testing tools, and
plenty of indie apps work. No Play Console account needed.

**iOS**: there's no real equivalent. Apple doesn't allow installing an app from a plain download
link outside its ecosystem. The only ways to get an iOS app onto someone's phone without the App
Store all still require an Apple Developer Program account ($99/year) at minimum — TestFlight
(needs App Store Connect), ad-hoc distribution (limited to 100 registered device UDIDs, expires
yearly), or an Enterprise account (internal company distribution only, against Apple's terms for
public distribution). If the cost concern also rules out that $99/year, iOS distribution isn't
realistically solvable outside the App Store right now — worth knowing before promising an iOS
download link to anyone.

Everything below is about Android.

## Why the APK was ~100-120MB in the first place

Not your assets — I checked; `assets/` totals under 400KB, that was never the issue. The real
cause is that a "universal" Android APK bundles native binaries for **every CPU architecture**
(arm64-v8a, armeabi-v7a, x86, x86_64) in one file, even though any single phone only ever uses
one. On the Play Store this doesn't matter because Play distributes an AAB and dynamically hands
each device only the slice it needs — you never see the bloat. Sideloading a plain APK doesn't get
that dynamic serving for free, so a universal APK is often 2-4x larger than necessary for any
given phone.

## What I changed

1. **`plugins/withAndroidAbiSplit.js`** (new, custom config plugin) — tells Gradle to build
   separate per-architecture APKs instead of one universal one. `expo-build-properties` (the
   standard Expo plugin for this kind of thing) doesn't expose this option — I checked its type
   definitions rather than assume — so this uses the public `@expo/config-plugins` Gradle-mod API
   directly, the standard documented way to make this kind of change without ejecting to a bare
   workflow.
2. **`expo-build-properties`** (new dependency) — turned on `enableMinifyInReleaseBuilds` (R8,
   strips unused code + obfuscates) and `enableShrinkResourcesInReleaseBuilds` (removes unused
   resources pulled in by dependencies). Both were off by default; both are reliable, no-tradeoff
   size wins.
3. **`eas.json`** — added a `direct-download` build profile that outputs an installable `.apk`
   (`buildType: "apk"`) instead of the Play-Store-bound `.aab` the `production` profile makes. An
   AAB isn't directly installable on a phone at all — it only becomes an APK via Play's own
   pipeline — so this profile is what you'll actually use for this.

## What to expect, honestly

I can't produce an actual Android build or measure its real byte size from here — there's no
Android SDK/Gradle in this environment, and doing this properly needs a real build. Based on how
much these specific levers typically save on a comparably-featured Expo/React Native app (SQLite,
notifications, background tasks, RevenueCat, Supabase):

- Splitting to a single ABI (arm64-v8a) typically cuts a universal APK's size by roughly half to
  two-thirds on its own — this is the single biggest lever here.
- Minification + resource shrinking typically saves another modest chunk on top of that.

**A realistic target after both changes is somewhere in the 25-40MB range**, not a guaranteed
exact number — it depends on exactly which native modules end up compiled in. Getting to a hard
20MB is possible but not guaranteed; if you land at, say, 35MB and want to go lower, the next lever
would be auditing which Expo modules are actually needed (each native module adds its own compiled
code) — happy to do that pass once you have a real build number to work from.

## How to actually build and get the small APK

```
npx eas build --profile direct-download --platform android
```

This produces the `.apk` file(s) on the EAS build page. **Important**: because of the ABI split,
Gradle produces *multiple* APK files (one per architecture, e.g. `app-arm64-v8a-release.apk`,
`app-armeabi-v7a-release.apk`, etc.) plus a universal one as a fallback. I can't guarantee from
here that EAS's cloud build dashboard surfaces every one of those as a separate downloadable
artifact — that's a genuine unknown without running the build myself. If only one artifact shows
up and it's not clearly the small one, building locally instead (`eas build --local` or
`npx expo prebuild` + `./gradlew assembleRelease` in the generated `android/` folder) gives you
direct filesystem access to every variant in `android/app/build/outputs/apk/release/` so you can
pick `app-arm64-v8a-release.apk` by hand — that one file is what you want for the download link.
arm64-v8a alone covers the overwhelming majority of Android phones actually in use today;
armeabi-v7a is only still relevant for very old/low-end devices.

## Where to host it for a direct link

You don't need a new service — you already have Supabase:
1. Create a public Storage bucket (e.g. `app-releases`).
2. Upload `app-arm64-v8a-release.apk` there.
3. Use its public URL as the download link.

Alternatives if you'd rather not use Supabase bandwidth for this: **GitHub Releases** (free,
unlimited for public repos, standard for exactly this use case) or **Firebase App Distribution**
(free tier, built specifically for beta/direct-install distribution, adds nicer install UX and
update notifications at the cost of a bit more setup).

## One more honest thing worth knowing before you ship this

Sideloaded APKs trigger real friction that a Play Store listing doesn't: Android shows an "Install
blocked" prompt requiring the user to manually allow installs from that source, and Google Play
Protect will often flag an APK it doesn't recognize with a "this app is not recognized" or "scan
for harmful content" warning — not because anything's wrong with it, just because it isn't coming
through Play's vetting pipeline. This is normal and won't stop a determined user, but it's a real
trust hurdle worth setting expectations for with anyone you send the link to (a short line on your
download page like "Android will warn you since this isn't from the Play Store — tap Install
Anyway" goes a long way).

## Setup required for this phase
1. `npm install` — added `expo-build-properties`.
2. No Supabase migration needed.
3. `npx tsc --noEmit` passes clean; `expo-doctor` 19/21 (2 network-only failures, unrelated).
4. Actually building (`eas build --profile direct-download --platform android`) and confirming
   the real resulting file size is the one step that has to happen on your end — I don't have
   the tooling to do it here.
