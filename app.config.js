export default {
    expo: {
        name: "Scripture Memory",
        slug: "scripture-memory-app",
        version: "1.0.0",
        scheme: "scripturememory",

        orientation: "portrait",
        userInterfaceStyle: "automatic",

        plugins: [
        "expo-router",
        "expo-web-browser",
        [
            "expo-notifications",
            {
            color: "#3D4B8C"
            }
        ]
        ],

        ios: {
        supportsTablet: false,
        bundleIdentifier: "com.joeladeyoju.scripturememory",
        },

        android: {
        package: "com.joeladeyoju.scripturememory",
        permissions: [
            "RECEIVE_BOOT_COMPLETED",
            "SCHEDULE_EXACT_ALARM"
        ]
        },

        extra: {
        eas: {
            projectId: "75367a17-f9b1-4a76-9234-19e5464690af"
        },

        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        bibleApiBase: process.env.EXPO_PUBLIC_BIBLE_API_BASE,
        },
    },
};