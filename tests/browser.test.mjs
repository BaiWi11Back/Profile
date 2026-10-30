// Browser acceptance: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node --test tests/browser.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
assert.ok(modulePath, 'Set PLAYWRIGHT_MODULE to an installed Playwright index.mjs');
const { chromium } = await import(pathToFileURL(modulePath).href);
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';

test('real Chromium: responsive pages, navigation, menu, clipboard, and private-file isolation', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    const routes = ['/', '/research/shandong-water-quality/', '/research/tire-rubber-particles/'];
    for (const route of routes) {
      for (const width of [1440, 1024, 768, 520, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(base + route);
        assert.equal(response.status(), 200);
        await page.evaluate(() => document.fonts.ready);
        const state = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          h1: document.querySelectorAll('h1').length,
          brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
        }));
        assert.ok(state.scroll <= state.width, `${route} overflows at ${width}: ${JSON.stringify(state)}`);
        assert.equal(state.h1, 1);
        assert.deepEqual(state.brokenImages, []);
        console.log(`PASS layout ${route} ${width}px`);
      }
    }
    await page.goto(base);
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.locator('.menu-toggle');
    const nav = page.locator('#primary-nav');
    assert.equal(await nav.isVisible(), false);
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await nav.isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await nav.isVisible(), false);
    assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
    await toggle.click();
    await nav.locator('a[href="#research"]').click();
    assert.equal(await nav.isVisible(), false);
    assert.equal(new URL(page.url()).hash, '#research');
    await page.locator('a[href="research/shandong-water-quality/"]').click();
    assert.ok(page.url().endsWith('/research/shandong-water-quality/'));
    await page.locator('.back-link').click();
    assert.equal(new URL(page.url()).hash, '#research');
    await page.locator('[data-copy-email]').click();
    await page.waitForFunction(() => document.querySelector('.copy-status').textContent === 'Email address copied.');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'bcyxyhysj@163.com');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base);
    const links = await page.locator('a').evaluateAll(els => els.map(el => el.href));
    for (const link of new Set(links.filter(url => url.startsWith(base)))) {
      const response = await context.request.get(link.split('#')[0]);
      assert.equal(response.status(), 200, link);
    }
    for (const file of ['大学申请个人网站.docx', '网站内容规划.md', 'preview.py']) {
      const response = await context.request.get(base + '/' + encodeURIComponent(file));
      assert.equal(response.status(), 404);
    }
    const fontState = await page.evaluate(() => ({
      display: document.fonts.check('500 40px "Cormorant Garamond"'),
      body: document.fonts.check('400 15px "DM Sans"'),
      title: document.title,
    }));
    console.log('FONT AND TITLE', JSON.stringify(fontState));
    await page.setViewportSize({ width: 390, height: 844 });
    const legibility = await page.evaluate(() => ({
      body: parseFloat(getComputedStyle(document.querySelector('.hero-intro')).fontSize),
      caption: parseFloat(getComputedStyle(document.querySelector('.hero-figure figcaption')).fontSize),
      project: parseFloat(getComputedStyle(document.querySelector('.inquiry-grid p:not(.eyebrow)')).fontSize),
    }));
    assert.ok(legibility.body >= 14 && legibility.caption >= 10 && legibility.project >= 14,
      `Mobile text is too small: ${JSON.stringify(legibility)}`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (process.env.SCREENSHOT_DIR) {
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'home-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'home-mobile.png'), fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log('PASS mobile menu, Escape focus, research links, clipboard, private files, JS errors');
  } finally {
    await context.close();
    await browser.close();
  }
});

test('content and navigation stay accessible without JavaScript', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    await page.goto(base);
    assert.equal(await page.locator('#primary-nav a[href="#research"]').isVisible(), true);
    assert.equal(await page.locator('#research').isVisible(), true);
    assert.equal(await page.locator('#practice').isVisible(), true);
  } finally {
    await browser.close();
  }
});
