"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useTrainingModules } from "@/features/training/use-training";

export default function TrainingHomePage() {
  const [query, setQuery] = useState("");
  const { data: modules, isPending, isError, refetch } = useTrainingModules();

  const filtered = modules?.filter((m) => {
    const haystack = `${m.title} ${m.description ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Training Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Short videos, step-by-step guides, and FAQs for every part of the system — organized to match the sidebar.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search training topics…"
        className="h-10 w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
      />

      {isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load the Training Center." onRetry={() => refetch()} />}

      {!isPending && !isError && filtered && filtered.length === 0 && (
        <EmptyState title={query ? `No topics match "${query}".` : "No training content yet."} />
      )}

      {!isPending && !isError && filtered && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <Link key={m.id} href={`/training/${m.slug}`} className="block">
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900">{m.title}</h2>
                  <Badge tone={m.viewedCount >= m.itemCount ? "success" : "neutral"}>
                    {m.viewedCount}/{m.itemCount} viewed
                  </Badge>
                </div>
                {m.description && <p className="mt-2 text-sm text-gray-500">{m.description}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
