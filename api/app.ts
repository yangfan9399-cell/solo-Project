import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import anomalyRoutes from './routes/anomalies.js'
import retestRoutes from './routes/retests.js'
import ruleRoutes from './routes/rules.js'
import transitionRoutes from './routes/transitions.js'
import auditRoutes from './routes/audits.js'
import seedRoutes from './routes/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/anomalies', anomalyRoutes)
app.use('/api/retests', retestRoutes)
app.use('/api/rules', ruleRoutes)
app.use('/api/transitions', transitionRoutes)
app.use('/api/audits', auditRoutes)
app.use('/api/seed', seedRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
