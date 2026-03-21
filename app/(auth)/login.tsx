import { useMemo, useState } from 'react';
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
import MailIcon from '@/assets/icons/mail.svg';
import LockIcon from '@/assets/icons/lock.svg';

type Errors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = AppColors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const inputLabelColor = useMemo(
    () => ({ color: palette.text }),
    [palette.text]
  );

  const validateEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

  const handleSubmit = () => {
    const nextErrors: Errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      // Hook up API call here.
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value) ? undefined : prev.email,
    }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: value.length >= 8 ? undefined : prev.password,
    }));
  };

  return (
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
                secureTextEntry
                style={[styles.input, { color: palette.text }]}
              />
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

          <Pressable onPress={handleSubmit} style={styles.buttonWrapper}>
            <LinearGradient
              colors={palette.gradients.button}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.button, { borderColor: palette.border }]}>
              <Text style={[styles.buttonText, { color: palette.onPrimary }]}>Login</Text>
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
});
