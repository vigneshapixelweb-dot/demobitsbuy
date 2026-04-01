import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@/components/ui/BottomSheet';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppColors } from '@/constants/theme';
import { Spacing } from '@/constants/spacing';
import { Radii } from '@/constants/radii';
import { Typography } from '@/constants/typography';
import ArrowLeft from '@/assets/icons/arrow-left.svg';
import MailIcon from '@/assets/icons/mail.svg';
import LockIcon from '@/assets/icons/lock.svg';
import { useAuthStore } from '@/stores/auth-store';

type Errors = {
  email?: string;
  password?: string;
};

const OTP_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [twoFACode, setTwoFACode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [twoFAError, setTwoFAError] = useState('');
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const otpInputsRef = useRef<Array<TextInput | null>>([]);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const requires2FA = useAuthStore((state) => state.requires2FA);
  const twoFAMethod = useAuthStore((state) => state.pendingTwoFAMethod);
  const login = useAuthStore((state) => state.login);
  const verify2FA = useAuthStore((state) => state.verify2FA);
  const clearTwoFA = useAuthStore((state) => state.clearTwoFA);
  const clearError = useAuthStore((state) => state.clearError);

  const inputLabelColor = useMemo(
    () => ({ color: palette.text }),
    [palette.text]
  );

  const validateEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

  useEffect(() => {
    if (requires2FA) {
      setShowTwoFAModal(true);
      setTwoFAError('');
      setTwoFACode(Array(OTP_LENGTH).fill(''));
    }
  }, [requires2FA]);

  useEffect(() => {
    if (!showTwoFAModal) return;
    const timer = setTimeout(() => {
      otpInputsRef.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [showTwoFAModal]);


  const handleSubmit = async () => {
    Keyboard.dismiss();
    const useDebugPayload = true;
    const nextErrors: Errors = {};
    const trimmedEmail = email.trim();

    if (!useDebugPayload) {
      if (!trimmedEmail || !validateEmail(trimmedEmail)) {
        nextErrors.email = 'Enter a valid email address.';
      }
      if (password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      const deviceId = Constants.sessionId ?? 'unknown';
      const payload = useDebugPayload
        ? {
            usernameEmail: 'testmail@mailinator.com',
            password: 'Test@123',
            deviceType: 'android',
            deviceId: 'c9b1f6a2-8d3e-4f91-bc2a-12ab34cd56ef',
            deviceToken: 'token123',
          }
        : {
            usernameEmail: trimmedEmail,
            password,
            deviceType: 'android',
            deviceId,
            deviceToken: 'token123',
          };
      const ok = await login(payload);
      if (ok) {
        router.replace('/(drawer)/(tabs)');
      }
    }
  };

  const handleVerify2FA = async () => {
    const cleaned = twoFACode.join('');
    if (cleaned.length !== OTP_LENGTH) {
      setTwoFAError('Enter the 6-digit code.');
      return;
    }
    setTwoFAError('');
    const ok = await verify2FA(cleaned);
    if (ok) {
      setShowTwoFAModal(false);
      router.replace('/(drawer)/(tabs)');
    }
  };

  const handleClose2FA = () => {
    setShowTwoFAModal(false);
    setTwoFAError('');
    setTwoFACode(Array(OTP_LENGTH).fill(''));
    clearTwoFA();
    clearError();
  };

  const focusOtpInput = (index: number) => {
    otpInputsRef.current[index]?.focus();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (twoFAError) setTwoFAError('');
    if (!value) {
      const next = [...twoFACode];
      next[index] = '';
      setTwoFACode(next);
      return;
    }

    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) return;

    const next = [...twoFACode];
    if (cleaned.length > 1) {
      const chars = cleaned.split('');
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = chars[i] ?? '';
      }
      setTwoFACode(next);
      const focusIndex = Math.min(cleaned.length, OTP_LENGTH) - 1;
      if (focusIndex >= 0) {
        focusOtpInput(focusIndex);
      }
      return;
    }

    next[index] = cleaned;
    setTwoFACode(next);
    if (index < OTP_LENGTH - 1) {
      focusOtpInput(index + 1);
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') return;
    if (twoFACode[index]) {
      const next = [...twoFACode];
      next[index] = '';
      setTwoFACode(next);
      return;
    }
    if (index > 0) {
      focusOtpInput(index - 1);
      const next = [...twoFACode];
      next[index - 1] = '';
      setTwoFACode(next);
    }
  };

  const renderTwoFAContent = () => (
    <View style={styles.twoFAContent}>
      <View style={styles.sheetHeader}>
        <Text style={[styles.twoFATitle, { color: palette.text }]}>2FA Verification</Text>
        <Pressable onPress={handleClose2FA} style={styles.sheetCloseButton}>
          <Ionicons name="close" size={20} color={palette.textMuted} />
        </Pressable>
      </View>
      <Text style={[styles.twoFASubtitle, { color: palette.textMuted }]}>
        {twoFAMethod === 'email'
          ? 'Enter the 6-digit code sent to your email.'
          : 'Enter the 6-digit code from Google Authenticator.'}
      </Text>
      <View style={styles.otpRow}>
        {twoFACode.map((digit, index) => (
          <TextInput
            key={`twofa-${index}`}
            ref={(ref) => {
              otpInputsRef.current[index] = ref;
            }}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            placeholderTextColor={palette.textMuted}
            style={[
              styles.otpInput,
              { borderColor: palette.border, backgroundColor: palette.surface, color: palette.text },
            ]}
          />
        ))}
      </View>
      {twoFAError || authError ? (
        <Text style={[styles.errorText, { color: palette.alert }]}>
          {twoFAError || authError}
        </Text>
      ) : null}
      <View style={styles.twoFAActions}>
        <Pressable
          style={[styles.twoFAButton, { borderColor: palette.border }]}
          onPress={handleClose2FA}
        >
          <Text style={[styles.twoFAButtonText, { color: palette.text }]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.twoFAButton, { backgroundColor: palette.primary }]}
          onPress={handleVerify2FA}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={palette.onPrimary} />
          ) : (
            <Text style={[styles.twoFAButtonText, { color: palette.onPrimary }]}>Verify</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  const handleEmailChange = (value: string) => {
    if (authError) {
      clearError();
    }
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value) ? undefined : prev.email,
    }));
  };

  const handlePasswordChange = (value: string) => {
    if (authError) {
      clearError();
    }
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: value.length >= 8 ? undefined : prev.password,
    }));
  };

  return (
    <>
      <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View
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
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <ArrowLeft width={20} height={20} color={palette.text} />
            </Pressable>
            <Text style={[styles.title, { color: palette.text }]}>Login</Text>
            <View style={styles.iconSpacer} />
          </View>

          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            Please login to your account
          </Text>

          <View
            style={[styles.segmentContainer, { borderColor: palette.border }]}>
            <Pressable
              onPress={() => router.replace('/(auth)/register')}
              style={[styles.segmentButton]}>
              <Text style={[styles.segmentText, { color: palette.textMuted }]}>Register</Text>
            </Pressable>
            <Pressable
              onPress={() => {}}
              style={[styles.segmentButton, { backgroundColor: palette.primary }]}>
              <Text style={[styles.segmentText, { color: palette.onPrimary }]}>Login</Text>
            </Pressable>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, inputLabelColor]}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: palette.border, backgroundColor: palette.surface },
              ]}>
              <MailIcon width={20} height={20} color={palette.textMuted} />
              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email address"
                placeholderTextColor={palette.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: palette.text }]}
              />
            </View>
            {errors.email ? (
              <Text style={[styles.errorText, { color: palette.alert }]}>{errors.email}</Text>
            ) : null}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, inputLabelColor]}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: palette.border, backgroundColor: palette.surface },
              ]}>
              <LockIcon width={20} height={20} color={palette.textMuted} />
              <TextInput
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                placeholderTextColor={palette.textMuted}
                secureTextEntry={!isPasswordVisible}
                style={[styles.input, { color: palette.text }]}
              />
              <Pressable
                onPress={() => setIsPasswordVisible((prev) => !prev)}
                style={styles.iconButtonSmall}
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}>
                <Ionicons
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color={palette.textMuted}
                />
              </Pressable>
            </View>
            {errors.password ? (
              <Text style={[styles.errorText, { color: palette.alert }]}>{errors.password}</Text>
            ) : null}
          </View>

          <Pressable onPress={() => {}} style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: palette.accent }]}>
              Forgot your password ?
            </Text>
          </Pressable>

          <Pressable onPress={handleSubmit} style={styles.buttonWrapper} disabled={isLoading}>
            <LinearGradient
              colors={palette.gradients.button}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[
                styles.button,
                { borderColor: palette.border, opacity: isLoading ? 0.7 : 1 },
              ]}>
              {isLoading ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: palette.onPrimary }]}>Login</Text>
              )}
            </LinearGradient>
          </Pressable>
          {authError && !showTwoFAModal ? (
            <Text style={[styles.errorText, { color: "#ff0000" }]}>{authError}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      </SafeAreaView>

      <BottomSheet isOpen={showTwoFAModal} onClose={handleClose2FA} snapPct={0.7}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={12}
        >
          {renderTwoFAContent()}
        </KeyboardAvoidingView>
      </BottomSheet>
    </>
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
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
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
    fontSize: Typography.size.xxl,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: Radii.pill,
    borderWidth: 1,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  segmentButton: {
    flex: 1,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  formSection: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.md,
  },
  iconButtonSmall: {
    // padding: Spacing.xs,
    paddingRight:Spacing.xs,
  },
  errorText: {
    fontSize: Typography.size.xs,
  },
  forgotRow: {
    alignItems: 'flex-start',
  },
  forgotText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: Spacing.md,
  },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: Typography.size.lg,
    fontWeight: '600',
  },
  twoFAContent: {
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoFATitle: {
    fontSize: Typography.size.lg,
    fontWeight: '600',
  },
  twoFASubtitle: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  otpInput: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderRadius: Radii.md,
    fontSize: Typography.size.md,
  },
  twoFAActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  twoFAButton: {
    flex: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  twoFAButtonText: {
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
});
