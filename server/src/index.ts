import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { setupDatabase } from './config/database.ts';
import { errorHandler } from './middleware/error.middleware.ts';
import { requestLogger } from './middleware/logging.middleware.ts';
import { errorLogger } from './middleware/error-logging.middleware.ts';
import { swaggerSpec } from './config/swagger.ts';
import router from './routes/index.ts';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize database
setupDatabase();

// Routes
app.use('/api', router);

// Error handling
app.use(errorLogger);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
}); 