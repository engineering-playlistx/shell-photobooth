import { createMiddleware } from '@tanstack/react-start'

const isProduction = process.env.NODE_ENV === 'production'

function logRequest(data: {
  timestamp: string
  method: string
  pathname: string
  ip: string
  userAgent: string
  status?: number
  duration?: number
  error?: string
}) {
  if (isProduction) {
    console.log(JSON.stringify(data))
  } else {
    const {
      timestamp,
      method,
      pathname,
      ip,
      userAgent,
      status,
      duration,
      error,
    } = data
    if (error) {
      console.error(
        `[${timestamp}] ${method} ${pathname} - ERROR - ${duration}ms`,
        error,
      )
    } else if (status !== undefined && duration !== undefined) {
      console.log(
        `[${timestamp}] ${method} ${pathname} - ${status} - ${duration}ms`,
      )
    } else {
      console.log(
        `[${timestamp}] ${method} ${pathname} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}`,
      )
    }
  }
}

export const loggingMiddleware = createMiddleware().server(
  async ({ request, next }) => {
    const startTime = Date.now()
    const method = request.method
    const url = new URL(request.url)
    const pathname = url.pathname
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const timestamp = new Date().toISOString()

    logRequest({
      timestamp,
      method,
      pathname,
      ip,
      userAgent,
    })

    try {
      const result = await next()
      const duration = Date.now() - startTime
      const status = result.response.status || 200

      logRequest({
        timestamp,
        method,
        pathname,
        ip,
        userAgent,
        status,
        duration,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      logRequest({
        timestamp,
        method,
        pathname,
        ip,
        userAgent,
        duration,
        error: errorMessage,
      })

      throw error
    }
  },
)
