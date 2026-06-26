import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: "Add", tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="categories"
        options={{ title: "Categories", tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} /> }}
      />
    </Tabs>
  );
}

// import { Tabs } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { useTheme } from "@/theme";
// import { useStreak } from "@/hooks/useStreak";
// import { useVerses } from "@/hooks/useVerses";
// import { useAuth } from "@/hooks/useAuth";

// export default function TabsLayout() {
//   const theme = useTheme();
//   const { user } = useAuth(); // Get the user from auth

//   // Only load verses if user is logged in
//   const {
//     learning,
//     mastered,
//     categories,
//     loading,
//     refresh,
//     markStatus,
//   } = useVerses(user?.id ?? null);

//   const streak = useStreak([
//     ...learning,
//     ...mastered,
//   ]);

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: theme.accent,
//         tabBarInactiveTintColor: theme.textSecondary,
//         tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{ 
//           title: "Today", 
//           tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} /> 
//         }}
//       />
//       <Tabs.Screen
//         name="add"
//         options={{ 
//           title: "Add", 
//           tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> 
//         }}
//       />
//       <Tabs.Screen
//         name="categories"
//         options={{ 
//           title: "Categories", 
//           tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" color={color} size={size} /> 
//         }}
//       />
//       <Tabs.Screen
//         name="history"
//         options={{ 
//           title: "History", 
//           tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} /> 
//         }}
//       />
//     </Tabs>
//   );
// }