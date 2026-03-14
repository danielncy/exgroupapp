"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithPhone, verifyOtp } from "@ex-group/db";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
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
    },
    [phone]
  );

  const handleVerifyOtp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      const cleaned = otp.replace(/\s+/g, "");
      if (!/^\d{6}$/.test(cleaned)) {
        setError("Please enter a valid 6-digit code");
        return;
      }

      try {
        setLoading(true);
        await verifyOtp(phone.replace(/\s+/g, ""), cleaned);
        router.push("/");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Invalid OTP";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [phone, otp, router]
  );

  const handleBack = useCallback(() => {
    setStep("phone");
    setOtp("");
    setError(null);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-surface p-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-primary">EX Group</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in with your phone number
          </p>
        </div>

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone number
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  +65
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9123 4567"
                  maxLength={8}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                Enter the 6-digit code sent to +65 {phone}
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest text-gray-900 placeholder-gray-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
