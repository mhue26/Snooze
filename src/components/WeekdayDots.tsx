import { StyleSheet, Text, View } from 'react-native';
import { dateForWeekdaySlot, weekdayInitial, weekdayLabel, todayWeekdaySlot, type WeekStartsOn } from '../domain/dates';
import { theme, typography } from '../theme/tokens';

export function WeekdayDots({
  activeIndex,
  weekStartsOn,
  layout = 'horizontal',
  anchorDate,
  today,
}: {
  activeIndex: number;
  weekStartsOn: WeekStartsOn;
  layout?: 'horizontal' | 'vertical';
  /** Date whose week is shown (typically the selected day). */
  anchorDate: string;
  /** Local today (`YYYY-MM-DD`) — slots after this render dimmer. */
  today: string;
}) {
  const activeLabel = weekdayLabel(activeIndex, weekStartsOn);
  const todaySlot = todayWeekdaySlot(anchorDate, today, weekStartsOn);
  const description = todaySlot === null ? `Selected: ${activeLabel}` : todaySlot === activeIndex ? `Selected: ${activeLabel}, today` : `Selected: ${activeLabel}; today: ${weekdayLabel(todaySlot, weekStartsOn)}`;
  return (
    <View
      style={layout === 'vertical' ? styles.containerVertical : styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={description}
    >
      {Array.from({ length: 7 }, (_, i) => {
        const isActive = i === activeIndex;
        if (isActive) {
          const initial = weekdayInitial(i, weekStartsOn);
          return (
            <View key={i} style={styles.dotActive}>
              <Text style={styles.dotText}>{initial}</Text>
            </View>
          );
        }
        if (i === todaySlot) return <View key={i} style={styles.dotToday} />;
        const isFuture = dateForWeekdaySlot(anchorDate, i, weekStartsOn) > today;
        return <View key={i} style={isFuture ? styles.dotFuture : styles.dotInactive} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  containerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 6,
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.dotInactive,
  },
  dotToday: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: theme.dotActive,
  },
  dotFuture: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.dotFuture,
  },
  dotActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.dotActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontFamily: typography.bodyBold,
    color: theme.buttonText,
    fontSize: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
