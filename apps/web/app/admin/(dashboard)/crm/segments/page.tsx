"use client";

import { useEffect, useState, useCallback } from "react";
import { getSegments, getSegmentMembers } from "@ex-group/db";
import type { Segment } from "@ex-group/db";

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [members, setMembers] = useState<
    Array<{ customer_id: string; display_name: string; phone: string; entered_at: string }>
  >([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadSegments = useCallback(async () => {
    try {
      const data = await getSegments();
      setSegments(data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  async function handleViewMembers(segmentId: string) {
    if (selectedSegment === segmentId) {
      setSelectedSegment(null);
      setMembers([]);
      return;
    }

    setSelectedSegment(segmentId);
    setMembersLoading(true);
    try {
      const data = await getSegmentMembers(segmentId);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Customer Segments</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage customer segments
        </p>
      </div>

      <div className="space-y-4">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {seg.name}
                </h3>
                <p className="text-xs text-slate-500">{seg.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {seg.member_count ?? 0} members
                </span>
                {seg.is_dynamic && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                    Dynamic
                  </span>
                )}
                <button
                  onClick={() => void handleViewMembers(seg.id)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {selectedSegment === seg.id ? "Hide" : "View Members"}
                </button>
              </div>
            </div>

            {/* Criteria */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
              <p className="text-xs text-slate-500">
                Criteria: {JSON.stringify(seg.criteria)}
              </p>
            </div>

            {/* Members list */}
            {selectedSegment === seg.id && (
              <div className="border-t border-slate-200 p-4">
                {membersLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">
                    No members in this segment
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {members.map((m) => (
                      <div
                        key={m.customer_id}
                        className="flex items-center justify-between py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {m.display_name}
                          </p>
                          <p className="text-xs text-slate-500">{m.phone}</p>
                        </div>
                        <p className="text-xs text-slate-400">
                          Since{" "}
                          {new Date(m.entered_at).toLocaleDateString("en-SG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {segments.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">No segments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
