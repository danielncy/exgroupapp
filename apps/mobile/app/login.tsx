import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithPhone, verifyOtp } from "@ex-group/db";

type Step = "phone" | "otp";

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = useCallback(async () => {
    setError(null);

    const cleaned = phone.replace(/\s+/g, "");
    if (!/^\d{8}$/.test(cleaned)) {
      setError("Please enter a valid 8-digit Singapore phone number");
      return;
    }

    try {
      setLoading(true);
      await signInWithPhone(cleaned);
      setStep("otp");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleVerifyOtp = useCallback(async () => {
    setError(null);

    const cleaned = otp.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleaned)) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(phone.replace(/\s+/g, ""), cleaned);
      router.replace("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [phone, otp, router]);

  const handleBack = useCallback(() => {
    setStep("phone");
    setOtp("");
    setError(null);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>EX Group</Text>
        <Text style={styles.subtitle}>Sign in with your phone number</Text>

        {step === "phone" && (
          <View style={styles.form}>
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+65</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="9123 4567"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={8}
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                autoFocus
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === "otp" && (
          <View style={styles.form}>
            <Text style={styles.label}>
              Enter the 6-digit code sent to +65 {phone}
            </Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              editable={!loading}
              autoFocus
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBack}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>Use a different number</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A2E",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    width: "100%",
    maxWidth: 360,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  prefix: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "#D1D5DB",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 14,
  },
  prefixText: {
    fontSize: 14,
    color: "#6B7280",
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    color: "#111827",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 16,
  },
  error: {
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  backText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
