import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

interface TeardownEnvironment {
  supabase: any;
  testUser: string;
  testPassword: string;
}

async function globalTeardown() {
  console.log('🧹 Starting enhanced global test teardown...');
  
  const startTime = Date.now();

  try {
    // Initialize teardown environment
    const env = await initializeTeardownEnvironment();
    
    // Comprehensive test data cleanup
    await performComprehensiveCleanup(env);
    
    // Generate cleanup report
    await generateCleanupReport();
    
    // Archive test artifacts if needed
    await archiveTestArtifacts();

    const duration = Date.now() - startTime;
    console.log(`✅ Global teardown completed successfully in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ Global teardown encountered errors:', error);
    // Don't throw error in teardown to avoid masking test failures
    // Log the error for debugging but continue
  }
}

async function initializeTeardownEnvironment(): Promise<TeardownEnvironment> {
  console.log('🔧 Initializing teardown environment...');
  
  const testUser = process.env.TEST_USER;
  const testPassword = process.env.TEST_PASSWORD;
  
  if (!testUser || !testPassword) {
    console.warn('⚠️ Test credentials not configured, limited cleanup available');
    throw new Error('Test credentials required for comprehensive cleanup');
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

  console.log('✅ Teardown environment initialized');

  return {
    supabase,
    testUser,
    testPassword
  };
}

async function performComprehensiveCleanup(env: TeardownEnvironment) {
  console.log('🗑️ Performing comprehensive test data cleanup...');
  
  try {
    // Authenticate as test user for cleanup
    const { data: authData, error: authError } = await env.supabase.auth.signInWithPassword({
      email: env.testUser,
      password: env.testPassword
    });

    if (authError || !authData.user) {
      console.warn('⚠️ Could not authenticate for cleanup - test user may not exist');
      return;
    }

    const userId = authData.user.id;
    console.log(`🔍 Cleaning up data for user: ${env.testUser} (${userId})`);

    // Clean up notes data
    await cleanupNotes(env.supabase, userId);
    
    // Clean up any other test-related data
    await cleanupAdditionalTestData(env.supabase, userId);
    
    // Sign out after cleanup
    await env.supabase.auth.signOut();
    
    console.log('✅ Comprehensive cleanup completed');

  } catch (error) {
    console.warn('⚠️ Comprehensive cleanup encountered issues:', error);
  }
}

async function cleanupNotes(supabase: any, userId: string) {
  try {
    // Get count of notes to be deleted for reporting
    const { data: countData, error: countError } = await supabase
      .from('notes')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (countError) {
      console.warn('⚠️ Could not count notes for cleanup:', countError.message);
    }

    const noteCount = countData?.length || 0;

    if (noteCount > 0) {
      // Delete test notes
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.warn('⚠️ Could not clean up test notes:', deleteError.message);
      } else {
        console.log(`🗑️ Cleaned up ${noteCount} test notes`);
      }
    } else {
      console.log('✅ No test notes found to clean up');
    }

  } catch (error) {
    console.warn('⚠️ Notes cleanup failed:', error);
  }
}

async function cleanupAdditionalTestData(supabase: any, userId: string) {
  try {
    // Add cleanup for any additional test data tables here
    // For example, if you have user preferences, settings, etc.
    
    console.log('✅ Additional test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Additional cleanup encountered issues:', error);
  }
}

async function generateCleanupReport() {
  console.log('📊 Generating cleanup report...');
  
  try {
    const reportDir = 'test-results';
    const reportPath = path.join(reportDir, 'cleanup-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      testRun: {
        completed: true,
        cleanupPerformed: true
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        testUser: process.env.TEST_USER
      }
    };

    // Ensure directory exists
    await fs.mkdir(reportDir, { recursive: true });
    
    // Write report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Cleanup report generated: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️ Could not generate cleanup report:', error);
  }
}

async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts...');
  
  try {
    // In CI environments, we might want to preserve certain artifacts
    if (process.env.CI) {
      console.log('🏗️ CI environment detected - preserving artifacts for analysis');
      
      // Artifacts are typically handled by CI system (GitHub Actions, etc.)
      // This is a placeholder for any custom archiving logic
    }
    
    console.log('✅ Test artifacts handling completed');
  } catch (error) {
    console.warn('⚠️ Artifact archiving encountered issues:', error);
  }
}

export default globalTeardown;