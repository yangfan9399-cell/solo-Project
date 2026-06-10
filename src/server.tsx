import express from 'express'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getClaims, getClaimById, updateClaimStatus, addSupplierResponse } from './api/claims'
import { getSupplierSummary, getCategorySummary, getDefectTypeSummary, getPeriodSummary, getDashboardStats } from './api/report'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000

app.use(express.json())
app.use(express.static(join(__dirname, '../dist')))

app.get('/api/claims', async (_, res) => {
  try {
    const claims = await getClaims()
    res.json(claims)
  } catch (error) {
    console.error('Failed to fetch claims:', error)
    res.status(500).json({ error: 'Failed to fetch claims' })
  }
})

app.get('/api/claims/:id', async (req, res) => {
  try {
    const claim = await getClaimById(Number(req.params.id))
    if (!claim) {
      res.status(404).json({ error: 'Claim not found' })
    } else {
      res.json(claim)
    }
  } catch (error) {
    console.error('Failed to fetch claim:', error)
    res.status(500).json({ error: 'Failed to fetch claim' })
  }
})

app.post('/api/claims/:id', async (req, res) => {
  try {
    const { action, status, comment, operator, responseType, evidenceUrl } = req.body
    const id = Number(req.params.id)

    if (action === 'updateStatus') {
      await updateClaimStatus(id, status, comment, operator)
    } else if (action === 'supplierResponse') {
      await addSupplierResponse(id, responseType, comment, evidenceUrl || null)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Failed to update claim:', error)
    res.status(500).json({ error: 'Failed to update claim' })
  }
})

app.get('/api/report/suppliers', async (_, res) => {
  try {
    const data = await getSupplierSummary()
    res.json(data)
  } catch (error) {
    console.error('Failed to fetch supplier summary:', error)
    res.status(500).json({ error: 'Failed to fetch supplier summary' })
  }
})

app.get('/api/report/categories', async (_, res) => {
  try {
    const data = await getCategorySummary()
    res.json(data)
  } catch (error) {
    console.error('Failed to fetch category summary:', error)
    res.status(500).json({ error: 'Failed to fetch category summary' })
  }
})

app.get('/api/report/defects', async (_, res) => {
  try {
    const data = await getDefectTypeSummary()
    res.json(data)
  } catch (error) {
    console.error('Failed to fetch defect summary:', error)
    res.status(500).json({ error: 'Failed to fetch defect summary' })
  }
})

app.get('/api/report/periods', async (_, res) => {
  try {
    const data = await getPeriodSummary()
    res.json(data)
  } catch (error) {
    console.error('Failed to fetch period summary:', error)
    res.status(500).json({ error: 'Failed to fetch period summary' })
  }
})

app.get('/api/report/stats', async (_, res) => {
  try {
    const data = await getDashboardStats()
    res.json(data)
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

app.use((_, res) => {
  res.sendFile(join(__dirname, '../dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
