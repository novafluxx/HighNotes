// Quick test script to verify encryption modal issues are fixed
const { chromium } = require('playwright');

async function testEncryptionModals() {
  // Check environment variables
  const TEST_USER = process.env.TEST_USER;
  const TEST_PASSWORD = process.env.TEST_PASSWORD;
  
  if (!TEST_USER || !TEST_PASSWORD) {
    console.error('Missing TEST_USER or TEST_PASSWORD environment variables');
    process.exit(1);
  }

  console.log('Starting test with user:', TEST_USER);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('Logging in...');
      
      // Fill login form
      await page.fill('input[type="email"]', TEST_USER);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for navigation to complete
      await page.waitForURL(/\/notes/, { timeout: 10000 });
      console.log('Login successful, redirected to notes page');
    }

    // Now we should be on the notes page
    await page.waitForSelector('h3:has-text("My Notes")', { timeout: 5000 });
    console.log('Notes page loaded successfully');

    // Check if any modals are visible on page load
    const setupModal = await page.locator('[data-testid="encryption-setup-modal"], .modal:has-text("Set Up Note Encryption")').count();
    const unlockModal = await page.locator('[data-testid="encryption-unlock-modal"], .modal:has-text("Unlock Encryption")').count();
    
    console.log('Setup modal count on load:', setupModal);
    console.log('Unlock modal count on load:', unlockModal);

    if (setupModal > 0 || unlockModal > 0) {
      console.error('❌ ISSUE: Encryption modals are visible on page load!');
    } else {
      console.log('✅ GOOD: No encryption modals visible on page load');
    }

    // Create a new note to test modal behavior
    console.log('Creating a new note...');
    await page.click('button:has-text("New Note")');
    
    // Wait for note editor to load
    await page.waitForSelector('.tiptap-editor', { timeout: 5000 });
    console.log('Note editor loaded');

    // Check if modals appear when note is created
    const setupModalAfterNote = await page.locator('[data-testid="encryption-setup-modal"], .modal:has-text("Set Up Note Encryption")').count();
    const unlockModalAfterNote = await page.locator('[data-testid="encryption-unlock-modal"], .modal:has-text("Unlock Encryption")').count();
    
    console.log('Setup modal count after creating note:', setupModalAfterNote);
    console.log('Unlock modal count after creating note:', unlockModalAfterNote);

    if (setupModalAfterNote > 0 || unlockModalAfterNote > 0) {
      console.error('❌ ISSUE: Encryption modals appeared after creating note!');
    } else {
      console.log('✅ GOOD: No encryption modals appeared after creating note');
    }

    // Look for encryption dropdown button
    const encryptionDropdown = await page.locator('button:has-text("Encryption")').count();
    console.log('Encryption dropdown button count:', encryptionDropdown);

    if (encryptionDropdown > 0) {
      console.log('✅ GOOD: Encryption dropdown button found');
      
      // Click the encryption dropdown
      await page.click('button:has-text("Encryption")');
      await page.waitForTimeout(500); // Wait for dropdown to open
      
      // Check for encryption options
      const setupOption = await page.locator('text="Setup encryption"').count();
      console.log('Setup encryption option count:', setupOption);
      
      if (setupOption > 0) {
        console.log('✅ GOOD: Setup encryption option available in dropdown');
        
        // Click setup encryption option
        await page.click('text="Setup encryption"');
        await page.waitForTimeout(1000);
        
        // Check if setup modal appears
        const setupModalAfterClick = await page.locator('.modal:has-text("Set Up Note Encryption")').count();
        console.log('Setup modal count after clicking setup:', setupModalAfterClick);
        
        if (setupModalAfterClick > 0) {
          console.log('✅ GOOD: Setup modal appears when user explicitly requests it');
          
          // Close the modal by clicking outside or cancel
          await page.click('button:has-text("Cancel")');
          await page.waitForTimeout(500);
        } else {
          console.error('❌ ISSUE: Setup modal did not appear when requested');
        }
      }
    } else {
      console.log('❌ ISSUE: Encryption dropdown button not found');
    }

    // Test clicking around the page to see if modals appear unexpectedly
    console.log('Testing clicking around the page...');
    await page.click('body');
    await page.waitForTimeout(500);
    
    const unexpectedSetupModal = await page.locator('.modal:has-text("Set Up Note Encryption")').count();
    const unexpectedUnlockModal = await page.locator('.modal:has-text("Unlock Encryption")').count();
    
    if (unexpectedSetupModal > 0 || unexpectedUnlockModal > 0) {
      console.error('❌ ISSUE: Modals appeared when clicking elsewhere on the page!');
    } else {
      console.log('✅ GOOD: No unexpected modals appeared when clicking around');
    }

    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testEncryptionModals().catch(console.error);
