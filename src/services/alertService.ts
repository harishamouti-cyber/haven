/**
 * Haven Multi-Channel Owner Alert Service
 * 
 * Delivers urgent alerts to business owners via:
 * 1. WhatsApp (via CallMeBot API or Twilio)
 * 2. Telegram Bot API ($0/month, unlimited, instant setup via @BotFather)
 * 3. Discord Webhook ($0/month, instant setup)
 * 4. Slack Incoming Webhook ($0/month)
 */

try {
  process.loadEnvFile();
} catch {
  // Ignore if .env doesn't exist
}

export interface AlertPayload {
  businessName: string;
  severity: 'URGENT' | 'WARNING' | 'INFO';
  summary: string;
  fullContent?: string;
  actionRequired: string;
  timestamp: string;
}

export class AlertService {
  private whatsappWebhookUrl?: string;
  private callmebotPhone?: string;
  private callmebotApiKey?: string;
  private telegramBotToken?: string;
  private telegramChatId?: string;
  private discordWebhookUrl?: string;
  private slackWebhookUrl?: string;
  private alertHistory: AlertPayload[] = [];

  constructor() {
    this.whatsappWebhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    this.callmebotPhone = process.env.CALLMEBOT_PHONE;
    this.callmebotApiKey = process.env.CALLMEBOT_APIKEY;
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  async sendOwnerAlert(alert: AlertPayload): Promise<{ delivered: boolean; channel: string; channels: string[] }> {
    this.alertHistory.push(alert);

    const formattedMessage = `🚨 *HAVEN ALERT - ${alert.businessName}* [${alert.severity}]
━━━━━━━━━━━━━━━━━━━━
${alert.summary}

⚠️ *Action Required*: ${alert.actionRequired}
🕒 *Time*: ${alert.timestamp}`;

    const deliveredChannels: string[] = [];

    // 1. CallMeBot WhatsApp API (Direct GET request)
    if (this.callmebotPhone && this.callmebotApiKey) {
      try {
        const encodedText = encodeURIComponent(formattedMessage);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${this.callmebotPhone}&text=${encodedText}&apikey=${this.callmebotApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          deliveredChannels.push('CALLMEBOT_WHATSAPP');
        }
      } catch (err) {
        console.warn('CallMeBot WhatsApp alert failed:', err);
      }
    } else if (this.whatsappWebhookUrl) {
      try {
        const res = await fetch(this.whatsappWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: formattedMessage }),
        });
        if (res.ok) deliveredChannels.push('WHATSAPP_WEBHOOK');
      } catch (err) {
        console.warn('WhatsApp webhook alert failed:', err);
      }
    }

    // 2. Telegram Bot API ($0 Unlimited Instant Free Channel)
    if (this.telegramBotToken && this.telegramChatId) {
      try {
        const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.telegramChatId,
            text: formattedMessage,
            parse_mode: 'Markdown',
          }),
        });
        if (res.ok) deliveredChannels.push('TELEGRAM');
      } catch (err) {
        console.warn('Telegram alert failed:', err);
      }
    }

    // 3. Discord Webhook ($0 Free Instant Channel)
    if (this.discordWebhookUrl) {
      try {
        const res = await fetch(this.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: formattedMessage }),
        });
        if (res.ok) deliveredChannels.push('DISCORD');
      } catch (err) {
        console.warn('Discord alert failed:', err);
      }
    }

    // 4. Slack Incoming Webhook
    if (this.slackWebhookUrl) {
      try {
        const res = await fetch(this.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: formattedMessage }),
        });
        if (res.ok) deliveredChannels.push('SLACK');
      } catch (err) {
        console.warn('Slack alert failed:', err);
      }
    }

    if (deliveredChannels.length === 0) {
      deliveredChannels.push('LOCAL_BUFFER');
    }

    return {
      delivered: true,
      channel: deliveredChannels.join('+'),
      channels: deliveredChannels,
    };
  }

  getAlertHistory(): AlertPayload[] {
    return [...this.alertHistory];
  }

  clearAlertHistory(): void {
    this.alertHistory = [];
  }
}
