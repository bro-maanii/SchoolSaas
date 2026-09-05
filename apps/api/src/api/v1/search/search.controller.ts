import { Request, Response, NextFunction } from "express";
import * as searchService from "./search.service";

export async function searchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as unknown as { q: string };
    const result = await searchService.search(req.auth!.schoolId!, req.auth!.role, req.auth!.userId, q);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
