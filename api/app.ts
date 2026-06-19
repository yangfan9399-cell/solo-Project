/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import fs from 'fs'
import authRoutes from './routes/auth.js'
import batchRoutes from './routes/batches.js'
import { initDatabase } from './db/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

let dbReady = false
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (!dbReady) {
    try {
      await initDatabase()
      dbReady = true
    } catch (e) {
      console.error('数据库初始化失败:', e)
      return next(e as Error)
    }
  }
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api', batchRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

const distPath = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  console.log('Serving frontend static files from:', distPath)
  app.use(express.static(distPath, { index: false }))
  app.get('*', (_req: Request, res: Response) => {
    const indexFile = path.join(distPath, 'index.html')
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile)
    } else {
      res.status(404).json({ success: false, error: 'Frontend not built' })
    }
  })
}

app.use((error: Error, req: Request, res: Response) => {
  console.error('Server Error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error: ' + (error.message || String(error)),
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
