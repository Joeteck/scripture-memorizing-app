// app/privacy-policy.tsx
// Public route (see app/_layout.tsx isPublicRoute) — reachable from Sign
// In before a session exists, as well as from Profile once signed in.
//
// NOTE: This is a starting-point policy, not a substitute for legal
// review. Fill in the placeholders below (contact email, jurisdiction,
// last-updated date) before shipping, and read PRODUCTION_AUDIT_REPORT.md
// for what's covered vs. what still needs a lawyer's eye if this app
// scales beyond personal/small use.
import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Linking as RNLinking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type, spacing } from "@/theme";

// Fill in before shipping — used at the bottom of both legal screens.
const CONTACT_EMAIL = "adeyojuibukunoluwa1@gmail.com"; // e.g. "you@example.com"
const LAST_UPDATED = "July 2026";

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text }}>Privacy Policy</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: theme.textSecondary }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          Scripture Memory ("the app") is built to help you memorize Bible verses. This policy
          explains what information the app collects, why, and what control you have over it.
        </Text>

        <Section title="Information We Collect" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            • Account information — your email address, or basic profile info (name, email) if
            you sign in with Google. Used only to authenticate you and identify your data.{"\n\n"}
            • Content you add — Bible verse references, translations, and categories you create.
            This is yours; we store it so it's there when you come back.{"\n\n"}
            • Notification preferences — reminder intervals you set, used only to schedule
            on-device reminders.{"\n\n"}
            • Feedback you submit — if you use the in-app feedback form, your message and the
            email address you provide with it.{"\n\n"}
            • Diagnostic information — if the app encounters an error, we record a technical
            description of what went wrong (message, stack trace, screen name, device platform,
            and app version) so we can fix it. This is not linked to your verse content.
          </Text>
        </Section>

        <Section title="What We Don't Collect" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We don't use advertising trackers, don't sell or share your data with advertisers,
            and don't collect location data, contacts, or browsing history from your device.
          </Text>
        </Section>

        <Section title="How We Use Information" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Solely to operate the app: authenticating you, storing and syncing your verses and
            categories, scheduling the reminders you configure, responding to feedback, and
            diagnosing errors. We do not use your data for advertising or sell it to third
            parties.
          </Text>
        </Section>

        <Section title="Third-Party Services" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            • Supabase — hosts our database and handles authentication. Your account and content
            data live on Supabase's infrastructure, protected so only you can read your own data.
            {"\n\n"}
            • Google Sign-In — if you choose "Continue with Google," Google handles that
            authentication; we only receive your email and basic profile info in return.{"\n\n"}
            • Bible text API — verse text is fetched from a public Bible-text API using only the
            reference and translation you request (e.g. "John 3:16", "KJV"); this request is not
            linked to your identity.
          </Text>
        </Section>

        <Section title="Data Retention & Deletion" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Your content stays in your account until you remove it or delete your account. You
            can delete your account at any time from Profile → Delete Account, which permanently
            removes your account, verses, and categories. Some anonymized records (like error
            reports or feedback not tied to your account) may be retained for troubleshooting.
          </Text>
        </Section>

        <Section title="Children's Privacy" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            This app is not directed at children under 13, and we do not knowingly collect
            personal information from children under 13. If you believe a child has provided us
            personal information, please contact us and we'll remove it.
          </Text>
        </Section>

        <Section title="Your Rights" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            You can access, correct, or delete your content directly in the app at any time.
            Depending on where you live, you may also have additional rights over your personal
            data (such as requesting a copy of it) — contact us and we'll help.
          </Text>
        </Section>

        <Section title="Changes to This Policy" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            If this policy changes, we'll update the "Last updated" date above. Continued use of
            the app after a change means you accept the updated policy.
          </Text>
        </Section>

        <Section title="Contact Us" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Questions about this policy or your data? Reach out at:
          </Text>
          {CONTACT_EMAIL ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => RNLinking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              <Ionicons name="mail-outline" size={18} color={theme.accent} />
              <Text style={[styles.linkText, { color: theme.accent }]}>{CONTACT_EMAIL}</Text>
            </Pressable>
          ) : (
            <Text style={[styles.body, { color: theme.textSecondary, fontStyle: "italic" }]}>
              adeyojuibukunoluwa1@gmail.com
            </Text>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: { padding: 20, paddingBottom: 60 },
  updated: { fontSize: 12, marginBottom: 12, fontWeight: "600" },
  intro: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 21 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  linkText: { fontSize: 14, fontWeight: "600" },
});
