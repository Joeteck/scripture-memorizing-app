// app/donate.tsx
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { useTheme, type } from "@/theme";
import { useToast } from "@/lib/toast";
import { logError } from "@/lib/monitoring";
import { ModalHeader } from "@/components/ModalHeader";

const ACCOUNTS = [
  { bank: "Stanbic IBTC Bank", name: "Adeyoju Ibukunoluwa Joel", number: "0034563949", id: "1" },
  { bank: "Nombank MFB", name: "Cowrywise Ibukunoluwa Joel Adeyoju", number: "3418754037", id: "2" },
  { bank: "Palmpay", name: "Adeyoju Ibukunoluwa Joel", number: "8058509717", id: "3" },
];

export default function DonateScreen() {
  const theme = useTheme();
  const toast = useToast();

  async function copy(text: string) {
    try {
      await Clipboard.setStringAsync(text);
      toast.showSuccess("Copied", "Account number copied to clipboard.");
    } catch (e) {
      logError(e, { where: "donate: copy account number" });
      toast.showError("Couldn't Copy", "Please try copying manually.");
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ModalHeader title="Support the App" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Heart icon — theme.errorSoft/theme.error already give a warm red
            that adapts correctly in dark mode, unlike the hardcoded hex
            values this used to have. */}
        <View style={[styles.iconWrap, { backgroundColor: theme.errorSoft }]}>
          <Ionicons name="heart" size={48} color={theme.error} />
        </View>

        <Text style={[type.screenTitle, { color: theme.text, textAlign: "center", marginTop: 16 }]}>
          Help Keep This Free
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 22, marginTop: 10, marginBottom: 32, fontSize: 15 }}>
          Scripture Memory is a labour of love. If it's been a blessing to you, a small donation helps keep the servers running and new features coming.
        </Text>

        {ACCOUNTS.map((acc) => (
          <View key={acc.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.bankName, { color: theme.accent }]}>{acc.bank}</Text>
            <Text style={[{ color: theme.text, fontWeight: "600", marginTop: 4 }]}>{acc.name}</Text>
            <View style={styles.accountRow}>
              <Text style={[styles.accountNum, { color: theme.text }]}>{acc.number}</Text>
              <Pressable
                onPress={() => copy(acc.number)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Copy ${acc.bank} account number`}
                style={[styles.copyBtn, { backgroundColor: theme.accentSoft }]}
              >
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
  content: { padding: 20, paddingTop: 0, paddingBottom: 60, alignItems: "stretch" },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  card: { borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1 },
  bankName: { fontSize: 16, fontWeight: "800" },
  accountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  accountNum: { fontSize: 20, fontWeight: "700", letterSpacing: 1 },
  copyBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
});

