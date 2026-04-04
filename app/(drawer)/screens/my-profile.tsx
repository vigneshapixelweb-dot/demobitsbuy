import ProfileDark from "@/assets/icons/Drawer/profile_dark.svg";
import ProfileLight from "@/assets/icons/Drawer/profile_light.svg";
import ArrowLeft from "@/assets/icons/arrow-left.svg";
import CalendarIcon from "@/assets/icons/calendar.svg";
import CheckIcon from "@/assets/icons/check.svg";
import CloseIcon from "@/assets/icons/security/close.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth-store";
import { updateProfileDetails } from "@/services/auth/update-profile";
import { SvgUri } from "react-native-svg";
import { fetchCountries, updateCountry, type Country } from "@/services/auth/country";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

export default function MyProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const refreshUserDetails = useAuthStore((state) => state.refreshUserDetails);

  const [nickname, setNickname] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [draftDob, setDraftDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarAsset, setAvatarAsset] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [hasSeededProfile, setHasSeededProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryError, setCountryError] = useState("");

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const displayName =
    profile?.fullName ||
    profile?.nickname ||
    profile?.username ||
    "User";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "U";
  const showVerifiedBadge = profile?.isVerified === true;
  const isSvgAvatar = avatarUri ? avatarUri.toLowerCase().includes(".svg") : false;

  useEffect(() => {
    if (!avatarUri || isSvgAvatar) return;
    Image.prefetch(avatarUri).catch(() => {});
  }, [avatarUri, isSvgAvatar]);

  const parseDob = (value?: string | null) => {
    if (!value) return null;
    const normalized = value.replace(/\//g, "-");
    const direct = new Date(normalized);
    if (!Number.isNaN(direct.getTime())) return direct;
    const parts = normalized.split("-").map((part) => part.trim());
    if (parts.length !== 3) return null;
    const [first, second, third] = parts;
    if (third.length === 4) {
      const day = Number(first);
      const month = Number(second);
      const year = Number(third);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        const parsed = new Date(year, month - 1, day);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!token) return;
    refreshUserDetails();
  }, [token, refreshUserDetails]);

  useEffect(() => {
    if (!profile || hasSeededProfile) return;
    setNickname(profile.nickname ?? profile.firstName ?? profile.fullName ?? profile.username ?? "");
    setLastName(profile.lastName ?? "");
    setPhoneNumber(profile.phone ?? "");
    setBio(profile.bio ?? "");
    const parsedDob = parseDob(profile.dob ?? undefined);
    if (parsedDob) {
      setDob(parsedDob);
      setDraftDob(parsedDob);
    }
    if (profile.avatarUrl) {
      setAvatarUri(profile.avatarUrl);
    }
    if (profile.countryId || profile.countryName) {
      setSelectedCountry((prev) =>
        prev ?? {
          id: profile.countryId ?? 0,
          name: profile.countryName ?? "Selected country",
        },
      );
    }
    setHasSeededProfile(true);
  }, [profile, hasSeededProfile]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      const result = await fetchCountries();
      if (!isActive) return;
      if (result.success && result.data?.countries) {
        setCountries(result.data.countries);
        setCountryError("");
        if (profile?.countryId) {
          const match = result.data.countries.find(
            (item) => String(item.id) === String(profile.countryId),
          );
          if (match) setSelectedCountry(match);
        }
      } else {
        setCountryError(result.message ?? "Unable to load countries.");
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [profile?.countryId]);

  const formattedDob = useMemo(() => {
    if (!dob) return "DD/MM/YYYY";
    const day = `${dob.getDate()}`.padStart(2, "0");
    const month = `${dob.getMonth() + 1}`.padStart(2, "0");
    const year = dob.getFullYear();
    return `${day}/${month}/${year}`;
  }, [dob]);

  const openDatePicker = () => {
    setDraftDob(dob ?? new Date());
    setShowDatePicker(true);
  };

  const handleDobChange = (_event: DateTimePickerChangeEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // Android auto-dismisses — save immediately
      setShowDatePicker(false);
      if (selectedDate) {
        setDob(selectedDate);
        setDraftDob(selectedDate);
      }
    } else {
      // iOS stays open until Done
      if (selectedDate) setDraftDob(selectedDate);
    }
  };

  const onUploadImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const selected = result.assets?.[0];
      if (!selected?.uri) return;
      setAvatarUri(selected.uri);
      setAvatarAsset({
        uri: selected.uri,
        name: selected.name ?? "profile.jpg",
        type: selected.mimeType ?? "image/jpeg",
      });
    } catch {
      Alert.alert("Upload failed", "Unable to open image picker.");
    }
  };

  const onSubmit = async () => {
    if (!nickname.trim()) {
      Alert.alert("Validation", "Please enter your nickname.");
      return;
    }
    if (!dob) {
      Alert.alert("Validation", "Please select your date of birth.");
      return;
    }
    if (!token) {
      Alert.alert("Profile", "Please log in again to update your profile.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await updateProfileDetails(token, {
        username: nickname.trim(),
        lastName: lastName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        profileImage: avatarAsset,
      });
      if (!result.success) {
        Alert.alert("Profile", result.message ?? "Profile update failed.");
        return;
      }
      if (result.data) {
        setNickname(result.data.username ?? nickname);
        setLastName(result.data.lastName ?? lastName);
        setPhoneNumber(result.data.phone ?? phoneNumber);
        if (result.data.avatarUrl) {
          setAvatarUri(result.data.avatarUrl);
        }
        if (result.data.countryId) {
          const matched = countries.find(
            (item) => String(item.id) === String(result.data?.countryId),
          );
          if (matched) setSelectedCountry(matched);
        } else if (result.data.countryName) {
          setSelectedCountry({
            id: result.data.countryId ?? 0,
            name: result.data.countryName,
          });
        }
      }
      if (selectedCountry?.id) {
        const countryResult = await updateCountry(token, selectedCountry.id);
        if (!countryResult.success) {
          Alert.alert("Profile", countryResult.message ?? "Country update failed.");
        }
      }
      await refreshUserDetails();
      Alert.alert("Profile Updated", result.message ?? "Your profile has been submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile update failed.";
      Alert.alert("Profile", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBackground }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {isDark ? (
        <View pointerEvents="none" style={styles.topGlow}>
          <LinearGradient colors={subtleGlow} style={StyleSheet.absoluteFillObject} />
        </View>
      ) : null}

      {/* KeyboardAvoidingView lifts the ScrollView above the keyboard */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable style={styles.iconButton} onPress={() => router.back()}>
              <ArrowLeft width={24} height={24} color={textMuted} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>My Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.profileCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <View style={styles.profileTopRow}>
              <View style={[styles.avatarWrap, { backgroundColor: palette.primary }]}>
                {avatarUri ? (
                  isSvgAvatar ? (
                    <SvgUri uri={avatarUri} width="100%" height="100%" />
                  ) : (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  )
                ) : (
                  <Text style={styles.avatarFallback}>{avatarInitial}</Text>
                )}
              </View>

              <View style={styles.profileMeta}>
                <View style={styles.nameRow}>
                  <Text style={[styles.nameText, { color: textPrimary }]}>{displayName}</Text>
                  {showVerifiedBadge ? (
                    <View style={[styles.verifyBadge, { backgroundColor: palette.primary }]}>
                      <CheckIcon width={10} height={10} color={palette.onPrimary} />
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.profileHint, { color: textMuted }]}>
                  Update your nickname and manage your account.
                </Text>
              </View>

              <Pressable style={[styles.uploadButton, { backgroundColor: palette.primary }]} onPress={onUploadImage}>
                <Text style={[styles.uploadButtonText, { color: palette.onPrimary }]}>Upload Image</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Basic Information</Text>

          <Text style={[styles.label, { color: textPrimary }]}>Nickname</Text>
          <View style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            {isDark ? (
              <ProfileDark width={20} height={20} style={styles.inputIcon} />
            ) : (
              <ProfileLight width={20} height={20} style={styles.inputIcon} />
            )}
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter your name"
              placeholderTextColor={textMuted}
              returnKeyType="next"
              style={[styles.input, { color: textPrimary }]}
            />
          </View>

          <Text style={[styles.label, { color: textPrimary }]}>Last Name</Text>
          <View style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            {isDark ? (
              <ProfileDark width={20} height={20} style={styles.inputIcon} />
            ) : (
              <ProfileLight width={20} height={20} style={styles.inputIcon} />
            )}
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor={textMuted}
              returnKeyType="next"
              style={[styles.input, { color: textPrimary }]}
            />
          </View>

          <Text style={[styles.label, { color: textPrimary }]}>Phone Number</Text>
          <View style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            {isDark ? (
              <ProfileDark width={20} height={20} style={styles.inputIcon} />
            ) : (
              <ProfileLight width={20} height={20} style={styles.inputIcon} />
            )}
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              placeholderTextColor={textMuted}
              keyboardType="phone-pad"
              returnKeyType="next"
              style={[styles.input, { color: textPrimary }]}
            />
          </View>

          <Text style={[styles.label, { color: textPrimary }]}>Date of Birth</Text>
          <Pressable
            style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
            onPress={openDatePicker}
          >
            <Text style={[styles.input, { color: textMuted }]}>{formattedDob}</Text>
            <CalendarIcon width={22} height={22} />
          </Pressable>

          <Text style={[styles.label, { color: textPrimary }]}>Country</Text>
          <Pressable
            style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={[styles.input, { color: selectedCountry ? textPrimary : textMuted }]}>
              {selectedCountry?.name ?? "Select country"}
            </Text>
          </Pressable>
          {countryError ? (
            <Text style={[styles.errorText, { color: palette.alert ?? "#DE2E42" }]}>
              {countryError}
            </Text>
          ) : null}

          <Text style={[styles.label, { color: textPrimary }]}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="Tell us about yourself"
            placeholderTextColor={textMuted}
            returnKeyType="done"
            blurOnSubmit
            style={[
              styles.bioInput,
              { color: textPrimary, backgroundColor: fieldBg, borderColor: fieldBorder },
            ]}
          />

          <Pressable style={[styles.submitButton, { backgroundColor: palette.primary }]} onPress={onSubmit}>
            <Text style={[styles.submitText, { color: palette.onPrimary }]}>Submit</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
          <Pressable onPress={() => {}}>
            <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
              <DateTimePicker
                value={draftDob}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                onValueChange={handleDobChange}
              />
              {/* Show Cancel/Done only on iOS; Android auto-dismisses */}
              {Platform.OS === "ios" && (
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalButton, { borderColor: fieldBorder, backgroundColor: fieldBg }]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: textMuted }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, { borderColor: palette.primary, backgroundColor: palette.primary }]}
                    onPress={() => {
                      setDob(draftDob);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: palette.onPrimary }]}>Done</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCountryPicker(false)}>
          <Pressable onPress={() => {}}>
            <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>Select Country</Text>
                <Pressable
                  style={styles.modalClose}
                  onPress={() => setShowCountryPicker(false)}
                >
                  <CloseIcon width={22} height={22} />
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={styles.countryList}
                showsVerticalScrollIndicator={false}
              >
                {countries.map((country) => {
                  const active = String(country.id) === String(selectedCountry?.id);
                  return (
                    <Pressable
                      key={country.id}
                      style={[
                        styles.countryRow,
                        { borderColor: fieldBorder },
                        active && { borderColor: palette.primary },
                      ]}
                      onPress={() => {
                        setSelectedCountry(country);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Text style={[styles.countryName, { color: textPrimary }]}>{country.name}</Text>
                      {active ? (
                        <View style={[styles.countryBadge, { backgroundColor: palette.primary }]}>
                          <CheckIcon width={10} height={10} color={palette.onPrimary} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 160,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 34,
    height: 28,
  },
  headerTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xl,
    lineHeight: Typography.line.lg,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    fontFamily: "Geist-Bold",
    fontSize: Typography.size.lg,
    color: "#FFFFFF",
  },
  profileMeta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md -1,
    lineHeight: Typography.line.md -1,
  },
  verifyBadge: {
    width: 15 ,
    height: 15,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHint: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs -1,
    lineHeight: Typography.line.xs -1,
  },
  uploadButton: {
    minWidth: 93,
    height: 27,
    borderRadius: Radii.xs,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  uploadButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs -1,
    lineHeight: Typography.line.xs -1,
  },
  sectionTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
    marginBottom: Spacing.xs,
  },
  label: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  inputRow: {
    height: 50,
    borderWidth: 1,
    borderRadius: Radii.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  bioInput: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    textAlignVertical: "top",
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  submitButton: {
    marginTop: Spacing.md,
    height: 50,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxxl+Spacing.lg,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  countryList: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  countryRow: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryName: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  countryBadge: {
    width: 18,
    height: 18,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm + 1,
    lineHeight: Typography.line.sm + 1,
  },
});
