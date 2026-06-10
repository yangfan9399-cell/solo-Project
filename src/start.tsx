import { createServer } from 'http'
import { createStartHandler } from '@tanstack/start-server-core'
import { getRouter } from '@/router'

const router = getRouter()

const startHandler = createStartHandler({ router })

const server = createServer(async (req, res) => {
  try {
    const response = await startHandler({
      url: req.url || '/',
      method: req.method || 'GET',
      headers: req.headers as Record<string, string>,
    })
    
    res.statusCode = response.statusCode || 200
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        res.setHeader(key, value)
      }
    }
    res.end(response.body)
  } catch (error) {
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
