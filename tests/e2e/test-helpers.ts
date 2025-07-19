import { Page, expect, Locator } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export interface TestNote {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestDataSet {
  notes: TestNote[];
  searchableNotes: TestNote[];
  largeDataset: TestNote[];
}

export class TestHelpers {
  private supabase;
  private testUser: string;
  private testPassword: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    this.testUser = process.env.TEST_USER!;
    this.testPassword = process.env.TEST_PASSWORD!;
  }

  /**
   * Enhanced login with better error handling and validation
   */
  async loginTestUser(page: Page, options: { timeout?: number; waitForRedirect?: boolean } = {}) {
    const { timeout = 30000, waitForRedirect = true } = options;
    
    console.log(`🔐 Logging in test user: ${this.testUser}`);
    
    try {
      await page.goto('/login', { waitUntil: 'networkidle' });
      
      // Wait for login form to be ready
      await page.waitForSelector('[data-testid="email-input"]', { timeout });
      
      // Fill credentials
      await page.fill('[data-testid="email-input"]', this.testUser);
      await page.fill('[data-testid="password-input"]', this.testPassword);
      
      // Submit form
      await page.click('[data-testid="login-button"]');
      
      if (waitForRedirect) {
        // Wait for successful login redirect with timeout
        await expect(page).toHaveURL('/notes', { timeout });
        
        // Verify we're actually logged in by checking for user-specific elements
        await page.waitForSelector('[data-testid="notes-container"]', { timeout: 10000 });
      }
      
      console.log('✅ Test user login successful');
    } catch (error) {
      await this.takeDebugScreenshot(page, 'login-failure');
      throw new Error(`Login failed: ${error}`);
    }
  }

  /**
   * Enhanced logout with verification
   */
  async logout(page: Page) {
    console.log('🚪 Logging out test user');
    
    try {
      // Check if user menu exists (user is logged in)
      const userMenuExists = await page.locator('[data-testid="user-menu-button"]').isVisible();
      
      if (!userMenuExists) {
        console.log('ℹ️ User already logged out or not on authenticated page');
        return;
      }
      
      // Click user menu button
      await page.click('[data-testid="user-menu-button"]');
      
      // Wait for menu to appear and click logout
      await page.waitForSelector('[data-testid="logout-button"]', { state: 'visible' });
      await page.click('[data-testid="logout-button"]');
      
      // Wait for redirect to home page
      await expect(page).toHaveURL('/', { timeout: 10000 });
      
      console.log('✅ Test user logout successful');
    } catch (error) {
      await this.takeDebugScreenshot(page, 'logout-failure');
      console.warn('⚠️ Logout may have failed:', error);
    }
  }

  /**
   * Create comprehensive test data sets
   */
  async seedTestData(options: {
    basicNotes?: number;
    searchableNotes?: boolean;
    largeDataset?: boolean;
  } = {}): Promise<TestDataSet> {
    const { basicNotes = 3, searchableNotes = false, largeDataset = false } = options;
    
    console.log('🌱 Seeding comprehensive test data...');
    
    // Authenticate for seeding
    const { data: { user }, error: authError } = await this.supabase.auth.signInWithPassword({
      email: this.testUser,
      password: this.testPassword
    });

    if (authError || !user) {
      throw new Error(`Failed to authenticate for seeding: ${authError?.message}`);
    }

    const testData: TestDataSet = {
      notes: [],
      searchableNotes: [],
      largeDataset: []
    };

    try {
      // Create basic test notes
      if (basicNotes > 0) {
        testData.notes = await this.createBasicNotes(user.id, basicNotes);
      }

      // Create searchable test notes
      if (searchableNotes) {
        testData.searchableNotes = await this.createSearchableNotes(user.id);
      }

      // Create large dataset for performance testing
      if (largeDataset) {
        testData.largeDataset = await this.createLargeDataset(user.id);
      }

      console.log(`✅ Test data seeded successfully:
        - Basic notes: ${testData.notes.length}
        - Searchable notes: ${testData.searchableNotes.length}
        - Large dataset: ${testData.largeDataset.length}`);

      return testData;

    } finally {
      await this.supabase.auth.signOut();
    }
  }

  /**
   * Create basic test notes
   */
  private async createBasicNotes(userId: string, count: number): Promise<TestNote[]> {
    const notes = Array.from({ length: count }, (_, i) => ({
      user_id: userId,
      title: `Test Note ${i + 1}`,
      content: `This is the content of test note ${i + 1}. It contains sample text for testing basic functionality.`,
      created_at: new Date(Date.now() - (i * 60000)).toISOString(),
      updated_at: new Date(Date.now() - (i * 60000)).toISOString()
    }));

    const { data, error } = await this.supabase
      .from('notes')
      .insert(notes)
      .select();

    if (error) {
      throw new Error(`Failed to create basic notes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create notes optimized for search testing
   */
  private async createSearchableNotes(userId: string): Promise<TestNote[]> {
    const searchableNotes = [
      {
        user_id: userId,
        title: 'JavaScript Fundamentals',
        content: 'Variables, functions, and scope in JavaScript. Essential concepts for web development.',
        created_at: new Date(Date.now() - 300000).toISOString(),
        updated_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        user_id: userId,
        title: 'React Components',
        content: 'Building reusable components in React. Props, state, and lifecycle methods.',
        created_at: new Date(Date.now() - 240000).toISOString(),
        updated_at: new Date(Date.now() - 240000).toISOString()
      },
      {
        user_id: userId,
        title: 'Database Design',
        content: 'Relational database concepts, normalization, and SQL queries for data management.',
        created_at: new Date(Date.now() - 180000).toISOString(),
        updated_at: new Date(Date.now() - 180000).toISOString()
      },
      {
        user_id: userId,
        title: 'API Development',
        content: 'RESTful API design principles, HTTP methods, and authentication strategies.',
        created_at: new Date(Date.now() - 120000).toISOString(),
        updated_at: new Date(Date.now() - 120000).toISOString()
      }
    ];

    const { data, error } = await this.supabase
      .from('notes')
      .insert(searchableNotes)
      .select();

    if (error) {
      throw new Error(`Failed to create searchable notes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create large dataset for performance testing
   */
  private async createLargeDataset(userId: string): Promise<TestNote[]> {
    const batchSize = 50;
    const totalNotes = 200;
    const allNotes: TestNote[] = [];

    for (let batch = 0; batch < Math.ceil(totalNotes / batchSize); batch++) {
      const batchNotes = Array.from({ length: Math.min(batchSize, totalNotes - batch * batchSize) }, (_, i) => {
        const noteIndex = batch * batchSize + i + 1;
        return {
          user_id: userId,
          title: `Performance Test Note ${noteIndex}`,
          content: `This is performance test note ${noteIndex}. It contains enough content to test rendering and search performance with larger datasets. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          created_at: new Date(Date.now() - (noteIndex * 30000)).toISOString(),
          updated_at: new Date(Date.now() - (noteIndex * 30000)).toISOString()
        };
      });

      const { data, error } = await this.supabase
        .from('notes')
        .insert(batchNotes)
        .select();

      if (error) {
        throw new Error(`Failed to create large dataset batch ${batch + 1}: ${error.message}`);
      }

      allNotes.push(...(data || []));
    }

    return allNotes;
  }

  /**
   * Enhanced cleanup with verification
   */
  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.signInWithPassword({
        email: this.testUser,
        password: this.testPassword
      });

      if (authError || !user) {
        console.warn('⚠️ Could not authenticate for cleanup');
        return;
      }

      // Get count before deletion
      const { data: countData, error: countError } = await this.supabase
        .from('notes')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      const noteCount = countData?.length || 0;

      if (noteCount > 0) {
        // Delete all test notes
        const { error: deleteError } = await this.supabase
          .from('notes')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error(`Failed to cleanup test notes: ${deleteError.message}`);
        }

        console.log(`✅ Cleaned up ${noteCount} test notes`);
      } else {
        console.log('✅ No test notes found to clean up');
      }

    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    } finally {
      await this.supabase.auth.signOut();
    }
  }

  /**
   * Enhanced element waiting with better error messages
   */
  async waitForElement(page: Page, selector: string, options: {
    timeout?: number;
    state?: 'visible' | 'hidden' | 'attached' | 'detached';
  } = {}): Promise<Locator> {
    const { timeout = 10000, state = 'visible' } = options;
    
    try {
      await page.waitForSelector(selector, { state, timeout });
      return page.locator(selector);
    } catch (error) {
      await this.takeDebugScreenshot(page, `wait-element-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
      throw new Error(`Element '${selector}' not found in ${state} state within ${timeout}ms`);
    }
  }

  /**
   * Enhanced screenshot with better naming and metadata
   */
  async takeDebugScreenshot(page: Page, name: string, options: { fullPage?: boolean } = {}) {
    const { fullPage = true } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debug-${name}-${timestamp}.png`;
    const filepath = `test-results/${filename}`;
    
    try {
      await page.screenshot({ 
        path: filepath,
        fullPage 
      });
      console.log(`📸 Debug screenshot saved: ${filepath}`);
    } catch (error) {
      console.warn('⚠️ Failed to take debug screenshot:', error);
    }
  }

  /**
   * Enhanced authentication check
   */
  async isUserAuthenticated(page: Page): Promise<boolean> {
    try {
      // Check for multiple indicators of authentication
      const indicators = [
        '[data-testid="notes-container"]',
        '[data-testid="user-menu-button"]',
        '[data-testid="create-note-button"]'
      ];

      for (const indicator of indicators) {
        try {
          await page.waitForSelector(indicator, { timeout: 2000 });
          return true;
        } catch {
          // Continue to next indicator
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Enhanced form handling with validation
   */
  async fillAndSubmitForm(page: Page, formData: Record<string, string>, submitSelector: string, options: {
    waitForNavigation?: boolean;
    timeout?: number;
  } = {}) {
    const { waitForNavigation = false, timeout = 10000 } = options;
    
    try {
      // Fill form fields
      for (const [selector, value] of Object.entries(formData)) {
        await page.waitForSelector(selector, { timeout });
        await page.fill(selector, value);
        
        // Verify the value was set
        const actualValue = await page.inputValue(selector);
        if (actualValue !== value) {
          throw new Error(`Failed to set value for ${selector}. Expected: ${value}, Actual: ${actualValue}`);
        }
      }
      
      // Submit form
      if (waitForNavigation) {
        await Promise.all([
          page.waitForNavigation({ timeout }),
          page.click(submitSelector)
        ]);
      } else {
        await page.click(submitSelector);
      }
      
    } catch (error) {
      await this.takeDebugScreenshot(page, 'form-submission-error');
      throw new Error(`Form submission failed: ${error}`);
    }
  }

  /**
   * Wait for network idle with retry logic
   */
  async waitForNetworkIdle(page: Page, timeout: number = 10000, retries: number = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await page.waitForLoadState('networkidle', { timeout });
        return;
      } catch (error) {
        if (attempt === retries) {
          console.warn(`⚠️ Network idle timeout after ${retries} attempts`);
          throw error;
        }
        console.log(`⏳ Network idle attempt ${attempt}/${retries} failed, retrying...`);
        await page.waitForTimeout(1000); // Wait 1 second before retry
      }
    }
  }

  /**
   * Create a note via UI and return its details
   */
  async createNoteViaUI(page: Page, title: string, content: string): Promise<void> {
    console.log(`📝 Creating note via UI: "${title}"`);
    
    try {
      // Click create note button
      await page.click('[data-testid="create-note-button"]');
      
      // Fill note form
      await page.fill('[data-testid="note-title-input"]', title);
      await page.fill('[data-testid="note-content-input"]', content);
      
      // Save note
      await page.click('[data-testid="save-note-button"]');
      
      // Wait for note to appear in list
      await page.waitForSelector(`text="${title}"`, { timeout: 10000 });
      
      console.log(`✅ Note created successfully: "${title}"`);
    } catch (error) {
      await this.takeDebugScreenshot(page, 'create-note-error');
      throw new Error(`Failed to create note via UI: ${error}`);
    }
  }

  /**
   * Search for notes and verify results
   */
  async searchNotes(page: Page, searchTerm: string): Promise<string[]> {
    console.log(`🔍 Searching for notes: "${searchTerm}"`);
    
    try {
      // Enter search term
      await page.fill('[data-testid="search-input"]', searchTerm);
      
      // Wait for search results
      await this.waitForNetworkIdle(page, 5000);
      
      // Get visible note titles
      const noteElements = await page.locator('[data-testid="note-item-title"]').all();
      const noteTitles = await Promise.all(
        noteElements.map(element => element.textContent())
      );
      
      const filteredTitles = noteTitles.filter(title => title !== null) as string[];
      
      console.log(`✅ Search completed. Found ${filteredTitles.length} results`);
      return filteredTitles;
    } catch (error) {
      await this.takeDebugScreenshot(page, 'search-error');
      throw new Error(`Search failed: ${error}`);
    }
  }
}