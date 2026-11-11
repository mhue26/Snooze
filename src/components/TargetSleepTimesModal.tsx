import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTimeFormat } from '../context/WeekStartContext';
import { DEFAULT_TARGET_SLEEP, isValidTargetSleepTimes, type TargetSleepTimes } from '../domain/targetSleep';
import { parseClockDigits, type TimeFormat } from '../domain/sleep';
import { theme, typography } from '../theme/tokens';

type ClockValue = { digits: string; period: 'AM' | 'PM' };

function clockValue(minutes: number, format: TimeFormat): ClockValue {
  const hours = Math.floor(minutes / 60);
  const displayHour = format === '12h' ? hours % 12 || 12 : hours;
  return {
    digits: `${String(displayHour).padStart(2, '0')}${String(minutes % 60).padStart(2, '0')}`,
    period: hours < 12 ? 'AM' : 'PM',
  };
}

function clockDisplay(digits: string): string {
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function TargetSleepTimesModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: TargetSleepTimes;
  onSave: (value: TargetSleepTimes) => Promise<void>;
  onClose: () => void;
}) {
  const { timeFormat } = useTimeFormat();
  const [bed, setBed] = useState<ClockValue>(() => clockValue(initial.bedtimeMinutes, timeFormat));
  const [wake, setWake] = useState<ClockValue>(() => clockValue(initial.wakeMinutes, timeFormat));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBed(clockValue(initial.bedtimeMinutes, timeFormat));
    setWake(clockValue(initial.wakeMinutes, timeFormat));
    setError('');
  }, [initial, timeFormat, visible]);

  const field = (
    label: string,
    value: ClockValue,
    setValue: (value: ClockValue) => void,
    _isBed: boolean,
  ) => (
    <View style={styles.clockGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={`${label}, ${timeFormat === '24h' ? '24 hour' : '12 hour'} time`}
        accessibilityHint="Enter four digits for hours and minutes"
        value={clockDisplay(value.digits)}
        keyboardType="number-pad"
        maxLength={5}
        placeholder="HH:MM"
        placeholderTextColor={theme.textOnPaperFaint}
        selectionColor={theme.buttonFill}
        cursorColor={theme.buttonFill}
        style={styles.clockInput}
        onChangeText={text => {
          let digits = text.replace(/\D/g, '').slice(0, 4);
          if (text.length < clockDisplay(value.digits).length && digits === value.digits) digits = digits.slice(0, -1);
          setValue({ ...value, digits });
        }}
      />
      {timeFormat === '12h' && (
        <View accessibilityRole="radiogroup" accessibilityLabel={`${label} period`} style={styles.clockPeriods}>
          {(['AM', 'PM'] as const).map(period => (
            <Pressable
              key={period}
              accessibilityRole="radio"
              accessibilityLabel={`${label} ${period}`}
              accessibilityState={{ checked: value.period === period }}
              onPress={() => setValue({ ...value, period })}
              style={[styles.clockPeriod, value.period === period && styles.selectedPeriod]}
            >
              <Text style={styles.periodText}>{period}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const save = async () => {
    if (saving) return;
    const bedtimeMinutes = parseClockDigits(bed.digits, timeFormat, bed.period);
    const wakeMinutes = parseClockDigits(wake.digits, timeFormat, wake.period);
    if (bedtimeMinutes === null || wakeMinutes === null) {
      setError(timeFormat === '24h' ? 'Enter valid times from 00:00 to 23:59.' : 'Enter valid times from 01:00 to 12:59.');
      return;
    }
    const next: TargetSleepTimes = { bedtimeMinutes, wakeMinutes };
    if (!isValidTargetSleepTimes(next)) {
      setError('Bedtime and wake time must define a sleep period.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave(next);
      onClose();
    } catch {
      setError('Could not save your target times. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop} accessibilityViewIsModal>
        <View style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>Target sleep times</Text>
          <Text style={styles.intro}>Your goal bedtime and wake time. Sleep debt on Today uses this window.</Text>
          <View style={styles.clockFields}>
            {field('Bedtime', bed, setBed, true)}
            {field('Wake time', wake, setWake, false)}
          </View>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setBed(clockValue(DEFAULT_TARGET_SLEEP.bedtimeMinutes, timeFormat));
                setWake(clockValue(DEFAULT_TARGET_SLEEP.wakeMinutes, timeFormat));
                setError('');
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>Reset to 11 PM – 7 AM</Text>
            </Pressable>
            <View style={styles.primaryActions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: saving }}
                disabled={saving}
                onPress={() => void save()}
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              >
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  dialog: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },
  title: { fontFamily: typography.heading, color: theme.textOnPaper, fontSize: 24 },
  intro: { fontFamily: typography.body, color: theme.textOnPaperMuted, fontSize: 14, lineHeight: 20 },
  clockFields: { flexDirection: 'row', gap: 12 },
  clockGroup: { flex: 1, gap: 8 },
  fieldLabel: { fontFamily: typography.bodySemibold, color: theme.textOnPaperMuted, fontSize: 14 },
  clockInput: {
    height: 52,
    borderWidth: 1,
    borderColor: theme.borderOnPaper,
    borderRadius: 14,
    textAlign: 'center',
    fontFamily: typography.heading,
    fontSize: 28,
    color: theme.textOnPaper,
  },
  clockPeriods: { flexDirection: 'row', borderRadius: 10, padding: 2, gap: 2, backgroundColor: theme.borderOnPaper },
  clockPeriod: { flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  selectedPeriod: { backgroundColor: theme.buttonFill },
  periodText: { fontFamily: typography.bodyBold, fontSize: 13, color: theme.textOnPaper },
  error: { fontFamily: typography.body, color: '#c44', fontSize: 14 },
  actions: { gap: 12 },
  resetButton: { minHeight: 40, justifyContent: 'center' },
  resetText: { fontFamily: typography.bodySemibold, color: theme.link, fontSize: 14 },
  primaryActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10 },
  cancelButton: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { fontFamily: typography.bodySemibold, color: theme.textOnPaper, fontSize: 15 },
  saveButton: {
    minHeight: 44,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: theme.buttonFill,
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveText: { fontFamily: typography.bodyBold, color: theme.buttonText, fontSize: 15 },
});
