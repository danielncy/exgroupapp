"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCheckoutSessionStatus, getWalletBalance } from "@ex-group/db";
import { Card, Button } from "@ex-group/ui";

function formatPrice(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export default function WalletSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"polling" | "success" | "timeout">("polling");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/wallet");
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const poll = setInterval(async () => {
      attempts++;
      try {
        const result = await getCheckoutSessionStatus(sessionId);
        if (result === "completed") {
          clearInterval(poll);
          const bal = await getWalletBalance();
          setBalance(bal);
          setStatus("success");
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setStatus("timeout");
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setStatus("timeout");
        }
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [sessionId, router]);

  return (
    <div className="mx-auto max-w-lg py-16">
      <Card variant="elevated">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          {status === "polling" && (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Processing Payment...
              </h1>
              <p className="text-sm text-gray-500">
                Please wait while we confirm your top-up.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Top-Up Successful!
              </h1>
              <p className="text-sm text-gray-500">
                Your wallet has been credited.
              </p>
              {balance !== null && (
                <p className="text-2xl font-bold text-gray-900">
                  Balance: {formatPrice(balance)} SGD
                </p>
              )}
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/wallet")}
              >
                Back to Wallet
              </Button>
            </>
          )}

          {status === "timeout" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Payment Pending
              </h1>
              <p className="text-sm text-gray-500">
                Your payment is still being processed. It may take a few moments
                to appear in your wallet.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/wallet")}
              >
                Back to Wallet
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
