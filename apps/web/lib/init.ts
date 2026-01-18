/**
 * Application Initialization
 *
 * This file runs once when the Next.js server starts.
 * It validates environment variables and performs other startup checks.
 */

import { validateEnvOrThrow } from './env';

// Validate environment variables on server startup
if (typeof window === 'undefined') {
  console.log('[App Init] Starting application initialization...');
  try {
    validateEnvOrThrow();
    console.log('[App Init] ✓ Application initialized successfully');
  } catch (error) {
    // Log the error and exit if validation fails
    console.error((error as Error).message);
    process.exit(1);
  }
}

/**
 * Initialize any other services here
 * For example:
 * - Connect to external services
 * - Initialize caches
 * - Set up error tracking
 */
export function initApp() {
  // Future initialization logic
}
