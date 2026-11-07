import type { BrowserContext } from "@playwright/test";
import { test, expect, messages } from "./fixtures";
import { getBlockLabel } from "../../src/lib/block-names";

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

test.describe("group invite links", () => {
  const signIn = async (context: BrowserContext, cookie: string, baseURL: string) =>
    context.addCookies([
      { name: "__session", value: cookie, url: baseURL, httpOnly: true, sameSite: "Lax" },
    ]);

  for (const locale of ["en", "zh"] as const) {
    test(`a signed-out visitor returns to the ${locale} invite after login`, async ({
      page,
      context,
      member,
      baseURL,
    }) => {
      const inviteCode = await member.createGroupPlan();
      await context.clearCookies({ name: "__session" });
      // Email and code delivery are outside this test. Only the page flow is real.
      await page.route("**/api/auth/otp/request", (route) => route.fulfill({ json: { ok: true } }));
      await page.route("**/api/auth/otp/verify", async (route) => {
        await signIn(context, member.cookie, baseURL!);
        await route.fulfill({ json: { ok: true } });
      });

      await page.goto(`/${locale}/join/${inviteCode}`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?next=%2Fjoin%2F${inviteCode}$`));
      await expect(page.getByRole("link", { name: "Sign up", exact: true })).toHaveAttribute(
        "href",
        new RegExp(`/signup\\?next=%2Fjoin%2F${inviteCode}$`),
      );

      await page.getByPlaceholder("Enter your email...").fill(member.email);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/login/verify\\?.*next=%2Fjoin`));
      await page.locator("input[autocomplete='one-time-code']").fill("123456");
      await expect(page).toHaveURL(new RegExp(`/${locale}/join/${inviteCode}$`));
      await expect(
        page.getByRole("heading", { name: messages[locale].plans.joinTitle }),
      ).toBeVisible();
    });
  }

  test("a return path to another page is ignored after login", async ({
    page,
    context,
    member,
    baseURL,
  }) => {
    await context.clearCookies({ name: "__session" });
    await page.route("**/api/auth/otp/verify", async (route) => {
      await signIn(context, member.cookie, baseURL!);
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto(
      `/en/login/verify?email=a%40example.invalid&next=${encodeURIComponent("/admin")}`,
    );
    await page.locator("input[autocomplete='one-time-code']").fill("123456");
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test.describe("new member", () => {
    test.use({ onboarded: false });
    test("finishes onboarding, returns to the invite and joins the group", async ({
      page,
      member,
    }) => {
      const inviteCode = await member.createGroupPlan();
      await page.goto(`/en/join/${inviteCode}`);
      await expect(page).toHaveURL(new RegExp(`/en/onboarding\\?next=%2Fjoin%2F${inviteCode}$`));
      await page
        .getByRole("textbox", { name: messages.en.onboarding.pickUsernameTitle })
        .fill(member.handle);
      await page
        .getByRole("button", { name: messages.en.onboarding.getStarted, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/en/join/${inviteCode}$`));
      await page.getByRole("button", { name: messages.en.plans.join, exact: true }).click();
      await expect(page).toHaveURL(/\/en\/progress\/[0-9a-f-]{36}/);
      // Block 1 twice: the foundation plan from onboarding and the group plan.
      await expect.poll(() => member.planBlocks()).toEqual([1, 1]);
    });
  });
});

test.describe("onboarding", () => {
  test.use({ onboarded: false });
  test("new member must finish onboarding, then lands in their Ephesians plan", async ({
    page,
    member,
  }) => {
    await page.goto("/en/progress");
    await expect(page).toHaveURL(/\/en\/onboarding$/);
    await page
      .getByRole("textbox", { name: messages.en.onboarding.pickUsernameTitle })
      .fill(member.handle);
    await page
      .getByRole("button", { name: messages.en.onboarding.getStarted, exact: true })
      .click();
    // A new member lands inside their Ephesians plan, ready for day 1.
    await expect(page).toHaveURL(/\/en\/progress\/[0-9a-f-]{36}/);
    await page.reload();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page).toHaveURL(/\/en\/progress\/[0-9a-f-]{36}/);
  });

  test("onboarding starts block 1 (Ephesians) once", async ({ page, member }) => {
    await page.goto("/en/onboarding");
    await page
      .getByRole("textbox", { name: messages.en.onboarding.pickUsernameTitle })
      .fill(member.handle);
    await page
      .getByRole("button", { name: messages.en.onboarding.getStarted, exact: true })
      .click();
    await expect.poll(() => member.planBlocks()).toEqual([1]);
    // The plan is in the member's list, and a reload does not add a second one.
    await page.goto("/en/progress");
    await expect(page.getByText(getBlockLabel(1, "en")).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(getBlockLabel(1, "en")).first()).toBeVisible();
    expect(await member.planBlocks()).toEqual([1]);
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
