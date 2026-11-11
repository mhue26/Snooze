import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { DataScreen } from '../screens/DataScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { theme } from '../theme/tokens';

const tabs = ['Log', 'Today', 'Plan', 'Settings'] as const;
type TabIndex = 0 | 1 | 2 | 3;
const TAB_SIZE = 48;
const TAB_GAP = 2;
const ISLAND_INSET = 6;
const tabHighlightOffset = (i: number) => ISLAND_INSET + i * (TAB_SIZE + TAB_GAP);

function Log() { return <PlaceholderScreen title="Log" subtitle="Your sleep log will appear here." />; }
function Plan() { return <PlaceholderScreen title="Plan" subtitle="Your sleep plans will appear here." />; }

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
    <View style={styles.gearIcon}>
      {[0, 45, 90, 135].map(angle => <View key={angle} style={[styles.gearSpoke, { backgroundColor: color, transform: [{ rotate: `${angle}deg` }] }]} />)}
      <View style={[styles.gearRing, { borderColor: color, backgroundColor: active ? theme.buttonFill : theme.tabBar }]} />
    </View>
  );
}

export function RootNavigator({ db }: { db: SQLiteDatabase }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState<TabIndex>(1);
  const [highlightIndex, setHighlightIndex] = useState<TabIndex>(1);
  const [dataVersion, setDataVersion] = useState(0);
  const [width, setWidth] = useState(0);
  const [islandInteractive, setIslandInteractive] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const animating = useRef(false);
  const [position] = useState(() => new Animated.Value(1));
  const [islandOffset] = useState(() => new Animated.Value(1));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenReaderRef = useRef(screenReaderEnabled);
  const widthRef = useRef(width);
  const indexRef = useRef(index);
  const panStartIndex = useRef<number>(index);
  const islandAnimationMs = 200;
  const islandHideDistance = 72;
  const pagerSpring = { useNativeDriver: true as const, tension: 72, friction: 14 };
  const tabTimingMs = 200;

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    screenReaderRef.current = screenReaderEnabled;
  }, [screenReaderEnabled]);

  useEffect(() => {
    const listenerId = position.addListener(({ value }) => {
      const next = Math.round(Math.max(0, Math.min(tabs.length - 1, value))) as TabIndex;
      setHighlightIndex(prev => (prev === next ? prev : next));
    });
    return () => position.removeListener(listenerId);
  }, [position]);

  const hideIsland = useCallback(() => {
    Animated.timing(islandOffset, { toValue: 1, duration: islandAnimationMs, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setIslandInteractive(false);
    });
  }, [islandOffset]);

  const showIsland = useCallback(() => {
    setIslandInteractive(true);
    Animated.timing(islandOffset, { toValue: 0, duration: islandAnimationMs, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (screenReaderRef.current) return;
      hideIsland();
    }, 3000);
  }, [hideIsland, islandOffset]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => { if (mounted) setScreenReaderEnabled(enabled); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled);
    return () => { mounted = false; subscription.remove(); if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  useEffect(() => {
    if (!screenReaderEnabled) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    islandOffset.setValue(0);
  }, [islandOffset, screenReaderEnabled]);

  const snapToTab = useCallback((target: TabIndex, animated = true) => {
    if (target === indexRef.current && !animated) return;
    animating.current = animated;
    const finish = () => {
      animating.current = false;
    };
    if (animated) {
      Animated.spring(position, { toValue: target, ...pagerSpring }).start(({ finished }) => {
        if (finished) finish();
      });
    } else {
      position.setValue(target);
      finish();
    }
    if (target !== indexRef.current) setIndex(target);
  }, [position]);

  const navigate = useCallback((next: TabIndex) => {
    showIsland();
    if (next === indexRef.current) return;
    animating.current = true;
    setIndex(next);
    Animated.timing(position, { toValue: next, duration: tabTimingMs, useNativeDriver: true }).start(() => {
      animating.current = false;
    });
  }, [position, showIsland]);

  const clampIndex = (value: number) => Math.max(0, Math.min(tabs.length - 1, value));

  const settlePager = useCallback((gestureDx: number, gestureVx: number) => {
    position.stopAnimation(value => {
      let target = Math.round(value) as TabIndex;
      if (Math.abs(gestureVx) > 0.2) {
        target = clampIndex(gestureVx > 0 ? Math.floor(value) : Math.ceil(value)) as TabIndex;
      } else if (Math.abs(gestureDx) < 12) {
        target = indexRef.current;
      }
      snapToTab(target);
    });
  }, [position, snapToTab]);

  // navigate / snapToTab read refs; handlers run on gesture only.
  // eslint-disable-next-line react-hooks/refs
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (event, gesture) => (
      event.nativeEvent.touches.length === 1
      && Math.abs(gesture.dx) > 12
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25
    ),
    onPanResponderGrant: () => {
      showIsland();
      animating.current = false;
      position.stopAnimation(value => {
        panStartIndex.current = value;
      });
    },
    onPanResponderMove: (_, gesture) => {
      const pageWidth = widthRef.current;
      if (!pageWidth) return;
      const next = clampIndex(panStartIndex.current - gesture.dx / pageWidth);
      position.setValue(next);
    },
    onPanResponderRelease: (_, gesture) => {
      settlePager(gesture.dx, gesture.vx);
    },
    onPanResponderTerminate: (_, gesture) => {
      settlePager(gesture.dx, gesture.vx);
    },
  }), [position, settlePager, showIsland]);

  const pages = [<Log key="Log" />, <TodayScreen key={`Today-${dataVersion}`} db={db} />, <Plan key="Plan" />, <DataScreen key="Settings" db={db} onDataCleared={() => setDataVersion(value => value + 1)} />];
  const islandLift = islandOffset.interpolate({ inputRange: [0, 1], outputRange: [0, islandHideDistance] });
  const islandOpacity = islandOffset.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

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
      <Animated.View
        style={[
          styles.island,
          {
            bottom: Math.max(insets.bottom, 12) + 12,
            opacity: islandOpacity,
            transform: [{ translateY: islandLift }],
          },
        ]}
        pointerEvents={islandInteractive || screenReaderEnabled ? 'auto' : 'none'}
        accessibilityRole="tablist"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeTabHighlight,
            {
              transform: [{
                translateX: position.interpolate({
                  inputRange: tabs.map((_, i) => i),
                  outputRange: tabs.map((_, i) => tabHighlightOffset(i)),
                }),
              }],
            },
          ]}
        />
        {tabs.map((tab, tabIndex) => (
          <Pressable key={tab} accessibilityRole="tab" accessibilityLabel={tab} accessibilityState={{ selected: tabIndex === index }} onPress={() => navigate(tabIndex as TabIndex)} style={styles.tab}>
            <TabIcon index={tabIndex as TabIndex} active={tabIndex === highlightIndex} />
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.screen },
  pager: { flex: 1, overflow: 'hidden' },
  pages: { flex: 1, flexDirection: 'row' },
  island: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', padding: ISLAND_INSET, gap: TAB_GAP, borderRadius: 28, backgroundColor: theme.tabBar, borderWidth: 1, borderColor: theme.borderOnNight, elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  activeTabHighlight: { position: 'absolute', left: 0, top: ISLAND_INSET, width: TAB_SIZE, height: TAB_SIZE, borderRadius: 22, backgroundColor: theme.buttonFill },
  tab: { width: TAB_SIZE, height: TAB_SIZE, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logIcon: { width: 19, height: 23, borderWidth: 2, borderRadius: 3, paddingTop: 5, paddingHorizontal: 3, gap: 3 },
  logLine: { height: 2, width: 9, borderRadius: 1 },
  shortLine: { width: 6 },
  calendarIcon: { width: 23, height: 21, borderWidth: 2, borderRadius: 4, overflow: 'hidden' },
  calendarTop: { height: 6, borderBottomWidth: 2 },
  calendarDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3, alignSelf: 'center' },
  planIcon: { width: 23, height: 23, borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planNeedle: { position: 'absolute', width: 2, height: 8, top: 4, borderRadius: 1 },
  planDot: { width: 4, height: 4, borderRadius: 2, marginTop: 10 },
  gearIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  gearSpoke: { position: 'absolute', width: 24, height: 4, borderRadius: 2 },
  gearRing: { width: 17, height: 17, borderWidth: 3, borderRadius: 9 },
});
