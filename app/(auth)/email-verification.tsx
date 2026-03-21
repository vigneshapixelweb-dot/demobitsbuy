import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppColors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { Radii } from '@/constants/radii';
import { Typography } from '@/constants/typography';
import ArrowLeft from '@/assets/icons/arrow-left.svg';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function EmailVerificationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [errors, setErrors] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  const canResend = secondsLeft === 0;

  const inputLabelColor = useMemo(
    () => ({ color: palette.text }),
    [palette.text]
  );

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (value: string, index: number) => {
    if (errors) {
      setErrors('');
    }
    if (!value) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }

    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) return;

    const next = [...otp];

    if (cleaned.length > 1) {
      const chars = cleaned.split('');
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = chars[i] ?? '';
      }
      setOtp(next);
      const focusIndex = Math.min(cleaned.length, OTP_LENGTH) - 1;
      if (focusIndex >= 0) {
        focusInput(focusIndex);
      }
      return;
    }

    next[index] = cleaned;
    setOtp(next);
    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') return;
    if (otp[index]) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }
    if (index > 0) {
      focusInput(index - 1);
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
    }
  };

  const handleSubmit = () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setErrors('Please enter the 6-digit code.');
      return;
    }
    setErrors('');
    // Hook up verification API here.
  };

  const handleResend = () => {
    if (!canResend) return;
    setSecondsLeft(RESEND_SECONDS);
    // Hook up resend API here.
  };

  const resendLabel = canResend ? 'Send Code' : `Send Code (${secondsLeft}s)`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <LinearGradient
        colors={palette.gradients.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.replace('/login')} style={styles.iconButton}>
              <ArrowLeft width={20} height={20} color={palette.text} />
            </Pressable>
            <Text style={[styles.title, { color: palette.text }]}>Email Verification</Text>
            <View style={styles.iconSpacer} />
          </View>

          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            Please enter the 6-digit verification code that was sent to
          </Text>
          <Text style={[styles.emailText, { color: palette.textMuted }]}>
            john@mailinator.com
          </Text>

          <Text style={[styles.label, inputLabelColor]}>Email Address</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={`otp-${index}`}
                ref={(ref) => {
                  inputsRef.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                textAlign="center"
                placeholderTextColor={palette.textMuted}
                style={[
                  styles.otpInput,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.surface,
                    color: palette.text,
                  },
                ]}
              />
            ))}
          </View>
          {errors ? (
            <Text style={[styles.errorText, { color: palette.alert }]}>{errors}</Text>
          ) : null}

          <View style={styles.resendRow}>
            <Text style={[styles.resendText, { color: palette.textMuted }]}>
              Mail not received click resend link,
            </Text>
            <Pressable onPress={handleResend} disabled={!canResend}>
              <Text style={[styles.resendLink, { color: palette.accent }]}>
                {resendLabel}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={handleSubmit} style={styles.buttonWrapper}>
            <LinearGradient
              colors={palette.gradients.button}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.button, { borderColor: palette.border }]}>
              <Text style={[styles.buttonText, { color: palette.onPrimary }]}>Submit</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 40,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.lg,
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  emailText: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  otpInput: {
    width: 46,
    height: 52,
    borderRadius: Radii.md,
    borderWidth: 0.7,
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  errorText: {
    fontSize: Typography.size.xs,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  resendText: {
    fontSize: Typography.size.xs,
  },
  resendLink: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: Spacing.lg,
  },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 0.8,
  },
  buttonText: {
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
});
