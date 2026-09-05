"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api-client";
import { downloadImportTemplate, importCommit, importPreview } from "@/lib/api/students";
import { toastSuccess } from "@/store/toast-store";
import type { ImportCommitResult, ImportPreviewResult } from "@/types/students";

type Step = "upload" | "preview" | "done";

export default function BulkImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setParsing(true);
    try {
      const data = await importPreview(file);
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to read that CSV file");
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview) return;
    setCommitting(true);
    setError(null);
    try {
      const validRows = preview.rows.filter((r) => r.errors.length === 0).map((r) => r.data);
      const commitResult = await importCommit(validRows);
      setResult(commitResult);
      setStep("done");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toastSuccess(`${commitResult.created} student(s) imported`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setCommitting(false);
    }
  }

  function reset() {
    setStep("upload");
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Bulk Import Students</h1>
        <Button variant="secondary" size="sm" onClick={() => downloadImportTemplate()}>
          Download CSV template
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {step === "upload" && (
        <Card>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors ${
              dragOver ? "border-primary-400 bg-primary-50" : "border-gray-300"
            }`}
          >
            <p className="text-sm text-gray-600">
              {parsing ? "Reading file…" : "Drag and drop a CSV file here, or"}
            </p>
            {!parsing && (
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Choose file
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <p className="text-xs text-gray-400">
              Use the template above so column names match exactly.
            </p>
          </div>
        </Card>
      )}

      {step === "preview" && preview && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-600">
                <strong className="text-gray-900">{preview.summary.total}</strong> rows found
              </span>
              <span className="text-success-600">
                <strong>{preview.summary.valid}</strong> valid
              </span>
              {preview.summary.invalid > 0 && (
                <span className="text-danger-600">
                  <strong>{preview.summary.invalid}</strong> with errors (will be skipped)
                </span>
              )}
            </div>
          </Card>

          <div className="max-h-[28rem] overflow-auto rounded-lg border border-surface-border bg-surface">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-surface-border bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Row</th>
                  <th className="px-4 py-2">Roll No.</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Class</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-surface-border last:border-0">
                    <td className="px-4 py-2 tabular-nums text-gray-500">{row.rowNumber}</td>
                    <td className="px-4 py-2 tabular-nums text-gray-700">{row.data.rollNumber}</td>
                    <td className="px-4 py-2 text-gray-700">{row.data.fullName}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {row.data.className} {row.data.sectionName}
                    </td>
                    <td className="px-4 py-2">
                      {row.errors.length === 0 ? (
                        <StatusBadge status="VALID" />
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {row.errors.map((e, i) => (
                            <span key={i} className="text-xs text-danger-600">
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={reset} disabled={committing}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport} disabled={committing || preview.summary.valid === 0}>
              {committing ? "Importing…" : `Import ${preview.summary.valid} student(s)`}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <Card>
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold text-gray-900">
              {result.created} of {result.totalRows} student(s) imported
            </p>
            {result.failed.length > 0 && (
              <p className="text-sm text-danger-600">{result.failed.length} row(s) could not be imported.</p>
            )}
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={reset}>
                Import another file
              </Button>
              <Button onClick={() => router.push("/students")}>Go to Students</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
