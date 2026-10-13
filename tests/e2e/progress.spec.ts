import { test, expect, messages, taskName, type Locale } from "./fixtures";

for (const locale of ["en", "zh"] as const) {
  test(`completion survives reload, navigation, and undo (${locale})`, async ({ page, member }) => {
    const task = member.tasks.find((item) => item.type === "devotional")!;
    const row = page
      .getByRole("button", { name: taskName(task, locale), exact: true })
      .locator("..");
    await page.goto(`/${locale}/progress?day=1`);
    await row.getByRole("button", { name: "Mark complete", exact: true }).click();
    await expect(row.getByRole("button", { name: "Mark incomplete", exact: true })).toBeVisible();
    await expect(
      page.getByText(locale === "en" ? "1 missed day" : "延误 1 天", { exact: true }),
    ).toBeVisible();
    await expect.poll(() => member.completion(task.id)).not.toBeUndefined();
    await page.reload();
    await expect(row.getByRole("button", { name: "Mark incomplete", exact: true })).toBeVisible();
    // Use app links to exercise the persistent layout and ProgressContext.
    await page
      .getByRole("navigation")
      .getByRole("link", { name: messages[locale].nav.home, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/?$`));
    await page
      .getByRole("navigation")
      .getByRole("link", { name: messages[locale].nav.block, exact: true })
      .click();
    await expect(row.getByRole("button", { name: "Mark incomplete", exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${locale}/progress\\?day=1$`));
    await row.getByRole("button", { name: "Mark incomplete", exact: true }).click();
    await expect.poll(() => member.completion(task.id)).toBeUndefined();
    await expect(page).toHaveURL(new RegExp(`/${locale}/progress\\?day=1$`));
    await page.reload();
    await expect(row.getByRole("button", { name: "Mark complete", exact: true })).toBeVisible();
    await expect(
      page.getByText(locale === "en" ? "2 missed days" : "延误 2 天", { exact: true }),
    ).toBeVisible();
  });
}

test("language switching keeps saved progress", async ({ page, member }) => {
  const task = member.tasks.find((item) => item.type === "devotional")!;
  await page.goto("/en/progress?day=1");
  const row = (locale: Locale) =>
    page.getByRole("button", { name: taskName(task, locale), exact: true }).locator("..");
  await row("en").getByRole("button", { name: "Mark complete", exact: true }).click();
  await expect.poll(() => member.completion(task.id)).not.toBeUndefined();
  for (const locale of ["zh", "en"] as const) {
    await page
      .getByRole("button", { name: locale === "zh" ? "Switch to Chinese" : "Switch to English" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/progress\\?day=1$`));
    await expect(
      page.getByRole("heading", { name: messages[locale].progress.mental, exact: true }),
    ).toBeVisible();
    // Keep the selected day through language changes, as required by the handover.
    await expect(
      row(locale).getByRole("button", { name: "Mark incomplete", exact: true }),
    ).toBeVisible();
  }
});

test("mood selections and context survive reopening and reload", async ({ page, member }) => {
  const task = member.tasks.find((item) => item.type === "mood_log")!;
  await page.goto("/en/progress?day=1");
  await page.getByRole("button", { name: "Open mood log", exact: true }).click();
  await page.getByRole("button", { name: messages.en.mood.good, exact: true }).click();
  await page.getByRole("button", { name: messages.en.mood.family, exact: true }).click();
  await page.getByRole("textbox").fill("A calm day with my family.");
  await page.getByRole("button", { name: messages.en.mood.submit, exact: true }).click();
  await expect
    .poll(() => member.completion(task.id))
    .toEqual({
      entries: [{ moods: ["good"], influences: ["family"], context: "A calm day with my family." }],
    });
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    await page.getByRole("button", { name: "😄 · Family", exact: true }).click();
    await expect(page.getByRole("button", { name: "Good", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "Family", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("textbox")).toHaveValue("A calm day with my family.");
    await page.goBack();
  }
});

test("reflection autosave survives reopening and reload", async ({ page, member }) => {
  const task = member.tasks.find((item) => item.inputs?.includes("reflection"))!;
  await page.goto("/en/progress?day=1");
  await page.getByRole("button", { name: taskName(task, "en"), exact: true }).click();
  const input = page.getByRole("textbox", { name: "Reflection", exact: true });
  await input.fill("I will make time to listen today.");
  await input.blur();
  await expect
    .poll(async () => (await member.completion(task.id))?.reflection)
    .toBe("I will make time to listen today.");
  await page.goBack();
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    await page.getByRole("button", { name: taskName(task, "en"), exact: true }).click();
    await expect(input).toHaveValue("I will make time to listen today.");
    await page.goBack();
  }
});

test("exercise and duration survive reopening and reload", async ({ page, member }) => {
  const task = member.tasks.find((item) => item.type === "exercise")!;
  await page.goto("/en/progress?day=1");
  await page.getByRole("button", { name: "Open exercise log", exact: true }).click();
  await page.getByRole("button", { name: /Run/ }).click();
  await page.getByRole("spinbutton", { name: "Hours", exact: true }).fill("1");
  await page.getByRole("spinbutton", { name: "Minutes", exact: true }).fill("15");
  await page.getByRole("button", { name: "Log Activity", exact: true }).click();
  await expect
    .poll(() => member.completion(task.id))
    .toEqual({ entries: [{ sportKey: "run", hours: 1, minutes: 15 }] });
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    await page.getByRole("button", { name: /Run · 1h 15min/ }).click();
    await expect(page.getByRole("button", { name: /Run/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("spinbutton", { name: "Hours", exact: true })).toHaveValue("1");
    await expect(page.getByRole("spinbutton", { name: "Minutes", exact: true })).toHaveValue("15");
    await page.goBack();
  }
});
