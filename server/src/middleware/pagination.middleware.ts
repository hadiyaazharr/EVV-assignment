import { Request, Response, NextFunction } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

declare global {
  namespace Express {
    interface Request {
      pagination?: Pagination;
    }
  }
}

export const paginationMiddleware = (defaultLimit = 10, maxLimit = 100) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  let limit = parseInt(req.query.limit as string) || defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

  req.pagination = { page, limit, skip, sortBy, sortOrder };
  next();
}; 