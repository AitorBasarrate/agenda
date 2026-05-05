import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  type Settings,
} from "@/contexts/settings-context";
import { Colors } from "@/constants/theme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [theme, setTheme] = React.useState(settings.theme);

  // Sync from prop only when the modal opens.
  React.useEffect(() => {
    if (isOpen) {
      setTheme(settings.theme); // use the prop, not the stale local state
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (isDark: boolean) => {
    // Only update local state — no context call here.
    // The Switch responds instantly; the rest of the app updates on close.
    setTheme(isDark ? "dark" : "light");
  };

  // Flush to context + storage in the same React batch as closing the modal.
  const handleClose = () => {
    onUpdateSettings({ theme });
    onClose();
  };

  const colors = Colors[theme];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Ajustes
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.text}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Appearance ── */}
            <View
              style={[styles.section, { borderBottomColor: colors.border }]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Apariencia
              </Text>

              <View
                style={[
                  styles.toggleRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <MaterialCommunityIcons
                  name={theme === "dark" ? "weather-night" : "weather-sunny"}
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  {theme === "dark" ? "Oscuro" : "Claro"}
                </Text>
                <Switch
                  value={theme === "dark"}
                  onValueChange={handleToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
});
