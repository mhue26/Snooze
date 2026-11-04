import { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { intendedUse } from '../domain/project';
import { OpenSourceNoticesScreen } from '../screens/OpenSourceNoticesScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

const Tab = createBottomTabNavigator();
function Log() { return <PlaceholderScreen title="Log" subtitle="Your sleep log will appear here." />; }
function History() { return <PlaceholderScreen title="History" subtitle="Your sleep history will appear here." />; }
function Plan() { return <PlaceholderScreen title="Plan" subtitle="Your sleep plans will appear here." />; }
function Data() {
  const [showNotices, setShowNotices] = useState(false);
  if (showNotices) return <View style={styles.fill}><Pressable accessibilityRole="button" onPress={() => setShowNotices(false)} style={styles.back}><Text style={styles.link}>← Data</Text></Pressable><OpenSourceNoticesScreen /></View>;
  return <PlaceholderScreen title="Data" subtitle="Settings and data controls will appear here."><Pressable accessibilityRole="button" onPress={() => setShowNotices(true)} style={styles.row}><Text style={styles.link}>Open source notices  →</Text></Pressable></PlaceholderScreen>;
}
export function RootNavigator({ cipherVersion }: { cipherVersion: string }) {
  return <Tab.Navigator initialRouteName="Today" screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: '#d1dcff', tabBarInactiveTintColor: '#8796b4', tabBarLabelPosition: 'below-icon', tabBarIcon: () => null, tabBarItemStyle: styles.tabItem, tabBarLabelStyle: styles.tabLabel }}>
    <Tab.Screen name="Log" component={Log} />
    <Tab.Screen name="Today">{() => <View style={styles.fill}><WelcomeScreen /><View style={styles.status}><Text style={styles.statusText}>Encrypted DB: OK · SQLCipher {cipherVersion}</Text><Text style={styles.statusText}>{intendedUse}</Text></View></View>}</Tab.Screen>
    <Tab.Screen name="History" component={History} /><Tab.Screen name="Plan" component={Plan} /><Tab.Screen name="Data" component={Data} />
  </Tab.Navigator>;
}
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#101b32' },
  tabBar: { backgroundColor: '#16233e', borderTopColor: '#33415c', height: 70, paddingBottom: 10 },
  tabItem: { justifyContent: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  row: { paddingVertical: 20, marginTop: 20, borderTopWidth: 1, borderColor: '#33415c' },
  link: { color: '#cbd7fa', fontSize: 16, fontWeight: '600' },
  back: { paddingHorizontal: 28, paddingTop: 24 },
  status: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#16233e' },
  statusText: { color: '#b8c8e4', fontSize: 11, lineHeight: 16 },
});
