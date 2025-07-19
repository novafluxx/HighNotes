import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestEnvironment {
  supabase: any;
  testUser: string;
  testPassword: string;
  baseURL: string;
}

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting enhanced global test setup...');
  
  const startTime = Date.now();

  try {
    // Initialize test environment
    const env = await initializeTestEnvironment();
    
    // Verify and prepare test database
    await setupTestDatabase(env);
    
    // Verify test user account
    await verifyTestUserAccount(env);
    
    // Warm up the application
    await warmupApplication(env.baseURL);
    
    // Seed initial test data if needed
    await seedInitialTestData(env);

    const duration = Date.now() - startTime;
    console.log(`✅ Global setup completed successfully in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function initializeTestEnvironment(): Promise<TestEnvironment> {
  console.log('🔧 Initializing test environment...');
  
  // Validate required environment variables
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'TEST_USER', 'TEST_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  console.log(`✅ Test environment initialized`);
  console.log(`   - Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`   - Test User: ${process.env.TEST_USER}`);
  console.log(`   - Base URL: ${baseURL}`);

  return {
    supabase,
    testUser: process.env.TEST_USER!,
    testPassword: process.env.TEST_PASSWORD!,
    baseURL
  };
}

async function setupTestDatabase(env: TestEnvironment) {
  console.log('🗄️ Setting up test database...');
  
  try {
    // Test database connectivity
    const { data, error } = await env.supabase
      .from('notes')
      .select('count')
      .limit(1);

    if (error) {
      console.warn('⚠️ Database connectivity test failed:', error.message);
      // Don't throw here as it might be a permissions issue
    } else {
      console.log('✅ Database connectivity verified');
    }

    // Clean up any existing test data
    await cleanupTestData(env);

  } catch (error) {
    console.warn('⚠️ Database setup encountered issues:', error);
    // Continue with setup as database issues might be non-critical
  }
}

async function verifyTestUserAccount(env: TestEnvironment) {
  console.log('👤 Verifying test user account...');
  
  try {
    // Attempt to sign in with test credentials to verify account exists
    const { data, error } = await env.supabase.auth.signInWithPassword({
      email: env.testUser,
      password: env.testPassword
    });

    if (error) {
      console.warn('⚠️ Test user verification failed:', error.message);
      console.log('💡 You may need to create the test user account manually');
      console.log(`   Email: ${env.testUser}`);
      console.log(`   Password: ${env.testPassword}`);
    } else {
      console.log('✅ Test user account verified');
      
      // Sign out immediately after verification
      await env.supabase.auth.signOut();
    }
  } catch (error) {
    console.warn('⚠️ Test user verification encountered error:', error);
  }
}

async function warmupApplication(baseURL: string) {
  console.log('🌡️ Warming up application...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a reasonable timeout for warmup
    page.setDefaultTimeout(30000);
    
    // Navigate to the app to ensure it's running and responsive
    await page.goto(baseURL, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Check if the app loaded correctly by looking for basic elements
    const title = await page.title();
    console.log(`✅ Application accessible - Title: "${title}"`);
    
    // Test key pages to ensure routing works
    const pagesToTest = ['/login', '/signup'];
    
    for (const path of pagesToTest) {
      try {
        await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
        console.log(`✅ Page ${path} accessible`);
      } catch (error) {
        console.warn(`⚠️ Page ${path} may have issues:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Application warmup failed:', error);
    throw new Error(`Application is not accessible at ${baseURL}. Please ensure the dev server is running.`);
  } finally {
    await browser.close();
  }
}

async function seedInitialTestData(env: TestEnvironment) {
  console.log('🌱 Seeding initial test data...');
  
  try {
    // For now, we'll keep this minimal and let individual tests seed their own data
    // This ensures test isolation and prevents test interdependencies
    
    console.log('✅ Initial test data setup completed (minimal seeding for isolation)');
  } catch (error) {
    console.warn('⚠️ Test data seeding encountered issues:', error);
    // Non-critical, continue with setup
  }
}

async function cleanupTestData(env: TestEnvironment) {
  console.log('🧹 Cleaning up existing test data...');
  
  try {
    // Sign in as test user to get their ID for cleanup
    const { data: authData, error: authError } = await env.supabase.auth.signInWithPassword({
      email: env.testUser,
      password: env.testPassword
    });

    if (authError || !authData.user) {
      console.warn('⚠️ Could not authenticate for cleanup - test user may not exist yet');
      return;
    }

    // Clean up test notes for this user
    const { error: notesError } = await env.supabase
      .from('notes')
      .delete()
      .eq('user_id', authData.user.id);

    if (notesError) {
      console.warn('⚠️ Could not clean up test notes:', notesError.message);
    } else {
      console.log('🧹 Cleaned up existing test notes');
    }

    // Sign out after cleanup
    await env.supabase.auth.signOut();

  } catch (error) {
    console.warn('⚠️ Cleanup failed (non-critical):', error);
  }
}

export default globalSetup;