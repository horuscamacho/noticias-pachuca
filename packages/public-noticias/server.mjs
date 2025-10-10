import { createServer } from 'node:http'
import server from './dist/server/server.js'

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

const httpServer = createServer(async (req, res) => {
  try {
    // Create a Request object from the Node.js request
    const url = new URL(req.url, `http://${req.headers.host}`)
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    })

    // Call the TanStack Start fetch handler
    const response = await server.fetch(request)

    // Write the response back to the Node.js response
    res.statusCode = response.status
    res.statusMessage = response.statusText

    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    // Handle streaming responses
    if (response.body) {
      const reader = response.body.getReader()
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (error) {
          console.error('Stream error:', error)
          res.end()
        }
      }
      await processStream()
    } else {
      res.end()
    }
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server listening on http://${HOST}:${PORT}`)
})

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down server...')
  httpServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
