"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRecordPayment } from "@/features/fees/use-fees";
import { toastError, toastSuccess } from "@/store/toast-store";
import { ApiError } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";
import type { Invoice, PaymentMethod } from "@/types/fees";

export function RecordPaymentDialog({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(invoice.balance));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [error, setError] = useState<string | null>(null);
  const recordPayment = useRecordPayment();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (parsed > invoice.balance) {
      setError(`Amount exceeds the outstanding balance of ${formatMoney(invoice.balance)}`);
      return;
    }
    try {
      await recordPayment.mutateAsync({ invoiceId: invoice.id, amount: parsed, method });
      toastSuccess(`Payment of ${formatMoney(parsed)} recorded for ${invoice.student.fullName}`);
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to record payment";
      setError(message);
      toastError(message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-gray-900">Record Payment</h2>
        <p className="mt-1 text-sm text-gray-500">
          {invoice.student.fullName} · {invoice.feeCategory.name} ({invoice.periodLabel})
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Outstanding: <span className="font-medium text-gray-900">{formatMoney(invoice.balance)}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div>
            <Label htmlFor="payment-amount">Amount received</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={invoice.balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="payment-method">Method</Label>
            <Select id="payment-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank transfer</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          {error && <FieldError>{error}</FieldError>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={recordPayment.isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? "Recording…" : "Record Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
