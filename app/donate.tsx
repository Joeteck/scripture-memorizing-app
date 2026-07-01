// app/donate.tsx
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { useTheme, type } from "@/theme";
import { useToast } from "@/lib/toast";

const ACCOUNTS = [
  { bank: "Stanbic IBTC Bank", name: "Adeyoju Ibukunoluwa Joel", number: "0034563949" },
  { bank: "Opay", name: "Adeyoju Ibukunoluwa Joel", number: "8058509717" },
  { bank: "Palmpay", name: "Adeyoju Ibukunoluwa Joel", number: "8058509717" },
];

export default function DonateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  async function copy(text: string) {
    await Clipboard.setStringAsync(text);
    toast.showSuccess("Copied!", "Account number copied to clipboard.");
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[{ fontSize: 20, fontWeight: "800", color: theme.text }]}>Support the App</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Heart icon */}
        <View style={[styles.iconWrap, { backgroundColor: "#FFF0F0" }]}>
          <Ionicons name="heart" size={48} color="#E74C3C" />
        </View>

        <Text style={[type.screenTitle, { color: theme.text, textAlign: "center", marginTop: 16 }]}>
          Help Keep This Free
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 22, marginTop: 10, marginBottom: 32, fontSize: 15 }}>
          Scripture Memory is a labour of love. If it's been a blessing to you, a small donation helps keep the servers running and new features coming.
        </Text>

        {ACCOUNTS.map((acc) => (
          <View key={acc.number} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.bankName, { color: theme.accent }]}>{acc.bank}</Text>
            <Text style={[{ color: theme.text, fontWeight: "600", marginTop: 4 }]}>{acc.name}</Text>
            <View style={styles.accountRow}>
              <Text style={[styles.accountNum, { color: theme.text }]}>{acc.number}</Text>
              <Pressable onPress={() => copy(acc.number)} hitSlop={8} style={[styles.copyBtn, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="copy-outline" size={16} color={theme.accent} />
                <Text style={[{ color: theme.accent, fontWeight: "700", fontSize: 13 }]}> Copy</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 24, fontSize: 13 }}>
          Thank you, and God bless you.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  content: { padding: 20, paddingBottom: 60, alignItems: "stretch" },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  card: { borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1 },
  bankName: { fontSize: 16, fontWeight: "800" },
  accountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  accountNum: { fontSize: 20, fontWeight: "700", letterSpacing: 1 },
  copyBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
});
