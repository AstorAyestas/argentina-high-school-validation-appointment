import { chromium, expect } from "@playwright/test";
import { NO_APPOINTMENTS_MESSAGE, SITE_PAGE } from "./constants";

async function checkAppointmentAvailability() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const message = new RegExp(NO_APPOINTMENTS_MESSAGE);

  try {
    await page.goto(SITE_PAGE);
    const expectedText = NO_APPOINTMENTS_MESSAGE.replace(/<br>/g, "");

    const alertText = await page.locator(".alert-danger").innerText();
    const normalizedText = alertText?.trim().replace(/\s+/g, " ");

    expect(normalizedText).toContain(expectedText);
    return false;
  } catch (error) {
    console.error("🪚 error:", error);
    return true;
  } finally {
    await browser.close();
  }
}

async function sendTelegramMessage(message: string) {
  const request = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_KEY}/sendMessage?chat_id=${process.env.TELEGRAM_CHANNEL}&text=${encodeURIComponent(message)}`,
    { method: "GET", redirect: "follow" },
  );
  const response = await request.json();
}

async function sendEmailMessage() {
  try {
    await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.MJ_APIKEY_PUBLIC}:${process.env.MJ_APIKEY_PRIVATE}`).toString("base64")}`,
      },
      body: JSON.stringify({
        SandboxMode: false,
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_FROM,
              Name: process.env.EMAIL_FROM_NAME,
            },
            To: [
              {
                Email: process.env.EMAIL_TO,
                Name: process.env.EMAIL_TO_NAME,
              },
              {
                Email: process.env.EMAIL_FROM,
                Name: process.env.EMAIL_FROM_NAME,
              },
            ],
            Subject: "🚨There are appointments available",
            TextPart:
              "There are appointments available to convalidate your high school diploma from a country with an agreement. Please go to this link: https://titulosvalidez.educacion.gob.ar/validez/detitulos/",
            HTMLPart:
              'There are appointments available to convalidate your high school diploma from a country with an agreement. Please go to this <a href="https://titulosvalidez.educacion.gob.ar/validez/detitulos/">link</a>.',
          },
        ],
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  const appointmentAvailable = await checkAppointmentAvailability();
  if (appointmentAvailable) {
    console.log("🪚 Sending 🚨There are appointments available...");
    await sendEmailMessage();
    await sendTelegramMessage("🚨There are appointments available");
  } else {
    console.log("🪚 Sending There are no appointments available...");
    await sendTelegramMessage("There are no appointments available");
  }
}

main();
