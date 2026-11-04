import { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { openDatabase, OpenDatabase } from './src/data/database';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
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
  return <><StatusBar style="light" />{result ? <NavigationContainer theme={DarkTheme}><RootNavigator cipherVersion={result.cipherVersion} /></NavigationContainer> : <View style={styles.loading}>{error ? <Text accessibilityRole="alert" style={styles.message}>Database could not be opened: {error}</Text> : <><ActivityIndicator color="#cbd7fa" /><Text style={styles.message}>Opening encrypted database…</Text></>}</View>}</>;
}
const styles = StyleSheet.create({ loading: { flex: 1, backgroundColor: '#101b32', justifyContent: 'center', padding: 28, gap: 16 }, message: { color: '#d1dcf2', textAlign: 'center', lineHeight: 22 } });
