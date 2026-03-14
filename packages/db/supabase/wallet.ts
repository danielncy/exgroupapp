import { supabase } from "./client";
import type {
  Wallet,
  WalletLedgerEntry,
  Transaction,
} from "@ex-group/shared/types/wallet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentCustomerId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (customerError || !customer) {
    throw new Error("Customer profile not found");
  }

  return customer.id as string;
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ---------------------------------------------------------------------------
// getOrCreateWallet — get current user's SGD wallet, create if doesn't exist
// ---------------------------------------------------------------------------

export async function getOrCreateWallet(): Promise<Wallet> {
  const customerId = await getCurrentCustomerId();

  // Try to get existing wallet
  const { data: existing, error: selectError } = await supabase
    .from("wallets")
    .select("*")
    .eq("customer_id", customerId)
    .eq("currency", "SGD")
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to fetch wallet: ${selectError.message}`);
  }

  if (existing) {
    return existing as Wallet;
  }

  // Create new SGD wallet
  const { data: wallet, error: insertError } = await supabase
    .from("wallets")
    .insert({
      customer_id: customerId,
      currency: "SGD",
    })
    .select()
    .single();

  if (insertError) {
    // Handle race condition — another request may have created it
    if (insertError.code === "23505") {
      const { data: retried, error: retryError } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", customerId)
        .eq("currency", "SGD")
        .single();

      if (retryError || !retried) {
        throw new Error("Failed to retrieve wallet after conflict");
      }
      return retried as Wallet;
    }
    throw new Error(`Failed to create wallet: ${insertError.message}`);
  }

  return wallet as Wallet;
}

// ---------------------------------------------------------------------------
// getWalletBalance — returns balance in cents from the ledger SUM
// ---------------------------------------------------------------------------

export async function getWalletBalance(): Promise<number> {
  const wallet = await getOrCreateWallet();

  const { data, error } = await supabase
    .from("wallet_ledger")
    .select("amount_cents")
    .eq("wallet_id", wallet.id);

  if (error) {
    throw new Error(`Failed to fetch wallet balance: ${error.message}`);
  }

  const balance = (data ?? []).reduce(
    (sum: number, entry: { amount_cents: number }) => sum + entry.amount_cents,
    0
  );

  return balance;
}

// ---------------------------------------------------------------------------
// getWalletHistory — get wallet ledger entries, most recent first
// ---------------------------------------------------------------------------

export async function getWalletHistory(
  limit: number = 50
): Promise<WalletLedgerEntry[]> {
  const wallet = await getOrCreateWallet();

  const { data, error } = await supabase
    .from("wallet_ledger")
    .select("*")
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch wallet history: ${error.message}`);
  }

  return (data ?? []) as WalletLedgerEntry[];
}

// ---------------------------------------------------------------------------
// topUpWallet — insert a 'topup' ledger entry (simulated — no Stripe)
// ---------------------------------------------------------------------------

export async function topUpWallet(amountCents: number): Promise<WalletLedgerEntry> {
  if (amountCents <= 0) {
    throw new Error("Top-up amount must be positive");
  }

  const wallet = await getOrCreateWallet();
  const idempotencyKey = `topup-${generateIdempotencyKey()}`;

  const { data: entry, error } = await supabase
    .from("wallet_ledger")
    .insert({
      wallet_id: wallet.id,
      entry_type: "topup",
      amount_cents: amountCents,
      currency: "SGD",
      reference_type: "topup",
      description: `Wallet top-up of $${(amountCents / 100).toFixed(2)}`,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to top up wallet: ${error.message}`);
  }

  return entry as WalletLedgerEntry;
}

// ---------------------------------------------------------------------------
// payWithWallet — deduct from wallet + create transaction record
// ---------------------------------------------------------------------------

export async function payWithWallet(
  bookingId: string,
  amountCents: number,
  outletId: string
): Promise<Transaction> {
  if (amountCents <= 0) {
    throw new Error("Payment amount must be positive");
  }

  const wallet = await getOrCreateWallet();
  const customerId = await getCurrentCustomerId();

  // Check balance
  const balance = await getWalletBalance();
  if (balance < amountCents) {
    throw new Error(
      `Insufficient balance. Current: $${(balance / 100).toFixed(2)}, Required: $${(amountCents / 100).toFixed(2)}`
    );
  }

  const idempotencyKey = `payment-${bookingId}-${generateIdempotencyKey()}`;

  // Insert negative ledger entry
  const { error: ledgerError } = await supabase
    .from("wallet_ledger")
    .insert({
      wallet_id: wallet.id,
      entry_type: "payment",
      amount_cents: -amountCents,
      currency: "SGD",
      reference_type: "booking",
      reference_id: bookingId,
      description: `Payment for booking`,
      idempotency_key: idempotencyKey,
    });

  if (ledgerError) {
    throw new Error(`Failed to process wallet payment: ${ledgerError.message}`);
  }

  // Create transaction record
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      customer_id: customerId,
      booking_id: bookingId,
      outlet_id: outletId,
      payment_method: "wallet",
      subtotal_cents: amountCents,
      discount_cents: 0,
      total_cents: amountCents,
      currency: "SGD",
      status: "completed",
    })
    .select()
    .single();

  if (txError) {
    throw new Error(`Failed to create transaction: ${txError.message}`);
  }

  return transaction as Transaction;
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

export interface PackageWithDetails {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  sessions_total: number;
  price_cents: number;
  currency: "MYR" | "SGD";
  is_active: boolean;
  created_at: string;
}

export interface CustomerPackageWithDetails {
  id: string;
  customer_id: string;
  package_id: string;
  sessions_remaining: number;
  purchased_at: string;
  expires_at: string | null;
  package?: PackageWithDetails;
}

// ---------------------------------------------------------------------------
// getPackages — list available service packages
// ---------------------------------------------------------------------------

export async function getPackages(
  brandId?: string
): Promise<PackageWithDetails[]> {
  let query = supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch packages: ${error.message}`);
  }

  return (data ?? []) as PackageWithDetails[];
}

// ---------------------------------------------------------------------------
// getMyPackages — get user's purchased packages with remaining sessions
// ---------------------------------------------------------------------------

export async function getMyPackages(): Promise<CustomerPackageWithDetails[]> {
  const customerId = await getCurrentCustomerId();

  const { data, error } = await supabase
    .from("customer_packages")
    .select(`
      *,
      package:packages(*)
    `)
    .eq("customer_id", customerId)
    .order("purchased_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch my packages: ${error.message}`);
  }

  return (data ?? []) as CustomerPackageWithDetails[];
}

// ---------------------------------------------------------------------------
// purchasePackage — deduct from wallet + create customer_package record
// ---------------------------------------------------------------------------

export async function purchasePackage(
  packageId: string
): Promise<CustomerPackageWithDetails> {
  // Fetch the package
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("*")
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (pkgError || !pkg) {
    throw new Error("Package not found or inactive");
  }

  const typedPkg = pkg as PackageWithDetails;

  // Check wallet balance
  const balance = await getWalletBalance();
  if (balance < typedPkg.price_cents) {
    throw new Error(
      `Insufficient balance. Current: $${(balance / 100).toFixed(2)}, Required: $${(typedPkg.price_cents / 100).toFixed(2)}`
    );
  }

  const wallet = await getOrCreateWallet();
  const customerId = await getCurrentCustomerId();
  const idempotencyKey = `pkg-${packageId}-${generateIdempotencyKey()}`;

  // Deduct from wallet
  const { error: ledgerError } = await supabase
    .from("wallet_ledger")
    .insert({
      wallet_id: wallet.id,
      entry_type: "payment",
      amount_cents: -typedPkg.price_cents,
      currency: "SGD",
      reference_type: "package",
      reference_id: packageId,
      description: `Package purchase: ${typedPkg.name}`,
      idempotency_key: idempotencyKey,
    });

  if (ledgerError) {
    throw new Error(`Failed to deduct wallet: ${ledgerError.message}`);
  }

  // Create customer_package
  const { data: customerPackage, error: cpError } = await supabase
    .from("customer_packages")
    .insert({
      customer_id: customerId,
      package_id: packageId,
      sessions_remaining: typedPkg.sessions_total,
    })
    .select(`
      *,
      package:packages(*)
    `)
    .single();

  if (cpError) {
    throw new Error(`Failed to create customer package: ${cpError.message}`);
  }

  return customerPackage as CustomerPackageWithDetails;
}
