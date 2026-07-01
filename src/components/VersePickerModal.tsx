// components/VersePickerModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

interface GridPickerProps {
  items: number[];
  selected: number | null;
  onSelect: (item: number) => void;
  theme: any;
}

function GridPicker({
  items,
  selected,
  onSelect,
  theme,
}: GridPickerProps) {
  return (
    <ScrollView 
      style={{ maxHeight: 400 }}
      nestedScrollEnabled={true}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.gridContainer}>
        {items.map((item) => {
          const isSelected = selected === item;
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.gridItem,
                {
                  backgroundColor: isSelected ? theme.accent : theme.background,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => onSelect(item)}
            >
              <Text
                style={[
                  styles.gridItemText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.text,
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

interface VersePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (verse: number) => void;
  bookName: string;
  chapter: number;
  totalVerses: number;
  selectedVerse: number | null;
  theme: any;
}

export function VersePickerModal({
  visible,
  onClose,
  onSelect,
  bookName,
  chapter,
  totalVerses,
  selectedVerse,
  theme,
}: VersePickerModalProps) {
  const verses = Array.from({ length: totalVerses }, (_, i) => i + 1);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Select Verse
          </Text>
          <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
            {bookName} {chapter}
          </Text>
          
          <GridPicker
            items={verses}
            selected={selectedVerse}
            onSelect={(verse) => {
              onSelect(verse);
              onClose();
            }}
            theme={theme}
          />
          
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.accent }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  gridItem: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  closeButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});