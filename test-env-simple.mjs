#!/usr/bin/env node

/**
 * Simple test for environment validation
 */

const originalEnv = { ...process.env };

console.log('=== Testing Environment Variable Validation ===\n');

// Test 1: Validate with current env vars
console.log('[Test 1] Testing with current environment variables...');

try {
  // Import the validateEnv function
  const { validateEnv } = await import('./apps/web/lib/env.ts');
  const result = validateEnv();

  if (result.isValid) {
    console.log('✓ Test 1 PASSED: Validation succeeded with current env vars');
    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach(w => console.log(`    ${w}`));
    }
  } else {
    console.log('❌ Test 1 FAILED: Validation failed');
    console.log('  Errors:');
    result.errors.forEach(e => console.log(`    ${e}`));
  }
} catch (error) {
  console.log('❌ Test 1 FAILED: Error importing/running validation');
  console.log(`  Error: ${error.message}`);
  process.exit(1);
}

// Test 2: Test with missing required vars
console.log('\n[Test 2] Testing with missing required env vars...');

// Remove required env vars temporarily
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

try {
  // Re-import to get fresh state
  const { validateEnv: validateEnv2 } = await import('./apps/web/lib/env.ts');
  const result2 = validateEnv2();

  if (!result2.isValid && result2.errors.length >= 3) {
    console.log('✓ Test 2 PASSED: Validation correctly detected missing vars');
    console.log(`  Found ${result2.errors.length} missing variables`);
  } else {
    console.log('❌ Test 2 FAILED: Did not detect missing vars correctly');
    console.log(`  isValid: ${result2.isValid}, errors: ${result2.errors.length}`);
  }
} catch (error) {
  console.log('❌ Test 2 FAILED: Error during validation');
  console.log(`  Error: ${error.message}`);
}

// Restore original env
process.env = originalEnv;

console.log('\n=== Tests Complete ===');
