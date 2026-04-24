import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ThemePreference, type Settings } from "@/contexts/settings-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
}

// ─── Theme option row ─────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] =
  [
    { value: "system", label: "Sistema", icon: "theme-light-dark" },
    { value: "light", label: "Claro", icon: "weather-sunny" },
    { value: "dark", label: "Oscuro", icon: "weather-night" },
  ];

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  return (
    <View style={[styles.section, { borderBottomColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Ajustes
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* ── Theme ── */}
          <SettingSection title="Apariencia">
            <View style={styles.optionGroup}>
              {THEME_OPTIONS.map((opt) => {
                const isActive = settings.theme === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    onPress={() => onUpdateSettings({ theme: opt.value })}
                    style={[
                      styles.optionRow,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isActive ? { borderColor: colors.primary } : null,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isActive }}
                    accessibilityLabel={opt.label}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={22}
                      color={isActive ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isActive ? colors.primary : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isActive && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </SettingSection>

          {/* Future settings sections go here */}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  body: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  optionGroup: {
    gap: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
  },
});
