import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, typography } from '../theme/tokens';

const TOP_INSET_EXTRA = 20;

export function PlaceholderScreen({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + TOP_INSET_EXTRA }]}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.screen, paddingHorizontal: 28 },
  title: { fontFamily: typography.heading, color: theme.textOnNight, fontSize: 36 },
  subtitle: { fontFamily: typography.body, color: theme.textOnNightMuted, fontSize: 16, lineHeight: 24, marginTop: 12 },
});
