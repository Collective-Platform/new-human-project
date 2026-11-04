import { test, expect, messages } from "./fixtures";

for (const locale of ["en", "zh"] as const) {
  test(`signed-out member routes go to the ${locale} public pages`, async ({ page }) => {
    for (const route of ["", "progress", "admin"]) {
      await page.goto(`/${locale}/${route}`);
      const destination = route === "" ? "landing" : "login";
      await expect(page).toHaveURL(new RegExp(`/${locale}/${destination}$`));
      await expect(page.getByRole("button", { name: "Mark complete", exact: true })).toHaveCount(0);
    }
  });
}

test.describe("onboarding", () => {
  test.use({ onboarded: false });
  test("new member must finish onboarding before using the dashboard", async ({ page, member }) => {
    await page.goto("/en/progress");
    await expect(page).toHaveURL(/\/en\/onboarding$/);
    await page
      .getByRole("textbox", { name: messages.en.onboarding.pickUsernameTitle })
      .fill(member.handle);
    await page
      .getByRole("button", { name: messages.en.onboarding.getStarted, exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/?$/);
    await page.reload();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page).toHaveURL(/\/en\/?$/);
  });
});

test("logout removes access, including reuse of the old session cookie", async ({
  page,
  member,
  context,
  baseURL,
}) => {
  await page.goto("/en/profile/settings");
  await page.getByRole("button", { name: messages.en.profile.logOut, exact: true }).click();
  await expect(page).toHaveURL(/\/en\/login$/);
  await page.goto("/en/progress");
  await expect(page).toHaveURL(/\/en\/login$/);
  await page.reload();
  await expect(page).toHaveURL(/\/en\/login$/);
  await context.addCookies([
    { name: "__session", value: member.cookie, url: baseURL!, httpOnly: true },
  ]);
  await page.goto("/en/progress");
  await expect(page).toHaveURL(/\/en\/landing$/);
  for (const locale of ["en", "zh"]) {
    for (const route of ["login", "signup"]) {
      await page.goto(`/${locale}/${route}`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/${route}$`));
    }
  }
});

test("a valid session skips login and signup", async ({ page, member }) => {
  expect(member.id).toBeGreaterThan(0);
  for (const locale of ["en", "zh"]) {
    for (const route of ["login", "signup"]) {
      await page.goto(`/${locale}/${route}`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/?$`));
    }
  }
});
