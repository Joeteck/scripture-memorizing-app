// app/terms.tsx
// Public route (see app/_layout.tsx isPublicRoute), same reasoning as
// app/privacy-policy.tsx.
//
// NOTE: This is a starting-point Terms of Service, not a substitute for
// legal review — especially the "Governing Law" placeholder below, which
// should name an actual jurisdiction before shipping.
import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Linking as RNLinking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type, spacing } from "@/theme";

const CONTACT_EMAIL = "adeyojuibukunoluwa1@gmail.com"; // e.g. "you@example.com" — keep in sync with app/privacy-policy.tsx
const LAST_UPDATED = "July 2026";
const GOVERNING_LAW = "These terms are governed by the laws of the Federal Republic of Nigeria, without regard to its conflict-of-law principles.";

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

export default function TermsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text }}>Terms of Service</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: theme.textSecondary }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          These terms govern your use of Scripture Memory ("the app"). By creating an account or
          using the app, you agree to them.
        </Text>

        <Section title="Using the App" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            You must be able to form a binding agreement to use this app (in most places, this
            means being 13 or older, or having a parent/guardian's permission). You agree to use
            the app only for its intended purpose — memorizing and organizing Scripture — and not
            to misuse it, attempt to disrupt it, or use it for anything unlawful.
          </Text>
        </Section>

        <Section title="Your Account" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            You're responsible for keeping your account credentials secure and for activity that
            happens under your account. You can delete your account at any time from
            Profile → Delete Account.
          </Text>
        </Section>

        <Section title="Your Content" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            The verses, categories, and notes you add remain yours. Bible text itself is sourced
            from third-party APIs under their own terms (typically public-domain or freely
            licensed translations) — we don't claim ownership of Scripture text. By using
            feedback or other submission features, you grant us permission to use that feedback
            to improve the app.
          </Text>
        </Section>

        <Section title="Availability" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We aim to keep the app available and your data intact, but we don't guarantee
            uninterrupted access — the app depends on third-party services (like Supabase and
            Bible text APIs) that are outside our control. We recommend not relying on the app as
            your only copy of anything important.
          </Text>
        </Section>

        <Section title="No Professional or Pastoral Advice" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Scripture Memory is a memorization and study tool. It is not a substitute for
            pastoral counsel, theological instruction, or professional advice of any kind.
          </Text>
        </Section>

        <Section title="Disclaimer of Warranties" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            The app is provided "as is," without warranties of any kind, express or implied,
            including fitness for a particular purpose or uninterrupted operation.
          </Text>
        </Section>

        <Section title="Limitation of Liability" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            To the fullest extent permitted by law, we are not liable for any indirect,
            incidental, or consequential damages arising from your use of the app, including loss
            of data.
          </Text>
        </Section>

        <Section title="Changes to These Terms" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We may update these terms from time to time. If we do, we'll update the "Last
            updated" date above. Continuing to use the app after a change means you accept the
            updated terms.
          </Text>
        </Section>

        <Section title="Governing Law" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {GOVERNING_LAW
              ? `These terms are governed by the laws of ${GOVERNING_LAW}, without regard to its conflict-of-law principles.`
              : "(Add the jurisdiction whose laws govern these terms in app/terms.tsx before publishing.)"}
          </Text>
        </Section>

        <Section title="Contact Us" theme={theme}>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Questions about these terms? Reach out at:
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
              (Add a contact email in app/terms.tsx before publishing.)
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
