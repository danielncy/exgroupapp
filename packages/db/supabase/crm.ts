import { createServiceClient } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthScore {
  id: string;
  customer_id: string;
  brand_id: string | null;
  score: number;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  risk_level: "healthy" | "cooling" | "at_risk" | "churning" | "churned";
  previous_risk_level: string | null;
  calculated_at: string;
  customer?: {
    id: string;
    display_name: string;
    phone: string;
    email: string | null;
  };
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  is_dynamic: boolean;
  created_at: string;
  member_count?: number;
}

export interface Campaign {
  id: string;
  name: string;
  segment_id: string | null;
  channel: "push" | "email" | "sms" | "whatsapp";
  message_template: string;
  offer: Record<string, unknown> | null;
  status: "draft" | "scheduled" | "sent" | "completed";
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  segment?: { id: string; name: string } | null;
}

export interface CampaignStats {
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface CreateCampaignInput {
  name: string;
  segment_id?: string;
  channel: "push" | "email" | "sms" | "whatsapp";
  message_template: string;
  offer?: Record<string, unknown>;
  scheduled_at?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServiceSupabase() {
  return createServiceClient();
}

// ---------------------------------------------------------------------------
// calculateHealthScores — trigger RFM calculation
// ---------------------------------------------------------------------------

export async function calculateHealthScores(): Promise<number> {
  const sb = getServiceSupabase();
  const { data, error } = await sb.rpc("calculate_health_scores");

  if (error) {
    throw new Error(`Failed to calculate health scores: ${error.message}`);
  }

  return data as number;
}

// ---------------------------------------------------------------------------
// getHealthScores — fetch all health scores with customer details
// ---------------------------------------------------------------------------

export async function getHealthScores(
  filters?: { risk_level?: string; limit?: number }
): Promise<HealthScore[]> {
  const sb = getServiceSupabase();
  const limit = filters?.limit ?? 100;

  let query = sb
    .from("customer_health_scores")
    .select(`
      *,
      customer:customers(id, display_name, phone, email)
    `)
    .order("score", { ascending: false })
    .limit(limit);

  if (filters?.risk_level) {
    query = query.eq("risk_level", filters.risk_level);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch health scores: ${error.message}`);
  }

  return (data ?? []) as unknown as HealthScore[];
}

// ---------------------------------------------------------------------------
// getSegments — fetch all segments with member counts
// ---------------------------------------------------------------------------

export async function getSegments(): Promise<Segment[]> {
  const sb = getServiceSupabase();

  const { data: segments, error } = await sb
    .from("customer_segments")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch segments: ${error.message}`);
  }

  const result: Segment[] = [];
  for (const seg of (segments ?? []) as Segment[]) {
    const { count } = await sb
      .from("customer_segment_members")
      .select("id", { count: "exact", head: true })
      .eq("segment_id", seg.id)
      .is("exited_at", null);

    result.push({ ...seg, member_count: count ?? 0 });
  }

  return result;
}

// ---------------------------------------------------------------------------
// getSegmentMembers — get customers in a segment
// ---------------------------------------------------------------------------

export async function getSegmentMembers(
  segmentId: string
): Promise<Array<{ customer_id: string; display_name: string; phone: string; entered_at: string }>> {
  const sb = getServiceSupabase();

  const { data, error } = await sb
    .from("customer_segment_members")
    .select(`
      customer_id,
      entered_at,
      customer:customers(display_name, phone)
    `)
    .eq("segment_id", segmentId)
    .is("exited_at", null)
    .order("entered_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch segment members: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as { customer_id: string; entered_at: string; customer: { display_name: string; phone: string } | null };
    return {
      customer_id: r.customer_id,
      display_name: r.customer?.display_name ?? "Unknown",
      phone: r.customer?.phone ?? "",
      entered_at: r.entered_at,
    };
  });
}

// ---------------------------------------------------------------------------
// createCampaign — create a new campaign
// ---------------------------------------------------------------------------

export async function createCampaign(
  input: CreateCampaignInput
): Promise<Campaign> {
  const sb = getServiceSupabase();

  const { data, error } = await sb
    .from("campaigns")
    .insert({
      name: input.name,
      segment_id: input.segment_id ?? null,
      channel: input.channel,
      message_template: input.message_template,
      offer: input.offer ?? null,
      status: input.scheduled_at ? "scheduled" : "draft",
      scheduled_at: input.scheduled_at ?? null,
    })
    .select(`
      *,
      segment:customer_segments(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  return data as unknown as Campaign;
}

// ---------------------------------------------------------------------------
// getCampaigns — list all campaigns
// ---------------------------------------------------------------------------

export async function getCampaigns(): Promise<Campaign[]> {
  const sb = getServiceSupabase();

  const { data, error } = await sb
    .from("campaigns")
    .select(`
      *,
      segment:customer_segments(id, name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  return (data ?? []) as unknown as Campaign[];
}

// ---------------------------------------------------------------------------
// getCampaignStats — aggregated event counts for a campaign
// ---------------------------------------------------------------------------

export async function getCampaignStats(
  campaignId: string
): Promise<CampaignStats> {
  const sb = getServiceSupabase();

  const { data, error } = await sb
    .from("campaign_events")
    .select("event_type")
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(`Failed to fetch campaign stats: ${error.message}`);
  }

  const events = (data ?? []) as Array<{ event_type: string }>;
  return {
    total_sent: events.filter((e) => e.event_type === "sent").length,
    delivered: events.filter((e) => e.event_type === "delivered").length,
    opened: events.filter((e) => e.event_type === "opened").length,
    clicked: events.filter((e) => e.event_type === "clicked").length,
    converted: events.filter((e) => e.event_type === "converted").length,
  };
}

// ---------------------------------------------------------------------------
// getRiskTransitions — recent risk level changes
// ---------------------------------------------------------------------------

export interface RiskTransition {
  id: string;
  customer_id: string;
  brand_id: string;
  from_level: string;
  to_level: string;
  detected_at: string;
  customer?: { display_name: string };
}

export async function getRiskTransitions(
  brandId?: string,
  limit = 50
): Promise<RiskTransition[]> {
  const sb = getServiceSupabase();

  let query = sb
    .from("customer_risk_events")
    .select(`
      *,
      customer:customers(display_name)
    `)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch risk transitions: ${error.message}`);
  }

  return (data ?? []).map((d: Record<string, unknown>) => ({
    ...(d as unknown as RiskTransition),
    customer: d.customer
      ? { display_name: (d.customer as { display_name: string }).display_name }
      : undefined,
  }));
}

// ---------------------------------------------------------------------------
// getChurnAlerts — notifications of type churn alert
// ---------------------------------------------------------------------------

export async function getChurnAlerts(limit = 50) {
  const sb = getServiceSupabase();

  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("type", "general")
    .not("data->alert_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch churn alerts: ${error.message}`);
  }

  return (data ?? []) as Array<{
    id: string;
    customer_id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
  }>;
}
