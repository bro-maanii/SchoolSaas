"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useClasses } from "@/features/classes/use-classes";
import {
  useCreateFeeCategory,
  useFeeCategories,
  useFeeStructure,
  useSetStructureAmount,
} from "@/features/fees/use-fees";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import type { FeeCategoryType } from "@/types/fees";

const TYPE_LABELS: Record<FeeCategoryType, string> = {
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
  ADMISSION: "Admission",
  OTHER: "Other",
};

export default function FeeStructurePage() {
  const { data: classes } = useClasses();
  const { data: categories, isPending: categoriesPending, isError: categoriesError, refetch: refetchCategories } =
    useFeeCategories();
  const { data: structure, isPending: structurePending, isError: structureError, refetch: refetchStructure } =
    useFeeStructure();

  const createCategory = useCreateFeeCategory();
  const setAmount = useSetStructureAmount();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<FeeCategoryType>("MONTHLY");
  const [addingCategory, setAddingCategory] = useState(false);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategory.mutateAsync({ name: newCategoryName.trim(), type: newCategoryType });
      setNewCategoryName("");
      setAddingCategory(false);
      toastSuccess(`Fee category "${newCategoryName.trim()}" created`);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to create fee category");
    }
  }

  const amountByCell = new Map<string, number>();
  structure?.items.forEach((item) => {
    amountByCell.set(`${item.classId}::${item.feeCategoryId}`, item.amount);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Fee Structure</h1>
        {structure?.academicYear && (
          <Badge tone="neutral">Academic year {structure.academicYear.label}</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee categories</CardTitle>
        </CardHeader>

        {categoriesPending && <Skeleton className="h-10 w-full" />}
        {categoriesError && <ErrorState message="Couldn't load fee categories." onRetry={() => refetchCategories()} />}

        {!categoriesPending && !categoriesError && (
          <div className="space-y-3">
            {categories && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700"
                  >
                    {c.name}
                    <Badge tone="neutral">{TYPE_LABELS[c.type]}</Badge>
                  </span>
                ))}
              </div>
            )}

            {addingCategory ? (
              <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
                  <Input
                    autoFocus
                    placeholder="e.g. Monthly Tuition"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-56"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Type</label>
                  <Select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value as FeeCategoryType)}
                    className="w-40"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="ADMISSION">Admission</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
                <Button type="submit" disabled={createCategory.isPending || !newCategoryName.trim()}>
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAddingCategory(false)}>
                  Cancel
                </Button>
              </form>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setAddingCategory(true)}>
                + Add fee category
              </Button>
            )}

            {(!categories || categories.length === 0) && !addingCategory && (
              <EmptyState title="No fee categories yet — add your first category above" />
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amount per class</CardTitle>
        </CardHeader>

        {structurePending && <Skeleton className="h-40 w-full" />}
        {structureError && <ErrorState message="Couldn't load the fee structure." onRetry={() => refetchStructure()} />}

        {!structurePending && !structureError && (!classes || classes.length === 0) && (
          <EmptyState title="Add a class first in Classes & Sections" />
        )}

        {!structurePending && !structureError && (!categories || categories.length === 0) && classes && classes.length > 0 && (
          <p className="text-sm text-gray-500">Add a fee category above to start setting amounts.</p>
        )}

        {!structurePending &&
          !structureError &&
          classes &&
          classes.length > 0 &&
          categories &&
          categories.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-left text-xs font-medium uppercase text-gray-500">
                    <th className="py-2 pr-4">Class</th>
                    {categories.map((c) => (
                      <th key={c.id} className="py-2 pr-4">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="border-b border-surface-border last:border-0">
                      <td className="py-2 pr-4 font-medium text-gray-900">{cls.name}</td>
                      {categories.map((cat) => (
                        <AmountCell
                          key={cat.id}
                          classId={cls.id}
                          categoryId={cat.id}
                          value={amountByCell.get(`${cls.id}::${cat.id}`)}
                          onSave={(amount) => {
                            setAmount.mutate(
                              { classId: cls.id, feeCategoryId: cat.id, amount },
                              {
                                onError: (err) =>
                                  toastError(err instanceof ApiError ? err.message : "Failed to set amount"),
                              }
                            );
                          }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}

function AmountCell({
  value,
  onSave,
}: {
  classId: string;
  categoryId: string;
  value: number | undefined;
  onSave: (amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value !== undefined ? String(value) : "");

  if (editing) {
    return (
      <td className="py-1 pr-4">
        <Input
          autoFocus
          type="number"
          min="0.01"
          step="0.01"
          value={draft}
          className="h-8 w-28"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            const parsed = Number(draft);
            if (parsed > 0 && parsed !== value) onSave(parsed);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </td>
    );
  }

  return (
    <td className="py-2 pr-4">
      <button
        type="button"
        onClick={() => {
          setDraft(value !== undefined ? String(value) : "");
          setEditing(true);
        }}
        className="rounded px-2 py-1 tabular-nums text-gray-700 hover:bg-gray-100"
      >
        {value !== undefined ? value.toLocaleString() : <span className="text-gray-400">Set amount</span>}
      </button>
    </td>
  );
}
