import { createMiddleware } from '@tanstack/react-start'

interface CorsOptions {
  origin?:
    | string
    | Array<string>
    | ((origin: string | null) => boolean | string | null)
  methods?: Array<string>
  allowedHeaders?: Array<string>
  exposedHeaders?: Array<string>
  credentials?: boolean
  maxAge?: number
}

function getAllowedOrigin(
  requestOrigin: string | null,
  allowedOrigins:
    | string
    | Array<string>
    | ((origin: string | null) => boolean | string | null)
    | undefined,
  credentials: boolean,
): string | null {
  if (!requestOrigin) {
    return null
  }

  if (!allowedOrigins) {
    return requestOrigin
  }

  if (typeof allowedOrigins === 'function') {
    const result = allowedOrigins(requestOrigin)
    return typeof result === 'boolean'
      ? result
        ? requestOrigin
        : null
      : result
  }

  if (typeof allowedOrigins === 'string') {
    if (allowedOrigins === '*') {
      return credentials ? requestOrigin : '*'
    }
    return allowedOrigins === requestOrigin ? requestOrigin : null
  }

  if (Array.isArray(allowedOrigins)) {
    if (allowedOrigins.includes('*')) {
      return credentials ? requestOrigin : '*'
    }
    return allowedOrigins.includes(requestOrigin) ? requestOrigin : null
  }

  return null
}

export function createCorsMiddleware(options: CorsOptions = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options

  return createMiddleware().server(async ({ request, next }) => {
    const requestOrigin = request.headers.get('origin')
    const allowedOrigin = getAllowedOrigin(requestOrigin, origin, credentials)

    const result = await next()

    if (request.method === 'OPTIONS') {
      const headers = new Headers(result.response.headers)

      if (allowedOrigin) {
        headers.set('Access-Control-Allow-Origin', allowedOrigin)
      }

      if (credentials && allowedOrigin) {
        headers.set('Access-Control-Allow-Credentials', 'true')
      }

      headers.set('Access-Control-Allow-Methods', methods.join(', '))
      headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
      headers.set('Access-Control-Max-Age', maxAge.toString())

      if (exposedHeaders.length > 0) {
        headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '))
      }

      return {
        ...result,
        response: new Response(null, { status: 204, headers }),
      }
    }

    if (allowedOrigin) {
      result.response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    }

    if (credentials && allowedOrigin) {
      result.response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    if (exposedHeaders.length > 0) {
      result.response.headers.set(
        'Access-Control-Expose-Headers',
        exposedHeaders.join(', '),
      )
    }

    return result
  })
}

export const corsMiddleware = createCorsMiddleware({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
})
