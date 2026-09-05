import { Request, Response, NextFunction } from "express";
import * as notificationsService from "./notifications.service";

export async function getLogHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.getLog(
      req.auth!.schoolId!,
      req.auth!.role,
      req.query as unknown as Parameters<typeof notificationsService.getLog>[2]
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listTemplatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await notificationsService.listTemplates(req.auth!.schoolId!);
    res.json({ data: templates });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await notificationsService.updateTemplate(req.auth!.schoolId!, req.params.id, req.body);
    res.json({ data: template });
  } catch (err) {
    next(err);
  }
}

export async function listRulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await notificationsService.listRules(req.auth!.schoolId!);
    res.json({ data: rules });
  } catch (err) {
    next(err);
  }
}

export async function updateRuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await notificationsService.updateRule(
      req.auth!.schoolId!,
      req.params.triggerType,
      req.body
    );
    res.json({ data: rule });
  } catch (err) {
    next(err);
  }
}
