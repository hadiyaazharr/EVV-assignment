import morgan from 'morgan';
import { StreamOptions } from 'morgan';
import { Request, Response } from 'express';

// Custom token for request body (excluding sensitive data)
morgan.token('body', (req: Request) => {
  const body = { ...req.body };
  // Remove sensitive data
  if (body.password) delete body.password;
  if (body.token) delete body.token;
  return JSON.stringify(body);
});

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req: Request, res: Response) => {
  if (!res._header || !req._startAt) return '';
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom format
const format = ':remote-addr - :method :url :status :response-time-ms ms - :res[content-length] bytes - :body';

// Stream configuration
const stream: StreamOptions = {
  write: (message: string) => {
    console.log(message.trim());
  },
};

// Create the middleware
export const requestLogger = morgan(format, { stream }); 