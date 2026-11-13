import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, FlatList, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { CellRendererProps } from '@react-native/virtualized-lists';
import { LinearGradient } from 'expo-linear-gradient';
import { sleepSunColors } from '../domain/sunlight';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WeekdayDots } from '../components/WeekdayDots';
import { useSunriseSunset, useTimeFormat, useWeekStart } from '../context/WeekStartContext';
import { loadSleepRecord, saveSleepRecord } from '../data/sleepRecords';
import { deleteNap, loadNaps, saveNap, type Nap } from '../data/naps';
import { dayHeaderTitle, formatMonthDay, weekdayIndex } from '../domain/dates';
import { daysBetween, formatDurationClock, formatSleepTime, localDateKey, parseClockDigits, parseSleepTime, shiftDate, sleepDuration, type SleepRecord, type TimeFormat } from '../domain/sleep';
import { monthProgress } from '../domain/monthProgress';
import { canBeginTodaySwipe, historySurfaceRelease } from '../domain/historyGesture';
import { calculateSleepDebt, DEBT_WINDOW_DAYS } from '../domain/sleepDebt';
import { theme, typography } from '../theme/tokens';

type TimeFields = { hour: string; minute: string; period: 'AM' | 'PM' };
function toFields(value: number): TimeFields {
  const hour = Math.floor(value / 60);
  return { hour: String(hour % 12 || 12), minute: String(value % 60).padStart(2, '0'), period: hour < 12 ? 'AM' : 'PM' };
}

function TimeInput({ label, value, onChange }: { label: string; value: TimeFields; onChange: (value: TimeFields) => void }) {
  return <View style={styles.timeGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.timeRow}>
      <TextInput accessibilityLabel={`${label} hour`} value={value.hour} onChangeText={hour => onChange({ ...value, hour })} keyboardType="number-pad" maxLength={2} placeholder="HH" placeholderTextColor={theme.textOnPaperFaint} selectionColor={theme.buttonFill} cursorColor={theme.buttonFill} style={styles.input} />
      <Text style={styles.colon}>:</Text>
      <TextInput accessibilityLabel={`${label} minute`} value={value.minute} onChangeText={minute => onChange({ ...value, minute })} keyboardType="number-pad" maxLength={2} placeholder="MM" placeholderTextColor={theme.textOnPaperFaint} selectionColor={theme.buttonFill} cursorColor={theme.buttonFill} style={styles.input} />
      <View style={styles.periods}>{(['AM', 'PM'] as const).map(period => <Pressable key={period} accessibilityRole="radio" accessibilityLabel={`${label} ${period}`} accessibilityState={{ checked: value.period === period }} onPress={() => onChange({ ...value, period })} style={[styles.period, value.period === period && styles.selectedPeriod]}><Text style={styles.periodText}>{period}</Text></Pressable>)}</View>
    </View>
  </View>;
}

type ClockValue = { digits: string; period: 'AM' | 'PM' };
function clockValue(minutes: number | undefined, format: TimeFormat, fallback: 'AM' | 'PM'): ClockValue {
  if (minutes === undefined) return { digits: '', period: fallback };
  const hours = Math.floor(minutes / 60);
  const displayHour = format === '12h' ? hours % 12 || 12 : hours;
  return { digits: `${String(displayHour).padStart(2, '0')}${String(minutes % 60).padStart(2, '0')}`, period: hours < 12 ? 'AM' : 'PM' };
}
function clockDisplay(digits: string): string {
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

function SleepEditor({ date, existing, db, onClose, onSaved }: { date: string; existing: SleepRecord | null; db: SQLiteDatabase; onClose: () => void; onSaved: (record: SleepRecord) => void }) {
  const { timeFormat } = useTimeFormat();
  const [bed, setBed] = useState(() => clockValue(existing?.bedtimeMinutes, timeFormat, 'PM'));
  const [wake, setWake] = useState(() => clockValue(existing?.wakeMinutes, timeFormat, 'AM'));
  const wakeRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    if (date > localDateKey(new Date())) { setError('Sleep cannot be logged for a future date.'); return; }
    const bedtimeMinutes = parseClockDigits(bed.digits, timeFormat, bed.period);
    const wakeMinutes = parseClockDigits(wake.digits, timeFormat, wake.period);
    if (bedtimeMinutes === null || wakeMinutes === null) { setError(timeFormat === '24h' ? 'Enter valid times from 00:00 to 23:59.' : 'Enter valid times from 01:00 to 12:59.'); return; }
    if (bedtimeMinutes === wakeMinutes) { setError('Bedtime and wake time must be different.'); return; }
    const record = { date, bedtimeMinutes, wakeMinutes };
    if (sleepDuration(record) === null) { setError('These times are not valid on this date. Check daylight saving time.'); return; }
    setError(''); setSaving(true);
    try { await saveSleepRecord(db, record); onSaved(record); }
    catch { setError('Could not save your sleep times. Please try again.'); }
    finally { setSaving(false); }
  };
  const field = (label: string, value: ClockValue, setValue: (value: ClockValue) => void, isBed: boolean) => <View style={styles.clockGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput ref={isBed ? undefined : wakeRef} accessibilityLabel={`${label}, ${timeFormat === '24h' ? '24 hour' : '12 hour'} time`} accessibilityHint="Enter four digits for hours and minutes" value={clockDisplay(value.digits)} autoFocus={isBed} selectTextOnFocus={!!existing} keyboardType="number-pad" maxLength={5} placeholder="HH:MM" placeholderTextColor={theme.textOnPaperFaint} selectionColor={theme.buttonFill} cursorColor={theme.buttonFill} style={styles.clockInput} onChangeText={text => {
      let digits = text.replace(/\D/g, '').slice(0, 4);
      if (text.length < clockDisplay(value.digits).length && digits === value.digits) digits = digits.slice(0, -1);
      setValue({ ...value, digits });
      if (isBed && value.digits.length < 4 && digits.length === 4) wakeRef.current?.focus();
    }} />
    {timeFormat === '12h' && <View accessibilityRole="radiogroup" accessibilityLabel={`${label} period`} style={styles.clockPeriods}>{(['AM', 'PM'] as const).map(period => <Pressable key={period} accessibilityRole="radio" accessibilityLabel={`${label} ${period}`} accessibilityState={{ checked: value.period === period }} onPress={() => setValue({ ...value, period })} style={[styles.clockPeriod, value.period === period && styles.selectedPeriod]}><Text style={styles.periodText}>{period}</Text></Pressable>)}</View>}
  </View>;
  return <View style={styles.sleepEditor}>
    <View style={styles.clockFields}>{field('Bedtime', bed, setBed, true)}{field('Wake time', wake, setWake, false)}</View>
    {!!error && <Text accessibilityRole="alert" style={styles.errorOnPaper}>{error}</Text>}
    <View style={styles.dialogActions}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.pressed]}><Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text></Pressable>
    </View>
  </View>;
}

function NapEditor({ date, existing, db, onClose, onSaved }: { date: string; existing: Nap | null; db: SQLiteDatabase; onClose: () => void; onSaved: () => void }) {
  const [start, setStart] = useState<TimeFields>(() => existing ? toFields(existing.startMinutes) : { hour: '', minute: '', period: 'PM' });
  const [end, setEnd] = useState<TimeFields>(() => existing ? toFields(existing.endMinutes) : { hour: '', minute: '', period: 'PM' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    const startMinutes = parseSleepTime(start.hour, start.minute, start.period);
    const endMinutes = parseSleepTime(end.hour, end.minute, end.period);
    if (date > localDateKey(new Date())) { setError('Naps cannot be logged for a future date.'); return; }
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) { setError('Enter valid times on the same day, with the end after the start.'); return; }
    const duration = sleepDuration({ date, bedtimeMinutes: startMinutes, wakeMinutes: endMinutes });
    if (duration === null) { setError('These times are not valid on this date. Check daylight saving time.'); return; }
    setSaving(true); setError('');
    try {
      const naps = await loadNaps(db, date);
      if (naps.some(nap => nap.id !== existing?.id && startMinutes < nap.endMinutes && endMinutes > nap.startMinutes)) {
        setError('This nap overlaps another nap.'); return;
      }
      await saveNap(db, { date, startMinutes, endMinutes }, existing?.id); onSaved();
    } catch { setError('Could not save your nap. Please try again.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!existing || saving) return;
    setSaving(true); setError('');
    try { await deleteNap(db, existing); onSaved(); }
    catch { setError('Could not delete your nap. Please try again.'); }
    finally { setSaving(false); }
  };
  return <View style={styles.inlineEditor}>
      <Text accessibilityRole="header" style={styles.dialogTitle}>{existing ? 'Edit nap' : 'Log nap'}</Text>
      <Text style={styles.dialogIntro}>Enter the start and end times on {formatMonthDay(date)}.</Text>
      <TimeInput label="Start time" value={start} onChange={setStart} />
      <TimeInput label="End time" value={end} onChange={setEnd} />
      {!!error && <Text accessibilityRole="alert" style={styles.errorOnPaper}>{error}</Text>}
      <View style={styles.dialogActions}>
        {existing && <Pressable accessibilityRole="button" disabled={saving} onPress={() => void remove()} style={styles.cancelButton}><Text style={styles.cancelText}>Delete</Text></Pressable>}
        <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => void save()} style={styles.saveButton}><Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text></Pressable>
      </View>
  </View>;
}

const WALL_ITEM_HEIGHT = 176;
const TIMELINE_VIEWABILITY = { viewAreaCoveragePercentThreshold: 10 };

const SLEEP_EDITOR_MS = 220;

function AddSleepHeading() {
  return (
    <View style={styles.addSleepRow}>
      <Text style={styles.cardMessage}>Add your sleep</Text>
      <Text style={styles.addSleepPlusIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">+</Text>
    </View>
  );
}

function DateOverview({ date, db, refresh, onPress, compact = false, location, onDataChanged }: { date: string; db: SQLiteDatabase; refresh: number; onPress: (record: SleepRecord | null) => void; compact?: boolean; location: { latitude: number; longitude: number } | null; onDataChanged?: () => void }) {
  const { timeFormat } = useTimeFormat();
  const [loaded, setLoaded] = useState<{ date: string; refresh: number; record: SleepRecord | null; naps: Nap[]; error: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const [editingSleep, setEditingSleep] = useState(false);
  const [editingNap, setEditingNap] = useState<Nap | 'new' | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sleepEditorAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => { if (active) setReduceMotion(enabled); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  const openSleepEditor = useCallback(() => {
    setEditingSleep(true);
    if (reduceMotion) {
      sleepEditorAnim.setValue(1);
      return;
    }
    sleepEditorAnim.setValue(0);
    Animated.timing(sleepEditorAnim, {
      toValue: 1,
      duration: SLEEP_EDITOR_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, sleepEditorAnim]);

  const closeSleepEditor = useCallback(() => {
    if (reduceMotion) {
      sleepEditorAnim.setValue(0);
      setEditingSleep(false);
      return;
    }
    Animated.timing(sleepEditorAnim, {
      toValue: 0,
      duration: SLEEP_EDITOR_MS * 0.85,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setEditingSleep(false);
    });
  }, [reduceMotion, sleepEditorAnim]);
  useEffect(() => {
    let active = true;
    Promise.all([loadSleepRecord(db, date), loadNaps(db, date)]).then(([record, naps]) => { if (active) setLoaded({ date, refresh, record, naps, error: false }); }).catch(() => { if (active) setLoaded({ date, refresh, record: null, naps: [], error: true }); });
    return () => { active = false; };
  }, [db, date, refresh, retry, localRefresh]);
  const loading = !loaded || loaded.date !== date || loaded.refresh !== refresh;
  const record = loading ? null : loaded.record;
  const mainDuration = record ? sleepDuration(record) : null;
  const napDuration = loading ? 0 : loaded.naps.reduce((sum, nap) => sum + (sleepDuration({ date, bedtimeMinutes: nap.startMinutes, wakeMinutes: nap.endMinutes }) ?? 0), 0);
  const duration = (mainDuration ?? 0) + napDuration;
  const label = formatMonthDay(date);
  const sleepMinutes = mainDuration ?? 0;
  const summary = (
    <>
      {compact ? <Text style={styles.overline}>{label.toUpperCase()}</Text> : null}
      {!compact && !loading && !loaded?.error && !record && duration > 0 && <AddSleepHeading />}
      {loading ? <Text style={styles.cardMessage}>Loading sleep…</Text> : loaded?.error ? <Text style={styles.cardMessage}>Could not load sleep.</Text> : duration > 0 ? <>
        <Text style={styles.bigSleep}>
          <Text style={styles.bigSleepValue}>{formatDurationClock(sleepMinutes)}</Text>
          {napDuration > 0 && (
            <Text style={styles.bigSleepUnit}> + {formatDurationClock(napDuration)}</Text>
          )}
        </Text>
        {record && <View accessibilityLabel={`Sleep from ${formatSleepTime(record.bedtimeMinutes, timeFormat)} to ${formatSleepTime(record.wakeMinutes, timeFormat)}`}>
          <LinearGradient colors={(location ? sleepSunColors(record, location) : ['#182741', '#182741']) as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.durationBar, compact && styles.durationBarCompact]}>
            {!compact && <><Text style={styles.barTime}>{formatSleepTime(record.bedtimeMinutes, timeFormat)}</Text><Text style={styles.barTime}>{formatSleepTime(record.wakeMinutes, timeFormat)}</Text></>}
          </LinearGradient>
        </View>}

      </> : <>{record ? <Text style={styles.cardMessage}>Review your sleep times</Text> : <AddSleepHeading />}{compact ? <Text style={styles.spanLine}>No sleep recorded</Text> : null}</>}
    </>
  );
  const durationLabel = `${formatDurationClock(sleepMinutes)} sleep${napDuration > 0 ? `, plus ${formatDurationClock(napDuration)} of naps` : ''}`;
  if (compact) return <View style={[styles.paperCard, styles.wallCard]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${loading ? 'loading sleep' : loaded?.error ? 'sleep could not be loaded, retry' : duration > 0 ? durationLabel : 'no sleep recorded'}`} accessibilityHint={loaded?.error ? 'Retry loading' : 'Open this day'} disabled={loading} onPress={() => loaded?.error ? setRetry(value => value + 1) : onPress(record)} style={({ pressed }) => [styles.overviewBody, styles.overviewBodyCompact, pressed && styles.pressed]}>{summary}</Pressable>
  </View>;
  const overviewOpacity = sleepEditorAnim.interpolate({
    inputRange: [0, 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const overviewLift = sleepEditorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  const editorOpacity = sleepEditorAnim;
  const editorLift = sleepEditorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
    extrapolate: 'clamp',
  });

  return <View style={styles.paperCard}>
    {loaded?.error || loading ? <View style={styles.overviewBody}>{summary}</View> : <View style={styles.sleepOverviewSlot}>
      <Animated.View
        pointerEvents={editingSleep ? 'none' : 'auto'}
        style={[
          editingSleep && styles.sleepOverviewOverlay,
          {
            opacity: editingSleep ? overviewOpacity : 1,
            transform: [{ translateY: editingSleep ? overviewLift : 0 }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={record ? `Edit sleep, ${durationLabel}` : 'Add your sleep'}
          onPress={openSleepEditor}
          disabled={editingSleep}
          style={({ pressed }) => [styles.overviewBody, pressed && styles.pressed]}
        >
          {summary}
        </Pressable>
      </Animated.View>
      {editingSleep && (
        <Animated.View style={{ opacity: editorOpacity, transform: [{ translateY: editorLift }] }}>
          <SleepEditor
            date={date}
            existing={record}
            db={db}
            onClose={closeSleepEditor}
            onSaved={() => {
              setLocalRefresh(value => value + 1);
              onDataChanged?.();
              closeSleepEditor();
            }}
          />
        </Animated.View>
      )}
    </View>}
    {loaded?.error && !loading ? <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)}><Text style={styles.retry}>Retry</Text></Pressable> : !loading && !editingSleep && <>
      {loaded?.naps.map(nap => editingNap !== 'new' && editingNap?.id === nap.id ? <NapEditor key={nap.id} date={date} existing={nap} db={db} onClose={() => setEditingNap(null)} onSaved={() => { setEditingNap(null); setLocalRefresh(value => value + 1); onDataChanged?.(); }} /> : <Pressable key={nap.id} accessibilityRole="button" accessibilityLabel={`Edit nap, ${formatSleepTime(nap.startMinutes, timeFormat)} to ${formatSleepTime(nap.endMinutes, timeFormat)}`} onPress={() => setEditingNap(nap)} style={styles.napRow}><Text style={styles.spanLine}>Nap  {formatSleepTime(nap.startMinutes, timeFormat)} – {formatSleepTime(nap.endMinutes, timeFormat)}</Text><Text style={styles.inlineActionText}>Edit</Text></Pressable>)}
      {record && (editingNap === 'new' ? <NapEditor date={date} existing={null} db={db} onClose={() => setEditingNap(null)} onSaved={() => { setEditingNap(null); setLocalRefresh(value => value + 1); onDataChanged?.(); }} /> : <Pressable accessibilityRole="button" onPress={() => setEditingNap('new')} style={styles.inlineAction}><Text style={styles.inlineActionText}>+ Log nap</Text></Pressable>)}
    </>}
  </View>;
}

function SleepDebtCard({ date, db, refresh }: { date: string; db: SQLiteDatabase; refresh: number }) {
  const { sleepNeedMinutes } = useWeekStart();
  const baselineMinutes = sleepNeedMinutes;
  const [result, setResult] = useState<{ date: string; refresh: number; minutes: number; recordedDays: number; error: boolean } | null>(null);
  useEffect(() => {
    let active = true;
    const dates = Array.from({ length: DEBT_WINDOW_DAYS }, (_, index) => shiftDate(date, -index));
    Promise.all(dates.map(async day => {
      const [record, naps] = await Promise.all([loadSleepRecord(db, day), loadNaps(db, day)]);
      return { date: day, record, naps };
    })).then(days => { if (active) setResult({ date, refresh, ...calculateSleepDebt(days, baselineMinutes), error: false }); })
      .catch(() => { if (active) setResult({ date, refresh, minutes: 0, recordedDays: 0, error: true }); });
    return () => { active = false; };
  }, [baselineMinutes, date, db, refresh]);
  const loading = !result || result.date !== date || result.refresh !== refresh;
  const available = !loading && !result.error && result.recordedDays > 0;
  return <View style={styles.debtCard}>
    <View style={styles.debtHeader}><Text accessibilityRole="header" style={styles.debtTitle}>Sleep debt</Text><Text style={styles.debtRange}>LAST 14 DAYS</Text></View>
    <View style={styles.debtContent}>
      <View style={styles.debtRing} accessible accessibilityLabel={loading ? 'Loading sleep debt' : result.error ? 'Sleep debt unavailable' : available ? `${formatDurationClock(result.minutes)} of estimated sleep debt` : 'No sleep records'}>
        <Text style={styles.debtValue}>{loading ? '…' : available ? formatDurationClock(result.minutes) : '—'}</Text>
        <Text style={styles.debtUnit}>HRS : MIN</Text>
      </View>
      <View style={styles.debtDetails}>
        <Text style={styles.debtHeadline}>{loading ? 'Looking back' : result.error ? 'Unable to load' : available ? 'Estimated shortfall' : 'Start your history'}</Text>
        <Text style={styles.debtDescription}>{loading ? 'Checking your sleep records.' : result.error ? 'Please try again later.' : available ? `${result.recordedDays} of 14 nights recorded${result.recordedDays < 14 ? ' · incomplete' : ''}` : 'Log sleep to see your estimate.'}</Text>
        <View style={styles.debtTrack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><View style={[styles.debtProgress, { width: `${loading || result.error ? 0 : result.recordedDays / DEBT_WINDOW_DAYS * 100}%` }]} /></View>
      </View>
    </View>
  </View>;
}

export function TodayScreen({ db }: { db: SQLiteDatabase }) {
  const insets = useSafeAreaInsets();
  const { weekStartsOn } = useWeekStart();
  const { sunriseSunsetEnabled, sunLocation } = useSunriseSunset();
  const effectiveLocation = sunriseSunsetEnabled ? sunLocation : null;
  const [today, setToday] = useState(() => localDateKey(new Date()));
  const [selected, setSelected] = useState(today);
  const [refresh, setRefresh] = useState(0);
  const [wall, setWall] = useState(false);
  const [wallPastToday, setWallPastToday] = useState(false);
  const [showDayTransition, setShowDayTransition] = useState(false);
  const [wallCount, setWallCount] = useState(30);
  const [wallStart, setWallStart] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const listRef = useRef<FlatList<number>>(null);
  const consumedPinch = useRef(false);
  const pinch = useRef<{ distance: number } | null>(null);
  const [glow] = useState(() => new Animated.Value(0));
  const [historyCount, setHistoryCount] = useState(30);
  const [timelineHeight, setTimelineHeight] = useState(0);
  const [historyMode, setHistoryMode] = useState(false);
  const [historyProgress] = useState(() => new Animated.Value(0));
  const [indicatorOpacity] = useState(() => new Animated.Value(0));
  const [indicatorDate, setIndicatorDate] = useState(today);
  const [indicatorFraction, setIndicatorFraction] = useState(0);
  const cellLayouts = useRef(new Map<number, { y: number; height: number }>());
  const lastIndicatorUpdate = useRef(0);
  const wallViewportHeight = useRef(0);
  const TimelineCell = useMemo(() => function TimelineCell({ item, children, style, onLayout, onFocusCapture }: CellRendererProps<number>) {
    return <View style={style} onFocusCapture={onFocusCapture} onLayout={event => { cellLayouts.current.set(item, { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height }); onLayout?.(event); }}>{children}</View>;
  }, []);
  const indicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyOffset = useRef(0);
  const touchStartedAtBoundary = useRef(false);
  const [scrollTarget, setScrollTarget] = useState<number | null>(null);
  const timelineRef = useRef<FlatList<number>>(null);
  const pendingTarget = useRef<number | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wallTransition] = useState(() => new Animated.Value(1));
  const [jumpTransition] = useState(() => new Animated.Value(0));
  const [dayEntry] = useState(() => new Animated.Value(1));
  const animateJump = useRef(false);
  const showIndicator = useCallback(() => {
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
    Animated.timing(indicatorOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  }, [indicatorOpacity]);
  const hideIndicator = useCallback(() => {
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
    indicatorTimer.current = setTimeout(() => Animated.timing(indicatorOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(), 900);
  }, [indicatorOpacity]);
  const showJumpToToday = wall ? wallPastToday : historyMode;
  useEffect(() => {
    if (reduceMotion) { jumpTransition.setValue(showJumpToToday ? 1 : 0); return; }
    const animation = Animated.timing(jumpTransition, { toValue: showJumpToToday ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [showJumpToToday, reduceMotion, jumpTransition]);
  const stateRef = useRef({ today, selected, wall, wallCount, reduceMotion, historyMode });
  useEffect(() => { stateRef.current = { today, selected, wall, wallCount, reduceMotion, historyMode }; }, [today, selected, wall, wallCount, reduceMotion, historyMode]);
  const onTimelineViewable = useCallback(({ viewableItems }: { viewableItems: { item: number; isViewable: boolean }[] }) => {
    if (stateRef.current.wall || !stateRef.current.historyMode) return;
    const target = pendingTarget.current;
    if (target !== null) {
      if (viewableItems.some(item => item.isViewable && item.item === target)) { pendingTarget.current = null; setSelected(shiftDate(stateRef.current.today, -target)); }
      return;
    }
    const visible = viewableItems.find(item => item.isViewable);
    if (visible) setSelected(shiftDate(stateRef.current.today, -visible.item));
  }, []);

  const refreshToday = useCallback(() => {
    const now = localDateKey(new Date());
    const previous = stateRef.current.today;
    setSelected(current => current === previous || current > now ? now : current);
    setToday(now);
    setRefresh(value => value + 1);
  }, []);
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(refreshToday, Math.max(1000, midnight.getTime() - now.getTime() + 100));
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refreshToday(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, [today, refresh, refreshToday]);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; listener.remove(); };
  }, []);

  useEffect(() => {
    glow.stopAnimation();
    if (wall || selected !== today || reduceMotion) { glow.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [glow, wall, selected, today, reduceMotion]);

  const navigateToDay = useCallback((date: string) => {
    const index = Math.max(0, daysBetween(date, stateRef.current.today));
    setHistoryCount(count => Math.max(count, index + 30));
    pendingTarget.current = index || null;
    setSelected(date);
    setIndicatorDate(date);
    setIndicatorFraction(0);
    setHistoryMode(index > 0);
    historyProgress.stopAnimation();
    Animated.timing(historyProgress, { toValue: index > 0 ? 1 : 0, duration: stateRef.current.reduceMotion ? 0 : 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    setScrollTarget(index > 0 ? index : null);
  }, [setHistoryCount, historyProgress]);
  useEffect(() => {
    if (wall || scrollTarget === null) return;
    const frame = requestAnimationFrame(() => {
      if (scrollTarget === 1) {
        historyOffset.current = 0;
        timelineRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else timelineRef.current?.scrollToIndex({ index: scrollTarget - 1, animated: false, viewPosition: 0 });
      setScrollTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [wall, scrollTarget, historyCount]);
  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
  }, []);
  const openWall = useCallback(() => {
    const { today: currentToday, selected: current } = stateRef.current;
    const index = Math.max(0, daysBetween(current, currentToday));
    pendingTarget.current = null;
    wallTransition.stopAnimation();
    const animate = !stateRef.current.reduceMotion;
    wallTransition.setValue(animate ? 0 : 1);
    setShowDayTransition(animate);
    setWallPastToday(index > 0);
    setWallStart(index); setWallCount(Math.max(30, index + 30));
    setWall(true);
  }, [wallTransition]);
  useEffect(() => {
    if (!wall || !showDayTransition) return;
    const frame = requestAnimationFrame(() => {
      Animated.timing(wallTransition, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShowDayTransition(false);
      });
    });
    return () => { cancelAnimationFrame(frame); wallTransition.stopAnimation(); };
  }, [wall, showDayTransition, wallTransition]);
  const openDay = useCallback((date: string) => {
    const fromWall = stateRef.current.wall;
    const motion = !stateRef.current.reduceMotion;
    animateJump.current = date === stateRef.current.today && !fromWall && motion;
    wallTransition.stopAnimation(); setShowDayTransition(false); setWall(false);
    dayEntry.stopAnimation();
    if (fromWall && motion) {
      dayEntry.setValue(0);
      Animated.timing(dayEntry, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else dayEntry.setValue(1);
    navigateToDay(date);
  }, [navigateToDay, wallTransition, dayEntry]);
  // Gesture callbacks read refs only when touch events occur.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: event => {
      if (event.nativeEvent.touches.length <= 1) touchStartedAtBoundary.current = canBeginTodaySwipe(historyOffset.current, stateRef.current.selected, shiftDate(stateRef.current.today, -1));
      return false;
    },
    onMoveShouldSetPanResponderCapture: (event, gesture) => event.nativeEvent.touches.length >= 2 || (!stateRef.current.wall && Math.abs(gesture.dy) > 15 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5 && (stateRef.current.historyMode ? touchStartedAtBoundary.current && gesture.dy < 0 : gesture.dy > 0)),
    onPanResponderGrant: event => {
      consumedPinch.current = false;
      const touches = event.nativeEvent.touches;
      pinch.current = touches.length >= 2 ? { distance: Math.abs(touches[0].pageY - touches[1].pageY) } : null;
    },
    onPanResponderMove: event => {
      const touches = event.nativeEvent.touches;
      if (consumedPinch.current || touches.length < 2) return;
      const distance = Math.abs(touches[0].pageY - touches[1].pageY);
      if (!pinch.current) { pinch.current = { distance }; return; }
      const delta = distance - pinch.current.distance;
      if (!stateRef.current.wall && delta < -45) { pinch.current = null; consumedPinch.current = true; openWall(); }
      else if (stateRef.current.wall && delta > 45) {
        pinch.current = null; consumedPinch.current = true; openDay(stateRef.current.today);
      }
    },
    onPanResponderRelease: (_event, gesture) => {
      if (consumedPinch.current || pinch.current) { pinch.current = null; return; }
      if (!stateRef.current.wall) {
        const destination = historySurfaceRelease(stateRef.current.historyMode, touchStartedAtBoundary.current, gesture.dy);
        if (destination === 'today') openDay(stateRef.current.today);
        else if (destination === 'yesterday') openDay(shiftDate(stateRef.current.today, -1));
      }
    },
    onPanResponderTerminate: () => { pinch.current = null; consumedPinch.current = false; },
    onPanResponderTerminationRequest: () => false,
  }), [openDay, openWall]);
  const timelineData = useMemo(() => Array.from({ length: historyCount }, (_, index) => index + 1), [historyCount]);
  const wallData = useMemo(() => Array.from({ length: wallCount }, (_, index) => index), [wallCount]);
  const previous = () => openDay(shiftDate(selected, -1));
  const next = () => { if (selected < today) openDay(shiftDate(selected, 1)); };
  return <View style={styles.container} {...pan.panHandlers}
    accessibilityActions={[
      { name: 'previousDay', label: 'Previous day' },
      { name: 'nextDay', label: 'Next day' },
      { name: 'goToday', label: 'Go to today' },
      { name: 'toggleHistory', label: wall ? 'Show day view' : 'Show history wall' },
    ]}
    onAccessibilityAction={event => {
      switch (event.nativeEvent.actionName) {
        case 'previousDay': setWall(false); previous(); break;
        case 'nextDay': setWall(false); next(); break;
        case 'goToday': openDay(today); break;
        case 'toggleHistory':
          if (wall) openDay(today);
          else openWall();
          break;
      }
    }}>

    {!wall && <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.glowContainer, { opacity: Animated.multiply(reduceMotion ? 0.18 : glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.23] }), historyProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) }]}><LinearGradient colors={['transparent', '#8098d4', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.glowGradient} /></Animated.View>}
    {wall && <View style={[styles.wallContainer, { paddingTop: insets.top + 20 }]} onLayout={event => { wallViewportHeight.current = event.nativeEvent.layout.height - insets.top - 20; }}>
      <FlatList ref={listRef} showsVerticalScrollIndicator={false} onScrollBeginDrag={showIndicator} onScrollEndDrag={hideIndicator} onMomentumScrollBegin={showIndicator} onMomentumScrollEnd={hideIndicator} data={wallData} keyExtractor={item => String(item)} initialScrollIndex={wallStart} getItemLayout={(_, index) => ({ length: WALL_ITEM_HEIGHT, offset: WALL_ITEM_HEIGHT * index, index })} onScroll={event => { const offset = event.nativeEvent.contentOffset.y; setWallPastToday(offset > 20); const now = Date.now(); if (now - lastIndicatorUpdate.current < 80) return; lastIndicatorUpdate.current = now; const position = Math.max(0, (offset + wallViewportHeight.current / 2) / WALL_ITEM_HEIGHT); const index = Math.min(wallCount - 1, Math.floor(position)); setIndicatorDate(shiftDate(today, -index)); setIndicatorFraction(index === wallCount - 1 ? 0 : position - index); }} scrollEventThrottle={16} onEndReached={() => setWallCount(value => value + 30)} onEndReachedThreshold={0.5} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} renderItem={({ item }) => {
        const date = shiftDate(today, -item);
        const delay = Math.min(Math.abs(item - wallStart), 4) * 0.08;
        const progress = wallTransition.interpolate({ inputRange: [0, delay + 0.001, delay + 0.65, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
        return <Animated.View style={[styles.wallItem, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}><DateOverview location={effectiveLocation} date={date} db={db} refresh={refresh} compact onPress={() => openDay(date)} /></Animated.View>;
      }} />
    </View>}
    {(!wall || showDayTransition) && <Animated.View pointerEvents={wall ? 'none' : 'auto'} accessibilityElementsHidden={wall} importantForAccessibility={wall ? 'no-hide-descendants' : 'auto'} style={[wall ? styles.dayOverlay : styles.fill, { opacity: wall ? wallTransition.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0, 0], extrapolate: 'clamp' }) : dayEntry }]}>
      <Animated.View pointerEvents={historyMode ? 'none' : 'auto'} accessibilityElementsHidden={historyMode} importantForAccessibility={historyMode ? 'no-hide-descendants' : 'auto'} style={[styles.dayOverlay, { transform: [{ scale: reduceMotion ? 1 : historyProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }] }]}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}>
          <Text style={styles.todayTitle} accessibilityRole="header">Today</Text>
          <View style={styles.dayLayout}><View style={styles.weekdayRail}><WeekdayDots layout="vertical" activeIndex={weekdayIndex(today, weekStartsOn)} weekStartsOn={weekStartsOn} anchorDate={today} today={today} /></View><View style={styles.dayMain}><DateOverview date={today} db={db} refresh={refresh} onDataChanged={() => setRefresh(value => value + 1)} location={effectiveLocation} onPress={() => {}} /><SleepDebtCard date={today} db={db} refresh={refresh} /></View></View>
        </ScrollView>
      </Animated.View>
      <Animated.View pointerEvents={historyMode ? 'auto' : 'none'} accessibilityElementsHidden={!historyMode} importantForAccessibility={historyMode ? 'auto' : 'no-hide-descendants'} style={[styles.dayOverlay, styles.historySurface, { opacity: reduceMotion ? historyProgress : 1, transform: [{ translateY: reduceMotion ? 0 : historyProgress.interpolate({ inputRange: [0, 1], outputRange: [-Math.max(1, timelineHeight), 0] }) }] }]}>
        <View pointerEvents="none" style={styles.historyEdge}><LinearGradient colors={['#0b162c', 'rgba(11,22,44,0)']} style={styles.historyEdgeFill} /></View>
        <FlatList
          ref={timelineRef} inverted bounces={false}
          onTouchStart={event => { if (event.nativeEvent.touches.length <= 1) touchStartedAtBoundary.current = canBeginTodaySwipe(historyOffset.current, stateRef.current.selected, shiftDate(stateRef.current.today, -1)); }} overScrollMode="never" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          onLayout={event => setTimelineHeight(event.nativeEvent.layout.height)}
          onScroll={event => {
            const offset = Math.max(0, event.nativeEvent.contentOffset.y);
            historyOffset.current = offset;
            const now = Date.now();
            if (now - lastIndicatorUpdate.current < 80) return;
            lastIndicatorUpdate.current = now;
            const center = offset + timelineHeight / 2;
            for (const [item, layout] of cellLayouts.current) {
              if (layout.height > 0 && center >= layout.y && center < layout.y + layout.height) {
                setIndicatorDate(shiftDate(today, -item));
                setIndicatorFraction((center - layout.y) / layout.height);
                break;
              }
            }
          }}
          onScrollBeginDrag={showIndicator} onScrollEndDrag={hideIndicator} onMomentumScrollBegin={showIndicator} onMomentumScrollEnd={hideIndicator}
          scrollEventThrottle={16} CellRendererComponent={TimelineCell} data={timelineData} keyExtractor={item => String(item)} windowSize={5} initialNumToRender={2} maxToRenderPerBatch={3}
          viewabilityConfig={TIMELINE_VIEWABILITY} onViewableItemsChanged={onTimelineViewable}
          onScrollToIndexFailed={info => {
            timelineRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
            if (retryTimer.current) clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(() => { if (pendingTarget.current !== null) timelineRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 }); }, 100);
          }}
          onEndReached={() => setHistoryCount(count => count + 30)} onEndReachedThreshold={0.5}
          renderItem={({ item }) => {
            const date = shiftDate(today, -item);
            return <View style={[styles.scroll, { paddingTop: 20, paddingBottom: 24 }]}>
              <Text style={styles.todayTitle} accessibilityRole="header">{dayHeaderTitle(date, today)}</Text>
              <View style={styles.dayLayout}><View style={styles.weekdayRail}><WeekdayDots layout="vertical" activeIndex={weekdayIndex(date, weekStartsOn)} weekStartsOn={weekStartsOn} anchorDate={date} today={today} /></View><View style={styles.dayMain}><DateOverview date={date} db={db} refresh={refresh} onDataChanged={() => setRefresh(value => value + 1)} location={effectiveLocation} onPress={() => {}} /><SleepDebtCard date={date} db={db} refresh={refresh} /></View></View>
            </View>;
          }}
        />
      </Animated.View>
    </Animated.View>}
    {(wall || historyMode) && <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.monthIndicator, { opacity: indicatorOpacity, top: insets.top + 40 }]}>
      <Text style={styles.monthLabel}>{monthProgress(indicatorDate, today, indicatorFraction).label}</Text>
      <View style={styles.monthTrack}><View style={[styles.monthThumb, { bottom: `${monthProgress(indicatorDate, today, indicatorFraction).progress * 100}%` }]} /></View>
    </Animated.View>}
    <Animated.View pointerEvents={showJumpToToday ? 'auto' : 'none'} accessibilityElementsHidden={!showJumpToToday} importantForAccessibility={showJumpToToday ? 'auto' : 'no-hide-descendants'} style={[styles.jumpContainer, { bottom: insets.bottom + 88, opacity: jumpTransition, transform: [{ translateY: jumpTransition.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Jump to Today" onPress={() => openDay(today)} style={({ pressed }) => [styles.jumpButton, pressed && styles.pressed]}>
        <Text style={styles.jumpArrow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">↓</Text>
        <Text style={styles.jumpText}>Jump to Today</Text>
      </Pressable>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.screen, overflow: 'hidden' },
  historySurface: { backgroundColor: '#0b162c' },
  historyEdge: { position: 'absolute', left: 0, right: 0, bottom: -36, height: 36 },
  historyEdgeFill: { flex: 1 },
  monthIndicator: { position: 'absolute', right: 4, alignItems: 'flex-end', gap: 5, zIndex: 3 },
  monthLabel: { fontFamily: typography.bodySemibold, color: theme.textOnNight, backgroundColor: theme.screen, overflow: 'hidden', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, fontSize: 11 },
  monthTrack: { width: 3, height: 78, borderRadius: 2, backgroundColor: theme.borderOnNight, marginRight: 4 },
  monthThumb: { position: 'absolute', width: 3, height: 14, borderRadius: 2, backgroundColor: theme.buttonFill, marginBottom: -7 },
  glowContainer: { position: 'absolute', top: '10%', left: '-30%', width: '160%', height: '72%' },
  glowGradient: { flex: 1, borderRadius: 240 },
  fill: { flex: 1 },
  jumpContainer: { position: 'absolute', alignSelf: 'center', zIndex: 2 },
  jumpButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.buttonFill, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  jumpArrow: { fontFamily: typography.bodyBold, color: theme.buttonText, fontSize: 20, lineHeight: 24 },
  jumpText: { fontFamily: typography.bodyBold, color: theme.buttonText, fontSize: 14 },
  dayOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  wallContainer: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  wallItem: { height: WALL_ITEM_HEIGHT, paddingHorizontal: 22, paddingBottom: 12 },
  wallCard: { flex: 1 },
  scroll: { paddingLeft: 8, paddingRight: 26, maxWidth: 520, width: '100%', alignSelf: 'center', gap: 14 },
  todayTitle: { fontFamily: typography.heading, color: theme.textOnNight, fontSize: 38, letterSpacing: -1.2, textAlign: 'center', marginTop: 8 },
  dayLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '100%' },
  weekdayRail: { width: 24, alignItems: 'center', paddingTop: 28 },
  dayMain: { flex: 1, minWidth: 0, marginRight: 2, gap: 14 },
  debtCard: { backgroundColor: theme.card, borderRadius: 24, padding: 22, gap: 18 },
  debtHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  debtTitle: { fontFamily: typography.heading, color: theme.textOnPaper, fontSize: 21 },
  debtRange: { fontFamily: typography.bodyBold, color: theme.textOnPaperMuted, fontSize: 10, letterSpacing: 1 },
  debtContent: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  debtRing: { width: 116, height: 116, borderRadius: 58, borderWidth: 7, borderColor: theme.buttonFill, alignItems: 'center', justifyContent: 'center' },
  debtValue: { fontFamily: typography.bodyBold, color: theme.textOnPaper, fontSize: 27, letterSpacing: -1 },
  debtUnit: { fontFamily: typography.bodySemibold, color: theme.textOnPaperMuted, fontSize: 10, letterSpacing: 0.7 },
  debtDetails: { flex: 1, gap: 7 },
  debtHeadline: { fontFamily: typography.bodyBold, color: theme.textOnPaper, fontSize: 15 },
  debtDescription: { fontFamily: typography.body, color: theme.textOnPaperMuted, fontSize: 13, lineHeight: 18 },
  debtTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: theme.borderOnPaper, marginTop: 4 },
  debtProgress: { height: '100%', borderRadius: 3, backgroundColor: theme.textOnPaper },
  paperCard: { backgroundColor: theme.card, borderRadius: 24, padding: 22, gap: 10 },
  sleepOverviewSlot: { position: 'relative' },
  sleepOverviewOverlay: { position: 'absolute', top: 0, right: 0, left: 0 },
  overviewBody: { gap: 18 },
  overviewBodyCompact: { gap: 10 },
  overline: { fontFamily: typography.heading, color: theme.textOnPaperMuted, fontSize: 9, letterSpacing: 1.2, marginBottom: 2 },
  bigSleep: { fontFamily: typography.body, fontSize: 40, lineHeight: 48, marginTop: 2 },
  bigSleepValue: { fontFamily: typography.bodyBold, color: theme.textOnPaper, fontSize: 40, letterSpacing: -1.5 },
  bigSleepUnit: { fontFamily: typography.bodySemibold, color: theme.textOnPaperFaint, fontSize: 28, letterSpacing: -0.5 },
  cardMessage: { fontFamily: typography.heading, color: theme.textOnPaper, fontSize: 24 },
  addSleepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  addSleepPlusIcon: { fontFamily: typography.heading, color: theme.textOnPaper, fontSize: 32, lineHeight: 34 },
  spanLine: { fontFamily: typography.body, color: theme.textOnPaperMuted, fontSize: 14, lineHeight: 18, includeFontPadding: false },
  durationBar: { minHeight: 46, borderRadius: 12, marginTop: 4, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  durationBarCompact: { minHeight: 8, borderRadius: 4 },
  barTime: { fontFamily: typography.bodyBold, color: '#ffffff', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.65)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  retry: { fontFamily: typography.body, color: theme.link, fontSize: 14 },
  pressed: { opacity: 0.85 },
  sleepEditor: { gap: 14 },
  clockFields: { flexDirection: 'row', gap: 12 },
  clockGroup: { flex: 1, minWidth: 0, gap: 8 },
  clockInput: { fontFamily: typography.bodySemibold, color: theme.textOnPaper, borderWidth: 1, borderColor: theme.borderOnPaper, borderRadius: 12, height: 52, paddingHorizontal: 10, fontSize: 22, textAlign: 'center' },
  clockPeriods: { flexDirection: 'row', alignSelf: 'center' },
  clockPeriod: { minWidth: 44, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  inlineEditor: { gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderOnPaper },
  inlineAction: { minHeight: 44, justifyContent: 'center' },
  inlineActionText: { fontFamily: typography.bodyBold, color: theme.textOnPaper, fontSize: 15 },
  napRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dialogTitle: { fontFamily: typography.heading, color: theme.textOnPaper, fontSize: 24 },
  dialogIntro: { fontFamily: typography.body, color: theme.textOnPaperMuted, fontSize: 14 },
  timeGroup: { gap: 8 },
  fieldLabel: { fontFamily: typography.bodySemibold, color: theme.textOnPaper, fontSize: 15 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { fontFamily: typography.body, color: theme.textOnPaper, borderWidth: 1, borderColor: theme.borderOnPaper, borderRadius: 10, width: 55, height: 48, textAlign: 'center', fontSize: 18 },
  colon: { fontFamily: typography.body, color: theme.textOnPaper, fontSize: 20 },
  periods: { flexDirection: 'row', marginLeft: 4 },
  period: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center', borderRadius: 10 },
  selectedPeriod: { backgroundColor: theme.buttonFill },
  periodText: { fontFamily: typography.bodySemibold, color: theme.textOnPaper },
  errorOnPaper: { fontFamily: typography.bodySemibold, color: theme.textOnPaper, fontSize: 14 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { fontFamily: typography.bodySemibold, color: theme.textOnPaper },
  saveButton: { minHeight: 44, paddingHorizontal: 22, borderRadius: 14, backgroundColor: theme.buttonFill, justifyContent: 'center' },
  saveText: { fontFamily: typography.bodyBold, color: theme.buttonText },
});

