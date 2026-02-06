import { createRouter } from '@tanstack/react-router'

import * as Sentry from '@sentry/tanstackstart-react'

import NotFound from './components/NotFound'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  })

  if (!router.isServer && !!import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [],
    })
  }

  return router
}
