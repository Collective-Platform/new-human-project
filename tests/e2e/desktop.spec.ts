import { test, expect, messages } from "./fixtures";

test("member can navigate on desktop but cannot open admin data", async ({ page, member }) => {
  await page.goto("/en");
  // Dashboard hydration writes the encoded timezone cookie. Wait before clicking.
  await expect
    .poll(
      async () => (await page.context().cookies()).find((cookie) => cookie.name === "tz")?.value,
    )
    .toBe(encodeURIComponent("Asia/Kuala_Lumpur"));
  await page
    .getByRole("navigation")
    .getByRole("link", { name: messages.en.nav.block, exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/progress$/);
  await expect(page.getByRole("heading", { name: "Mental", exact: true })).toBeVisible();
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole("heading", { name: "Admin", exact: true })).toHaveCount(0);
  expect(member.id).toBeGreaterThan(0);
});

test.describe("admin", () => {
  test.use({ memberRole: "admin" });
  test("admin can open the admin page and see the prepared member", async ({ page, member }) => {
    await page.goto("/en/admin");
    await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();
    await expect(page.getByText(member.email, { exact: true }).first()).toBeVisible();
  });
});
