"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCreateUser, useDeleteUser, useUpdateUser, useUpdateUserStatus, useUsers } from "@/features/users/use-users";
import { UserForm, type UserFormValues } from "@/features/users/user-form";
import { useAuthStore } from "@/store/auth-store";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import type { StaffUser } from "@/types/users";

const ROLE_LABEL: Record<string, string> = {
  SCHOOL_ADMIN: "School Admin",
  PRINCIPAL: "Principal",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
};

type FormTarget = { mode: "create" } | { mode: "edit"; user: StaffUser } | null;

export default function UsersRolesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "SCHOOL_ADMIN";

  const { data, isPending, isError, refetch } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; nextStatus: "ACTIVE" | "INACTIVE" } | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const atLimit = !!data && data.staffCount >= data.staffLimit;

  async function handleSubmit(values: UserFormValues) {
    if (!formTarget) return;
    try {
      if (formTarget.mode === "create") {
        await createUser.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role,
          assignments: values.role === "TEACHER" ? values.assignments : undefined,
        });
        toastSuccess(`${values.name.trim()} added as ${ROLE_LABEL[values.role]}`);
      } else {
        await updateUser.mutateAsync({
          id: formTarget.user.id,
          input: {
            name: values.name.trim(),
            email: values.email.trim(),
            password: values.password || undefined,
            role: values.role,
            assignments: values.role === "TEACHER" ? values.assignments : [],
          },
        });
        toastSuccess(`${values.name.trim()} updated`);
      }
      setFormTarget(null);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to save this account");
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) return;
    try {
      await updateStatus.mutateAsync({ id: statusTarget.id, status: statusTarget.nextStatus });
      toastSuccess(
        statusTarget.nextStatus === "ACTIVE" ? `${statusTarget.name} reactivated` : `${statusTarget.name} deactivated`
      );
      setStatusTarget(null);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to update account");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toastSuccess(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : "Failed to delete this account");
    }
  }

  const isFormOpen = formTarget !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users &amp; Roles</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.staffCount}/${data.staffLimit} staff accounts used` : "Staff accounts for this school"}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setFormTarget(isFormOpen ? null : { mode: "create" })}
            disabled={atLimit && !isFormOpen}
          >
            {isFormOpen ? "Cancel" : "Add User"}
          </Button>
        )}
      </div>

      {canManage && atLimit && !isFormOpen && (
        <div className="rounded-lg border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-600">
          This school has reached its limit of {data!.staffLimit} staff accounts. Deactivate one before adding another.
        </div>
      )}

      {canManage && formTarget && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>{formTarget.mode === "create" ? "Add a staff account" : `Edit ${formTarget.user.name}`}</CardTitle>
          </CardHeader>
          <UserForm
            key={formTarget.mode === "edit" ? formTarget.user.id : "create"}
            mode={formTarget.mode}
            user={formTarget.mode === "edit" ? formTarget.user : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setFormTarget(null)}
            pending={createUser.isPending || updateUser.isPending}
          />
        </Card>
      )}

      {isPending && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Couldn't load users." onRetry={() => refetch()} />}

      {!isPending && !isError && data && (
        <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned to</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-b border-surface-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.assignments.length > 0
                      ? u.assignments.map((a) => `${a.className} - ${a.sectionName}`).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {u.role !== "SCHOOL_ADMIN" && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setFormTarget({ mode: "edit", user: u })}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setStatusTarget({
                                id: u.id,
                                name: u.name,
                                nextStatus: u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              })
                            }
                          >
                            {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget({ id: u.id, name: u.name })}>
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.nextStatus === "ACTIVE" ? "Reactivate account?" : "Deactivate account?"}
        description={
          statusTarget?.nextStatus === "ACTIVE"
            ? `${statusTarget?.name} will be able to log in again.`
            : `${statusTarget?.name} will no longer be able to log in.`
        }
        confirmLabel={statusTarget?.nextStatus === "ACTIVE" ? "Reactivate" : "Deactivate"}
        destructive={statusTarget?.nextStatus !== "ACTIVE"}
        pending={updateStatus.isPending}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete account permanently?"
        description={`${deleteTarget?.name}'s account will be permanently removed — this can't be undone. Accounts with recorded payments, attendance, or messages can't be deleted this way; deactivate them instead.`}
        confirmLabel="Delete permanently"
        destructive
        pending={deleteUser.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
