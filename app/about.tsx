// app/about.tsx
import React from "react";
import { Linking as RNLinking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useTheme, type, spacing } from "@/theme";
import { ModalHeader } from "@/components/ModalHeader";

// Developer info: the name below is already public in app/donate.tsx, so
// it's carried over here rather than left blank. Everything else
// (bio, contact, links) is a placeholder — fill in or remove freely.
const DEVELOPER = {
  name: "Adeyoju Ibukunoluwa Joel",
  role: "Developer",
  bio: `Hi, I'm Joel Adeyoju—a software engineer and lifelong learner with a passion for building technology that makes a meaningful difference.

  I created this Scripture Memorization app from a simple conviction: God's Word is meant to be hidden in our hearts, not just stored on our devices. In a world filled with constant distractions, I wanted to build a tool that helps believers memorize, meditate on, and live out Scripture in a practical and engaging way.

  My goal is to combine thoughtful technology with timeless biblical principles to create experiences that encourage spiritual growth. Whether you're memorizing your first verse or building a lifelong habit of studying God's Word, I hope this app becomes a faithful companion on your journey.

  Thank you for being part of this community. I pray this app helps you grow deeper in your knowledge of God and strengthens your walk with Christ.

  "I have hidden your word in my heart that I might not sin against you." — Psalm 119:11`,
  email: "adeyojuibukunoluwa1@gmail.com",
  website: "https://myportfolio24-drab.vercel.app/portfolio/about",
  github: "https://github.com/joeteck"
};

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: "book-outline", text: "Smart Bible reference lookup" },
  { icon: "notifications-outline", text: "Customizable verse reminders" },
  { icon: "card-outline", text: "Swipeable review cards" },
  { icon: "pricetags-outline", text: "Organized Scripture categories" },
  { icon: "trophy-outline", text: "Mastery tracking & history" },
];

function Section({
  icon,
  title,
  children,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={theme.accent} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ModalHeader title="About" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="book" size={48} color={theme.accent} />
        </View>

        <Text style={[type.screenTitle, { color: theme.text, textAlign: "center", marginTop: 16 }]}>
          Scripture Memory
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 6 }}>
          v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>

        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          Scripture Memory is a simple, focused app for hiding God's Word in your heart — one
          verse at a time.
        </Text>

        {/* What it does */}
        <Section icon="apps-outline" title="What This App Does" theme={theme}>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Add any verse by reference, and Scripture Memory brings the text to you — organized
            into categories, reviewed through swipeable cards, and reinforced with reminders
            timed to how you learn best.
          </Text>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.feature}>
              <Ionicons name={f.icon} size={20} color={theme.accent} />
              <Text style={[styles.featureText, { color: theme.text }]}>{f.text}</Text>
            </View>
          ))}
        </Section>

        {/* How it helps you grow */}
        <Section icon="trending-up-outline" title="How It Helps You Grow" theme={theme}>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Memorization works through repetition spaced out over time, not a single burst of
            effort. Scripture Memory carries that repetition for you — gentle reminders bring a
            verse back to mind right as it's about to fade, and the swipe-review flow turns
            practice into something closer to a daily habit than a chore. Over weeks, that steady
            rhythm is what moves a verse from the page into the heart.
          </Text>
        </Section>

        {/* Mission & vision */}
        <Section icon="compass-outline" title="Mission & Vision" theme={theme}>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Our mission is to make Scripture memorization simple enough that anyone can build the
            habit, regardless of how busy life gets. We believe consistent time in God's Word
            shapes character quietly and steadily, and technology should make room for that
            practice rather than compete with it.
          </Text>
          <Text style={[styles.sectionBody, { color: theme.textSecondary, marginTop: spacing.sm }]}>
            Looking ahead, the vision is an app that grows alongside your walk — supporting more
            translations and languages, deeper study tools, and ways to memorize Scripture
            together with others.
          </Text>
        </Section>

        {/* Developer */}
        <Section icon="person-outline" title="About the Developer" theme={theme}>
          <View style={styles.devRow}>
            <View style={[styles.devAvatar, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.devInitials, { color: theme.accent }]}>
                {DEVELOPER.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.devName, { color: theme.text }]}>{DEVELOPER.name}</Text>
              <Text style={[styles.devRole, { color: theme.textSecondary }]}>{DEVELOPER.role}</Text>
            </View>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary, marginTop: spacing.sm }]}>
            {DEVELOPER.bio}
          </Text>
          {DEVELOPER.email ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => RNLinking.openURL(`mailto:${DEVELOPER.email}`)}
              accessibilityRole="link"
              accessibilityLabel={`Email ${DEVELOPER.email}`}
            >
              <Ionicons name="mail-outline" size={18} color={theme.accent} />
              <Text style={[styles.linkText, { color: theme.accent }]}>{DEVELOPER.email}</Text>
            </Pressable>
          ) : null}
          {DEVELOPER.website ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => RNLinking.openURL(DEVELOPER.website)}
              accessibilityRole="link"
              accessibilityLabel="Developer website"
            >
              <Ionicons name="globe-outline" size={18} color={theme.accent} />
              <Text style={[styles.linkText, { color: theme.accent }]}>{DEVELOPER.website}</Text>
            </Pressable>
          ) : null}
          {DEVELOPER.github ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => RNLinking.openURL(DEVELOPER.github)}
              accessibilityRole="link"
              accessibilityLabel="Developer GitHub profile"
            >
              <Ionicons name="logo-github" size={18} color={theme.accent} />
              <Text style={[styles.linkText, { color: theme.accent }]}>{DEVELOPER.github}</Text>
            </Pressable>
          ) : null}
        </Section>

                {/* Legal */}
        <Section icon="document-text-outline" title="Legal" theme={theme}>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push("/privacy-policy")}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
            <Text style={[styles.linkText, { color: theme.accent }]}>Privacy Policy</Text>
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push("/terms")}
            accessibilityRole="button"
            accessibilityLabel="Terms of Service"
          >
            <Ionicons name="document-outline" size={18} color={theme.accent} />
            <Text style={[styles.linkText, { color: theme.accent }]}>Terms of Service</Text>
          </Pressable>
        </Section>

        <Text style={[styles.closing, { color: theme.textSecondary }]}>
          Made for those who want to carry the Word wherever they go.{"\n\n"}
          "Thy word have I hid in mine heart, that I might not sin against thee."{"\n"}
          — Psalm 119:11
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 0, paddingBottom: 60 },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  intro: { lineHeight: 24, textAlign: "center", marginTop: 16, marginBottom: 24, fontSize: 15 },
  section: { borderRadius: 18, padding: 18, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionBody: { fontSize: 14, lineHeight: 21 },
  feature: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  featureText: { fontSize: 15, fontWeight: "600" },
  devRow: { flexDirection: "row", alignItems: "center" },
  devAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  devInitials: { fontSize: 16, fontWeight: "800" },
  devName: { fontSize: 15, fontWeight: "700" },
  devRole: { fontSize: 13, marginTop: 2 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  linkText: { fontSize: 14, fontWeight: "600" },
  closing: { textAlign: "center", marginTop: 8, lineHeight: 22, fontSize: 13 },
});
