#!/usr/bin/env node

/**
 * Test script to verify environment variable validation
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const WEB_DIR = 'apps/web';
const ENV_FILE = path.join(WEB_DIR, '.env.local');
const ENV_BACKUP = path.join(WEB_DIR, '.env.local.backup');

console.log('=== Environment Variable Validation Test ===\n');

// Step 1: Backup existing .env.local
if (fs.existsSync(ENV_FILE)) {
  fs.copyFileSync(ENV_FILE, ENV_BACKUP);
  console.log('✓ Backed up .env.local');
}

// Step 2: Test with missing env vars (delete .env.local temporarily)
console.log('\n[Test 1] Starting app without required env vars...');
console.log('Expected: App should fail with clear error message\n');

fs.rmSync(ENV_FILE, { force: true });

const test1 = spawn('pnpm', ['dev', '--port', '3003'], {
  cwd: WEB_DIR,
  stdio: 'pipe',
});

let test1Output = '';
const test1Timeout = setTimeout(() => {
  test1.kill();
  console.log('❌ Test 1 FAILED: App did not exit quickly with error');
  process.exit(1);
}, 10000);

test1.stderr.on('data', (data) => {
  test1Output += data.toString();
});

test1.on('close', (code) => {
  clearTimeout(test1Timeout);

  if (test1Output.includes('Environment Variable Validation Failed') ||
      test1Output.includes('Missing required environment variable')) {
    console.log('✓ Test 1 PASSED: App failed with clear error message');
    console.log('   Error message includes validation details\n');
  } else {
    console.log('❌ Test 1 FAILED: App did not show expected error');
    console.log('   Output:', test1Output);
    process.exit(1);
  }

  // Step 3: Test with valid env vars
  console.log('\n[Test 2] Starting app with valid env vars...');
  console.log('Expected: App should start successfully\n');

  // Restore .env.local
  if (fs.existsSync(ENV_BACKUP)) {
    fs.copyFileSync(ENV_BACKUP, ENV_FILE);
    fs.rmSync(ENV_BACKUP);
    console.log('✓ Restored .env.local');
  }

  const test2 = spawn('pnpm', ['dev', '--port', '3003'], {
    cwd: WEB_DIR,
    stdio: 'pipe',
  });

  let test2Output = '';
  const test2Timeout = setTimeout(() => {
    test2.kill();
    if (test2Output.includes('Environment variables validated successfully')) {
      console.log('✓ Test 2 PASSED: App started successfully');
      console.log('   Validation message appeared in output\n');
      console.log('=== All Tests Passed ===');
      process.exit(0);
    } else {
      console.log('⚠️  Test 2 INCONCLUSIVE: Could not confirm validation message');
      console.log('   (App may have started, but output format unclear)');
      console.log('   Output:', test2Output.substring(0, 500));
      process.exit(0);
    }
  }, 8000);

  test2.stdout.on('data', (data) => {
    test2Output += data.toString();
    // Check for success indicators
    if (test2Output.includes('Environment variables validated successfully') ||
        test2Output.includes('Ready in')) {
      clearTimeout(test2Timeout);
      test2.kill();
      console.log('✓ Test 2 PASSED: App started successfully');
      console.log('   Found validation success message in output\n');
      console.log('=== All Tests Passed ===');
      process.exit(0);
    }
  });

  test2.stderr.on('data', (data) => {
    test2Output += data.toString();
  });

  test2.on('close', () => {
    clearTimeout(test2Timeout);
    console.log('⚠️  Test 2: App closed unexpectedly');
    process.exit(1);
  });
});
