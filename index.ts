import { chromium, expect, Page } from "@playwright/test";
import {
  NO_APPOINTMENTS_MESSAGE,
  SITE_PAGE,
  SYSTEM_OUT_OF_SERVICE,
} from "./constants";

type AppointmentStatus = {
  isAvailable: boolean;
  error?: Error;
};

async function checkAppointmentStatus(
  expectedMessage: string,
): Promise<AppointmentStatus> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  let context;
  let page: Page;

  try {
    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    });

    page = await context.newPage();

    await page.goto(SITE_PAGE, { timeout: 30000 });

    const alertElement = await page.waitForSelector(".alert-danger", {
      timeout: 10000,
    });
    const alertText = await alertElement.innerText();

    const expectedText = expectedMessage.replace(/<br>/g, "");
    const normalizedText = alertText?.trim().replace(/\s+/g, " ");

    const isMessageMatching = normalizedText.includes(expectedText);

    return {
      isAvailable: !isMessageMatching,
    };
  } catch (error) {
    console.error(`Error checking appointment status: ${error.message}`);
    return {
      isAvailable: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  } finally {
    await context?.close();
    await browser.close();
  }
}

async function sendTelegramMessage(message: string) {
  const request = await fetch(
    `https://api.telegram.org/bot${
      process.env.TELEGRAM_KEY
    }/sendMessage?chat_id=${
      process.env.TELEGRAM_CHANNEL
    }&text=${encodeURIComponent(message)}`,
    { method: "GET", redirect: "follow" },
  );
  await request.json();
}

async function sendEmailMessage() {
  try {
    await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.MJ_APIKEY_PUBLIC}:${process.env.MJ_APIKEY_PRIVATE}`,
        ).toString("base64")}`,
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
  const [noAppointmentsStatus, outServiceStatus] = await Promise.all([
    checkAppointmentStatus(NO_APPOINTMENTS_MESSAGE),
    checkAppointmentStatus(SYSTEM_OUT_OF_SERVICE),
  ]);

  // Check for errors first
  if (noAppointmentsStatus.error || outServiceStatus.error) {
    console.error(
      "🔴 Error checking appointments, sending error notification...",
    );
    await sendTelegramMessage("⚠️ Error checking appointments availability");
    return;
  }

  // Check availability
  if (noAppointmentsStatus.isAvailable && outServiceStatus.isAvailable) {
    console.log("🟢 Appointments available! Sending notifications...");
    await Promise.all([
      sendEmailMessage(),
      sendTelegramMessage(
        "🚨 There are appointments available, Please go to this link: https://titulosvalidez.educacion.gob.ar/validez/detitulos/",
      ),
    ]);
  } else {
    console.log("🔵 No appointments available...");
    await sendTelegramMessage("ℹ️ There are no appointments available");
  }
}
main();
