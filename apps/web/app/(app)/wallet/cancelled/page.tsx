"use client";

import { useRouter } from "next/navigation";
import { Card, Button } from "@ex-group/ui";

export default function WalletCancelledPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg py-16">
      <Card variant="elevated">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Top-Up Cancelled
          </h1>
          <p className="text-sm text-gray-500">
            Your wallet top-up was cancelled. No charges were made.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push("/wallet")}
            >
              Back to Wallet
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/wallet")}
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
