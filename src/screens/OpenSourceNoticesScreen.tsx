import { ScrollView, StyleSheet, Text } from 'react-native';
import { notices } from '../domain/notices';
import { theme, typography } from '../theme/tokens';

export function OpenSourceNoticesScreen() {
  return <ScrollView contentContainerStyle={styles.container}><Text accessibilityRole="header" style={styles.title}>Open source notices</Text><Text style={styles.intro}>A preliminary list of project and dependency licences.</Text>{notices.map(notice => <Text key={notice.name} style={styles.notice}>{notice.name}{'\n'}{notice.license}{'\n'}{notice.url}</Text>)}</ScrollView>;
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: theme.screen, padding: 28 },
  title: { fontFamily: typography.heading, color: theme.textOnNight, fontSize: 30 },
  intro: { fontFamily: typography.body, color: theme.textOnNightMuted, marginTop: 12, lineHeight: 22 },
  notice: { fontFamily: typography.body, color: theme.textOnNightMuted, marginTop: 28, lineHeight: 23 },
});
