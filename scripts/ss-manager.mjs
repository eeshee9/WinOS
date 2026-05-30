import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

// Login as manager
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "mohit@eagleeyedigital.io");
await page.getByRole("button", { name: /send code/i }).click();
await page.waitForTimeout(2500);
const body = await page.evaluate(() => document.body.innerText);
const otp = body.match(/\b(\d{6})\b/)?.[1];
if (!otp) { console.log("no OTP"); await browser.close(); process.exit(1); }
await page.fill('input[name="otp"]', otp);
await page.getByRole("button", { name: /verify|confirm|sign in/i }).click();
await page.waitForTimeout(2500);

const shots = [
  ["dsm-all", "/dsm/all"],
  ["dsm-my", "/dsm/my"],
  ["dsr-manage", "/dsr/manage"],
];

for (const [name, path] of shots) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `scripts/mgr-${name}.png` });
  console.log("✓", name);
}

// member review pages
const memberLinks = await page.$$eval('a[href^="/dsm/member/"]', els => [...new Set(els.map(e => e.href))]);
if (memberLinks[0]) {
  await page.goto(memberLinks[0], { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "scripts/mgr-dsm-member.png" });
  console.log("✓ dsm-member");
}

const dsrMemberLinks = await page.$$eval('a[href^="/dsr/member/"]', els => [...new Set(els.map(e => e.href))].slice(0, 1));
if (dsrMemberLinks[0]) {
  await page.goto(dsrMemberLinks[0], { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "scripts/mgr-dsr-member.png" });
  console.log("✓ dsr-member");
}

await browser.close();
