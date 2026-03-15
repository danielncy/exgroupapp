"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCampaigns,
  createCampaign,
  getSegments,
  getCampaignStats,
} from "@ex-group/db";
import type { Campaign, Segment, CampaignStats, CreateCampaignInput } from "@ex-group/db";

const CHANNEL_LABELS: Record<string, string> = {
  push: "Push Notification",
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsMap, setStatsMap] = useState<Record<string, CampaignStats>>({});

  // Form state
  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [channel, setChannel] = useState<CreateCampaignInput["channel"]>("push");
  const [messageTemplate, setMessageTemplate] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [campaignsData, segmentsData] = await Promise.all([
        getCampaigns(),
        getSegments(),
      ]);
      setCampaigns(campaignsData);
      setSegments(segmentsData);

      // Load stats for sent/completed campaigns
      const stats: Record<string, CampaignStats> = {};
      for (const c of campaignsData) {
        if (c.status === "sent" || c.status === "completed") {
          try {
            stats[c.id] = await getCampaignStats(c.id);
          } catch {
            /* skip */
          }
        }
      }
      setStatsMap(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreate() {
    if (!name.trim() || !messageTemplate.trim()) {
      setError("Name and message template are required");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createCampaign({
        name: name.trim(),
        segment_id: segmentId || undefined,
        channel,
        message_template: messageTemplate.trim(),
      });
      setShowCreate(false);
      setName("");
      setSegmentId("");
      setChannel("push");
      setMessageTemplate("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage marketing campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showCreate ? "Cancel" : "New Campaign"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            New Campaign
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Win-back March 2026"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Target Segment
                </label>
                <select
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">All customers</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.member_count ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) =>
                    setChannel(e.target.value as CreateCampaignInput["channel"])
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Message Template
              </label>
              <textarea
                rows={3}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Hi {{name}}, we miss you! Book your next appointment and get 20% off..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const stats = statsMap[campaign.id];
          return (
            <div
              key={campaign.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {campaign.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {CHANNEL_LABELS[campaign.channel] ?? campaign.channel}
                    </span>
                    {campaign.segment && (
                      <span className="text-xs text-slate-500">
                        Target: {campaign.segment.name}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(campaign.created_at).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {campaign.message_template && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                  {campaign.message_template}
                </p>
              )}

              {stats && (
                <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">
                    Sent: <strong>{stats.total_sent}</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Delivered: <strong>{stats.delivered}</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Opened: <strong>{stats.opened}</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Clicked: <strong>{stats.clicked}</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Converted: <strong>{stats.converted}</strong>
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {campaigns.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              No campaigns yet. Create your first campaign to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
