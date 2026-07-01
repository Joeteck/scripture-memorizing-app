// src/components/SmartReferenceInput.tsx
// Smart Bible reference input: book autocomplete + space-separated chapter/verse
import React, { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";

const BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah",
  "Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians",
  "2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation",
];

type InputMode = "single" | "multi";
type ParseState = "book" | "chapter" | "verse_start" | "verse_end";

interface Props {
  value: string;
  onChange: (ref: string) => void;
  onModeChange?: (mode: InputMode) => void;
}

function parseInputState(raw: string): ParseState {
  const parts = raw.trim().split(/\s+/);
  // Is the first part a known book?
  const book = BOOKS.find((b) => b.toLowerCase() === parts[0]?.toLowerCase());
  if (!book) return "book";
  if (parts.length < 2) return "chapter";
  if (parts.length < 3) return "verse_start";
  return "verse_end";
}

function buildReference(raw: string, mode: InputMode): string {
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 3) return raw;
  // Last 1 or 2 items are numbers (chapter then verse)
  const nums = parts.slice(-2);
  const bookParts = parts.slice(0, -2);
  const chapter = nums[0];
  const verse = nums[1];
  if (!chapter || !verse) return raw;

  if (mode === "single") {
    return `${bookParts.join(" ")} ${chapter}:${verse}`;
  }

  // multi: last two numbers are start_verse end_verse
  const partsMulti = raw.trim().split(/\s+/);
  if (partsMulti.length < 4) return raw;
  const end = partsMulti[partsMulti.length - 1];
  const start = partsMulti[partsMulti.length - 2];
  const ch = partsMulti[partsMulti.length - 3];
  const bookM = partsMulti.slice(0, -3).join(" ");
  return `${bookM} ${ch}:${start}-${end}`;
}

export function SmartReferenceInput({ value, onChange, onModeChange }: Props) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<InputMode>("single");
  const [bookChosen, setBookChosen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleText(text: string) {
    setRaw(text);
    onChange(text);

    if (bookChosen) {
      setSuggestions([]);
      // Auto-format on completion
      const state = parseInputState(text);
      if (mode === "single" && state === "verse_end") {
        const formatted = buildReference(text, "single");
        setRaw(formatted);
        onChange(formatted);
      }
      if (mode === "multi") {
        const parts = text.trim().split(/\s+/);
        if (parts.length >= 4) {
          const formatted = buildReference(text, "multi");
          setRaw(formatted);
          onChange(formatted);
        }
      }
      return;
    }

    // Book suggestion phase
    const lower = text.toLowerCase();
    if (!lower) { setSuggestions([]); return; }
    const matches = BOOKS.filter((b) => b.toLowerCase().startsWith(lower)).slice(0, 7);
    setSuggestions(matches);
  }

  function selectBook(book: string) {
    const newRaw = book + " ";
    setRaw(newRaw);
    onChange(newRaw);
    setBookChosen(true);
    setSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function toggleMode() {
    const next = mode === "single" ? "multi" : "single";
    setMode(next);
    setRaw("");
    setBookChosen(false);
    setSuggestions([]);
    onChange("");
    onModeChange?.(next);
  }

  const parseState = parseInputState(raw);
  const placeholder =
    !bookChosen ? "Type a book name…" :
    parseState === "chapter" ? "Chapter number" :
    parseState === "verse_start" ? mode === "single" ? "Verse number" : "Starting verse" :
    "Ending verse";

  return (
    <View>
      {/* Mode toggle */}
      <View style={[styles.modeRow, { backgroundColor: theme.accentSoft, borderColor: theme.border }]}>
        <Pressable
          style={[styles.modeOption, mode === "single" && { backgroundColor: theme.accent }]}
          onPress={() => mode !== "single" && toggleMode()}
        >
          <Ionicons name="book-outline" size={14} color={mode === "single" ? "#fff" : theme.accent} />
          <Text style={[styles.modeText, { color: mode === "single" ? "#fff" : theme.accent }]}>
            {" "}Single
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeOption, mode === "multi" && { backgroundColor: theme.accent }]}
          onPress={() => mode !== "multi" && toggleMode()}
        >
          <Ionicons name="layers-outline" size={14} color={mode === "multi" ? "#fff" : theme.accent} />
          <Text style={[styles.modeText, { color: mode === "multi" ? "#fff" : theme.accent }]}>
            {" "}Multi (max 3)
          </Text>
        </Pressable>
      </View>

      {/* Input box */}
      <View style={[styles.inputWrap, { borderColor: suggestions.length ? theme.accent : theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          ref={inputRef}
          value={raw}
          onChangeText={handleText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
        />
        {raw.length > 0 && (
          <Pressable hitSlop={8} onPress={() => { setRaw(""); onChange(""); setBookChosen(false); setSuggestions([]); }}>
            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Book suggestions */}
      {suggestions.length > 0 && (
        <View style={[styles.suggestions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {suggestions.map((book) => (
            <Pressable
              key={book}
              style={({ pressed }) => [styles.suggestion, { backgroundColor: pressed ? theme.accentSoft : "transparent" }]}
              onPress={() => selectBook(book)}
            >
              <Ionicons name="book-outline" size={15} color={theme.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.suggestionText, { color: theme.text }]}>{book}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Hint */}
      {bookChosen && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {mode === "single"
            ? "Type: chapter Space verse  e.g. 3 16"
            : "Type: chapter Space verse1 Space verse2  e.g. 3 16 18"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  modeText: { fontSize: 13, fontWeight: "700" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 16 },
  suggestions: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 6,
    overflow: "hidden",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestionText: { fontSize: 15, fontWeight: "600" },
  hint: { fontSize: 12, marginTop: 8, fontStyle: "italic" },
});
