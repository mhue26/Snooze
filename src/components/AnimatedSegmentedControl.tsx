import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  Pressable,
} from 'react-native';
import {
  SETTINGS_INNER_HEIGHT,
  SETTINGS_INNER_RADIUS,
  SETTINGS_INSET,
  settingsControlStyles,
} from '../theme/settingsControls';
import { theme, typography } from '../theme/tokens';

const ANIM_MS = 200;

type SegmentOption<T extends string> = {
  value: T;
  label?: string;
  accessibilityLabel: string;
};

export function AnimatedSegmentedControl<T extends string>({
  options,
  value,
  onSelect,
  groupAccessibilityLabel,
  optionStyle,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  groupAccessibilityLabel: string;
  optionStyle?: StyleProp<ViewStyle>;
}) {
  const [layouts, setLayouts] = useState<Partial<Record<T, { x: number; width: number }>>>({});
  const highlightX = useRef(new Animated.Value(0)).current;
  const highlightW = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    const layout = layouts[value];
    if (!layout) return;
    if (!hasAnimated.current) {
      highlightX.setValue(layout.x);
      highlightW.setValue(layout.width);
      hasAnimated.current = true;
      return;
    }
    Animated.parallel([
      Animated.timing(highlightX, { toValue: layout.x, duration: ANIM_MS, useNativeDriver: false }),
      Animated.timing(highlightW, { toValue: layout.width, duration: ANIM_MS, useNativeDriver: false }),
    ]).start();
  }, [highlightW, highlightX, layouts, value]);

  const recordLayout = (optionValue: T, x: number, width: number) => {
    setLayouts(prev => {
      const existing = prev[optionValue];
      if (existing?.x === x && existing.width === width) return prev;
      return { ...prev, [optionValue]: { x, width } };
    });
  };

  const currentLayout = layouts[value];

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={groupAccessibilityLabel} style={settingsControlStyles.track}>
      {currentLayout && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              left: highlightX,
              width: highlightW,
            },
          ]}
        />
      )}
      {options.map(option => (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityLabel={option.accessibilityLabel}
          accessibilityState={{ checked: value === option.value }}
          onPress={() => onSelect(option.value)}
          onLayout={event => {
            const { x, width } = event.nativeEvent.layout;
            recordLayout(option.value, x, width);
          }}
          style={[styles.option, optionStyle]}
        >
          {option.label ? (
            <Text style={[styles.label, value === option.value && styles.labelSelected]}>{option.label}</Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    top: SETTINGS_INSET,
    bottom: SETTINGS_INSET,
    borderRadius: SETTINGS_INNER_RADIUS,
    backgroundColor: theme.buttonFill,
  },
  option: {
    minWidth: 40,
    height: SETTINGS_INNER_HEIGHT,
    paddingHorizontal: 8,
    borderRadius: SETTINGS_INNER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.bodyBold,
    color: theme.textOnNightMuted,
    fontSize: 14,
  },
  labelSelected: {
    color: theme.buttonText,
  },
});
