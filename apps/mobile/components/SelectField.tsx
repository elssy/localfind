import React, { useState } from "react";
import { View, Text, Modal, Pressable, FlatList, StyleSheet } from "react-native";
import { COLORS } from "@localfind/shared";

interface Props {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

// A dropdown that opens a list of choices. It does not depend on any extra
// package, so it adds nothing new to install.
export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
}: Props) {
  const [open, setOpen] = useState(false);

  const choose = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value || "not selected"}`}
      >
        <Text style={value ? styles.value : styles.placeholder}>{value || placeholder}</Text>
        <Text style={styles.chevron}>{"\u25BE"}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close"
          />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => choose(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {selected ? <Text style={styles.check}>{"\u2713"}</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: COLORS.midText, marginBottom: 6, marginTop: 14 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  value: { fontSize: 16, color: COLORS.darkText },
  placeholder: { fontSize: 16, color: COLORS.mutedText },
  chevron: { fontSize: 14, color: COLORS.mutedText },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 12,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionSelected: { backgroundColor: COLORS.lightBlueTint },
  optionText: { fontSize: 16, color: COLORS.darkText },
  optionTextSelected: { fontWeight: "600", color: COLORS.primaryBlue },
  check: { fontSize: 16, color: COLORS.primaryBlue },
});
