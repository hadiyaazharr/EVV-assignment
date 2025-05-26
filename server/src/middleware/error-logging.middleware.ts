import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';

export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user,
    statusCode: err instanceof AppError ? err.statusCode : 500
  });
  next(err);
}; 