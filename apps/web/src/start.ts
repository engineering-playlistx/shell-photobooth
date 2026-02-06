import { createStart } from '@tanstack/react-start'
import { corsMiddleware } from './middleware/cors'
import { loggingMiddleware } from './middleware/logging'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [corsMiddleware, loggingMiddleware],
  }
})
