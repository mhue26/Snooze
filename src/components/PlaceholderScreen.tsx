import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/tokens';

export function PlaceholderScreen({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return <View style={styles.container}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}{children}</View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.screen, paddingHorizontal: 28, paddingTop: 36 },
  title: { color: theme.textOnNight, fontSize: 36, fontWeight: '700' },
  subtitle: { color: theme.textOnNightMuted, fontSize: 16, lineHeight: 24, marginTop: 12 },
});
