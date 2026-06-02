# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: operational.spec.ts >> Operational Verification >> Suite 1-15: Complete Operational Stress Test
- Location: tests\operational.spec.ts:5:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button[role="tab"]:has-text("Auction")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - heading "TRANSFER MARKET" [level=1] [ref=e6]
          - generic [ref=e7]: LIVE
        - paragraph [ref=e8]: Football Franchise Auction System • 7 teams • 7-player squads • OVR decides the champion
      - generic [ref=e9]:
        - link "Leaderboard" [ref=e10] [cursor=pointer]:
          - /url: /
        - link "Admin" [ref=e11] [cursor=pointer]:
          - /url: /admin
        - button "Projector Contrast" [ref=e12] [cursor=pointer]
        - button "Fullscreen" [ref=e13] [cursor=pointer]:
          - img [ref=e14]
          - text: Fullscreen
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e22]:
          - button "Auction" [ref=e23] [cursor=pointer]
          - button "Teams" [ref=e24] [cursor=pointer]
          - button "Player Pool" [ref=e25] [cursor=pointer]
        - generic [ref=e26]:
          - heading "Auction Desk" [level=3] [ref=e28]
          - generic [ref=e29]:
            - generic [ref=e30]:
              - text: Team
              - combobox "Team" [ref=e31]:
                - option "Hala Barca" [selected]
                - option "Madridistas"
                - option "Padayapas"
                - option "Real United FC"
                - option "Team Morph"
                - option "Thenga FC"
                - option "Varcelona"
            - generic [ref=e32]:
              - text: Player
              - combobox "Player" [ref=e33]:
                - option "Alexander-Arnold • DEF • 86" [selected]
                - option "Alisson • GK • 89"
                - option "Álvarez • ATT • 87"
                - option "Antony • ATT • 81"
                - option "Araujo • DEF • 83"
                - option "Balde • DEF • 83"
                - option "Bastoni • DEF • 87"
                - option "Bellingham • MID • 90"
                - option "Benzema • ATT • 85"
                - option "Bernardo Silva • MID • 84"
                - option "Brahim • MID • 82"
                - option "Bruno Fernandes • MID • 87"
                - option "Casemiro • MID • 80"
                - option "Cherki • ATT • 81"
                - option "Courtois • GK • 89"
                - option "David Raya • GK • 87"
                - option "De Bruyne • MID • 87"
                - option "De Gea • GK • 85"
                - option "De Paul • MID • 84"
                - option "Dembélé • ATT • 90"
                - option "Diogo Costa • GK • 84"
                - option "Donnarumma • GK • 89"
                - option "Doué • ATT • 85"
                - option "Fermín • MID • 80"
                - option "Foden • MID • 85"
                - option "Gabriel • DEF • 88"
                - option "Gavi • MID • 83"
                - option "Griezmann • ATT • 85"
                - option "Gvardiol • DEF • 84"
                - option "Haaland • ATT • 90"
                - option "Hakimi • DEF • 89"
                - option "Huijsen • DEF • 82"
                - option "Kane • ATT • 89"
                - option "Kimmich • DEF • 89"
                - option "Kvaratskhelia • ATT • 87"
                - option "Lamine Yamal • ATT • 89"
                - option "Marquinhos • DEF • 87"
                - option "Martínez • GK • 85"
                - option "Mbappé • ATT • 91"
                - option "Modrić • MID • 83"
                - option "Musiala • MID • 88"
                - option "Nuno Mendes • DEF • 86"
                - option "Oblak • GK • 88"
                - option "Odegaard • MID • 87"
                - option "Onana • GK • 80"
                - option "Pacho • DEF • 86"
                - option "Palmer • ATT • 87"
                - option "Pedri • MID • 89"
                - option "Rafael Leão • ATT • 84"
                - option "Raphinha • ATT • 89"
                - option "Rashford • ATT • 80"
                - option "Rice • MID • 87"
                - option "Rodri • MID • 90"
                - option "Rodrygo • ATT • 85"
                - option "Ruben Dias • DEF • 86"
                - option "Rüdiger • DEF • 86"
                - option "Saka • ATT • 88"
                - option "Salah • ATT • 91"
                - option "Son • ATT • 85"
                - option "Stones • DEF • 82"
                - option "ter Stegen • GK • 86"
                - option "Valverde • MID • 89"
                - option "van Dijk • DEF • 90"
                - option "Vini Jr. • ATT • 89"
                - option "Vitinha • MID • 89"
            - generic [ref=e34]:
              - text: Winning Bid
              - spinbutton "Winning Bid" [ref=e35]: "13"
            - generic [ref=e36]:
              - generic [ref=e37]:
                - paragraph [ref=e38]: Current
                - paragraph [ref=e39]: ₹100 Cr
              - generic [ref=e40]:
                - paragraph [ref=e41]: After
                - paragraph [ref=e42]: ₹87 Cr
            - generic [ref=e43]:
              - button "Confirm Sale" [ref=e44] [cursor=pointer]
              - generic [ref=e45]: Enter confirms sale • / focuses search
      - complementary [ref=e46]:
        - generic [ref=e47]:
          - heading "Auction Timer" [level=3] [ref=e49]
          - generic [ref=e50]:
            - paragraph [ref=e51]: 01:00
            - generic [ref=e52]:
              - button "Start" [ref=e53] [cursor=pointer]
              - button "Reset" [ref=e54] [cursor=pointer]:
                - img [ref=e55]
                - text: Reset
        - generic [ref=e58]:
          - heading "Bidding History Feed" [level=3] [ref=e60]:
            - img [ref=e61]
            - text: Bidding History Feed
          - paragraph [ref=e66]: No actions yet. The feed will auto-save every auction event.
  - button "Open Next.js Dev Tools" [ref=e72] [cursor=pointer]:
    - img [ref=e73]
  - alert [ref=e76]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Operational Verification', () => {
  4   | 
  5   |   test('Suite 1-15: Complete Operational Stress Test', async ({ page, context }) => {
  6   |     await page.goto('http://localhost:3000/admin');
  7   |     
  8   |     // Wait for initial load
  9   |     await expect(page.locator('text=TRANSFER MARKET')).toBeVisible();
  10  |     await expect(page.locator('text=Loading auction control room...')).not.toBeVisible({ timeout: 15000 });
  11  | 
  12  |     // 1. Basic Auction Flow
> 13  |     await page.click('button[role="tab"]:has-text("Auction")'); 
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  14  |     
  15  |     // Get the Team and Player selects
  16  |     const teamSelect = page.locator('label').filter({ hasText: 'Team' }).locator('select');
  17  |     const playerSelect = page.locator('label').filter({ hasText: 'Player' }).locator('select');
  18  |     
  19  |     await teamSelect.selectOption({ index: 0 }); // First team
  20  |     const playerId = await playerSelect.evaluate((el: HTMLSelectElement) => el.options[0].value);
  21  |     const playerName = await playerSelect.evaluate((el: HTMLSelectElement) => el.options[0].text.split(' • ')[0]);
  22  |     
  23  |     // Confirm Sale
  24  |     const confirmSaleButton = page.locator('button:has-text("Confirm Sale")');
  25  |     
  26  |     // Accept the "Confirm sale" native dialog
  27  |     page.on('dialog', async dialog => {
  28  |       if (dialog.message().includes('Confirm sale')) {
  29  |         await dialog.accept();
  30  |       }
  31  |     });
  32  | 
  33  |     await confirmSaleButton.click();
  34  | 
  35  |     // Check overlay
  36  |     await expect(page.locator('text=SOLD').first()).toBeVisible();
  37  |     
  38  |     // 2. Remove from Team flow
  39  |     await page.click('button[role="tab"]:has-text("Player Pool")');
  40  |     
  41  |     // Search for the sold player
  42  |     await page.fill('[data-search]', playerName);
  43  |     
  44  |     // It should be sold, so we click "Remove"
  45  |     await page.click('button:has-text("Remove")');
  46  |     await expect(page.locator('text=removed from team')).toBeVisible();
  47  | 
  48  |     // 3. Add Player flow
  49  |     await page.fill('input[placeholder="e.g. Kylian Mbappe"]', 'Test Player Dynamico');
  50  |     await page.click('button:has-text("Add Player")');
  51  |     
  52  |     // Password protection for Add Player
  53  |     await expect(page.locator('text=Protected Action')).toBeVisible();
  54  |     await page.fill('input[type="password"]', 'change-me-for-live-event');
  55  |     await page.click('button:has-text("Confirm")');
  56  |     
  57  |     await expect(page.locator('text=Test Player Dynamico added to the pool')).toBeVisible();
  58  | 
  59  |     // 4. Mark Unavailable flow
  60  |     await page.fill('[data-search]', 'Test Player Dynamico');
  61  |     await page.click('button:has-text("Unavailable")');
  62  |     // enter WRONG password
  63  |     await page.fill('input[type="password"]', 'wrong-pass');
  64  |     await page.click('button:has-text("Confirm")');
  65  |     await expect(page.locator('text=Invalid admin password')).toBeVisible();
  66  |     
  67  |     // Cancel modal
  68  |     await page.click('button:has-text("Cancel")');
  69  | 
  70  |     // 5. Delete Player flow
  71  |     // Add a dialog handler for the Delete confirmation
  72  |     page.once('dialog', async dialog => {
  73  |       if (dialog.message().includes('permanently delete')) {
  74  |         await dialog.accept();
  75  |       }
  76  |     });
  77  |     
  78  |     await page.click('button:has-text("Delete")');
  79  |     await page.fill('input[type="password"]', 'change-me-for-live-event');
  80  |     await page.click('button:has-text("Confirm")');
  81  |     await expect(page.locator('text=deleted')).toBeVisible();
  82  | 
  83  |     // 6. Reset Auction Action
  84  |     await page.click('button[role="tab"]:has-text("Teams")');
  85  |     await page.click('button:has-text("Reset Auction")');
  86  |     await page.fill('input[type="password"]', 'change-me-for-live-event');
  87  |     await page.click('button:has-text("Confirm")');
  88  |     await expect(page.locator('text=Auction reset complete')).toBeVisible();
  89  | 
  90  |     // 7. Factory Reset
  91  |     await page.click('button:has-text("Factory Reset")');
  92  |     // Test that confirm requires "RESET"
  93  |     await page.fill('input[type="password"]', 'change-me-for-live-event');
  94  |     await page.fill('input[type="text"]', 'RESET');
  95  |     await page.click('button:has-text("Confirm")');
  96  |     await expect(page.locator('text=Factory reset complete')).toBeVisible({ timeout: 10000 });
  97  |   });
  98  | 
  99  | });
  100 | 
```