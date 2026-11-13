import { useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWeekStart } from '../context/WeekStartContext';
import { authenticateDeletion } from '../data/authenticateDeletion';
import { clearSleepData, type ExportFormat } from '../data/deviceData';
import { shareDeviceDataExport } from '../data/shareDeviceDataExport';
import { AnimatedSegmentedControl } from '../components/AnimatedSegmentedControl';
import { SleepNeedDropdown } from '../components/SleepNeedDropdown';
import { TargetSleepTimesDropdown } from '../components/TargetSleepTimesDropdown';
import { useAnimatedDropdown } from '../hooks/useAnimatedDropdown';
import { OpenSourceNoticesScreen } from './OpenSourceNoticesScreen';
import {
  SETTINGS_INNER_HEIGHT,
  SETTINGS_OUTER_HEIGHT,
  settingsControlStyles,
} from '../theme/settingsControls';
import { formatDurationClock, formatSleepTime, type TimeFormat } from '../domain/sleep';
import { DEFAULT_SLEEP_NEED_MINUTES } from '../domain/sleepNeed';
import { DEFAULT_TARGET_SLEEP } from '../domain/targetSleep';
import { theme, typography } from '../theme/tokens';

const deleteIconColor = '#9e3a3a';
const destructiveRed = '#d64545';
const TOP_INSET_EXTRA = 20;
const TIME_FORMAT_DROPDOWN_HEIGHT = 100;
const TARGET_SLEEP_DROPDOWN_HEIGHT = 280;
const SLEEP_NEED_DROPDOWN_HEIGHT = 160;
type SunTimesToggle = 'off' | 'on';

const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string }[] = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

function timeFormatLabel(format: TimeFormat): string {
  return format === '24h' ? '24-hour' : '12-hour';
}

function DisclosureChevron({ progress }: { progress: Animated.Value }) {
  const rotation = progress.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '135deg'] });
  return (
    <View style={styles.disclosureChevron} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.disclosureChevronIcon, { transform: [{ rotate: rotation }] }]} />
    </View>
  );
}

function TrashIcon({ color }: { color: string }) {
  return (
    <View style={iconStyles.trash} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[iconStyles.trashHandle, { backgroundColor: color }]} />
      <View style={[iconStyles.trashLid, { backgroundColor: color }]} />
      <View style={[iconStyles.trashBody, { backgroundColor: color }]}>
        <View style={iconStyles.trashSlot} />
        <View style={iconStyles.trashSlot} />
      </View>
    </View>
  );
}

export function DataScreen({ db, onDataCleared }: { db: SQLiteDatabase; onDataCleared: () => void }) {
  const insets = useSafeAreaInsets();
  const [showNotices, setShowNotices] = useState(false);
  const timeFormatDropdown = useAnimatedDropdown(TIME_FORMAT_DROPDOWN_HEIGHT);
  const targetSleepDropdown = useAnimatedDropdown(TARGET_SLEEP_DROPDOWN_HEIGHT);
  const sleepNeedDropdown = useAnimatedDropdown(SLEEP_NEED_DROPDOWN_HEIGHT);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const {
    weekStartsOn,
    setWeekStartsOn,
    timeFormat,
    setTimeFormat,
    sunriseSunsetEnabled,
    sunriseSunsetBusy,
    setSunriseSunsetEnabled,
    targetSleepTimes,
    setTargetSleepTimes,
    sleepNeedMinutes,
    setSleepNeedMinutes,
  } = useWeekStart();
  const targetSleepLabel = `${formatSleepTime(targetSleepTimes.bedtimeMinutes, timeFormat)} – ${formatSleepTime(targetSleepTimes.wakeMinutes, timeFormat)}`;
  const sleepNeedLabel = formatDurationClock(sleepNeedMinutes);

  if (showNotices) {
    return (
      <View style={styles.fill}>
        <Pressable accessibilityRole="button" onPress={() => setShowNotices(false)} style={[styles.back, { paddingTop: insets.top + TOP_INSET_EXTRA }]}>
          <Text style={styles.link}>← Settings</Text>
        </Pressable>
        <OpenSourceNoticesScreen />
      </View>
    );
  }

  const exportData = async (format: ExportFormat) => {
    setBusy(true);
    try {
      await shareDeviceDataExport(db, { weekStartsOn, timeFormat, sunriseSunsetEnabled, targetSleepTimes, sleepNeedMinutes }, format);
    } catch {
      Alert.alert('Export failed', 'Your data could not be exported. Please try again.');
    } finally { setBusy(false); }
  };

  const confirmClearData = async () => {
    setShowClearConfirm(false);
    setBusy(true);
    try {
      const authentication = await authenticateDeletion();
      if (authentication !== 'authenticated') {
        if (authentication === 'unavailable') Alert.alert('Device authentication unavailable', 'Set up a device passcode or supported biometric authentication, then try again. No data was deleted.');
        else if (authentication === 'failed') Alert.alert('Authentication failed', 'Please try again. No data was deleted.');
        return;
      }
      await clearSleepData(db);
      onDataCleared();
      try {
        await setWeekStartsOn('monday');
        await setTimeFormat('12h');
        await setSunriseSunsetEnabled(false);
        await setTargetSleepTimes(DEFAULT_TARGET_SLEEP);
        await setSleepNeedMinutes(DEFAULT_SLEEP_NEED_MINUTES);
        Alert.alert('Device data cleared', 'Sleep and nap records were deleted and settings were reset.');
      } catch {
        Alert.alert('Records cleared', 'Sleep and nap records were deleted, but settings could not be fully reset.');
      }
    } catch {
      Alert.alert('Could not clear data', 'Your records could not be deleted. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.fill} contentContainerStyle={[styles.container, { paddingTop: insets.top + TOP_INSET_EXTRA }]}>
      <Text accessibilityRole="header" style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionHeader}>PERSONALISATION</Text>
        <View style={styles.settingsCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Target sleep times, ${targetSleepLabel}`}
            accessibilityState={{ expanded: targetSleepDropdown.open }}
            onPress={() => targetSleepDropdown.setOpenAnimated(!targetSleepDropdown.open)}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.rowPressed]}
          >
            <Text style={[styles.settingLabel, styles.rowLabel]}>Target sleep times</Text>
            <View style={styles.disclosureTrailing}>
              <Text style={styles.settingDetail}>{targetSleepLabel}</Text>
              <DisclosureChevron progress={targetSleepDropdown.progress} />
            </View>
          </Pressable>
          {targetSleepDropdown.mounted && (
            <Animated.View
              importantForAccessibility={targetSleepDropdown.open ? 'auto' : 'no-hide-descendants'}
              pointerEvents={targetSleepDropdown.open ? 'auto' : 'none'}
              style={[styles.dropdownPanel, targetSleepDropdown.panelStyle]}
            >
              <TargetSleepTimesDropdown
                active={targetSleepDropdown.open}
                initial={targetSleepTimes}
                sleepNeedMinutes={sleepNeedMinutes}
                onSave={setTargetSleepTimes}
                onClose={() => targetSleepDropdown.setOpenAnimated(false)}
              />
            </Animated.View>
          )}
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sleep need, ${sleepNeedLabel}`}
            accessibilityState={{ expanded: sleepNeedDropdown.open }}
            onPress={() => sleepNeedDropdown.setOpenAnimated(!sleepNeedDropdown.open)}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.rowPressed]}
          >
            <Text style={[styles.settingLabel, styles.rowLabel]}>Sleep need</Text>
            <View style={styles.disclosureTrailing}>
              <Text style={styles.settingDetail}>{sleepNeedLabel}</Text>
              <DisclosureChevron progress={sleepNeedDropdown.progress} />
            </View>
          </Pressable>
          {sleepNeedDropdown.mounted && (
            <Animated.View
              importantForAccessibility={sleepNeedDropdown.open ? 'auto' : 'no-hide-descendants'}
              pointerEvents={sleepNeedDropdown.open ? 'auto' : 'none'}
              style={[styles.dropdownPanel, sleepNeedDropdown.panelStyle]}
            >
              <SleepNeedDropdown
                active={sleepNeedDropdown.open}
                initial={sleepNeedMinutes}
                targetSleepTimes={targetSleepTimes}
                onSave={setSleepNeedMinutes}
                onClose={() => sleepNeedDropdown.setOpenAnimated(false)}
              />
            </Animated.View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionHeader}>CALENDAR</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <Text style={[styles.settingLabel, styles.rowLabel]}>Week starts on</Text>
            <AnimatedSegmentedControl
              groupAccessibilityLabel="First day of the week"
              value={weekStartsOn}
              onSelect={day => { void setWeekStartsOn(day).catch(() => Alert.alert('Could not save setting', 'Please try again.')); }}
              options={[
                { value: 'sunday', label: 'S', accessibilityLabel: 'Sunday' },
                { value: 'monday', label: 'M', accessibilityLabel: 'Monday' },
              ]}
              optionStyle={styles.dayOption}
            />
          </View>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Time format, ${timeFormatLabel(timeFormat)}`}
            accessibilityState={{ expanded: timeFormatDropdown.open }}
            onPress={() => timeFormatDropdown.setOpenAnimated(!timeFormatDropdown.open)}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.rowPressed]}
          >
            <Text style={[styles.settingLabel, styles.rowLabel]}>Time format</Text>
            <View style={styles.disclosureTrailing}>
              <Text style={styles.settingDetail}>{timeFormatLabel(timeFormat)}</Text>
              <DisclosureChevron progress={timeFormatDropdown.progress} />
            </View>
          </Pressable>
          {timeFormatDropdown.mounted && (
            <Animated.View
              accessibilityRole="menu"
              accessibilityLabel="Time format options"
              importantForAccessibility={timeFormatDropdown.open ? 'auto' : 'no-hide-descendants'}
              pointerEvents={timeFormatDropdown.open ? 'auto' : 'none'}
              style={[styles.dropdownPanel, timeFormatDropdown.panelStyle]}
            >
              {TIME_FORMAT_OPTIONS.map((option, index) => (
                <View key={option.value}>
                  {index > 0 && <View style={styles.dropdownDivider} />}
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: timeFormat === option.value }}
                    onPress={() => {
                      if (option.value !== timeFormat) {
                        void setTimeFormat(option.value).catch(() => Alert.alert('Could not save setting', 'Please try again.'));
                      }
                      timeFormatDropdown.setOpenAnimated(false);
                    }}
                    style={({ pressed }) => [styles.dropdownRow, pressed && styles.rowPressed]}
                  >
                    <Text style={[styles.dropdownLabel, timeFormat === option.value && styles.dropdownLabelSelected]}>
                      {option.label}
                    </Text>
                    {timeFormat === option.value ? <Text style={styles.pickerCheck}>✓</Text> : <View style={styles.pickerCheckSpacer} />}
                  </Pressable>
                </View>
              ))}
            </Animated.View>
          )}
          <View style={styles.divider} />
          <View style={styles.settingsRow}>
            <Text style={[styles.settingLabel, styles.rowLabel]}>Sunrise and sunset times</Text>
            <AnimatedSegmentedControl<SunTimesToggle>
              groupAccessibilityLabel="Sunrise and sunset times"
              value={sunriseSunsetEnabled ? 'on' : 'off'}
              disabled={sunriseSunsetBusy}
              muted={!sunriseSunsetEnabled}
              optionStyle={styles.dayOption}
              onSelect={choice => {
                const enabled = choice === 'on';
                if (enabled === sunriseSunsetEnabled || sunriseSunsetBusy) return;
                void setSunriseSunsetEnabled(enabled).then(result => {
                  if (result === 'denied') Alert.alert('Location access is off', 'Allow location access in device settings to use sunrise and sunset times.');
                  else if (result === 'unsupported') Alert.alert('Location unavailable', 'This app build does not include location support. Update or rebuild the app to use sunrise and sunset times.');
                  else if (result === 'unavailable') Alert.alert('Could not get location', 'Check that location services are on, then try again.');
                }).catch(() => Alert.alert('Could not save setting', 'Please try again.'));
              }}
              options={[
                { value: 'off', accessibilityLabel: 'Off' },
                { value: 'on', accessibilityLabel: 'On' },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionHeader}>DATA</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <Text style={[styles.settingLabel, styles.rowLabel]}>Export data</Text>
            <View style={styles.exportActions}>
              {(['json', 'csv'] as const).map(format => (
                <Pressable
                  key={format}
                  accessibilityRole="button"
                  accessibilityLabel={`Export data as ${format.toUpperCase()}`}
                  disabled={busy}
                  accessibilityState={{ disabled: busy }}
                  onPress={() => void exportData(format)}
                  style={({ pressed }) => [
                    styles.exportFormatButton,
                    pressed && styles.exportFormatButtonPressed,
                    busy && styles.exportFormatButtonDisabled,
                  ]}
                >
                  <Text style={styles.exportFormatButtonText}>{format.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingsRow}>
            <Text style={[styles.settingLabel, styles.rowLabel]}>Clear device data</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete all device data"
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              onPress={() => setShowClearConfirm(true)}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
                busy && styles.deleteButtonDisabled,
              ]}
            >
              <TrashIcon color={deleteIconColor} />
            </Pressable>
          </View>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => setShowNotices(true)} style={styles.noticesRow}>
        <Text style={styles.link}>Open source notices  →</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={showClearConfirm} onRequestClose={() => setShowClearConfirm(false)}>
        <View style={styles.modalBackdrop} accessibilityViewIsModal>
          <View style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>Clear device data?</Text>
            <Text style={styles.dialogIntro}>This permanently deletes all sleep records on this device.</Text>
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" onPress={() => setShowClearConfirm(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void confirmClearData()}
                style={({ pressed }) => [styles.clearConfirmButton, pressed && styles.clearConfirmButtonPressed, busy && styles.clearConfirmButtonDisabled]}
              >
                <Text style={styles.clearConfirmButtonText}>Clear data</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.screen },
  container: { paddingHorizontal: 28, paddingBottom: 120 },
  back: { paddingHorizontal: 28, paddingTop: 24 },
  title: { fontFamily: typography.heading, color: theme.textOnNight, fontSize: 36 },
  section: { marginTop: 24 },
  sectionHeader: { fontFamily: typography.heading, color: theme.overline, fontSize: 10, letterSpacing: 1.5, marginBottom: 10 },
  settingsCard: { borderRadius: 16, backgroundColor: theme.borderOnNight, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: (52 - SETTINGS_OUTER_HEIGHT) / 2,
    minHeight: 52,
  },
  settingLabel: { fontFamily: typography.bodySemibold, color: theme.textOnNight, fontSize: 16 },
  settingDetail: { fontFamily: typography.body, color: theme.textOnNightMuted, fontSize: 16 },
  disclosureTrailing: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  disclosureChevron: { width: 12, height: 14, alignItems: 'center', justifyContent: 'center' },
  disclosureChevronIcon: {
    width: 8,
    height: 8,
    borderTopWidth: 1.25,
    borderRightWidth: 1.25,
    borderColor: theme.textOnNightMuted,
    transform: [{ rotate: '45deg' }],
    marginLeft: -1,
  },
  dropdownPanel: {
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: theme.screen,
    overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    gap: 12,
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderOnNight,
    marginHorizontal: 12,
  },
  dropdownLabel: { fontFamily: typography.body, color: theme.textOnNightMuted, fontSize: 15, flex: 1 },
  dropdownLabelSelected: { fontFamily: typography.bodySemibold, color: theme.textOnNight },
  pickerCheck: { fontFamily: typography.bodyBold, color: theme.link, fontSize: 18 },
  pickerCheckSpacer: { width: 18 },
  rowLabel: { flex: 1 },
  rowPressed: { opacity: 0.85 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.screen, marginHorizontal: 16 },
  deleteButton: {
    minWidth: 44,
    minHeight: SETTINGS_OUTER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: { opacity: 0.65 },
  deleteButtonDisabled: { opacity: 0.45 },
  exportActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportFormatButton: {
    ...settingsControlStyles.innerPill,
    minWidth: 48,
    paddingHorizontal: 10,
    backgroundColor: theme.buttonFill,
  },
  exportFormatButtonPressed: { opacity: 0.85 },
  exportFormatButtonDisabled: { opacity: 0.45 },
  exportFormatButtonText: { fontFamily: typography.bodyBold, color: theme.buttonText, fontSize: 14 },
  dayOption: { width: SETTINGS_INNER_HEIGHT, minWidth: SETTINGS_INNER_HEIGHT, paddingHorizontal: 0 },
  noticesRow: { paddingVertical: 20, marginTop: 24, borderTopWidth: 1, borderColor: theme.borderOnNight },
  link: { fontFamily: typography.bodySemibold, color: theme.link, fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  dialog: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },
  dialogTitle: { fontFamily: typography.heading, color: theme.textOnPaper, fontSize: 24 },
  dialogIntro: { fontFamily: typography.body, color: theme.textOnPaperMuted, fontSize: 14, lineHeight: 20 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10 },
  cancelButton: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { fontFamily: typography.bodySemibold, color: theme.textOnPaper, fontSize: 15 },
  clearConfirmButton: {
    minHeight: 44,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: destructiveRed,
    justifyContent: 'center',
  },
  clearConfirmButtonPressed: { opacity: 0.85 },
  clearConfirmButtonDisabled: { opacity: 0.45 },
  clearConfirmButtonText: { fontFamily: typography.bodyBold, color: '#ffffff', fontSize: 15 },
});

const iconStyles = StyleSheet.create({
  trash: { width: 20, height: 20, alignItems: 'center' },
  trashHandle: {
    width: 7,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 1,
  },
  trashLid: { width: 17, height: 3, borderRadius: 1 },
  trashBody: {
    marginTop: 2,
    width: 14,
    height: 11,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingBottom: 2,
    paddingHorizontal: 2,
  },
  trashSlot: { width: 2, height: 7, backgroundColor: theme.screen, borderRadius: 1 },
});
