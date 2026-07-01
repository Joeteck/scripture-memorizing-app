// components/BibleReferenceInput.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ViewStyle,
  Keyboard,
} from "react-native";

interface Book {
  id: number;
  display: string;
  names: string[];
}

interface BibleReferenceInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  theme: any;
}

const BOOKS: Book[] = [
  { id: 1, display: "Genesis", names: ["genesis", "gen"] },
  { id: 2, display: "Exodus", names: ["exodus", "exo", "ex"] },
  { id: 3, display: "Leviticus", names: ["leviticus", "lev"] },
  { id: 4, display: "Numbers", names: ["numbers", "num"] },
  { id: 5, display: "Deuteronomy", names: ["deuteronomy", "deut", "deu"] },
  { id: 6, display: "Joshua", names: ["joshua", "josh", "jos"] },
  { id: 7, display: "Judges", names: ["judges", "judg", "jdg"] },
  { id: 8, display: "Ruth", names: ["ruth", "rut"] },
  { id: 9, display: "1 Samuel", names: ["1 samuel", "1samuel", "1 sam", "i samuel"] },
  { id: 10, display: "2 Samuel", names: ["2 samuel", "2samuel", "2 sam", "ii samuel"] },
  { id: 11, display: "1 Kings", names: ["1 kings", "1kings", "1 ki", "i kings"] },
  { id: 12, display: "2 Kings", names: ["2 kings", "2kings", "2 ki", "ii kings"] },
  { id: 13, display: "1 Chronicles", names: ["1 chronicles", "1chronicles", "1 chron", "1 chr"] },
  { id: 14, display: "2 Chronicles", names: ["2 chronicles", "2chronicles", "2 chron", "2 chr"] },
  { id: 15, display: "Ezra", names: ["ezra"] },
  { id: 16, display: "Nehemiah", names: ["nehemiah", "neh"] },
  { id: 17, display: "Esther", names: ["esther", "esth", "est"] },
  { id: 18, display: "Job", names: ["job"] },
  { id: 19, display: "Psalms", names: ["psalms", "psalm", "ps", "psa"] },
  { id: 20, display: "Proverbs", names: ["proverbs", "prov", "pro"] },
  { id: 21, display: "Ecclesiastes", names: ["ecclesiastes", "eccl", "ecc"] },
  { id: 22, display: "Song of Solomon", names: ["song of solomon", "song of songs", "songs", "sos"] },
  { id: 23, display: "Isaiah", names: ["isaiah", "isa"] },
  { id: 24, display: "Jeremiah", names: ["jeremiah", "jer"] },
  { id: 25, display: "Lamentations", names: ["lamentations", "lam"] },
  { id: 26, display: "Ezekiel", names: ["ezekiel", "ezek", "eze"] },
  { id: 27, display: "Daniel", names: ["daniel", "dan"] },
  { id: 28, display: "Hosea", names: ["hosea", "hos"] },
  { id: 29, display: "Joel", names: ["joel"] },
  { id: 30, display: "Amos", names: ["amos"] },
  { id: 31, display: "Obadiah", names: ["obadiah", "obad", "oba"] },
  { id: 32, display: "Jonah", names: ["jonah", "jon"] },
  { id: 33, display: "Micah", names: ["micah", "mic"] },
  { id: 34, display: "Nahum", names: ["nahum", "nah"] },
  { id: 35, display: "Habakkuk", names: ["habakkuk", "hab"] },
  { id: 36, display: "Zephaniah", names: ["zephaniah", "zeph", "zep"] },
  { id: 37, display: "Haggai", names: ["haggai", "hag"] },
  { id: 38, display: "Zechariah", names: ["zechariah", "zech", "zec"] },
  { id: 39, display: "Malachi", names: ["malachi", "mal"] },
  { id: 40, display: "Matthew", names: ["matthew", "matt", "mat"] },
  { id: 41, display: "Mark", names: ["mark", "mar", "mrk"] },
  { id: 42, display: "Luke", names: ["luke", "luk"] },
  { id: 43, display: "John", names: ["john", "jhn"] },
  { id: 44, display: "Acts", names: ["acts", "act"] },
  { id: 45, display: "Romans", names: ["romans", "rom"] },
  { id: 46, display: "1 Corinthians", names: ["1 corinthians", "1corinthians", "1 cor"] },
  { id: 47, display: "2 Corinthians", names: ["2 corinthians", "2corinthians", "2 cor"] },
  { id: 48, display: "Galatians", names: ["galatians", "gal"] },
  { id: 49, display: "Ephesians", names: ["ephesians", "eph"] },
  { id: 50, display: "Philippians", names: ["philippians", "phil", "php"] },
  { id: 51, display: "Colossians", names: ["colossians", "col"] },
  { id: 52, display: "1 Thessalonians", names: ["1 thessalonians", "1thessalonians", "1 thess", "1 th"] },
  { id: 53, display: "2 Thessalonians", names: ["2 thessalonians", "2thessalonians", "2 thess", "2 th"] },
  { id: 54, display: "1 Timothy", names: ["1 timothy", "1timothy", "1 tim"] },
  { id: 55, display: "2 Timothy", names: ["2 timothy", "2timothy", "2 tim"] },
  { id: 56, display: "Titus", names: ["titus", "tit"] },
  { id: 57, display: "Philemon", names: ["philemon", "phlm", "phm"] },
  { id: 58, display: "Hebrews", names: ["hebrews", "heb"] },
  { id: 59, display: "James", names: ["james", "jas", "jam"] },
  { id: 60, display: "1 Peter", names: ["1 peter", "1peter", "1 pet", "1 pe"] },
  { id: 61, display: "2 Peter", names: ["2 peter", "2peter", "2 pet", "2 pe"] },
  { id: 62, display: "1 John", names: ["1 john", "1john", "1 jn"] },
  { id: 63, display: "2 John", names: ["2 john", "2john", "2 jn"] },
  { id: 64, display: "3 John", names: ["3 john", "3john", "3 jn"] },
  { id: 65, display: "Jude", names: ["jude", "jud"] },
  { id: 66, display: "Revelation", names: ["revelation", "revelations", "rev"] },
];

export function BibleReferenceInput({
  value,
  onChangeText,
  placeholder = "Type a book name, e.g., John",
  style,
  theme,
}: BibleReferenceInputProps) {
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [displayText, setDisplayText] = useState(value);
  const inputRef = useRef<TextInput>(null);

  // Update display text when value changes from parent
  useEffect(() => {
    setDisplayText(value);
  }, [value]);

  // Handle book suggestions
  useEffect(() => {
    const parts = displayText.trim().split(/\s+/);
    if (parts.length === 0 || parts.length > 1) {
      setShowSuggestions(false);
      return;
    }

    const searchTerm = parts[0].toLowerCase();
    if (searchTerm.length > 0) {
      const filtered = BOOKS.filter(book =>
        book.display.toLowerCase().includes(searchTerm) ||
        book.names.some(name => name.includes(searchTerm))
      ).slice(0, 10);
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [displayText]);

  const formatReference = (text: string): string => {
    // Remove any extra spaces
    let formatted = text.replace(/\s+/g, ' ').trim();
    
    // Fix spacing around colon
    formatted = formatted.replace(/\s*:\s*/g, ':');
    
    // Fix spacing around hyphen for verse ranges
    formatted = formatted.replace(/\s*-\s*/g, '-');
    
    // Ensure single space between book and chapter
    formatted = formatted.replace(/([a-zA-Z0-9])\s+(\d+)/g, '$1 $2');
    
    // Remove spaces before colon
    formatted = formatted.replace(/\s+:/g, ':');
    
    return formatted;
  };

  const isValidFormat = (text: string): boolean => {
    if (text.trim() === '') return true;
    
    // Book name only (e.g., "John")
    if (/^[a-zA-Z0-9\s]+$/.test(text.trim())) {
      return true;
    }
    
    // Book + chapter (e.g., "John 3")
    if (/^[a-zA-Z0-9\s]+\s+\d+$/.test(text.trim())) {
      return true;
    }
    
    // Book + chapter:verse (e.g., "John 3:16")
    if (/^[a-zA-Z0-9\s]+\s+\d+:\d+$/.test(text.trim())) {
      return true;
    }
    
    // Book + chapter:verse-verse (e.g., "John 3:16-18")
    if (/^[a-zA-Z0-9\s]+\s+\d+:\d+-\d+$/.test(text.trim())) {
      return true;
    }
    
    return false;
  };

  const getValidationError = (text: string): string | null => {
    if (text.trim() === '') return null;
    
    const trimmed = text.trim();
    
    // Check if it starts with a valid book name
    const bookMatch = trimmed.match(/^([a-zA-Z0-9\s]+?)(?:\s|$)/);
    if (bookMatch) {
      const bookName = bookMatch[1].trim();
      const found = BOOKS.some(b => 
        b.display.toLowerCase() === bookName.toLowerCase() ||
        b.names.some(name => name.toLowerCase() === bookName.toLowerCase())
      );
      if (!found && !trimmed.includes(' ')) {
        return 'Unknown book name';
      }
    }
    
    // Check for invalid characters
    if (/[<>{}[\]\\|;'"]/.test(trimmed)) {
      return 'Invalid characters detected';
    }
    
    // Check for multiple colons
    if ((trimmed.match(/:/g) || []).length > 1) {
      return 'Invalid format: too many colons';
    }
    
    return null;
  };

  const handleTextChange = (text: string) => {
    // Don't allow invalid characters
    const cleaned = text.replace(/[<>{}[\]\\|;'"]/g, '');
    
    // Format the text as user types
    let formatted = formatReference(cleaned);
    
    // Validate the format
    if (!isValidFormat(formatted) && formatted.trim() !== '') {
      // If invalid, try to correct it
      // For example, if user types "John 3:16", it's valid
      // If user types "John 3 : 16", we already fixed the spacing
      
      // Check if it's a partial input that might become valid
      const parts = formatted.split(/\s+/);
      if (parts.length === 1 && parts[0].length > 0) {
        // User is typing book name
        const bookMatch = BOOKS.find(b => 
          b.display.toLowerCase().startsWith(parts[0].toLowerCase()) ||
          b.names.some(name => name.startsWith(parts[0].toLowerCase()))
        );
        if (!bookMatch) {
          // Don't prevent typing, just show in red later
        }
      } else if (parts.length === 2) {
        // User typed book and chapter number
        const bookName = parts[0];
        const chapterNum = parts[1];
        if (!/^\d+$/.test(chapterNum)) {
          // If chapter has non-numeric chars, remove them
          const numeric = chapterNum.replace(/\D/g, '');
          if (numeric) {
            formatted = `${bookName} ${numeric}`;
          } else {
            formatted = bookName;
          }
        }
      }
    }
    
    setDisplayText(formatted);
    onChangeText(formatted);
    
    // Show/hide suggestions based on input
    const parts = formatted.trim().split(/\s+/);
    if (parts.length === 1 && parts[0].length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectBook = (book: Book) => {
    const newText = book.display;
    setDisplayText(newText);
    onChangeText(newText);
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    // Focus back on input to continue typing chapter
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const getBookDisplayName = (text: string): string => {
    const parts = text.trim().split(/\s+/);
    if (parts.length === 0) return text;
    
    const bookName = parts[0];
    const found = BOOKS.find(b => 
      b.display.toLowerCase() === bookName.toLowerCase() ||
      b.names.some(name => name.toLowerCase() === bookName.toLowerCase())
    );
    
    if (found) {
      // Preserve the rest of the text
      const rest = parts.slice(1).join(' ');
      return `${found.display}${rest ? ' ' + rest : ''}`;
    }
    
    return text;
  };

  // Fix capitalization when user finishes typing
  const handleBlur = () => {
    setShowSuggestions(false);
    
    if (displayText.trim()) {
      const corrected = getBookDisplayName(displayText);
      if (corrected !== displayText) {
        setDisplayText(corrected);
        onChangeText(corrected);
      }
    }
  };

  const validationError = getValidationError(displayText);
  const isValid = isValidFormat(displayText) || displayText.trim() === '';

  return (
    <View style={[styles.container, style]}>
      <TextInput
        ref={inputRef}
        value={displayText}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: validationError ? '#FF4444' : (isValid ? theme.border : '#FFA500'),
            backgroundColor: theme.background,
          }
        ]}
        onBlur={handleBlur}
        onFocus={() => {
          const parts = displayText.trim().split(/\s+/);
          if (parts.length === 1 && parts[0].length > 0) {
            setShowSuggestions(true);
          }
        }}
        autoCapitalize="words"
        autoCorrect={false}
        spellCheck={false}
      />

      {/* Format hint */}
      {displayText.trim().length > 0 && !isValid && !validationError && (
        <Text style={[styles.hintText, { color: '#FFA500' }]}>
          ℹ️ Format: Book Chapter:Verse (e.g., John 3:16)
        </Text>
      )}

      {/* Validation error */}
      {validationError && (
        <Text style={[styles.errorText, { color: '#FF4444' }]}>
          ⚠️ {validationError}
        </Text>
      )}

      {/* Format examples */}
      {displayText.trim().length === 0 && (
        <Text style={[styles.exampleText, { color: theme.textSecondary }]}>
          Examples: John 3:16 • Romans 8:28-29 • Psalm 23
        </Text>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }]}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            style={{ maxHeight: 200 }}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.suggestionItem,
                  { borderBottomColor: theme.border }
                ]}
                onPress={() => selectBook(item)}
              >
                <Text style={[styles.suggestionText, { color: theme.text }]}>
                  {item.display}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 1000,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  hintText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  exampleText: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: "italic",
  },
});