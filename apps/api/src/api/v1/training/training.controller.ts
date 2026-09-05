import { Request, Response, NextFunction } from "express";
import * as trainingService from "./training.service";

export async function listModulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await trainingService.listModules(req.auth!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getModuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await trainingService.getModuleBySlug(req.params.slug, req.auth!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function markViewedHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await trainingService.markItemViewed(req.params.itemId, req.auth!.userId);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}
