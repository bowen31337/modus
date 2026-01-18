import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env';

export async function GET() {
  const result = validateEnv();

  return NextResponse.json({
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    timestamp: new Date().toISOString(),
  });
}
