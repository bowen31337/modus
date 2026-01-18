#!/usr/bin/env node

/**
 * Test script for AI API endpoints
 * Tests both /api/v1/ai/suggest and /api/v1/ai/analyze-sentiment
 */

const BASE_URL = 'http://localhost:3000';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`TEST: ${testName}`, 'blue');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ${message}`, 'yellow');
}

// ============================================================================
// Test Functions
// ============================================================================

async function testSentimentAnalysis() {
  logTest('POST /api/v1/ai/analyze-sentiment');

  const testCases = [
    {
      name: 'Negative sentiment',
      text: 'This is terrible and completely broken. I hate it! Very frustrating.',
      expectedLabel: 'negative',
    },
    {
      name: 'Positive sentiment',
      text: 'This is amazing! I love it. Works perfectly. Thank you so much!',
      expectedLabel: 'positive',
    },
    {
      name: 'Neutral sentiment',
      text: 'I have a question about the account settings. Where can I find them?',
      expectedLabel: 'neutral',
    },
    {
      name: 'Empty text (should fail)',
      text: '',
      shouldFail: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    logInfo(`Testing: ${testCase.name}`);

    try {
      const response = await fetch(`${BASE_URL}/api/v1/ai/analyze-sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testCase.text }),
      });

      const result = await response.json();

      if (testCase.shouldFail) {
        if (!response.ok) {
          logSuccess(`Correctly returned error: ${response.status}`);
          passed++;
        } else {
          logError(`Should have failed but succeeded`);
          failed++;
        }
      } else {
        if (response.ok) {
          const { data } = result;

          logInfo(`Score: ${data.score}, Label: ${data.label}, Confidence: ${data.confidence}`);

          // Check if label matches expected
          if (data.label === testCase.expectedLabel) {
            logSuccess(`Label matches expected: ${testCase.expectedLabel}`);
            passed++;
          } else {
            logError(`Label mismatch: expected ${testCase.expectedLabel}, got ${data.label}`);
            failed++;
          }

          // Validate score range
          if (data.score >= -1 && data.score <= 1) {
            logSuccess(`Score is in valid range: ${data.score}`);
          } else {
            logError(`Score out of range: ${data.score}`);
            failed++;
          }

          // Validate confidence range
          if (data.confidence >= 0 && data.confidence <= 1) {
            logSuccess(`Confidence is in valid range: ${data.confidence}`);
          } else {
            logError(`Confidence out of range: ${data.confidence}`);
            failed++;
          }
        } else {
          logError(`Request failed: ${response.status} ${JSON.stringify(result)}`);
          failed++;
        }
      }
    } catch (error) {
      logError(`Exception: ${error.message}`);
      failed++;
    }
  }

  log(`\nSentiment Analysis: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return { passed, failed };
}

async function testAISuggest() {
  logTest('POST /api/v1/ai/suggest');

  const testCases = [
    {
      name: 'Valid post ID (string format)',
      postId: '1',
      shouldFail: false,
    },
    {
      name: 'Invalid post ID format',
      postId: 'not-a-uuid',
      shouldFail: true,
    },
    {
      name: 'Non-existent post ID',
      postId: '999999',
      shouldFail: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    logInfo(`Testing: ${testCase.name}`);

    try {
      const response = await fetch(`${BASE_URL}/api/v1/ai/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: testCase.postId,
          use_rag: true,
          max_similar: 3,
        }),
      });

      const result = await response.json();

      if (testCase.shouldFail) {
        if (!response.ok) {
          logSuccess(`Correctly returned error: ${response.status}`);
          passed++;
        } else {
          logError(`Should have failed but succeeded`);
          failed++;
        }
      } else {
        if (response.ok) {
          const { data } = result;

          logInfo(`Suggestion: ${data.suggestion.substring(0, 100)}...`);
          logInfo(`Context: ${JSON.stringify(data.context)}`);
          logInfo(`Tokens used: ${data.tokens_used}, Model: ${data.model}`);

          // Check if suggestion is not empty
          if (data.suggestion && data.suggestion.length > 0) {
            logSuccess(`Suggestion generated (${data.suggestion.length} chars)`);
            passed++;
          } else {
            logError(`Suggestion is empty`);
            failed++;
          }

          // Check if tokens_used is a number
          if (typeof data.tokens_used === 'number') {
            logSuccess(`Tokens used is valid: ${data.tokens_used}`);
          } else {
            logError(`Tokens used is invalid`);
            failed++;
          }
        } else {
          logError(`Request failed: ${response.status} ${JSON.stringify(result)}`);
          failed++;
        }
      }
    } catch (error) {
      logError(`Exception: ${error.message}`);
      failed++;
    }
  }

  log(`\nAI Suggest: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return { passed, failed };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  log('\nAI API Endpoint Tests', 'blue');
  log('='.repeat(60), 'blue');
  log(`Testing endpoints at ${BASE_URL}`, 'blue');

  let totalPassed = 0;
  let totalFailed = 0;

  // Test sentiment analysis
  const sentimentResults = await testSentimentAnalysis();
  totalPassed += sentimentResults.passed;
  totalFailed += sentimentResults.failed;

  // Test AI suggest
  const suggestResults = await testAISuggest();
  totalPassed += suggestResults.passed;
  totalFailed += suggestResults.failed;

  // Summary
  console.log('\n' + '='.repeat(60));
  log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`, totalFailed === 0 ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
