import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "@/middleware/auth.middleware";
import { tenantMiddleware } from "@/middleware/tenant.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validateBody, validateQuery } from "@/middleware/validate.middleware";
import { createStudentSchema, listStudentsQuerySchema, updateStudentSchema } from "./students.validation";
import {
  createStudentHandler,
  deactivateStudentHandler,
  getStudentHandler,
  listStudentsHandler,
  updateStudentHandler,
} from "./students.controller";
import { csvTemplateHandler, importCommitHandler, importPreviewHandler } from "./students.import.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    if (isCsv) {
      cb(null, true);
    } else {
      cb(new Error("Only .csv files are accepted"));
    }
  },
});

export const studentsRouter = Router();

studentsRouter.use(authMiddleware, tenantMiddleware);

// Import routes first — "/import/*" would otherwise be captured by "/:id".
studentsRouter.get("/import/template", requireRole(["SCHOOL_ADMIN"]), csvTemplateHandler);
studentsRouter.post(
  "/import/preview",
  requireRole(["SCHOOL_ADMIN"]),
  upload.single("file"),
  importPreviewHandler
);
studentsRouter.post("/import/commit", requireRole(["SCHOOL_ADMIN"]), importCommitHandler);

studentsRouter.get("/", validateQuery(listStudentsQuerySchema), listStudentsHandler);
studentsRouter.post(
  "/",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(createStudentSchema),
  createStudentHandler
);
studentsRouter.get("/:id", getStudentHandler);
studentsRouter.patch(
  "/:id",
  requireRole(["SCHOOL_ADMIN"]),
  validateBody(updateStudentSchema),
  updateStudentHandler
);
studentsRouter.delete("/:id", requireRole(["SCHOOL_ADMIN"]), deactivateStudentHandler);
