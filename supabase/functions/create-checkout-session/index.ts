// supabase/functions/create-checkout-session/index.ts
// Creates a Stripe Checkout Session for wallet top-up

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get customer record
    const { data: customer, error: customerError } = await supabaseClient
      .from("customers")
      .select("id, email, display_name")
      .eq("auth_user_id", user.id)
      .single();

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: "Customer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create wallet
    let wallet = await supabaseClient
      .from("wallets")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("currency", "SGD")
      .maybeSingle();

    if (!wallet.data) {
      const { data: newWallet, error: walletError } = await supabaseClient
        .from("wallets")
        .insert({ customer_id: customer.id, currency: "SGD" })
        .select("id")
        .single();

      if (walletError) throw new Error("Failed to create wallet");
      wallet = { data: newWallet, error: null, count: null, status: 200, statusText: "OK" };
    }

    const { amount_cents } = await req.json();

    if (!amount_cents || amount_cents < 100 || amount_cents > 100000) {
      return new Response(
        JSON.stringify({ error: "Amount must be between $1.00 and $1,000.00" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sgd",
            unit_amount: amount_cents,
            product_data: {
              name: "Wallet Top-Up",
              description: `Top up $${(amount_cents / 100).toFixed(2)} SGD`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customer.email ?? user.email,
      success_url: `${appUrl}/wallet/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/wallet/cancelled`,
      metadata: {
        customer_id: customer.id,
        wallet_id: wallet.data!.id,
        amount_cents: String(amount_cents),
      },
    });

    // Track the session in our database
    await supabaseClient.from("stripe_checkout_sessions").insert({
      stripe_session_id: session.id,
      wallet_id: wallet.data!.id,
      customer_id: customer.id,
      amount_cents,
      currency: "SGD",
      status: "pending",
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
