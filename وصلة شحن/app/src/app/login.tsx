import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Logo } from '../components/icons';
import { Screen } from '../components/screen';
import { Button, T } from '../components/ui';
import { normalizeEgPhone } from '../lib/phone';
import { useApp } from '../store/app-store';
import { colors, fonts, statusColors, ltrRow } from '../theme';

export default function LoginScreen() {
  const app = useApp();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [raw, setRaw] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const phone = normalizeEgPhone(raw);

  const [busy, setBusy] = useState(false);

  const requestCode = async () => {
    if (!phone) return setError('اكتب رقم موبايل مصري صح');
    setBusy(true);
    const r = await app.sendCode(phone);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setError(null);
    setCode('');
    setStep('otp');
  };

  const finish = async () => {
    if (!/^\d{6}$/.test(code)) return setError('الكود 6 أرقام');
    setBusy(true);
    const r = await app.confirmCode(phone!, code);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (next) router.replace(next as Href);
    else router.dismissTo('/');
  };

  return (
    <Screen style={{ justifyContent: 'center', flexGrow: 1 }}>
      <View style={{ alignItems: 'center', paddingTop: 24 }}>
        <Logo size={140} stroke={5} />
      </View>
      <View style={{ gap: 10 }}>
        <T w="bold" size={30} style={{ lineHeight: 44, textAlign: 'right' }}>
          {'اعرف الشاحن '}
          <T w="bold" size={30} color={colors.brand}>
            شغّال
          </T>
          {'\nقبل ما تروح.'}
        </T>
        <T size={15} color={colors.textMuted} style={{ textAlign: 'right', lineHeight: 24 }}>
          كل الشبكات على خريطة واحدة، وحالة كل شاحن جاية من سواقين زيك.
        </T>
      </View>

      {step === 'phone' ? (
        <View style={{ gap: 10 }}>
          <T size={13} color={colors.textMuted} style={{ textAlign: 'right' }}>
            رقم موبايلك
          </T>
          <View style={styles.phoneBox}>
            <T latin w="bold" size={17} color={colors.textMuted}>
              +20
            </T>
            <View style={{ width: 1, height: 24, backgroundColor: colors.track }} />
            <TextInput
              accessibilityLabel="رقم موبايلك"
              keyboardType="phone-pad"
              inputMode="tel"
              placeholder="10 1234 5678"
              placeholderTextColor={colors.textFaint}
              value={raw}
              onChangeText={(t) => {
                setRaw(t);
                setError(null);
              }}
              style={styles.input}
            />
          </View>
          {error && (
            <T size={12} color={statusColors.broken.text} style={{ textAlign: 'right' }}>
              {error}
            </T>
          )}
          <Button label={busy ? 'بنبعت...' : 'ابعتلي الكود'} disabled={busy} onPress={requestCode} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <T size={14} color={colors.textMuted} style={{ textAlign: 'right' }}>
            {`اكتب الكود اللي وصلك على ${phone}`}
          </T>
          <TextInput
            accessibilityLabel="كود التأكيد"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={6}
            value={code}
            autoFocus
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, ''));
              setError(null);
            }}
            placeholder="••••••"
            placeholderTextColor={colors.textFaint}
            style={[styles.phoneBox, styles.otp]}
          />
          {error && (
            <T size={12} color={statusColors.broken.text} style={{ textAlign: 'right' }}>
              {error}
            </T>
          )}
          <Pressable onPress={() => setStep('phone')} style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
            <T size={13} color={colors.brand}>
              غيّر الرقم
            </T>
          </Pressable>
          <Button label={busy ? 'بنتأكد...' : 'تأكيد'} disabled={busy} onPress={finish} />
          {!app.remote && (
            <T size={11} color={colors.textFaint} style={{ textAlign: 'center' }}>
              نسخة تجريبية من غير سيرفر: أي 6 أرقام بتنفع
            </T>
          )}
        </View>
      )}

      <Pressable accessibilityRole="link" onPress={() => router.dismissTo('/')} style={{ alignItems: 'center', paddingVertical: 8 }}>
        <T size={14} color={colors.textMuted}>
          تصفح الخريطة من غير حساب ←
        </T>
      </Pressable>
      <T size={12} color={colors.textFaint} style={{ textAlign: 'center' }}>
        الحساب محتاجه بس علشان تبلّغ أو تضيف محطة
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  phoneBox: { height: 60, borderRadius: 18, backgroundColor: colors.surface, ...ltrRow, alignItems: 'center', gap: 12, paddingHorizontal: 18 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.latinBold, fontSize: 18, letterSpacing: 1, textAlign: 'left', paddingVertical: 0 },
  otp: { color: colors.text, fontFamily: fonts.latinBold, fontSize: 26, letterSpacing: 12, textAlign: 'center' },
});
