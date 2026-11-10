import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { OpenSourceNoticesScreen } from '../screens/OpenSourceNoticesScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { theme } from '../theme/tokens';

const tabs = ['Log', 'Today', 'Plan', 'Data'] as const;
type TabIndex = 0 | 1 | 2 | 3;

function Log() { return <PlaceholderScreen title="Log" subtitle="Your sleep log will appear here." />; }
function Plan() { return <PlaceholderScreen title="Plan" subtitle="Your sleep plans will appear here." />; }

function Data() {
  const [showNotices, setShowNotices] = useState(false);
  if (showNotices) {
    return (
      <View style={styles.fill}>
        <Pressable accessibilityRole="button" onPress={() => setShowNotices(false)} style={styles.back}><Text style={styles.link}>← Data</Text></Pressable>
        <OpenSourceNoticesScreen />
      </View>
    );
  }
  return (
    <PlaceholderScreen title="Data" subtitle="Settings and data controls will appear here.">
      <Pressable accessibilityRole="button" onPress={() => setShowNotices(true)} style={styles.row}><Text style={styles.link}>Open source notices  →</Text></Pressable>
    </PlaceholderScreen>
  );
}

function TabIcon({ index, active }: { index: TabIndex; active: boolean }) {
  const color = active ? theme.buttonText : theme.tabInactive;
  if (index === 0) {
    return (
      <View style={[styles.logIcon, { borderColor: color }]}>
        <View style={[styles.logLine, { backgroundColor: color }]} />
        <View style={[styles.logLine, { backgroundColor: color }]} />
        <View style={[styles.logLine, styles.shortLine, { backgroundColor: color }]} />
      </View>
    );
  }
  if (index === 1) {
    return (
      <View style={[styles.calendarIcon, { borderColor: color }]}>
        <View style={[styles.calendarTop, { borderColor: color }]} />
        <View style={[styles.calendarDot, { backgroundColor: color }]} />
      </View>
    );
  }
  if (index === 2) {
    return (
      <View style={[styles.planIcon, { borderColor: color }]}>
        <View style={[styles.planNeedle, { backgroundColor: color }]} />
        <View style={[styles.planDot, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.dataIcon}>
      <View style={[styles.dataCap, { borderColor: color }]} />
      <View style={[styles.dataBody, { borderColor: color }]} />
    </View>
  );
}

export function RootNavigator({ db }: { db: SQLiteDatabase }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState<TabIndex>(1);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const animating = useRef(false);
  const [position] = useState(() => new Animated.Value(1));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showIsland = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => { if (mounted) setScreenReaderEnabled(enabled); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled);
    return () => { mounted = false; subscription.remove(); if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const navigate = useCallback((next: TabIndex) => {
    if (animating.current) return;
    showIsland();
    setIndex(prev => {
      if (prev === next) return prev;
      animating.current = true;
      Animated.timing(position, { toValue: next, duration: 250, useNativeDriver: true }).start(() => { animating.current = false; });
      return next;
    });
  }, [position, showIsland]);

  // navigate reads animating ref; handlers run on gesture only.
  // eslint-disable-next-line react-hooks/refs
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (event, gesture) => event.nativeEvent.touches.length === 1 && Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 55 && Math.abs(gesture.vx) < 0.5) return;
      const next = Math.max(0, Math.min(tabs.length - 1, index + (gesture.dx > 0 ? -1 : 1))) as TabIndex;
      if (next !== index) navigate(next);
    },
  }), [index, navigate]);

  const islandVisible = visible || screenReaderEnabled;
  const pages = [<Log key="Log" />, <TodayScreen key="Today" db={db} />, <Plan key="Plan" />, <Data key="Data" />];

  return (
    <View style={styles.container} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.pager} {...panResponder.panHandlers}>
        <Animated.View style={[styles.pages, { width: width * tabs.length, transform: [{ translateX: Animated.multiply(position, -width) }] }]}>
          {pages.map((screen, pageIndex) => (
            <View key={tabs[pageIndex]} style={{ width }} pointerEvents={pageIndex === index ? 'auto' : 'none'} accessibilityElementsHidden={pageIndex !== index} importantForAccessibility={pageIndex === index ? 'auto' : 'no-hide-descendants'}>
              {screen}
            </View>
          ))}
        </Animated.View>
      </View>
      {islandVisible && (
        <View style={[styles.island, { bottom: Math.max(insets.bottom, 12) + 12 }]} accessibilityRole="tablist">
          {tabs.map((tab, tabIndex) => (
            <Pressable key={tab} accessibilityRole="tab" accessibilityLabel={tab} accessibilityState={{ selected: tabIndex === index }} onPress={() => navigate(tabIndex as TabIndex)} style={[styles.tab, tabIndex === index && styles.activeTab]}>
              <TabIcon index={tabIndex as TabIndex} active={tabIndex === index} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.screen },
  fill: { flex: 1, backgroundColor: theme.screen },
  back: { paddingHorizontal: 28, paddingTop: 24 },
  row: { paddingVertical: 20, marginTop: 20, borderTopWidth: 1, borderColor: theme.borderOnNight },
  link: { color: theme.link, fontSize: 16, fontWeight: '600' },
  pager: { flex: 1, overflow: 'hidden' },
  pages: { flex: 1, flexDirection: 'row' },
  island: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', padding: 6, gap: 2, borderRadius: 28, backgroundColor: theme.tabBar, borderWidth: 1, borderColor: theme.borderOnNight, elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  tab: { width: 48, height: 48, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activeTab: { backgroundColor: theme.buttonFill },
  logIcon: { width: 19, height: 23, borderWidth: 2, borderRadius: 3, paddingTop: 5, paddingHorizontal: 3, gap: 3 },
  logLine: { height: 2, width: 9, borderRadius: 1 },
  shortLine: { width: 6 },
  calendarIcon: { width: 23, height: 21, borderWidth: 2, borderRadius: 4, overflow: 'hidden' },
  calendarTop: { height: 6, borderBottomWidth: 2 },
  calendarDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3, alignSelf: 'center' },
  planIcon: { width: 23, height: 23, borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planNeedle: { position: 'absolute', width: 2, height: 8, top: 4, borderRadius: 1 },
  planDot: { width: 4, height: 4, borderRadius: 2, marginTop: 10 },
  dataIcon: { width: 18, height: 22, alignItems: 'center' },
  dataCap: { width: 14, height: 5, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  dataBody: { width: 18, height: 14, borderWidth: 2, borderTopWidth: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
});
