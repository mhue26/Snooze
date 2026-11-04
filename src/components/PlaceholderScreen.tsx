import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function PlaceholderScreen({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return <View style={styles.container}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}{children}</View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101b32', paddingHorizontal: 28, paddingTop: 36 },
  title: { color: '#f5f7ff', fontSize: 36, fontWeight: '700' },
  subtitle: { color: '#b8c8e4', fontSize: 16, lineHeight: 24, marginTop: 12 },
});
