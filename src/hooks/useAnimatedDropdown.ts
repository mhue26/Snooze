import { useCallback, useState } from 'react';
import { Animated, Easing } from 'react-native';

export const DROPDOWN_ANIM_MS = 220;

export function useAnimatedDropdown(maxHeight: number) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  const setOpenAnimated = useCallback((next: boolean) => {
    if (next) {
      setMounted(true);
      setOpen(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: DROPDOWN_ANIM_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }
    setOpen(false);
    Animated.timing(progress, {
      toValue: 0,
      duration: DROPDOWN_ANIM_MS * 0.85,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [progress]);

  const panelStyle = {
    opacity: progress,
    maxHeight: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, maxHeight],
    }),
    marginBottom: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
    transform: [{
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-6, 0],
      }),
    }],
  };

  return { open, mounted, progress, setOpenAnimated, panelStyle };
}
