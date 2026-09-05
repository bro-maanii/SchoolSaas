"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import {
  useClasses,
  useCreateClass,
  useCreateSection,
  useUpdateClass,
  useUpdateSection,
} from "@/features/classes/use-classes";
import type { ClassRecord } from "@/types/students";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export default function ClassesAndSectionsPage() {
  const { data: classes, isPending, isError, refetch } = useClasses();
  const createClass = useCreateClass();
  const [newClassName, setNewClassName] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<{ type: "class" | "section"; classId: string; sectionId?: string; name: string } | null>(
    null
  );
  const updateClass = useUpdateClass();
  const updateSection = useUpdateSection();

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await createClass.mutateAsync({ name: newClassName.trim() });
      setNewClassName("");
      toastSuccess(`Class "${newClassName.trim()}" created`);
    } catch (err) {
      toastError(errorMessage(err, "Failed to create class"));
    }
  }

  async function handleArchiveConfirm() {
    if (!archiveTarget) return;
    try {
      if (archiveTarget.type === "class") {
        await updateClass.mutateAsync({ classId: archiveTarget.classId, input: { isArchived: true } });
      } else {
        await updateSection.mutateAsync({
          classId: archiveTarget.classId,
          sectionId: archiveTarget.sectionId!,
          input: { isArchived: true },
        });
      }
      toastSuccess(`"${archiveTarget.name}" archived`);
      setArchiveTarget(null);
    } catch (err) {
      toastError(errorMessage(err, "Failed to archive"));
      setArchiveTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Classes & Sections</h1>
      </div>

      <Card>
        <form onSubmit={handleCreateClass} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="new-class">
              Add a class
            </label>
            <Input
              id="new-class"
              placeholder="e.g. Class 5"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={createClass.isPending || !newClassName.trim()}>
            {createClass.isPending ? "Adding…" : "Add Class"}
          </Button>
        </form>
      </Card>

      {isPending && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load classes." onRetry={() => refetch()} />}

      {!isPending && !isError && classes && classes.length === 0 && (
        <EmptyState title="No classes yet — add your first class above" />
      )}

      {!isPending && !isError && classes && classes.length > 0 && (
        <div className="space-y-4">
          {classes.map((cls) => (
            <ClassRow
              key={cls.id}
              cls={cls}
              onRename={(name) => updateClass.mutate({ classId: cls.id, input: { name } })}
              onArchive={() => setArchiveTarget({ type: "class", classId: cls.id, name: cls.name })}
              onArchiveSection={(sectionId, name) =>
                setArchiveTarget({ type: "section", classId: cls.id, sectionId, name })
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={archiveTarget !== null}
        title={`Archive "${archiveTarget?.name}"?`}
        description={
          archiveTarget?.type === "class"
            ? "This hides the class and all its sections from active pickers. Existing students, attendance, and fee history are kept."
            : "This hides the section from active pickers. Existing students and history are kept."
        }
        confirmLabel="Archive"
        pending={updateClass.isPending || updateSection.isPending}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}

function ClassRow({
  cls,
  onRename,
  onArchive,
  onArchiveSection,
}: {
  cls: ClassRecord;
  onRename: (name: string) => void;
  onArchive: () => void;
  onArchiveSection: (sectionId: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cls.name);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const createSection = useCreateSection();

  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionName.trim()) return;
    try {
      await createSection.mutateAsync({ classId: cls.id, input: { name: sectionName.trim() } });
      setSectionName("");
      setAddingSection(false);
    } catch (err) {
      toastError(errorMessage(err, "Failed to add section"));
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-gray-400">{expanded ? "▾" : "▸"}</span>
          {editing ? (
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => {
                setEditing(false);
                if (name.trim() && name.trim() !== cls.name) onRename(name.trim());
              }}
              className="h-8 w-48"
            />
          ) : (
            <span className="font-medium text-gray-900">{cls.name}</span>
          )}
          <Badge tone="neutral">{cls._count?.students ?? 0} students</Badge>
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            Rename
          </Button>
          <Button variant="destructive" size="sm" onClick={onArchive}>
            Archive
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2 border-t border-surface-border pt-4">
          {cls.sections.length === 0 && (
            <p className="text-sm text-gray-500">No sections yet.</p>
          )}
          {cls.sections.map((section) => (
            <div key={section.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-700">Section {section.name}</span>
              <Button variant="ghost" size="sm" onClick={() => onArchiveSection(section.id, `${cls.name} - ${section.name}`)}>
                Archive
              </Button>
            </div>
          ))}

          {addingSection ? (
            <form onSubmit={handleAddSection} className="flex items-center gap-2 pt-1">
              <Input
                autoFocus
                placeholder="e.g. A"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="h-8 w-32"
              />
              <Button type="submit" size="sm" disabled={createSection.isPending || !sectionName.trim()}>
                Add
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setAddingSection(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setAddingSection(true)}>
              + Add section
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
