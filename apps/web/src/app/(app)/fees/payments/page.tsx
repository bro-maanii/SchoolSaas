"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StudentPicker } from "@/features/fees/student-picker";
import { RecordPaymentDialog } from "@/features/fees/record-payment-dialog";
import { useStudentLedger } from "@/features/fees/use-fees";
import { formatMoney } from "@/lib/format";
import type { Invoice } from "@/types/fees";

export default function RecordPaymentPage() {
  const [student, setStudent] = useState<{ id: string; fullName: string; rollNumber: string; className: string } | null>(
    null
  );
  const { data: invoices, isPending, isError, refetch } = useStudentLedger(student?.id);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  const outstanding = (invoices ?? []).filter((inv) => inv.status !== "PAID");

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Record Payment</h1>

      <Card>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Find a student</label>
        <StudentPicker
          onSelect={(s) => {
            setStudent(s);
          }}
        />
      </Card>

      {!student && <EmptyState title="Search for a student above to record a payment" />}

      {student && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            {student.fullName} <span className="font-normal text-gray-500">· {student.className}</span>
          </h2>

          {isPending && <Skeleton className="h-32 w-full" />}
          {isError && <ErrorState message="Couldn't load invoices." onRetry={() => refetch()} />}

          {!isPending && !isError && outstanding.length === 0 && (
            <EmptyState title="This student has no outstanding invoices 🎉" />
          )}

          {!isPending && !isError && outstanding.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {outstanding.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-surface-border last:border-0">
                      <td className="px-4 py-3 text-gray-900">{invoice.feeCategory.name}</td>
                      <td className="px-4 py-3 text-gray-600">{invoice.periodLabel}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                        {formatMoney(invoice.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => setPayingInvoice(invoice)}>
                          Record Payment
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {payingInvoice && <RecordPaymentDialog invoice={payingInvoice} onClose={() => setPayingInvoice(null)} />}
    </div>
  );
}
