export default {
  expo: {
    name: "Scripture Memory",
    slug: "scripture-memory-app",
    version: "1.0.0",
    scheme: "scripturememory",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",

    plugins: [
      "expo-router",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FBF8F2",
          image: "./assets/splash-icon.png",
          imageWidth: 220,
          dark: {
            backgroundColor: "#14171F",
            image: "./assets/splash-icon.png",
          },
        },
      ],
      [
        "expo-notifications",
        {
          color: "#3D4B8C",
          icon: "./assets/notification-icon.png",
          defaultChannel: "verse-reminders",
          sounds: [],
        },
      ],
    ],

    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.joeladeyoju.scripturememory",
      infoPlist: {
        UIBackgroundModes: ["remote-notification", "fetch"],
      },
    },

    android: {
      package: "com.joeladeyoju.scripturememory",
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      // Critical for background notifications on Android 12+
      permissions: [
        "RECEIVE_BOOT_COMPLETED",
        "SCHEDULE_EXACT_ALARM",
        "USE_EXACT_ALARM",
        "POST_NOTIFICATIONS",
        "VIBRATE",
        "WAKE_LOCK",
        // Lets the app ask the user to exempt it from battery optimization,
        // which is the #1 real-world cause of "reminders stop when the app
        // is minimized" on Android (Doze mode + OEM background killers).
        // Legitimate use per Play Store policy for apps whose core
        // function is scheduled/background reminders — declare this
        // clearly in the Play Console's permissions declaration form
        // before submitting. See src/lib/notifications.ts and
        // PRODUCTION_AUDIT_REPORT.md for details.
        "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
      ],
      // Deep link handling: allows scripturememory://reset-password?... links
      // from Supabase password reset emails to open the app directly.
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "scripturememory",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    web: {
      favicon: "./assets/favicon.png",
    },

    extra: {
      eas: {
        projectId: "c39fbd97-5c6e-4692-acdf-aff3619f8269"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      bibleApiBase: process.env.EXPO_PUBLIC_BIBLE_API_BASE,
    },
  },
};
