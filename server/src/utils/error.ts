export interface ValidationError {
  path: string;
  message: string;
  code?: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: ValidationError[]
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: ValidationError[]) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Forbidden') {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Not found') {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }
} 