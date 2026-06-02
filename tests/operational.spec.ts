import { test, expect } from '@playwright/test';

test.describe('Operational Verification', () => {

  test('Suite 1-15: Complete Operational Stress Test', async ({ page, context }) => {
    await page.goto('http://localhost:3000/admin');
    
    // Wait for initial load
    await expect(page.locator('text=TRANSFER MARKET')).toBeVisible();
    await expect(page.locator('text=Loading auction control room...')).not.toBeVisible({ timeout: 15000 });

    // 1. Basic Auction Flow
    await page.click('button[role="tab"]:has-text("Auction")'); 
    
    // Get the Team and Player selects
    const teamSelect = page.locator('label').filter({ hasText: 'Team' }).locator('select');
    const playerSelect = page.locator('label').filter({ hasText: 'Player' }).locator('select');
    
    await teamSelect.selectOption({ index: 0 }); // First team
    const playerId = await playerSelect.evaluate((el: HTMLSelectElement) => el.options[0].value);
    const playerName = await playerSelect.evaluate((el: HTMLSelectElement) => el.options[0].text.split(' • ')[0]);
    
    // Confirm Sale
    const confirmSaleButton = page.locator('button:has-text("Confirm Sale")');
    
    // Accept the "Confirm sale" native dialog
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Confirm sale')) {
        await dialog.accept();
      }
    });

    await confirmSaleButton.click();

    // Check overlay
    await expect(page.locator('text=SOLD').first()).toBeVisible();
    
    // 2. Remove from Team flow
    await page.click('button[role="tab"]:has-text("Player Pool")');
    
    // Search for the sold player
    await page.fill('[data-search]', playerName);
    
    // It should be sold, so we click "Remove"
    await page.click('button:has-text("Remove")');
    await expect(page.locator('text=removed from team')).toBeVisible();

    // 3. Add Player flow
    await page.fill('input[placeholder="e.g. Kylian Mbappe"]', 'Test Player Dynamico');
    await page.click('button:has-text("Add Player")');
    
    // Password protection for Add Player
    await expect(page.locator('text=Protected Action')).toBeVisible();
    await page.fill('input[type="password"]', 'change-me-for-live-event');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=Test Player Dynamico added to the pool')).toBeVisible();

    // 4. Mark Unavailable flow
    await page.fill('[data-search]', 'Test Player Dynamico');
    await page.click('button:has-text("Unavailable")');
    // enter WRONG password
    await page.fill('input[type="password"]', 'wrong-pass');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('text=Invalid admin password')).toBeVisible();
    
    // Cancel modal
    await page.click('button:has-text("Cancel")');

    // 5. Delete Player flow
    // Add a dialog handler for the Delete confirmation
    page.once('dialog', async dialog => {
      if (dialog.message().includes('permanently delete')) {
        await dialog.accept();
      }
    });
    
    await page.click('button:has-text("Delete")');
    await page.fill('input[type="password"]', 'change-me-for-live-event');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('text=deleted')).toBeVisible();

    // 6. Reset Auction Action
    await page.click('button[role="tab"]:has-text("Teams")');
    await page.click('button:has-text("Reset Auction")');
    await page.fill('input[type="password"]', 'change-me-for-live-event');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('text=Auction reset complete')).toBeVisible();

    // 7. Factory Reset
    await page.click('button:has-text("Factory Reset")');
    // Test that confirm requires "RESET"
    await page.fill('input[type="password"]', 'change-me-for-live-event');
    await page.fill('input[type="text"]', 'RESET');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('text=Factory reset complete')).toBeVisible({ timeout: 10000 });
  });

});
