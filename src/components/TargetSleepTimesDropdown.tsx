import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTimeFormat } from '../context/WeekStartContext';
import { DEFAULT_SLEEP_NEED_MINUTES, suggestedBedtimeMinutes } from '../domain/sleepNeed';
import { isValidTargetSleepTimes, type TargetSleepTimes } from '../domain/targetSleep';
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

export function TargetSleepTimesDropdown({
  initial,
  active,
  sleepNeedMinutes = DEFAULT_SLEEP_NEED_MINUTES,
  onSave,
  onClose,
}: {
  initial: TargetSleepTimes;
  active: boolean;
  sleepNeedMinutes?: number;
  onSave: (value: TargetSleepTimes) => Promise<void>;
  onClose: () => void;
}) {
  const { timeFormat } = useTimeFormat();
  const resetKey = `${active ? 'active' : 'inactive'}-${initial.bedtimeMinutes}-${initial.wakeMinutes}-${timeFormat}-${sleepNeedMinutes}`;

  return (
    <TargetSleepTimesForm
      key={resetKey}
      initial={initial}
      timeFormat={timeFormat}
      sleepNeedMinutes={sleepNeedMinutes}
      onSave={onSave}
      onClose={onClose}
    />
  );
}

function TargetSleepTimesForm({
  initial,
  timeFormat,
  sleepNeedMinutes,
  onSave,
  onClose,
}: {
  initial: TargetSleepTimes;
  timeFormat: TimeFormat;
  sleepNeedMinutes: number;
  onSave: (value: TargetSleepTimes) => Promise<void>;
  onClose: () => void;
}) {
  const [bed, setBed] = useState(() => clockValue(initial.bedtimeMinutes, timeFormat));
  const [wake, setWake] = useState(() => clockValue(initial.wakeMinutes, timeFormat));
  const [bedPeriodUserOverridden, setBedPeriodUserOverridden] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const wakeMinutes = parseClockDigits(wake.digits, timeFormat, wake.period);
  const suggestedBed = useMemo(() => {
    if (wakeMinutes === null) return null;
    const minutes = suggestedBedtimeMinutes(wakeMinutes, sleepNeedMinutes);
    return {
      minutes,
      clock: clockValue(minutes, timeFormat),
    };
  }, [wakeMinutes, sleepNeedMinutes, timeFormat]);

  const activeBedPeriod = bed.digits === '' && suggestedBed && !bedPeriodUserOverridden
    ? suggestedBed.clock.period
    : bed.period;

  const bedPlaceholder = bed.digits === '' && suggestedBed
    ? clockDisplay(suggestedBed.clock.digits)
    : 'HH:MM';

  const field = (
    label: string,
    value: ClockValue,
    setValue: (value: ClockValue) => void,
    placeholder = 'HH:MM',
    currentPeriod = value.period,
    onSelectPeriod?: (period: 'AM' | 'PM') => void,
  ) => (
    <View style={styles.clockGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={`${label}, ${timeFormat === '24h' ? '24 hour' : '12 hour'} time`}
        accessibilityHint="Enter four digits for hours and minutes"
        value={clockDisplay(value.digits)}
        keyboardType="number-pad"
        maxLength={5}
        placeholder={placeholder}
        placeholderTextColor={theme.textOnNightMuted}
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
              accessibilityState={{ checked: currentPeriod === period }}
              onPress={() => {
                if (onSelectPeriod) onSelectPeriod(period);
                else setValue({ ...value, period });
              }}
              style={[styles.clockPeriod, currentPeriod === period && styles.selectedPeriod]}
            >
              <Text style={[styles.periodText, currentPeriod === period && styles.periodTextSelected]}>{period}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const save = async () => {
    if (saving) return;
    const bedtimeMinutes = bed.digits === '' && suggestedBed
      ? suggestedBed.minutes
      : parseClockDigits(bed.digits, timeFormat, activeBedPeriod);
    const parsedWake = parseClockDigits(wake.digits, timeFormat, wake.period);
    if (bedtimeMinutes === null || parsedWake === null) {
      setError(timeFormat === '24h' ? 'Enter valid times from 00:00 to 23:59.' : 'Enter valid times from 01:00 to 12:59.');
      return;
    }
    const next: TargetSleepTimes = { bedtimeMinutes, wakeMinutes: parsedWake };
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
    <View style={styles.content}>
      <View style={styles.clockFields}>
        {field(
          'Bedtime',
          bed,
          next => {
            if (next.digits === '') setBedPeriodUserOverridden(false);
            setBed(next);
          },
          bedPlaceholder,
          activeBedPeriod,
          period => {
            setBedPeriodUserOverridden(true);
            setBed({ ...bed, period });
          },
        )}
        {field('Wake time', wake, setWake)}
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
  clockFields: { flexDirection: 'row', gap: 10 },
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
  clockPeriods: { flexDirection: 'row', borderRadius: 10, padding: 2, gap: 2, backgroundColor: theme.borderOnNight },
  clockPeriod: { flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  selectedPeriod: { backgroundColor: theme.buttonFill },
  periodText: { fontFamily: typography.bodyBold, fontSize: 12, color: theme.textOnNightMuted },
  periodTextSelected: { color: theme.buttonText },
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
