import { ReactNode } from "react";

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <p className="text-sm text-gray-500">{title}</p>
      {action}
    </div>
  );
}
