import { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { openDatabase, OpenDatabase } from './src/data/database';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palette, theme } from './src/theme/tokens';
import { runAndroidDatabaseCheck } from './src/testing/androidDatabaseCheck';

function DatabaseVerification() {
  const [status, setStatus] = useState('Running Android database verification…');
  useEffect(() => {
    runAndroidDatabaseCheck().then(result => { console.log(`DATABASE_VERIFICATION: ${result}`); setStatus(result); }).catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`DATABASE_VERIFICATION FAILED: ${message}`);
      setStatus(`FAILED: ${message}`);
    });
  }, []);
  return <View style={styles.loading}><Text selectable style={styles.message}>{status}</Text></View>;
}

export default function App() {
  if (__DEV__ && process.env.EXPO_PUBLIC_SQLCIPHER_TEST === '1') return <DatabaseVerification />;
  return <MainApp />;
}

function MainApp() {
  const [result, setResult] = useState<OpenDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let opened: OpenDatabase | null = null;
    openDatabase().then(value => {
      if (disposed) { void value.db.closeAsync(); return; }
      opened = value;
      setResult(value);
    }).catch(reason => { if (!disposed) setError(reason instanceof Error ? reason.message : 'Unable to open the database.'); });
    return () => { disposed = true; if (opened) void opened.db.closeAsync(); };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {result
        ? <NavigationContainer theme={DarkTheme}><RootNavigator db={result.db} /></NavigationContainer>
        : <View style={styles.loading}>{error ? <Text accessibilityRole="alert" style={styles.message}>Database could not be opened: {error}</Text> : <><ActivityIndicator color={palette.action} /><Text style={styles.message}>Opening encrypted database…</Text></>}</View>}
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({ loading: { flex: 1, backgroundColor: theme.screen, justifyContent: 'center', padding: 28, gap: 16 }, message: { color: theme.textOnNightMuted, textAlign: 'center', lineHeight: 22 } });
