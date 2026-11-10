import { StyleSheet, Text, View } from 'react-native';
import { weekdayInitial, weekdayLabel, type WeekStartsOn } from '../domain/dates';
import { theme } from '../theme/tokens';

export function WeekdayDots({
  activeIndex,
  weekStartsOn,
}: {
  activeIndex: number;
  weekStartsOn: WeekStartsOn;
}) {
  const activeLabel = weekdayLabel(activeIndex, weekStartsOn);
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={activeLabel}
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
        return <View key={i} style={styles.dotInactive} />;
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
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.dotInactive,
  },
  dotActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.dotActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    color: theme.buttonText,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
