import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Animated, AppState, FlatList, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SnoozeBrand } from '../components/SnoozeBrand';
import { loadSleepRecord, saveSleepRecord } from '../data/sleepRecords';
import { daysBetween, formatSleepTime, localDateKey, parseSleepTime, shiftDate, sleepDuration, type SleepRecord } from '../domain/sleep';
import { theme } from '../theme/tokens';

type TimeFields = { hour: string; minute: string; period: 'AM' | 'PM' };
function toFields(value: number): TimeFields {
  const hour = Math.floor(value / 60);
  return { hour: String(hour % 12 || 12), minute: String(value % 60).padStart(2, '0'), period: hour < 12 ? 'AM' : 'PM' };
}

function TimeInput({ label, value, onChange }: { label: string; value: TimeFields; onChange: (value: TimeFields) => void }) {
  return <View style={styles.timeGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.timeRow}>
      <TextInput accessibilityLabel={`${label} hour`} value={value.hour} onChangeText={hour => onChange({ ...value, hour })} keyboardType="number-pad" maxLength={2} placeholder="HH" placeholderTextColor={theme.textOnPaperFaint} style={styles.input} />
      <Text style={styles.colon}>:</Text>
      <TextInput accessibilityLabel={`${label} minute`} value={value.minute} onChangeText={minute => onChange({ ...value, minute })} keyboardType="number-pad" maxLength={2} placeholder="MM" placeholderTextColor={theme.textOnPaperFaint} style={styles.input} />
      <View style={styles.periods}>{(['AM', 'PM'] as const).map(period => <Pressable key={period} accessibilityRole="radio" accessibilityLabel={`${label} ${period}`} accessibilityState={{ checked: value.period === period }} onPress={() => onChange({ ...value, period })} style={[styles.period, value.period === period && styles.selectedPeriod]}><Text style={styles.periodText}>{period}</Text></Pressable>)}</View>
    </View>
  </View>;
}

function SleepEditor({ date, existing, db, onClose, onSaved }: { date: string; existing: SleepRecord | null; db: SQLiteDatabase; onClose: () => void; onSaved: (record: SleepRecord) => void }) {
  const [bed, setBed] = useState<TimeFields>(() => existing ? toFields(existing.bedtimeMinutes) : { hour: '', minute: '', period: 'PM' });
  const [wake, setWake] = useState<TimeFields>(() => existing ? toFields(existing.wakeMinutes) : { hour: '', minute: '', period: 'AM' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    if (date > localDateKey(new Date())) { setError('Sleep cannot be logged for a future date.'); return; }
    const bedtimeMinutes = parseSleepTime(bed.hour, bed.minute, bed.period);
    const wakeMinutes = parseSleepTime(wake.hour, wake.minute, wake.period);
    if (bedtimeMinutes === null || wakeMinutes === null) { setError('Enter a valid hour and minute for both times.'); return; }
    if (bedtimeMinutes === wakeMinutes) { setError('Bedtime and wake time must be different.'); return; }
    const record = { date, bedtimeMinutes, wakeMinutes };
    if (sleepDuration(record) === null) { setError('These times are not valid on this date. Check daylight saving time.'); return; }
    setError(''); setSaving(true);
    try { await saveSleepRecord(db, record); onSaved(record); }
    catch { setError('Could not save your sleep times. Please try again.'); }
    finally { setSaving(false); }
  };
  return <Modal transparent animationType="fade" visible onRequestClose={() => { if (!saving) onClose(); }}>
    <View style={styles.modalBackdrop} accessibilityViewIsModal>
      <View style={styles.dialog}>
        <Text accessibilityRole="header" style={styles.dialogTitle}>Edit sleep</Text>
        <Text style={styles.dialogIntro}>Enter the sleep period ending on the selected date.</Text>
        <TimeInput label="Bedtime" value={bed} onChange={setBed} />
        <TimeInput label="Wake time" value={wake} onChange={setWake} />
        {!!error && <Text accessibilityRole="alert" style={styles.errorOnPaper}>{error}</Text>}
        <View style={styles.dialogActions}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.pressed]}><Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const WALL_ITEM_HEIGHT = 176;

function DateOverview({ date, db, refresh, onPress, compact = false }: { date: string; db: SQLiteDatabase; refresh: number; onPress: (record: SleepRecord | null) => void; compact?: boolean }) {
  const [loaded, setLoaded] = useState<{ date: string; refresh: number; record: SleepRecord | null; error: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    loadSleepRecord(db, date).then(record => { if (active) setLoaded({ date, refresh, record, error: false }); }).catch(() => { if (active) setLoaded({ date, refresh, record: null, error: true }); });
    return () => { active = false; };
  }, [db, date, refresh, retry]);
  const loading = !loaded || loaded.date !== date || loaded.refresh !== refresh;
  const record = loading ? null : loaded.record;
  const duration = record ? sleepDuration(record) : null;
  const label = formatDate(date);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${loading ? 'loading sleep' : loaded?.error ? 'sleep could not be loaded, retry' : record && duration !== null ? `${Math.floor(duration / 60)} hours ${duration % 60} minutes, ${formatSleepTime(record.bedtimeMinutes)} to ${formatSleepTime(record.wakeMinutes)}` : 'no sleep recorded'}`} accessibilityHint={loaded?.error ? 'Retry loading' : compact ? 'Open this day' : 'Open the sleep editor'} disabled={loading} onPress={() => loaded?.error ? setRetry(value => value + 1) : onPress(record)} style={({ pressed }) => [styles.paperCard, compact && styles.wallCard, pressed && styles.pressed]}>
    <Text style={styles.overline}>{compact ? label.toUpperCase() : 'REST OVERVIEW'}</Text>
    {loading ? <Text style={styles.cardMessage}>Loading sleep…</Text> : loaded?.error ? <Text style={styles.cardMessage}>Could not load sleep. Tap to retry.</Text> : record && duration !== null ? <>
      <Text style={styles.bigSleep}><Text style={styles.bigSleepValue}>{Math.floor(duration / 60)}</Text><Text style={styles.bigSleepUnit}>h</Text><Text style={styles.bigSleepValue}> {duration % 60}</Text><Text style={styles.bigSleepUnit}>m</Text></Text>
      <Text style={styles.spanLine}>{formatSleepTime(record.bedtimeMinutes)}  →  {formatSleepTime(record.wakeMinutes)}</Text>
    </> : <><Text style={styles.cardMessage}>{record ? 'Review your sleep times' : 'Add your sleep'}</Text><Text style={styles.spanLine}>{compact ? 'No sleep recorded' : 'Tap to add or edit bedtime and wake time'}</Text></>}
  </Pressable>;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

export function TodayScreen({ db }: { db: SQLiteDatabase }) {
  const insets = useSafeAreaInsets();
  const [today, setToday] = useState(() => localDateKey(new Date()));
  const [selected, setSelected] = useState(today);
  const [refresh, setRefresh] = useState(0);
  const [wall, setWall] = useState(false);
  const [wallCount, setWallCount] = useState(30);
  const [wallStart, setWallStart] = useState(0);
  const [editor, setEditor] = useState<{ date: string; record: SleepRecord | null } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const listRef = useRef<FlatList<number>>(null);
  const listContainer = useRef<ComponentRef<typeof View>>(null);
  const wallOffset = useRef(0);
  const wallTop = useRef(0);
  const wallHeight = useRef(0);
  const consumedPinch = useRef(false);
  const pinch = useRef<{ distance: number; centre: number } | null>(null);
  const [transition] = useState(() => new Animated.Value(1));
  const stateRef = useRef({ today, selected, wall, wallCount, reduceMotion });
  useEffect(() => { stateRef.current = { today, selected, wall, wallCount, reduceMotion }; }, [today, selected, wall, wallCount, reduceMotion]);

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

  const animatePage = useCallback((date: string) => {
    setSelected(date);
    if (stateRef.current.reduceMotion) return;
    transition.setValue(0);
    Animated.timing(transition, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [transition]);
  const openWall = useCallback(() => {
    const { today: currentToday, selected: current } = stateRef.current;
    const index = Math.max(0, daysBetween(current, currentToday));
    setWallStart(index); setWallCount(Math.max(30, index + 30)); wallOffset.current = index * WALL_ITEM_HEIGHT;
    setWall(true);
  }, []);
  const openDay = useCallback((date: string) => { setWall(false); animatePage(date); }, [animatePage]);
  // Gesture callbacks read refs only when touch events occur.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (event, gesture) => event.nativeEvent.touches.length >= 2 || (!stateRef.current.wall && Math.abs(gesture.dy) > 22 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5),
    onPanResponderGrant: event => {
      consumedPinch.current = false;
      const touches = event.nativeEvent.touches;
      if (touches.length >= 2) {
        pinch.current = { distance: Math.abs(touches[0].pageY - touches[1].pageY), centre: (touches[0].pageY + touches[1].pageY) / 2 };
        listContainer.current?.measureInWindow((_x, y) => { wallTop.current = y; });
      } else pinch.current = null;
    },
    onPanResponderMove: event => {
      const touches = event.nativeEvent.touches;
      if (consumedPinch.current || touches.length < 2) return;
      const distance = Math.abs(touches[0].pageY - touches[1].pageY);
      const centre = (touches[0].pageY + touches[1].pageY) / 2;
      if (!pinch.current) { pinch.current = { distance, centre }; return; }
      const delta = distance - pinch.current.distance;
      if (!stateRef.current.wall && delta < -45) { pinch.current = null; consumedPinch.current = true; openWall(); }
      else if (stateRef.current.wall && delta > 45) {
        const index = Math.max(0, Math.min(stateRef.current.wallCount - 1, Math.floor((wallOffset.current + centre - wallTop.current) / WALL_ITEM_HEIGHT)));
        pinch.current = null; consumedPinch.current = true; openDay(shiftDate(stateRef.current.today, -index));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (consumedPinch.current || pinch.current || stateRef.current.wall) { pinch.current = null; return; }
      if (Math.abs(gesture.dy) < 60 && Math.abs(gesture.vy) < 0.6) return;
      const { selected: current, today: currentToday } = stateRef.current;
      const next = shiftDate(current, gesture.dy > 0 ? -1 : 1);
      if (next <= currentToday) animatePage(next);
    },
    onPanResponderTerminationRequest: () => false,
  }), [animatePage, openDay, openWall]);
  const wallData = useMemo(() => Array.from({ length: wallCount }, (_, index) => index), [wallCount]);
  const previous = () => animatePage(shiftDate(selected, -1));
  const next = () => { if (selected < today) animatePage(shiftDate(selected, 1)); };
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
        case 'goToday': setWall(false); animatePage(today); break;
        case 'toggleHistory':
          if (wall) openDay(shiftDate(today, -Math.max(0, Math.min(wallCount - 1, Math.floor((wallOffset.current + wallHeight.current / 2) / WALL_ITEM_HEIGHT)))));
          else openWall();
          break;
      }
    }}>

    <View style={[styles.historyHeader, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}><SnoozeBrand /><View style={styles.avatar} accessibilityLabel="Profile" /></View>
    </View>
    {wall ? <View ref={listContainer} style={styles.wallContainer} onLayout={event => { wallHeight.current = event.nativeEvent.layout.height; listContainer.current?.measureInWindow((_x, y) => { wallTop.current = y; }); }}>
      <FlatList ref={listRef} data={wallData} keyExtractor={item => String(item)} initialScrollIndex={wallStart} getItemLayout={(_, index) => ({ length: WALL_ITEM_HEIGHT, offset: WALL_ITEM_HEIGHT * index, index })} onScroll={event => { wallOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} onEndReached={() => setWallCount(value => value + 30)} onEndReachedThreshold={0.5} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} renderItem={({ item }) => {
        const date = shiftDate(today, -item);
        return <View style={styles.wallItem}><DateOverview date={date} db={db} refresh={refresh} compact onPress={() => openDay(date)} /></View>;
      }} />
    </View> : <Animated.View style={[styles.fill, { opacity: transition, transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.todayRow}><Text style={styles.dateLine}>{formatDate(selected).toUpperCase()}</Text><Text style={styles.todayTitle} accessibilityRole="header">{selected === today ? 'Today' : selected === shiftDate(today, -1) ? 'Yesterday' : formatDate(selected)}</Text></View>
        <DateOverview date={selected} db={db} refresh={refresh} onPress={record => setEditor({ date: selected, record })} />
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.napButton, pressed && styles.pressed]}><Text style={styles.napButtonText}>Log nap</Text><Text style={styles.napIcon}>◎</Text></Pressable>
      </ScrollView>
    </Animated.View>}
    {editor && <SleepEditor key={editor.date} date={editor.date} existing={editor.record} db={db} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setRefresh(value => value + 1); }} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.screen },
  fill: { flex: 1 },
  historyHeader: { paddingHorizontal: 22, width: '100%', maxWidth: 520, alignSelf: 'center' },
  wallContainer: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  wallItem: { height: WALL_ITEM_HEIGHT, paddingHorizontal: 22, paddingBottom: 12 },
  wallCard: { flex: 1 },
  scroll: { paddingHorizontal: 22, maxWidth: 520, width: '100%', alignSelf: 'center', gap: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.buttonFill },
  todayRow: { marginTop: 8, alignItems: 'center', width: '100%' },
  dateLine: { color: theme.overlineAccent, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textAlign: 'center' },
  todayTitle: { color: theme.textOnNight, fontSize: 38, fontWeight: '700', letterSpacing: -1.2, marginTop: 6, textAlign: 'center' },
  paperCard: { backgroundColor: theme.card, borderRadius: 24, padding: 22, gap: 10 },
  overline: { color: theme.textOnPaperMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  bigSleep: { fontSize: 40, lineHeight: 44 },
  bigSleepValue: { color: theme.textOnPaper, fontSize: 40, fontWeight: '700', letterSpacing: -1.5 },
  bigSleepUnit: { color: theme.textOnPaperFaint, fontSize: 28, fontWeight: '600', letterSpacing: -0.5 },
  cardMessage: { color: theme.textOnPaper, fontSize: 24, fontWeight: '700' },
  spanLine: { color: theme.textOnPaperMuted, fontSize: 14 },
  retry: { color: theme.link, fontSize: 14 },
  napButton: { minHeight: 54, borderRadius: 27, backgroundColor: theme.buttonFill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 22 },
  napButtonText: { color: theme.buttonText, fontSize: 16, fontWeight: '700' },
  napIcon: { color: theme.buttonText, fontSize: 18 },
  pressed: { opacity: 0.85 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: theme.card, borderRadius: 24, padding: 22, gap: 16 },
  dialogTitle: { color: theme.textOnPaper, fontSize: 24, fontWeight: '700' },
  dialogIntro: { color: theme.textOnPaperMuted, fontSize: 14 },
  timeGroup: { gap: 8 },
  fieldLabel: { color: theme.textOnPaper, fontWeight: '600', fontSize: 15 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { color: theme.textOnPaper, borderWidth: 1, borderColor: theme.borderOnPaper, borderRadius: 10, width: 55, height: 48, textAlign: 'center', fontSize: 18 },
  colon: { color: theme.textOnPaper, fontSize: 20 },
  periods: { flexDirection: 'row', marginLeft: 4 },
  period: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center', borderRadius: 10 },
  selectedPeriod: { backgroundColor: theme.buttonFill },
  periodText: { color: theme.textOnPaper, fontWeight: '600' },
  errorOnPaper: { color: theme.textOnPaper, fontWeight: '600', fontSize: 14 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { color: theme.textOnPaper, fontWeight: '600' },
  saveButton: { minHeight: 44, paddingHorizontal: 22, borderRadius: 14, backgroundColor: theme.buttonFill, justifyContent: 'center' },
  saveText: { color: theme.buttonText, fontWeight: '700' },
});
