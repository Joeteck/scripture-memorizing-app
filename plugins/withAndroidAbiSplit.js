// plugins/withAndroidAbiSplit.js
//
// Why this exists: a single "universal" Android APK bundles native
// binaries (.so files) for every CPU architecture — arm64-v8a,
// armeabi-v7a, x86, x86_64 — even though any one device only ever uses
// one of them. On the Play Store this is normally a non-issue because
// Play distributes an AAB and dynamically serves each device only the
// slice it needs. For a direct-download APK (see PHASE_4_NOTES.md —
// distributing outside Play Store), there's no dynamic serving, so a
// "universal" APK is often 2–4x larger than it needs to be for any given
// phone.
//
// This plugin tells Gradle to build separate, smaller per-ABI APKs
// instead of one fat one. arm64-v8a alone covers the overwhelming
// majority of Android phones actually in use today (armeabi-v7a is only
// still relevant for very old/low-end devices; x86/x86_64 are emulators,
// not real phones) — see eas.json / PHASE_4_NOTES.md for how the build
// profile picks which output to actually ship.
//
// This has to be a custom plugin because expo-build-properties (the
// standard Expo plugin for common Android/iOS build tweaks) doesn't
// expose ABI-split configuration — confirmed by checking its type
// definitions rather than assuming. This uses the public
// @expo/config-plugins Gradle-mod API, the supported way to make this
// kind of native build change without ejecting to a bare workflow.
const { withAppBuildGradle } = require("@expo/config-plugins");

const SPLITS_BLOCK = `
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk true
        }
    }
`;

const withAndroidAbiSplit = (config) => {
  return withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents;

    if (gradle.includes("splits {")) {
      // Already present (e.g. re-running prebuild) — don't duplicate.
      return config;
    }

    // Insert right after the opening `android {` line, which every
    // Expo-generated app/build.gradle has exactly once.
    const androidBlockMatch = gradle.match(/android\s*\{/);
    if (!androidBlockMatch) {
      console.warn(
        "[withAndroidAbiSplit] Could not find `android {` block in app/build.gradle — ABI splitting was not applied. App will build as a single universal APK."
      );
      return config;
    }

    const insertAt = androidBlockMatch.index + androidBlockMatch[0].length;
    config.modResults.contents =
      gradle.slice(0, insertAt) + SPLITS_BLOCK + gradle.slice(insertAt);

    return config;
  });
};

module.exports = withAndroidAbiSplit;
