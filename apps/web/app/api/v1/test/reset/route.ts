import { dataStore } from '@/lib/data-store';
import { NextResponse } from 'next/server';

/**
 * POST /api/v1/test/reset
 *
 * Test-only endpoint to reset the in-memory data store to its initial state.
 * This is used by Playwright tests to ensure a clean state between tests.
 *
 * Security: This endpoint only works in demo mode (when modus_demo_session cookie is set).
 */

export async function POST() {
  // Only allow in demo mode
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  if (!isDemo) {
    return NextResponse.json(
      { error: 'This endpoint is only available in demo mode' },
      { status: 403 }
    );
  }

  try {
    // Reset the data store by calling its reset method
    dataStore.reset();

    return NextResponse.json(
      {
        message: 'Data store reset successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting data store:', error);

    return NextResponse.json(
      {
        error: 'Failed to reset data store',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
