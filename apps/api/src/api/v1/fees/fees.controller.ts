import { Request, Response, NextFunction } from "express";
import * as feesService from "./fees.service";

export async function listCategoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await feesService.listFeeCategories(req.auth!.schoolId!);
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await feesService.createFeeCategory(req.auth!.schoolId!, req.body);
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await feesService.updateFeeCategory(req.auth!.schoolId!, req.params.id, req.body);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function listStructureHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const structure = await feesService.listStructure(req.auth!.schoolId!);
    res.json({ data: structure });
  } catch (err) {
    next(err);
  }
}

export async function setStructureAmountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await feesService.setStructureAmount(req.auth!.schoolId!, req.body);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function generateInvoicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feesService.generateMonthlyInvoices(req.auth!.schoolId!, req.body.period);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listInvoicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feesService.listInvoices(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof feesService.listInvoices>[1]
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentLedgerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const ledger = await feesService.getStudentLedger(req.auth!.schoolId!, req.params.studentId);
    res.json({ data: ledger });
  } catch (err) {
    next(err);
  }
}

export async function recordPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await feesService.recordPayment(req.auth!.schoolId!, req.auth!.userId, req.body);
    res.status(201).json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function sendFeeReminderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feesService.sendFeeReminderNotification(
      req.auth!.schoolId!,
      req.auth!.userId,
      req.params.id
    );
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getDefaultersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const defaulters = await feesService.getDefaulters(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof feesService.getDefaulters>[1]
    );
    res.json({ data: defaulters });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await feesService.getFeeDashboard(req.auth!.schoolId!, req.query.period as string | undefined);
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
}
