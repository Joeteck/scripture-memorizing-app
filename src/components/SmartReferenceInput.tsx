// src/components/SmartReferenceInput.tsx
// Smart Bible reference input: book autocomplete + intelligent formatting
import React, { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
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

interface Props {
  value: string;
  onChange: (ref: string) => void;
  onModeChange?: (mode: InputMode) => void;
  /** Fired when the user presses the keyboard's search/return key. */
  onSubmit?: (ref: string) => void;
}

export function SmartReferenceInput({ value, onChange, onModeChange, onSubmit }: Props) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<InputMode>("single");
  const [bookChosen, setBookChosen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleText(text: string) {
    // Don't process if text hasn't changed
    if (text === raw) return;

    // Handle backspace/deletion - just update raw
    if (text.length < raw.length) {
      setRaw(text);
      onChange(text);
      
      // Check if we've deleted back to book-only
      const parts = text.trim().split(/\s+/);
      if (parts.length <= 1) {
        setBookChosen(false);
        // Show suggestions if user is typing a book
        const lower = text.toLowerCase();
        if (!lower) { 
          setSuggestions([]); 
          return; 
        }
        const matches = BOOKS.filter((b) => b.toLowerCase().startsWith(lower)).slice(0, 7);
        setSuggestions(matches);
      } else {
        setSuggestions([]);
      }
      return;
    }

    // If we haven't chosen a book yet, handle book selection
    if (!bookChosen) {
      setRaw(text);
      onChange(text);
      
      const lower = text.toLowerCase();
      if (!lower) { 
        setSuggestions([]); 
        return; 
      }
      const matches = BOOKS.filter((b) => b.toLowerCase().startsWith(lower)).slice(0, 7);
      setSuggestions(matches);
      
      // Check if user typed a complete book name followed by space
      const spaceIndex = text.indexOf(' ');
      if (spaceIndex > 0) {
        const potentialBook = text.substring(0, spaceIndex).trim();
        const isBook = BOOKS.some(b => b.toLowerCase() === potentialBook.toLowerCase());
        if (isBook) {
          setBookChosen(true);
          setSuggestions([]);
          onChange(text); // Keep the text as is with space
        }
      }
      return;
    }

    // Book is chosen, now handle chapter:verse formatting
    setSuggestions([]);
    
    // Find the book part (everything before the numbers)
    const bookMatch = text.match(/^(.+?)\s+(\d+.*)/);
    if (!bookMatch) {
      setRaw(text);
      onChange(text);
      return;
    }

    const bookPart = bookMatch[1];
    const numbersPart = bookMatch[2];

    // Parse the numbers part based on mode
    if (mode === "single") {
      let formatted = numbersPart;
      
      // Auto-insert colon after chapter number + space (before typing verse)
      // Handle "chapter " -> "chapter:" (colon appears immediately after space)
      if (/^\d+\s$/.test(formatted)) {
        formatted = formatted.replace(/\s$/, ':');
      }
      // Handle "chapter:verse" -> keep as is
      // Replace "chapter space verse" with "chapter:verse"
      formatted = formatted.replace(/^(\d+)\s+(\d+)$/, '$1:$2');
      
      const newText = bookPart + " " + formatted;
      setRaw(newText);
      onChange(newText);
    } else {
      // Multi mode
      let formatted = numbersPart;
      
      // Auto-insert colon after chapter number + space
      if (/^\d+\s$/.test(formatted)) {
        formatted = formatted.replace(/\s$/, ':');
      }
      // Handle "chapter:verse " -> "chapter:verse-" (dash appears immediately after space)
      else if (/^\d+:\d+\s$/.test(formatted)) {
        formatted = formatted.replace(/\s$/, '-');
      }
      // Handle "chapter verse1 verse2" -> "chapter:verse1-verse2"
      formatted = formatted.replace(/^(\d+)\s+(\d+)\s+(\d+)$/, '$1:$2-$3');
      // Handle "chapter:verse1 verse2" -> "chapter:verse1-verse2"
      formatted = formatted.replace(/^(\d+):(\d+)\s+(\d+)$/, '$1:$2-$3');
      // Handle "chapter:verse1-" -> keep as is (ready for last verse)
      
      const newText = bookPart + " " + formatted;
      setRaw(newText);
      onChange(newText);
    }
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

  // Determine placeholder based on current state
  function getPlaceholder(): string {
    if (!bookChosen) return "Type a book name…";
    
    const parts = raw.trim().split(/\s+/);
    if (parts.length <= 1) return "Chapter number";
    
    if (mode === "single") {
      if (!raw.includes(":")) return "Chapter:Verse (type chapter then space)";
      const afterColon = raw.split(":")[1];
      if (!afterColon || afterColon === "") return "Verse number";
      return "Reference complete";
    } else {
      // Multi mode
      if (!raw.includes(":")) return "Chapter number";
      const colonParts = raw.split(":");
      if (colonParts.length < 2) return "Chapter number";
      const afterColon = colonParts[1];
      if (!afterColon || afterColon === "") return "Starting verse";
      if (!afterColon.includes("-")) return "Starting verse (then space for dash)";
      const dashParts = afterColon.split("-");
      if (dashParts.length < 2 || dashParts[1] === "") return "Ending verse";
      return "Reference complete";
    }
  }

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
            {" "}Multi
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
          placeholder={getPlaceholder()}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={() => onSubmit?.(raw)}
        />
        {raw.length > 0 && (
          <Pressable hitSlop={8} onPress={() => { 
            setRaw(""); 
            onChange(""); 
            setBookChosen(false); 
            setSuggestions([]); 
          }}>
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
            ? "Type chapter number, space, then verse number"
            : "Type chapter, space, verse1, space, verse2"}
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