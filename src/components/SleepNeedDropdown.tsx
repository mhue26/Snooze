import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  formatDurationDigits,
  parseSleepNeedDigits,
  suggestedSleepNeedMinutes,
} from '../domain/sleepNeed';
import { targetSleepDurationMinutes, type TargetSleepTimes } from '../domain/targetSleep';
import { theme, typography } from '../theme/tokens';

function durationDisplay(digits: string): string {
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function SleepNeedDropdown({
  initial,
  active,
  targetSleepTimes,
  onSave,
  onClose,
}: {
  initial: number;
  active: boolean;
  targetSleepTimes: TargetSleepTimes;
  onSave: (value: number) => Promise<void>;
  onClose: () => void;
}) {
  const resetKey = `${active ? 'active' : 'inactive'}-${initial}-${targetSleepTimes.bedtimeMinutes}-${targetSleepTimes.wakeMinutes}`;

  return (
    <SleepNeedForm
      key={resetKey}
      initial={initial}
      targetSleepTimes={targetSleepTimes}
      onSave={onSave}
      onClose={onClose}
    />
  );
}

function SleepNeedForm({
  initial,
  targetSleepTimes,
  onSave,
  onClose,
}: {
  initial: number;
  targetSleepTimes: TargetSleepTimes;
  onSave: (value: number) => Promise<void>;
  onClose: () => void;
}) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const targetWindow = useMemo(
    () => targetSleepDurationMinutes(targetSleepTimes),
    [targetSleepTimes],
  );

  const suggestedMinutes = useMemo(
    () => suggestedSleepNeedMinutes(targetWindow, initial),
    [targetWindow, initial],
  );

  const placeholderText = durationDisplay(formatDurationDigits(suggestedMinutes));

  const save = async () => {
    if (saving) return;

    let minutesToSave: number;
    if (digits === '') {
      // If the user types nothing and presses Save, the shown greyed suggested value is saved.
      minutesToSave = suggestedMinutes;
    } else {
      const parsed = parseSleepNeedDigits(digits);
      if (!parsed.success) {
        setError(parsed.error);
        return;
      }
      minutesToSave = parsed.minutes;
    }

    setError('');
    setSaving(true);
    try {
      await onSave(minutesToSave);
      onClose();
    } catch {
      setError('Could not save your sleep need. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.content}>
      <View style={styles.clockFields}>
        <View style={styles.clockGroup}>
          <Text style={styles.fieldLabel}>Sleep need duration</Text>
          <TextInput
            accessibilityLabel="Sleep need, hours and minutes"
            accessibilityHint="Enter four digits for hours and minutes"
            value={durationDisplay(digits)}
            keyboardType="number-pad"
            maxLength={5}
            placeholder={placeholderText}
            placeholderTextColor={theme.textOnNightMuted}
            selectionColor={theme.buttonFill}
            cursorColor={theme.buttonFill}
            style={styles.clockInput}
            onChangeText={text => {
              let next = text.replace(/\D/g, '').slice(0, 4);
              if (text.length < durationDisplay(digits).length && next === digits) {
                next = next.slice(0, -1);
              }
              setDigits(next);
            }}
          />
        </View>
      </View>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <View style={styles.actions}>
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
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 12 },
  clockFields: { flexDirection: 'row' },
  clockGroup: { flex: 1, minWidth: 0, gap: 6 },
  fieldLabel: { fontFamily: typography.bodySemibold, color: theme.textOnNightMuted, fontSize: 13 },
  clockInput: {
    height: 46,
    borderWidth: 1,
    borderColor: theme.borderOnNight,
    borderRadius: 12,
    textAlign: 'center',
    fontFamily: typography.bodyBold,
    fontSize: 22,
    color: theme.textOnNight,
  },
  error: { fontFamily: typography.body, color: '#e07070', fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  cancelButton: { minHeight: 40, paddingHorizontal: 12, justifyContent: 'center' },
  cancelText: { fontFamily: typography.bodySemibold, color: theme.textOnNight, fontSize: 15 },
  saveButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.buttonFill,
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveText: { fontFamily: typography.bodyBold, color: theme.buttonText, fontSize: 14 },
});
