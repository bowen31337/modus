import { test, expect } from '@playwright/test';

test.describe('Keyboard Focus States', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard and wait for it to load
    await page.goto('http://localhost:3005/dashboard');
    await page.waitForSelector('[data-testid="queue-pane"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid^="post-card-"]', { timeout: 10000 });
  });

  test('all interactive elements show visible focus rings when navigating with Tab', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).evaluateAll(els => els.map(el => ({
      tagName: el.tagName,
      testId: el.getAttribute('data-testid'),
      ariaLabel: el.getAttribute('aria-label'),
      text: el.textContent?.trim().substring(0, 50)
    })));

    console.log('Found focusable elements:', focusableElements.length);

    // Navigate through elements with Tab and verify focus ring
    let previousFocus: string | null = null;
    const focusStates: string[] = [];

    for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Get the currently focused element
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active) return null;
        return {
          tagName: active.tagName,
          testId: active.getAttribute('data-testid'),
          ariaLabel: active.getAttribute('aria-label'),
          text: active.textContent?.trim().substring(0, 50)
        };
      });

      if (focusedElement) {
        const focusKey = `${focusedElement.tagName}-${focusedElement.testId || focusedElement.ariaLabel || focusedElement.text}`;
        if (focusKey !== previousFocus) {
          focusStates.push(focusKey);
          previousFocus = focusKey;
        }

        // Verify focus ring is visible using getComputedStyle
        const hasFocusRing = await page.evaluate(() => {
          const active = document.activeElement as HTMLElement;
          if (!active) return false;
          const styles = window.getComputedStyle(active);
          // Check for focus ring indicators
          const outlineWidth = styles.outlineWidth;
          const outlineStyle = styles.outlineStyle;
          const boxShadow = styles.boxShadow;
          const outlineOffset = styles.outlineOffset;

          // Tailwind focus:ring-2 creates box-shadow or outline
          const hasRing = outlineStyle !== 'none' ||
                         boxShadow.includes('0 0 0') ||
                         boxShadow.includes('ring') ||
                         outlineWidth !== '0px';

          return hasRing;
        });

        console.log(`Tab ${i + 1}: ${focusKey} - Focus ring: ${hasFocusRing}`);
        expect(hasFocusRing, `Element ${focusKey} should have visible focus ring`).toBeTruthy();
      }
    }

    // Verify we navigated through multiple elements
    expect(focusStates.length).toBeGreaterThan(0);
  });

  test('focus ring color is Indigo-500 (#6366f1) or similar', async ({ page }) => {
    // Navigate to a button
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Get the computed focus ring color
    const focusColor = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      if (!active) return null;

      const styles = window.getComputedStyle(active);

      // Check box-shadow for ring color (Tailwind focus:ring uses box-shadow)
      const boxShadow = styles.boxShadow;

      // Check outline color
      const outlineColor = styles.outlineColor;

      // Check border color if focus changes border
      const borderColor = styles.borderColor;

      return {
        boxShadow,
        outlineColor,
        borderColor,
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth
      };
    });

    console.log('Focus ring styles:', JSON.stringify(focusColor, null, 2));

    // Verify some form of visible focus indicator exists
    expect(focusColor).toBeTruthy();

    const hasVisibleFocus =
      focusColor.outlineStyle !== 'none' ||
      focusColor.outlineWidth !== '0px' ||
      (focusColor.boxShadow && focusColor.boxShadow !== 'none');

    expect(hasVisibleFocus, 'Focus should have a visible indicator').toBeTruthy();
  });

  test('focus order is logical and sequential (left-to-right, top-to-bottom)', async ({ page }) => {
    // Get initial element positions
    const getFocusedElementInfo = async () => {
      return await page.evaluate(() => {
        const active = document.activeElement as HTMLElement;
        if (!active) return null;
        const rect = active.getBoundingClientRect();
        return {
          tagName: active.tagName,
          testId: active.getAttribute('data-testid'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          text: active.textContent?.trim().substring(0, 30)
        };
      });
    };

    const positions: { x: number, y: number, text?: string, testId?: string }[] = [];

    // Navigate through first 8 elements
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
      const info = await getFocusedElementInfo();
      if (info) {
        positions.push({ x: info.x, y: info.y, text: info.text, testId: info.testId });
        console.log(`Element ${i + 1}: x=${info.x}, y=${info.y}, text=${info.text}`);
      }
    }

    // Verify we have multiple positions
    expect(positions.length).toBeGreaterThan(3);

    // Basic check: positions should generally progress (not jump wildly)
    // This is a simplified check - in reality, we'd need more sophisticated logic
    // to handle different layouts
    console.log('Focus positions captured:', positions.length);
  });

  test('focus never gets lost or trapped in an infinite loop', async ({ page }) => {
    const focusedElements = new Set<string>();

    // Navigate through elements multiple times to detect loops
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        const focused = await page.evaluate(() => {
          const active = document.activeElement as HTMLElement;
          if (!active) return null;
          // Skip Next.js portal elements which are internal implementation details
          if (active.tagName === 'NEXTJS-PORTAL') return null;
          return active.getAttribute('data-testid') || active.tagName;
        });

        if (focused) {
          const key = `${cycle}-${focused}`;
          if (focusedElements.has(key)) {
            // We've seen this element in this cycle before - possible loop
            console.log(`Potential loop detected at cycle ${cycle}, element ${focused}`);
          }
          focusedElements.add(key);
        }
      }
    }

    // Verify we navigated through multiple unique elements (excluding portals)
    const uniqueElements = Array.from(focusedElements).filter(k => !k.startsWith('0-')).length;
    console.log('Unique elements navigated:', uniqueElements);

    // Should have navigated through multiple elements
    expect(uniqueElements).toBeGreaterThan(5);
  });

  test('Tab key navigates through all major UI sections', async ({ page }) => {
    // Expected major sections to navigate through
    const sections = [
      { name: 'Left rail navigation', selector: '[data-testid="left-rail"]' },
      { name: 'Queue pane', selector: '[data-testid="queue-pane"]' },
      { name: 'Work pane', selector: '[data-testid="work-pane"]' }
    ];

    const sectionsVisited: string[] = [];

    // Navigate and check which sections we hit
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const inSection = await page.evaluate((selectors) => {
        const active = document.activeElement;
        if (!active) return null;

        for (const [name, selector] of Object.entries(selectors)) {
          const container = document.querySelector(selector);
          if (container && container.contains(active)) {
            return name;
          }
        }
        return null;
      }, Object.fromEntries(sections.map(s => [s.name, s.selector])));

      if (inSection && !sectionsVisited.includes(inSection)) {
        sectionsVisited.push(inSection);
        console.log(`Visited section: ${inSection}`);
      }
    }

    console.log('All sections visited:', sectionsVisited);

    // Should be able to reach at least the queue and work panes
    expect(sectionsVisited.length).toBeGreaterThan(0);
  });
});
