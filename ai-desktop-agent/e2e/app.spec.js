/**
 * E2E Tests for AI Desktop Agent
 * Using Playwright
 */

const { test, expect } = require('@playwright/test');

test.describe('AI Desktop Agent E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('/');

        // Wait for app to load
        await page.waitForLoadState('networkidle');
    });

    test('should load main application', async ({ page }) => {
        // Check if main container is visible
        await expect(page.locator('.app-container')).toBeVisible();

        // Check if title is correct
        await expect(page).toHaveTitle(/AI Desktop Agent/);
    });

    test('should display chat interface', async ({ page }) => {
        // Check if chat input is visible
        await expect(page.locator('input[placeholder*="Type your message"]')).toBeVisible();

        // Check if send button is visible
        await expect(page.locator('button:has-text("Send")')).toBeVisible();
    });

    test('should send and receive message', async ({ page }) => {
        // Type a message
        await page.fill('input[placeholder*="Type your message"]', 'Hello, AI!');

        // Click send button
        await page.click('button:has-text("Send")');

        // Wait for response
        await page.waitForSelector('.message.assistant', { timeout: 10000 });

        // Check if response is visible
        await expect(page.locator('.message.assistant')).toBeVisible();
    });

    test('should display workflow builder', async ({ page }) => {
        // Click on workflow tab
        await page.click('button:has-text("Workflows")');

        // Check if workflow builder is visible
        await expect(page.locator('.workflow-builder')).toBeVisible();

        // Check if canvas is visible
        await expect(page.locator('.workflow-canvas')).toBeVisible();
    });

    test('should create simple workflow', async ({ page }) => {
        // Click on workflow tab
        await page.click('button:has-text("Workflows")');

        // Click on create workflow button
        await page.click('button:has-text("Create Workflow")');

        // Wait for workflow editor
        await page.waitForSelector('.workflow-editor');

        // Add a node
        await page.click('button:has-text("Add Node")');

        // Select node type
        await page.click('text=Action');

        // Save workflow
        await page.click('button:has-text("Save")');

        // Check if success message appears
        await expect(page.locator('.toast.success')).toBeVisible();
    });

    test('should display settings panel', async ({ page }) => {
        // Click on settings button
        await page.click('button[aria-label="Settings"]');

        // Check if settings panel is visible
        await expect(page.locator('.settings-panel')).toBeVisible();

        // Check if API settings section is visible
        await expect(page.locator('text=API Settings')).toBeVisible();
    });

    test('should update API settings', async ({ page }) => {
        // Click on settings button
        await page.click('button[aria-label="Settings"]');

        // Click on API settings
        await page.click('text=API Settings');

        // Fill API key
        await page.fill('input[name="apiKey"]', 'test-api-key');

        // Save settings
        await page.click('button:has-text("Save")');

        // Check if success message appears
        await expect(page.locator('.toast.success')).toBeVisible();
    });

    test('should display clipboard history', async ({ page }) => {
        // Click on clipboard button
        await page.click('button[aria-label="Clipboard"]');

        // Check if clipboard panel is visible
        await expect(page.locator('.clipboard-panel')).toBeVisible();

        // Check if clipboard items are displayed
        await expect(page.locator('.clipboard-item')).toHaveCount(0); // Initially empty
    });

    test('should copy text to clipboard', async ({ page }) => {
        // Type text in chat input
        await page.fill('input[placeholder*="Type your message"]', 'Test text to copy');

        // Select text
        await page.keyboard.press('Control+A');

        // Copy text
        await page.keyboard.press('Control+C');

        // Click on clipboard button
        await page.click('button[aria-label="Clipboard"]');

        // Check if clipboard item is displayed
        await expect(page.locator('.clipboard-item')).toHaveCount(1);
    });

    test('should display automation triggers', async ({ page }) => {
        // Click on automation tab
        await page.click('button:has-text("Automation")');

        // Check if triggers section is visible
        await expect(page.locator('.triggers-section')).toBeVisible();

        // Check if add trigger button is visible
        await expect(page.locator('button:has-text("Add Trigger")')).toBeVisible();
    });

    test('should create automation trigger', async ({ page }) => {
        // Click on automation tab
        await page.click('button:has-text("Automation")');

        // Click on add trigger button
        await page.click('button:has-text("Add Trigger")');

        // Select trigger type
        await page.click('text=Time-based');

        // Set trigger time
        await page.fill('input[type="time"]', '09:00');

        // Save trigger
        await page.click('button:has-text("Save")');

        // Check if trigger is displayed
        await expect(page.locator('.trigger-item')).toBeVisible();
    });

    test('should display MCP resources', async ({ page }) => {
        // Click on MCP tab
        await page.click('button:has-text("MCP")');

        // Check if resources section is visible
        await expect(page.locator('.mcp-resources')).toBeVisible();

        // Check if resources are listed
        await expect(page.locator('.resource-item')).toHaveCount(8); // 8 default resources
    });

    test('should call MCP tool', async ({ page }) => {
        // Click on MCP tab
        await page.click('button:has-text("MCP")');

        // Click on tools section
        await page.click('text=Tools');

        // Select a tool
        await page.click('text=capture_screen');

        // Click on execute button
        await page.click('button:has-text("Execute")');

        // Wait for result
        await page.waitForSelector('.tool-result', { timeout: 10000 });

        // Check if result is displayed
        await expect(page.locator('.tool-result')).toBeVisible();
    });

    test('should display browser automation panel', async ({ page }) => {
        // Click on browser automation tab
        await page.click('button:has-text("Browser")');

        // Check if browser panel is visible
        await expect(page.locator('.browser-panel')).toBeVisible();

        // Check if URL input is visible
        await expect(page.locator('input[placeholder*="Enter URL"]')).toBeVisible();
    });

    test('should navigate to URL', async ({ page }) => {
        // Click on browser automation tab
        await page.click('button:has-text("Browser")');

        // Enter URL
        await page.fill('input[placeholder*="Enter URL"]', 'https://example.com');

        // Click navigate button
        await page.click('button:has-text("Navigate")');

        // Wait for page to load
        await page.waitForSelector('.browser-preview', { timeout: 10000 });

        // Check if preview is displayed
        await expect(page.locator('.browser-preview')).toBeVisible();
    });

    test('should display OCR panel', async ({ page }) => {
        // Click on OCR tab
        await page.click('button:has-text("OCR")');

        // Check if OCR panel is visible
        await expect(page.locator('.ocr-panel')).toBeVisible();

        // Check if upload button is visible
        await expect(page.locator('button:has-text("Upload Image")')).toBeVisible();
    });

    test('should recognize text from image', async ({ page }) => {
        // Click on OCR tab
        await page.click('button:has-text("OCR")');

        // Upload test image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles('./tests/fixtures/test-text.png');

        // Click recognize button
        await page.click('button:has-text("Recognize")');

        // Wait for result
        await page.waitForSelector('.ocr-result', { timeout: 10000 });

        // Check if result is displayed
        await expect(page.locator('.ocr-result')).toBeVisible();
    });

    test('should display OAuth providers', async ({ page }) => {
        // Click on OAuth tab
        await page.click('button:has-text("OAuth")');

        // Check if providers are listed
        await expect(page.locator('.oauth-provider')).toHaveCount(5); // 5 providers
    });

    test('should initiate OAuth flow', async ({ page }) => {
        // Click on OAuth tab
        await page.click('button:has-text("OAuth")');

        // Click on Google provider
        await page.click('.oauth-provider:has-text("Google")');

        // Click connect button
        await page.click('button:has-text("Connect")');

        // Check if authorization URL is displayed
        await expect(page.locator('.auth-url')).toBeVisible();
    });

    test('should display vector store panel', async ({ page }) => {
        // Click on vector store tab
        await page.click('button:has-text("Vector Store")');

        // Check if vector store panel is visible
        await expect(page.locator('.vector-store-panel')).toBeVisible();

        // Check if collections are listed
        await expect(page.locator('.collection-item')).toBeVisible();
    });

    test('should add document to vector store', async ({ page }) => {
        // Click on vector store tab
        await page.click('button:has-text("Vector Store")');

        // Click on add document button
        await page.click('button:has-text("Add Document")');

        // Enter document content
        await page.fill('textarea[name="content"]', 'Test document content');

        // Save document
        await page.click('button:has-text("Save")');

        // Check if success message appears
        await expect(page.locator('.toast.success')).toBeVisible();
    });

    test('should display media editing panel', async ({ page }) => {
        // Click on media editing tab
        await page.click('button:has-text("Media")');

        // Check if media editing panel is visible
        await expect(page.locator('.media-panel')).toBeVisible();

        // Check if upload button is visible
        await expect(page.locator('button:has-text("Upload Video")')).toBeVisible();
    });

    test('should trim video', async ({ page }) => {
        // Click on media editing tab
        await page.click('button:has-text("Media")');

        // Upload test video
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles('./tests/fixtures/test-video.mp4');

        // Set trim parameters
        await page.fill('input[name="startTime"]', '0');
        await page.fill('input[name="endTime"]', '5');

        // Click trim button
        await page.click('button:has-text("Trim")');

        // Wait for result
        await page.waitForSelector('.media-result', { timeout: 30000 });

        // Check if result is displayed
        await expect(page.locator('.media-result')).toBeVisible();
    });

    test('should handle errors gracefully', async ({ page }) => {
        // Type invalid command
        await page.fill('input[placeholder*="Type your message"]', '/invalid-command');

        // Click send button
        await page.click('button:has-text("Send")');

        // Check if error message is displayed
        await expect(page.locator('.error-message')).toBeVisible();
    });

    test('should display keyboard shortcuts', async ({ page }) => {
        // Press Ctrl+K to open shortcuts
        await page.keyboard.press('Control+K');

        // Check if shortcuts modal is visible
        await expect(page.locator('.shortcuts-modal')).toBeVisible();

        // Check if shortcuts are listed
        await expect(page.locator('.shortcut-item')).toHaveCount(10);
    });

    test('should display help documentation', async ({ page }) => {
        // Click on help button
        await page.click('button[aria-label="Help"]');

        // Check if help panel is visible
        await expect(page.locator('.help-panel')).toBeVisible();

        // Check if documentation is displayed
        await expect(page.locator('.documentation')).toBeVisible();
    });

    test('should persist settings', async ({ page, context }) => {
        // Click on settings button
        await page.click('button[aria-label="Settings"]');

        // Update a setting
        await page.check('input[name="darkMode"]');

        // Save settings
        await page.click('button:has-text("Save")');

        // Reload page
        await page.reload();

        // Check if setting is persisted
        await page.click('button[aria-label="Settings"]');
        await expect(page.locator('input[name="darkMode"]')).toBeChecked();
    });

    test('should handle network errors', async ({ page }) => {
        // Simulate network offline
        await context.setOffline(true);

        // Try to send message
        await page.fill('input[placeholder*="Type your message"]', 'Test message');
        await page.click('button:has-text("Send")');

        // Check if offline message is displayed
        await expect(page.locator('.offline-message')).toBeVisible();

        // Restore network
        await context.setOffline(false);
    });

    test('should display analytics dashboard', async ({ page }) => {
        // Click on analytics tab
        await page.click('button:has-text("Analytics")');

        // Check if analytics dashboard is visible
        await expect(page.locator('.analytics-dashboard')).toBeVisible();

        // Check if charts are displayed
        await expect(page.locator('.chart')).toBeVisible();
    });
});
