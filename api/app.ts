import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { seedData } from '../shared/seed.js';
import exceptionRoutes from './routes/exceptions.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

seedData();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/exceptions', exceptionRoutes);
app.use('/api/stats', statsRoutes);

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    });
  },
);

const distDir = path.resolve(__dirname, '..', 'dist');

if (existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get('*', (req: Request, res: Response): void => {
    const indexPath = path.join(distDir, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
      return;
    }
    res.status(404).send('Not found');
  });
}

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
});

export default app;
