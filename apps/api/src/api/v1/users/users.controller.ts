import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";

export async function listUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.listUsers(req.auth!.schoolId!);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.createUser(req.auth!.schoolId!, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.updateUserStatus(req.auth!.schoolId!, req.params.id, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.updateUser(req.auth!.schoolId!, req.params.id, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(req.auth!.schoolId!, req.params.id);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}
