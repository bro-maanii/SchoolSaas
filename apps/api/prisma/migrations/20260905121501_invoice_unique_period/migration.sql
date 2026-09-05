-- CreateIndex
CREATE UNIQUE INDEX "Invoice_studentId_feeCategoryId_periodLabel_key" ON "Invoice"("studentId", "feeCategoryId", "periodLabel");
