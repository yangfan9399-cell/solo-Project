import express from 'express'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { mockClaims, mockClaimDetails, mockSupplierSummary, mockCategorySummary, mockDefectTypeSummary, mockPeriodSummary, mockDashboardStats } from './api/mockData'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000

app.use(express.json())
app.use(express.static(join(__dirname, '../dist')))

app.get('/api/claims', async (_, res) => {
  try {
    res.json(mockClaims)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' })
  }
})

app.get('/api/claims/:id', async (req, res) => {
  try {
    const claim = mockClaimDetails[Number(req.params.id)]
    if (!claim) {
      res.status(404).json({ error: 'Claim not found' })
    } else {
      res.json(claim)
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' })
  }
})

app.post('/api/claims/:id', async (req, res) => {
  try {
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update claim' })
  }
})

app.get('/api/report/suppliers', async (_, res) => {
  try {
    res.json(mockSupplierSummary)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier summary' })
  }
})

app.get('/api/report/categories', async (_, res) => {
  try {
    res.json(mockCategorySummary)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category summary' })
  }
})

app.get('/api/report/defects', async (_, res) => {
  try {
    res.json(mockDefectTypeSummary)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch defect summary' })
  }
})

app.get('/api/report/periods', async (_, res) => {
  try {
    res.json(mockPeriodSummary)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch period summary' })
  }
})

app.get('/api/report/stats', async (_, res) => {
  try {
    res.json(mockDashboardStats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

app.use((_, res) => {
  res.sendFile(join(__dirname, '../dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
