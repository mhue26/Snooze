import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const cards = [
  { label: 'A LITTLE INTRODUCTION', title: 'Your first step\nstarts here.', description: 'A little space for your introduction. Add the details that matter most here.', number: '01', accent: '#c9d5ff' },
  { label: 'THE NEXT CHAPTER', title: 'Make it your\nown.', description: 'This is a placeholder for the next part of your onboarding experience.', number: '02', accent: '#d9c9f4' },
  { label: 'GETTING CLOSER', title: 'A moment to\nsettle in.', description: 'Share a little more about what someone can expect along the way.', number: '03', accent: '#c3dedb' },
  { label: 'ONE LAST THING', title: 'Ready when\nyou are.', description: 'A final placeholder before the next part of the experience begins.', number: '04', accent: '#efcfbe' },
];

export function WelcomeScreen() {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const card = cards[step];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandStar}>✳</Text></View><Text style={styles.brandName}>snooze</Text></View>
          <Text style={styles.headerLabel}>A LITTLE SOMETHING FOR YOU</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.overline}>WELCOME TO SNOOZE <Text style={styles.overlineStar}>✳</Text></Text>
          <Text style={styles.heading}>Let’s get you{ '\n' }settled in.</Text>
          <Text style={styles.introText}>A few little steps to get started.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>{complete ? 'ALL DONE' : card.label}</Text>
            <Text style={styles.cardNumber}>{complete ? '✳' : card.number} <Text style={styles.cardTotal}>/ 04</Text></Text>
          </View>
          <View style={styles.artwork} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.halo, { backgroundColor: complete ? '#c9d5ff' : card.accent }]} />
            <View style={styles.moon} />
            <Text style={styles.artStarOne}>✦</Text><Text style={styles.artStarTwo}>✳</Text><Text style={styles.artDot}>·</Text>
            <View style={styles.orbit} />
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle} accessibilityRole="header">{complete ? 'All settled\nin.' : card.title}</Text>
            <Text style={styles.cardDescription}>{complete ? 'Your onboarding placeholder is complete.' : card.description}</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.progress} accessibilityLabel={complete ? 'Onboarding complete' : `Step ${step + 1} of 4`}>
              {cards.map((_, index) => <View key={index} style={[styles.progressDot, (complete || index === step) && styles.progressDotActive]} />)}
            </View>
            <Text style={styles.stepLabel}>{complete ? 'COMPLETE' : `STEP ${step + 1} OF 4`}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => complete ? (setComplete(false), setStep(0)) : step === cards.length - 1 ? setComplete(true) : setStep(step + 1)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{complete ? 'Start again' : step === cards.length - 1 ? 'Finish' : 'Continue'}</Text><Text style={styles.arrow}>↗</Text>
          </Pressable>
          {!complete && step > 0 ? <Pressable accessibilityRole="button" onPress={() => setStep(step - 1)} style={styles.backButton}><Text style={styles.backText}>←  Back</Text></Pressable> : <Text style={styles.footerNote}>TAKE YOUR TIME. YOU’RE RIGHT ON TIME.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101a31' },
  scrollContent: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#d2dcff', alignItems: 'center', justifyContent: 'center' },
  brandStar: { color: '#202d50', fontSize: 19, lineHeight: 23 },
  brandName: { color: '#f5f4ef', fontSize: 21, fontWeight: '700', letterSpacing: -0.8 },
  headerLabel: { color: '#8190ae', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  intro: { marginTop: 46, marginBottom: 26 },
  overline: { color: '#aab9dc', fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  overlineStar: { color: '#d5dfff', fontSize: 13 },
  heading: { color: '#f8f7f1', fontSize: 38, lineHeight: 44, fontWeight: '600', letterSpacing: -1.5, marginTop: 13 },
  introText: { color: '#9eacc7', fontSize: 15, marginTop: 10 },
  card: { backgroundColor: '#f2f0e9', borderRadius: 26, overflow: 'hidden', paddingHorizontal: 25, paddingTop: 23, paddingBottom: 22 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#687284', fontSize: 9, fontWeight: '700', letterSpacing: 1.3, flexShrink: 1 },
  cardNumber: { color: '#34405c', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  cardTotal: { color: '#a9aeb7', fontWeight: '400' },
  artwork: { height: 160, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  halo: { width: 126, height: 126, borderRadius: 63, opacity: 0.65, position: 'absolute' },
  moon: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#34466d', position: 'absolute', left: '50%', marginLeft: -41 },
  orbit: { width: 170, height: 67, borderRadius: 90, borderWidth: 1, borderColor: '#9eaacc', transform: [{ rotate: '-25deg' }], position: 'absolute' },
  artStarOne: { position: 'absolute', top: 25, right: '21%', color: '#7282a3', fontSize: 20 },
  artStarTwo: { position: 'absolute', bottom: 20, left: '23%', color: '#9aa9c4', fontSize: 17 },
  artDot: { position: 'absolute', top: 25, left: '25%', color: '#7282a3', fontSize: 32 },
  cardCopy: { minHeight: 132 },
  cardTitle: { color: '#24314b', fontSize: 30, lineHeight: 34, fontWeight: '600', letterSpacing: -1 },
  cardDescription: { color: '#707b8c', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 300 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#dcdedc', paddingTop: 18, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccd0d0' },
  progressDotActive: { width: 22, backgroundColor: '#52658c' },
  stepLabel: { color: '#89919c', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  actions: { marginTop: 20, alignItems: 'center' },
  primaryButton: { width: '100%', minHeight: 58, paddingHorizontal: 22, borderRadius: 18, backgroundColor: '#cbd7fa', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryButtonText: { color: '#24314b', fontSize: 15, fontWeight: '700' },
  arrow: { color: '#24314b', fontSize: 22 },
  pressed: { opacity: 0.8 },
  backButton: { padding: 16 },
  backText: { color: '#b9c5dd', fontSize: 14, fontWeight: '600' },
  footerNote: { color: '#7787a7', fontSize: 9, fontWeight: '700', letterSpacing: 1.15, marginTop: 22, textAlign: 'center' },
});
