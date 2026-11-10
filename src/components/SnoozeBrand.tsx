import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/tokens';

export function SnoozeBrand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><Text style={styles.brandStar}>✳</Text></View>
      <Text style={styles.brandName}>snooze</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 29, height: 29, borderRadius: 10, backgroundColor: theme.brandMarkFill, alignItems: 'center', justifyContent: 'center' },
  brandStar: { color: theme.brandMarkIcon, fontSize: 19, lineHeight: 23 },
  brandName: { color: theme.textOnNight, fontSize: 21, fontWeight: '700', letterSpacing: -0.8 },
});
