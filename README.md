# Argentina High School Diploma Validation Appointment Checker

Automated tool that checks for available appointments on the Argentina Ministry of Education website for validating foreign high school diplomas.

## Features

- Automated checking of appointment availability
- Notifications via:
  - Telegram messages
  - Email notifications using Mailjet

## Setup

1. Clone the repository
2. Install dependencies:

```sh
npm ci
```

3. Install Playwright dependencies:

```sh
npx playwright install --with-deps chromium
```

4. Create a `.env` file with the following variables:

```sh
TELEGRAM_KEY=your_telegram_bot_token
TELEGRAM_CHANNEL=your_telegram_channel_id
MJ_APIKEY_PUBLIC=your_mailjet_public_key
MJ_APIKEY_PRIVATE=your_mailjet_private_key
EMAIL_FROM=sender@email.com
EMAIL_FROM_NAME=Sender Name
EMAIL_TO=recipient@email.com
EMAIL_TO_NAME=Recipient Name
```

## Usage

### Local Development

Run the appointment checker:

```sh
npm run check

Run the appointment checker in the github action:

```sh
npm run check-ci

```

Run tests:

```sh
npm run test              # Run tests in Chromium
npm run test-with-ui      # Run tests with Playwright UI
npm run show-report      # View test reports
```

### GitHub Actions

The project includes a GitHub workflow that can be run:

- Manually through workflow_dispatch
- Automatically on schedule (commented by default)

To enable automatic checking, uncomment the schedule section in `.github/workflows/check-appointment-job.yml`:

```yml
schedule:
  - cron: "0 * * * *" # Runs every hour
```

## Requirements

- Node.js v23.7.0 (specified in .nvmrc)
- NPM
- Telegram Bot Token
- Mailjet API Keys
