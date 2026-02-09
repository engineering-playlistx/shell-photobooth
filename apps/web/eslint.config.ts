//  @ts-check

// @ts-expect-error
import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: ['prettier.config.js', '.output/**'],
  },
  ...tanstackConfig,
]
