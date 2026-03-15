// supabase/functions/stripe-webhook/index.ts
// Handles Stripe webhook events — credits wallet on checkout.session.completed

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

serve(async (req: Request) => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const customerId = metadata.customer_id;
    const walletId = metadata.wallet_id;
    const amountCents = parseInt(metadata.amount_cents ?? "0", 10);

    if (!customerId || !walletId || !amountCents) {
      console.error("Missing metadata in checkout session:", session.id);
      return new Response("Missing metadata", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency key prevents double-crediting
    const idempotencyKey = `stripe-${session.id}`;

    // Check if already processed
    const { data: existing } = await supabase
      .from("wallet_ledger")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      // Already processed — idempotent
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Credit wallet
    const { error: ledgerError } = await supabase.from("wallet_ledger").insert({
      wallet_id: walletId,
      entry_type: "topup",
      amount_cents: amountCents,
      currency: "SGD",
      reference_type: "stripe_checkout",
      reference_id: session.id,
      description: `Wallet top-up of $${(amountCents / 100).toFixed(2)} via Stripe`,
      stripe_payment_intent_id: session.payment_intent as string,
      idempotency_key: idempotencyKey,
    });

    if (ledgerError) {
      console.error("Failed to credit wallet:", ledgerError);
      return new Response("Failed to credit wallet", { status: 500 });
    }

    // Update checkout session status
    await supabase
      .from("stripe_checkout_sessions")
      .update({
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", session.id);

    return new Response(JSON.stringify({ received: true, credited: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook error";
    console.error("Stripe webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
