"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useAuthStore } from "@/store/auth-store";
import { useStudentLedger } from "@/features/fees/use-fees";
import { RecordPaymentDialog } from "@/features/fees/record-payment-dialog";
import { NotifyFeeButton } from "@/features/fees/notify-fee-button";
import { formatMoney } from "@/lib/format";
import type { Invoice } from "@/types/fees";

export function StudentLedgerView({ studentId }: { studentId: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const canRecordPayment = role === "SCHOOL_ADMIN" || role === "ACCOUNTANT";
  const { data: invoices, isPending, isError, refetch } = useStudentLedger(studentId);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Couldn't load the fee ledger." onRetry={() => refetch()} />;
  }

  if (!invoices || invoices.length === 0) {
    return <EmptyState title="No invoices for this student yet" />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Amount Due</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-surface-border last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{invoice.feeCategory.name}</td>
                <td className="px-4 py-3 text-gray-600">{invoice.periodLabel}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                  {formatMoney(invoice.amountDue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                  {formatMoney(invoice.amountPaid)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                  {formatMoney(invoice.balance)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {canRecordPayment && invoice.status !== "PAID" && (
                    <div className="flex justify-end gap-1">
                      <NotifyFeeButton invoiceId={invoice.id} />
                      <Button variant="ghost" size="sm" onClick={() => setPayingInvoice(invoice)}>
                        Record Payment
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payingInvoice && (
        <RecordPaymentDialog invoice={payingInvoice} onClose={() => setPayingInvoice(null)} />
      )}
    </div>
  );
}
