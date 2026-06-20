import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { uyapRoutes } from './routes/uyap/index.js'
import { whatsappRoutes } from './routes/whatsapp/index.js'
import { gmailRoutes } from './routes/gmail/index.js'
import { startCronJobs } from './jobs/cron.js'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: [process.env.WEB_URL ?? 'http://localhost:3000'],
  credentials: true,
})

await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

await app.register(uyapRoutes, { prefix: '/uyap' })
await app.register(whatsappRoutes, { prefix: '/whatsapp' })
await app.register(gmailRoutes, { prefix: '/gmail' })

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
startCronJobs()
