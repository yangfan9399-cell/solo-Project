import { handler } from './dist/server/entry.mjs';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(handler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
