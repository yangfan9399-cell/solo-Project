import express from 'express'
import path from 'path'

const app = express()
const port = process.env.PORT || 3000

app.use(express.static('dist'))
app.use(express.json())

app.get('/api/claims', async (req, res) => {
  const { getClaims } = await import('./api/claims')
  const claims = await getClaims()
  res.json(claims)
})

app.get('/api/claims/:id', async (req, res) => {
  const { getClaimById } = await import('./api/claims')
  const claim = await getClaimById(Number(req.params.id))
  res.json(claim)
})

app.post('/api/claims/:id', async (req, res) => {
  const { updateClaimStatus, addSupplierResponse } = await import('./api/claims')
  const { action, status, comment, operator, responseType, evidenceUrl } = req.body
  const id = Number(req.params.id)

  try {
    if (action === 'updateStatus') {
      await updateClaimStatus(id, status, comment, operator)
    } else if (action === 'supplierResponse') {
      await addSupplierResponse(id, responseType, comment, evidenceUrl || null)
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/report/suppliers', async (req, res) => {
  const { getSupplierSummary } = await import('./api/report')
  const result = await getSupplierSummary()
  res.json(result)
})

app.get('/api/report/categories', async (req, res) => {
  const { getCategorySummary } = await import('./api/report')
  const result = await getCategorySummary()
  res.json(result)
})

app.get('/api/report/defects', async (req, res) => {
  const { getDefectTypeSummary } = await import('./api/report')
  const result = await getDefectTypeSummary()
  res.json(result)
})

app.get('/api/report/periods', async (req, res) => {
  const { getPeriodSummary } = await import('./api/report')
  const result = await getPeriodSummary()
  res.json(result)
})

app.get('/api/report/stats', async (req, res) => {
  const { getDashboardStats } = await import('./api/report')
  const result = await getDashboardStats()
  res.json(result)
})

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
