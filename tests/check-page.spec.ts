import { test, expect } from "@playwright/test";
import {
  NO_APPOINTMENTS_MESSAGE,
  SITE_PAGE,
  SYSTEM_OUT_OF_SERVICE,
} from "../constants";
test("check is there are appointments available", async ({ page }) => {
  await page.goto(SITE_PAGE);
  const expectedText = NO_APPOINTMENTS_MESSAGE.replace(/<br>/g, "");

  const alertText = await page.locator(".alert-danger").innerText();
  const normalizedText = alertText?.trim().replace(/\s+/g, " ");

  expect(normalizedText).toContain(expectedText);
});

test("check if the service is out of service", async ({ page }) => {
  await page.goto(SITE_PAGE);
  const expectedText = SYSTEM_OUT_OF_SERVICE.replace(/<br>/g, "");
  const alertText = await page.locator(".alert-danger").innerText();
  const normalizedText = alertText?.trim().replace(/\s+/g, " ");
  expect(normalizedText).toContain(expectedText);
});
