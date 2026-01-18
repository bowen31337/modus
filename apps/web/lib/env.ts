/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup.
 * If any required variables are missing, the application will fail to start
 * with a clear error message indicating which variables are missing.
 */

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validator?: (value: string) => boolean;
}

const ENV_VARS: EnvVarSpec[] = [
  // Supabase Configuration
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL (e.g., https://your-project.supabase.co)',
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key for client-side access',
    validator: (value) => value.length > 20,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key for server-side operations (never expose to client)',
    validator: (value) => value.length > 20,
  },

  // AI Provider Configuration
  {
    name: 'OPENAI_API_KEY',
    required: false, // At least one AI provider should be configured
    description: 'OpenAI API key for AI features (optional if using other provider)',
    validator: (value) => value.startsWith('sk-'),
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    description: 'Anthropic API key for AI features (optional if using OpenAI)',
    validator: (value) => value.startsWith('sk-ant-'),
  },

  // Optional: Model Configuration
  {
    name: 'AI_MODEL',
    required: false,
    description: 'Default AI model to use (e.g., gpt-4-turbo-preview)',
    defaultValue: 'gpt-4-turbo-preview',
  },
  {
    name: 'EMBEDDING_MODEL',
    required: false,
    description: 'Embedding model for RAG (e.g., text-embedding-3-small)',
    defaultValue: 'text-embedding-3-small',
  },

  // Application Configuration
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'Application base URL (e.g., http://localhost:3000)',
    defaultValue: 'http://localhost:3000',
    validator: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment (development, production, test)',
    defaultValue: 'development',
    validator: (value) => ['development', 'production', 'test'].includes(value),
  },
];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates all environment variables based on the specification above.
 * Returns a validation result with errors (for missing required vars) and warnings.
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if demo mode is enabled
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Check if at least one AI provider is configured
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  for (const spec of ENV_VARS) {
    const value = process.env[spec.name];

    // Check if variable is missing
    if (!value || value.trim() === '') {
      // In demo mode, skip validation for Supabase credentials
      if (isDemoMode && spec.name.startsWith('NEXT_PUBLIC_SUPABASE') ||
          isDemoMode && spec.name === 'SUPABASE_SERVICE_ROLE_KEY') {
        continue;
      }

      if (spec.required) {
        errors.push(`❌ Missing required environment variable: ${spec.name}\n   ${spec.description}`);
      } else if (spec.defaultValue) {
        // Set default value if provided
        process.env[spec.name] = spec.defaultValue;
      }
      continue;
    }

    // Run custom validator if provided (skip in demo mode for Supabase vars)
    if (spec.validator && !spec.validator(value)) {
      if (isDemoMode && spec.name.startsWith('NEXT_PUBLIC_SUPABASE')) {
        continue;
      }
      if (isDemoMode && spec.name === 'SUPABASE_SERVICE_ROLE_KEY') {
        continue;
      }

      if (spec.required) {
        errors.push(`❌ Invalid value for ${spec.name}: ${value}\n   ${spec.description}`);
      } else {
        warnings.push(`⚠️  Suspicious value for ${spec.name}: ${value}\n   ${spec.description}`);
      }
    }
  }

  // Warn about demo mode
  if (isDemoMode) {
    warnings.push('ℹ️  Running in DEMO MODE - Supabase credentials not required');
  }

  // Special check: At least one AI provider should be configured
  if (!hasOpenAI && !hasAnthropic) {
    warnings.push(
      '⚠️  No AI provider configured. Set either OPENAI_API_KEY or ANTHROPIC_API_KEY to enable AI features.'
    );
  }

  // Security warning in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      warnings.push(
        '⚠️  NEXT_PUBLIC_APP_URL is set to localhost in production. This may cause issues.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment variables and throws an error if validation fails.
 * This should be called during application initialization.
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  if (result.errors.length > 0) {
    const errorMessage = [
      '\n',
      '═'.repeat(60),
      '❌ Environment Variable Validation Failed',
      '═'.repeat(60),
      '\n',
      'The application cannot start because the following required',
      'environment variables are missing or invalid:\n',
      ...result.errors,
      '\n',
      'Please update your .env.local file with the required values.',
      'Refer to .env.example for a complete list of environment variables.',
      '\n',
      '═'.repeat(60),
      '\n',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Print warnings if any
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    result.warnings.forEach((warning) => console.warn(warning));
    console.warn('');
  }

  // Print success message
  console.log('✅ Environment variables validated successfully');
}

/**
 * Get a typed environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

/**
 * Get a boolean environment variable
 */
export function getBoolEnv(key: string, fallback: boolean = false): boolean {
  const value = process.env[key]?.toLowerCase().trim();
  if (!value) return fallback;

  return ['true', '1', 'yes', 'on'].includes(value);
}

/**
 * Get a number environment variable
 */
export function getNumberEnv(key: string, fallback?: number): number {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }

  const num = Number.parseInt(value, 10);

  if (Number.isNaN(num)) {
    throw new Error(`Invalid number value for ${key}: ${value}`);
  }

  return num;
}
