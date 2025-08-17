# Gold-Dollar-Crypto-Price-Tracker-Telegram-Bot
A production-ready JavaScript bot that tracks gold, USD, and selected cryptocurrencies 24/7. It sends hourly updates to Telegram with price changes, highlighting increases (green), decreases (red), and neutral moves (white) for clear real-time market monitoring. You can see the reslut in my telegram channel HERE: https://t.me/currency_crypto_dollar

# Setup (Step by Step)
Prerequisites

A Telegram account.

A Telegram bot token from @BotFather.

A Telegram channel or group where the bot is added as Admin.

A Cloudflare account (to run a Worker).


# 1) Create your Telegram bot

Open Telegram and message @BotFather.

Create a new bot and copy the API token (you’ll use this as tgBotToken).

Add the bot as Admin to your channel or group (you’ll use its ID as tgChannel).


# 2) Create a Cloudflare Worker

In Cloudflare Dashboard go to Workers & Pages → Create Worker → Deploy → Edit code.

Delete the default “Hello World!” code.

Paste the code from this repository (the file you downloaded/cloned).


# 3) Set environment variables

In your Worker, open Settings → Variables (or Variables & Secrets).

Add:

tgBotToken = your Telegram bot API token from @BotFather.

tgChannel = your Telegram channel/group ID where the bot is admin.

Tip: For channels, this may be the channel username (e.g., @mychannel) or a numeric ID. Make sure the bot has posting permission.


# 4) Create a Cloudflare KV namespace

Open a new tab and go to Cloudflare Dashboard: https://dash.cloudflare.com

Go to Storage & Databases → KV → Create.

In Namespace name, enter a name (e.g., PRice) and click Add.


# 5) Bind the KV to your Worker

Go back to Workers & Pages, open your Worker → Settings.

Go to Bindings → Add binding → choose KV namespace.

Set Variable name to PRICE_link.

Select the KV namespace you just created (e.g., PRice).

Click Deploy.


# 6) Verify the Worker

In your Worker overview, click Visit.

If you see “Messages sent to Telegram”, you’re all set!

If you visit before binding KV, you may see an error—that’s expected. Bind the KV (step 5) and deploy again.


# 7) Schedule hourly execution (choose one)
Option A — Cloudflare Cron Triggers (recommended)

Go to your Worker → Settings → Triggers.

Under Cron Triggers, click Add.

Use a cron expression for your schedule, e.g. 0 * * * * for every hour.

Save.

Option B — External Cron Service

Use a service like cron-job.org.

Add your Worker URL (e.g., https://<your-worker>.<subdomain>.workers.dev) and set the interval (e.g., hourly).


# Summary of configuration

tgBotToken: Telegram bot API token from @BotFather.

tgChannel: Your Telegram channel/group ID where the bot is admin.

PRICE_link (KV binding): Cloudflare KV namespace binding used by the Worker.
