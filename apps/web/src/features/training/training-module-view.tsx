"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useMarkItemViewed, useTrainingModule } from "@/features/training/use-training";
import type { TrainingItem } from "@/types/training";

function VideoItem({ item }: { item: TrainingItem }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">{item.title}</p>
      <video controls className="w-full rounded-lg border border-surface-border bg-black" src={item.content} />
    </div>
  );
}

function TextItem({ item }: { item: TrainingItem }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">{item.title}</p>
      <p className="whitespace-pre-line text-sm text-gray-600">{item.content}</p>
    </div>
  );
}

function FaqItem({ item }: { item: TrainingItem }) {
  return (
    <details className="group rounded-lg border border-surface-border px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-gray-900 marker:content-none">
        <span className="mr-2 inline-block text-gray-400 transition-transform group-open:rotate-90">›</span>
        {item.title}
      </summary>
      <p className="mt-2 pl-5 text-sm text-gray-600">{item.content}</p>
    </details>
  );
}

export function TrainingModuleView({ slug }: { slug: string }) {
  const { data: trainingModule, isPending, isError, refetch } = useTrainingModule(slug);
  const markViewed = useMarkItemViewed();
  const markedRef = useRef(false);

  // "Marked viewed automatically on open" (Section 14 of the plan) — fire
  // once per item the first time this module's data loads, not on every
  // refetch/re-render.
  useEffect(() => {
    if (markedRef.current || !trainingModule) return;
    markedRef.current = true;
    trainingModule.items.filter((i) => !i.viewed).forEach((i) => markViewed.mutate(i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingModule?.id]);

  return (
    <div className="space-y-6">
      <Link href="/training" className="text-sm text-primary-600 hover:underline">
        ← Training Center
      </Link>

      {isPending && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-56 w-full" />
        </div>
      )}

      {isError && <ErrorState message="Couldn't load this training topic." onRetry={() => refetch()} />}

      {!isPending && !isError && trainingModule && (
        <>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{trainingModule.title}</h1>
            {trainingModule.description && <p className="mt-1 text-sm text-gray-500">{trainingModule.description}</p>}
          </div>

          {trainingModule.items
            .filter((i) => i.type === "VIDEO")
            .map((item) => (
              <Card key={item.id}>
                <VideoItem item={item} />
              </Card>
            ))}

          {trainingModule.items
            .filter((i) => i.type === "TEXT")
            .map((item) => (
              <Card key={item.id}>
                <TextItem item={item} />
              </Card>
            ))}

          {trainingModule.items.some((i) => i.type === "FAQ") && (
            <Card>
              <CardHeader>
                <CardTitle>Frequently asked questions</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {trainingModule.items
                  .filter((i) => i.type === "FAQ")
                  .map((item) => (
                    <FaqItem key={item.id} item={item} />
                  ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
