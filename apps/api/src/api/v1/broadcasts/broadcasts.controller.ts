import { Request, Response, NextFunction } from "express";
import * as broadcastsService from "./broadcasts.service";

export async function previewAudienceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await broadcastsService.previewAudience(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof broadcastsService.previewAudience>[1]
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function createBroadcastHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await broadcastsService.createBroadcast(
      req.auth!.schoolId!,
      req.auth!.userId,
      req.auth!.role,
      req.body
    );
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listBroadcastsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await broadcastsService.listBroadcasts(
      req.auth!.schoolId!,
      req.query as unknown as Parameters<typeof broadcastsService.listBroadcasts>[1]
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBroadcastHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await broadcastsService.getBroadcast(req.auth!.schoolId!, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
