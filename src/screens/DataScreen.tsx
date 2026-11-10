import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useWeekStart } from '../context/WeekStartContext';
import { OpenSourceNoticesScreen } from './OpenSourceNoticesScreen';
import { theme } from '../theme/tokens';

export function DataScreen() {
  const [showNotices, setShowNotices] = useState(false);
  const { weekStartsOn, setWeekStartsOn } = useWeekStart();

  if (showNotices) {
    return (
      <View style={styles.fill}>
        <Pressable accessibilityRole="button" onPress={() => setShowNotices(false)} style={styles.back}>
          <Text style={styles.link}>← Data</Text>
        </Pressable>
        <OpenSourceNoticesScreen />
      </View>
    );
  }

  const isSunday = weekStartsOn === 'sunday';

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>Data</Text>
      <Text style={styles.subtitle}>Settings and data controls will appear here.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>CALENDAR</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingLabel}>Week starts on Sunday</Text>
            <Text style={styles.settingHint}>When off, the 7-day indicator starts on Monday.</Text>
          </View>
          <Switch
            accessibilityLabel="Week starts on Sunday"
            value={isSunday}
            onValueChange={checked => setWeekStartsOn(checked ? 'sunday' : 'monday')}
            trackColor={{ false: theme.borderOnNight, true: theme.buttonFill }}
            thumbColor={isSunday ? theme.buttonText : theme.textOnNight}
          />
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => setShowNotices(true)} style={styles.noticesRow}>
        <Text style={styles.link}>Open source notices  →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.screen },
  container: { flex: 1, backgroundColor: theme.screen, paddingHorizontal: 28, paddingTop: 36 },
  back: { paddingHorizontal: 28, paddingTop: 24 },
  title: { color: theme.textOnNight, fontSize: 36, fontWeight: '700' },
  subtitle: { color: theme.textOnNightMuted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  section: { marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderColor: theme.borderOnNight },
  sectionHeader: { color: theme.overline, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  settingTextGroup: { flex: 1 },
  settingLabel: { color: theme.textOnNight, fontSize: 16, fontWeight: '600' },
  settingHint: { color: theme.textOnNightMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  noticesRow: { paddingVertical: 20, marginTop: 24, borderTopWidth: 1, borderColor: theme.borderOnNight },
  link: { color: theme.link, fontSize: 16, fontWeight: '600' },
});
