-- AlterTable
ALTER TABLE "School" ADD COLUMN     "weeklyOffDays" INTEGER[] DEFAULT ARRAY[0]::INTEGER[];
