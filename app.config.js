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
        projectId: "75367a17-f9b1-4a76-9234-19e5464690af",
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      bibleApiBase: process.env.EXPO_PUBLIC_BIBLE_API_BASE,
    },
  },
};
