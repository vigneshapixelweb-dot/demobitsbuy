import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CloseIcon from "@/assets/icons/security/close.svg";

const OTP_LENGTH = 6;

type PaletteSubset = {
  gradients: { button: readonly string[] };
  accent: string;
  primary: string;
  onPrimary: string;
};

type SecurityModalsProps = {
  showOtpModal: boolean;
  showProtectModal: boolean;
  showVerificationModal: boolean;
  showLoginPasswordModal: boolean;
  setShowOtpModal: (value: boolean) => void;
  setShowProtectModal: (value: boolean) => void;
  setShowVerificationModal: (value: boolean) => void;
  setShowLoginPasswordModal: (value: boolean) => void;
  fieldBg: string;
  fieldBorder: string;
  textPrimary: string;
  textMuted: string;
  noteBorder: string;
  noteBg: string;
  palette: PaletteSubset;
  qrMatrix: boolean[][];
  walletAddress: string;
  verificationEmail: string;
  onCopyWallet: () => void;
  otp: string[];
  handleOtpChange: (value: string, index: number) => void;
  handleOtpKeyPress: (key: string, index: number) => void;
  inputsRef: React.MutableRefObject<Array<TextInput | null>>;
  otpError: string;
  resendLabel: string;
  secondsLeft: number;
  handleOtpResend: () => void;
  handleOtpSubmit: () => void;
  openOtpModal: () => void;
  AuthenticatorAppIcon: React.ComponentType<{ width?: number; height?: number }>;
  styles: Record<string, any>;
};

export default function SecurityModals({
  showOtpModal,
  showProtectModal,
  showVerificationModal,
  showLoginPasswordModal,
  setShowOtpModal,
  setShowProtectModal,
  setShowVerificationModal,
  setShowLoginPasswordModal,
  fieldBg,
  fieldBorder,
  textPrimary,
  textMuted,
  noteBorder,
  noteBg,
  palette,
  qrMatrix,
  walletAddress,
  verificationEmail,
  onCopyWallet,
  otp,
  handleOtpChange,
  handleOtpKeyPress,
  inputsRef,
  otpError,
  resendLabel,
  secondsLeft,
  handleOtpResend,
  handleOtpSubmit,
  openOtpModal,
  AuthenticatorAppIcon,
  styles,
}: SecurityModalsProps) {
  const [verificationOtp, setVerificationOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verificationError, setVerificationError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hideCurrentPassword, setHideCurrentPassword] = useState(true);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [passwordError, setPasswordError] = useState("");
  const verificationInputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (!showOtpModal) return;
    const timer = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [showOtpModal, inputsRef]);

  useEffect(() => {
    if (!showVerificationModal) return;
    setVerificationOtp(Array(OTP_LENGTH).fill(""));
    setVerificationError("");
    const timer = setTimeout(() => {
      verificationInputsRef.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [showVerificationModal]);

  useEffect(() => {
    if (!showLoginPasswordModal) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setHideCurrentPassword(true);
    setHideNewPassword(true);
    setHideConfirmPassword(true);
    setPasswordError("");
  }, [showLoginPasswordModal]);

  const handleVerificationChange = (value: string, index: number) => {
    if (verificationError) setVerificationError("");
    if (!value) {
      const next = [...verificationOtp];
      next[index] = "";
      setVerificationOtp(next);
      return;
    }

    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return;

    const next = [...verificationOtp];
    if (cleaned.length > 1) {
      const chars = cleaned.split("");
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = chars[i] ?? "";
      }
      setVerificationOtp(next);
      const focusIndex = Math.min(cleaned.length, OTP_LENGTH) - 1;
      if (focusIndex >= 0) {
        verificationInputsRef.current[focusIndex]?.focus();
      }
      return;
    }

    next[index] = cleaned;
    setVerificationOtp(next);
    if (index < OTP_LENGTH - 1) {
      verificationInputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerificationKeyPress = (key: string, index: number) => {
    if (key !== "Backspace") return;
    if (verificationOtp[index]) {
      const next = [...verificationOtp];
      next[index] = "";
      setVerificationOtp(next);
      return;
    }
    if (index > 0) {
      verificationInputsRef.current[index - 1]?.focus();
      const next = [...verificationOtp];
      next[index - 1] = "";
      setVerificationOtp(next);
    }
  };

  const handleVerificationConfirm = () => {
    const code = verificationOtp.join("");
    if (code.length !== OTP_LENGTH) {
      setVerificationError("Please enter the 6-digit code.");
      return;
    }
    setVerificationError("");
    Alert.alert("Verified", "Security verification confirmed.");
    setShowVerificationModal(false);
  };

  const handleVerificationResend = () => {
    Alert.alert("Code Sent", `A code has been sent to ${verificationEmail}.`);
  };

  const closeLoginPasswordModal = () => {
    setShowLoginPasswordModal(false);
    setPasswordError("");
  };

  const handleLoginPasswordConfirm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }
    setPasswordError("");
    setShowLoginPasswordModal(false);
    Alert.alert("Password Changed", "Your login password has been updated.");
  };

  return (
    <>
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowOtpModal(false)} />
          <View style={[styles.otpCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.otpCardScroll}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Enable Google Authenticator
                </Text>
                <Pressable style={styles.modalClose} onPress={() => setShowOtpModal(false)}>
                  <CloseIcon width={22} height={22} />
                </Pressable>
              </View>
              <Text style={[styles.modalText, { color: textMuted }]}>
                Install google Authenticator App in Your Mobile and Scan QR Code (or) If You are
                Unable to Scan the QR Code, Please enter the Code Manually into the App
              </Text>

              <View style={[styles.qrCard, { borderColor: fieldBorder, backgroundColor: fieldBg }]}>
                <View style={styles.qrFrame}>
                  {qrMatrix.map((row, rowIndex) => (
                    <View key={`qr-row-${rowIndex}`} style={styles.qrRow}>
                      {row.map((cell, cellIndex) => (
                        <View
                          key={`qr-cell-${rowIndex}-${cellIndex}`}
                          style={[styles.qrCell, { backgroundColor: cell ? "#0B0B0B" : "#FFFFFF" }]}
                        />
                      ))}
                    </View>
                  ))}
                </View>

                <Text style={[styles.walletTitle, { color: textPrimary }]}>Wallet Address</Text>
                <View style={[styles.walletField, { borderColor: fieldBorder }]}>
                  <Text style={[styles.walletValue, { color: textMuted }]} numberOfLines={1}>
                    {walletAddress}
                  </Text>
                  <Pressable onPress={onCopyWallet}>
                    <Ionicons name="copy-outline" size={20} color={textMuted} />
                  </Pressable>
                </View>
                <Text style={[styles.walletNote, { color: textMuted }]}>
                  Note: Please save your private key properly in case of any login issues caused by
                  switching or losing your phone.
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Enter the OTP</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={`otp-${index}`}
                    ref={(ref) => {
                      inputsRef.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    placeholderTextColor={textMuted}
                    style={[
                      styles.otpInput,
                      { borderColor: fieldBorder, backgroundColor: fieldBg, color: textPrimary },
                    ]}
                  />
                ))}
              </View>
              {otpError ? (
                <Text style={[styles.errorText, { color: "#DE2E42" }]}>{otpError}</Text>
              ) : null}

              <View style={styles.resendRow}>
                <Text style={[styles.resendText, { color: textMuted }]}>
                  Mail not received click resend link,
                </Text>
                <Pressable onPress={handleOtpResend} disabled={secondsLeft !== 0}>
                  <Text style={[styles.resendLink, { color: palette.accent }]}>{resendLabel}</Text>
                </Pressable>
              </View>

              <Pressable onPress={handleOtpSubmit} style={styles.submitButton}>
                <LinearGradient
                  colors={palette.gradients.button as [string, string, ...string[]]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={[styles.submitText, { color: palette.onPrimary }]}>Submit</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showProtectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProtectModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowProtectModal(false)} />
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Protect your Funds</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowProtectModal(false)}>
                <CloseIcon width={22} height={22} />
              </Pressable>
            </View>
            <View style={styles.modalDivider} />
            <Text style={[styles.modalText, { color: textMuted }]}
            >
              Your account security level is low. Please enable at least one more verification mode.
            </Text>
            <Pressable
              style={[styles.modalOption, { borderColor: fieldBorder }]}
              onPress={() => {
                setShowProtectModal(false);
                openOtpModal();
              }}
            >
              <View style={styles.modalOptionLeft}>
                <AuthenticatorAppIcon width={36} height={36} />
                <View>
                  <Text style={[styles.modalOptionTitle, { color: textPrimary }]}
                  >
                    Authenticator App
                  </Text>
                  <Text style={[styles.modalOptionSub, { color: textMuted }]}
                  >
                    (Recommended)
                  </Text>
                </View>
              </View>
              <View style={[styles.modalOptionArrow, { backgroundColor: fieldBorder }]}>
                <Ionicons name="chevron-forward" size={16} color={textPrimary} />
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVerificationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowVerificationModal(false)}
          />
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.verificationCardScroll}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>Security Verification</Text>
                <Pressable style={styles.modalClose} onPress={() => setShowVerificationModal(false)}>
                  <CloseIcon width={22} height={22} />
                </Pressable>
              </View>
              <View style={styles.modalDivider} />

              <Text style={[styles.verificationText, { color: textMuted }]}>
                Enter the 6-digit code will be sent to{" "}
                <Text style={[styles.verificationEmail, { color: textPrimary }]}>
                  {verificationEmail}
                </Text>
              </Text>

              <View style={styles.verificationOtpRow}>
                {verificationOtp.map((digit, index) => (
                  <TextInput
                    key={`verification-${index}`}
                    ref={(ref) => {
                      verificationInputsRef.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={(value) => handleVerificationChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleVerificationKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    placeholderTextColor={textMuted}
                    style={[
                      styles.verificationOtpInput,
                      { borderColor: fieldBorder, backgroundColor: fieldBg, color: textPrimary },
                    ]}
                  />
                ))}
              </View>

              {verificationError ? (
                <Text style={[styles.errorText, { color: "#DE2E42" }]}>{verificationError}</Text>
              ) : null}

              <Pressable style={styles.verificationLink} onPress={handleVerificationResend}>
                <Text style={[styles.resendLink, { color: palette.accent }]}>Get Code</Text>
              </Pressable>

              <View style={styles.verificationButtons}>
                <Pressable
                  style={[
                    styles.verificationButton,
                    { borderWidth: 1, borderColor: fieldBorder, backgroundColor: fieldBg },
                  ]}
                  onPress={() => setShowVerificationModal(false)}
                >
                  <Text style={[styles.verificationButtonText, { color: textPrimary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.verificationButton, { backgroundColor: palette.primary }]}
                  onPress={handleVerificationConfirm}
                >
                  <Text style={[styles.verificationButtonText, { color: palette.onPrimary }]}>
                    Confirm
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showLoginPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={closeLoginPasswordModal}
      >
        <KeyboardAvoidingView
          style={styles.centeredModalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeLoginPasswordModal} />
          <View style={[styles.passwordModalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.passwordCardScroll}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>Change Login Password</Text>
                <Pressable style={styles.modalClose} onPress={closeLoginPasswordModal}>
                  <CloseIcon width={22} height={22} />
                </Pressable>
              </View>
              <View style={styles.modalDivider} />

              <View style={[styles.passwordNoteCard, { borderColor: noteBorder, backgroundColor: noteBg }]}>
                <Text style={[styles.passwordNoteTitle, { color: noteBorder }]}>Note:</Text>
                <Text style={[styles.passwordNoteText, { color: textMuted }]}>
                  For your security, withdrawals will be temporarily unavailable for 24 hours
                  after changing security settings
                </Text>
              </View>

              <Text style={[styles.passwordLabel, { color: textPrimary }]}>Current Password</Text>
              <View style={[styles.passwordField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}>
                <TextInput
                  style={[styles.passwordInput, { color: textPrimary }]}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={(value) => {
                    setCurrentPassword(value);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry={hideCurrentPassword}
                  placeholderTextColor={textMuted}
                  returnKeyType="next"
                />
                <Pressable onPress={() => setHideCurrentPassword((prev) => !prev)}>
                  <Ionicons
                    name={hideCurrentPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={textMuted}
                  />
                </Pressable>
              </View>

              <Text style={[styles.passwordLabel, { color: textPrimary }]}>New Password</Text>
              <View style={[styles.passwordField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}>
                <TextInput
                  style={[styles.passwordInput, { color: textPrimary }]}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry={hideNewPassword}
                  placeholderTextColor={textMuted}
                  returnKeyType="next"
                />
                <Pressable onPress={() => setHideNewPassword((prev) => !prev)}>
                  <Ionicons
                    name={hideNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={textMuted}
                  />
                </Pressable>
              </View>

              <Text style={[styles.passwordLabel, { color: textPrimary }]}>Confirm Password</Text>
              <View style={[styles.passwordField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}>
                <TextInput
                  style={[styles.passwordInput, { color: textPrimary }]}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry={hideConfirmPassword}
                  placeholderTextColor={textMuted}
                  returnKeyType="done"
                  onSubmitEditing={handleLoginPasswordConfirm}
                />
                <Pressable onPress={() => setHideConfirmPassword((prev) => !prev)}>
                  <Ionicons
                    name={hideConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={textMuted}
                  />
                </Pressable>
              </View>

              {passwordError ? (
                <Text style={styles.passwordError}>{passwordError}</Text>
              ) : null}

              <View style={styles.passwordActions}>
                <Pressable
                  style={[
                    styles.passwordActionButton,
                    { borderColor: fieldBorder, backgroundColor: fieldBg },
                  ]}
                  onPress={closeLoginPasswordModal}
                >
                  <Text style={[styles.passwordActionText, { color: textMuted }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.passwordActionButton,
                    { borderColor: palette.primary, backgroundColor: palette.primary },
                  ]}
                  onPress={handleLoginPasswordConfirm}
                >
                  <Text style={[styles.passwordActionText, { color: palette.onPrimary }]}>Confirm</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
