import { ScrollView, StyleSheet, Text } from 'react-native';
import { notices } from '../domain/notices';

export function OpenSourceNoticesScreen() {
  return <ScrollView contentContainerStyle={styles.container}><Text accessibilityRole="header" style={styles.title}>Open source notices</Text><Text style={styles.intro}>A preliminary list of project and dependency licences.</Text>{notices.map(notice => <Text key={notice.name} style={styles.notice}>{notice.name}{'\n'}{notice.license}{'\n'}{notice.url}</Text>)}</ScrollView>;
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#101b32', padding: 28 },
  title: { color: '#f5f7ff', fontSize: 30, fontWeight: '700' },
  intro: { color: '#b8c8e4', marginTop: 12, lineHeight: 22 },
  notice: { color: '#d1dcf2', marginTop: 28, lineHeight: 23 },
});
