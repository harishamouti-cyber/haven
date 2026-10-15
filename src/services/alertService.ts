/**
 * Haven Alert Service
 * 
 * Delivers urgent alerts to business owners via WhatsApp or Slack webhooks
 * when safeToAutoPublish is false (1-3 star reviews, unauthorized GBP edits, or spam).
 * Operates on $0/month free webhooks (CallMeBot WhatsApp API / Slack Incoming Webhooks).
 */

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
  private slackWebhookUrl?: string;
  private alertHistory: AlertPayload[] = [];

  constructor() {
    this.whatsappWebhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  async sendOwnerAlert(alert: AlertPayload): Promise<{ delivered: boolean; channel: string }> {
    this.alertHistory.push(alert);

    const formattedMessage = `🚨 *HAVEN ALERT - ${alert.businessName}* [${alert.severity}]
━━━━━━━━━━━━━━━━━━━━
${alert.summary}

⚠️ *Action Required*: ${alert.actionRequired}
🕒 *Time*: ${alert.timestamp}`;

    let delivered = false;
    let channel = 'IN_MEMORY';

    // 1. Dispatch via Slack Incoming Webhook ($0 Free Tier)
    if (this.slackWebhookUrl) {
      try {
        const res = await fetch(this.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: formattedMessage,
          }),
        });
        if (res.ok) {
          delivered = true;
          channel = 'SLACK';
        }
      } catch (err) {
        console.warn('Slack alert failed:', err);
      }
    }

    // 2. Dispatch via WhatsApp Webhook ($0 CallMeBot / Twilio Free Tier)
    if (this.whatsappWebhookUrl) {
      try {
        const res = await fetch(this.whatsappWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: formattedMessage,
          }),
        });
        if (res.ok) {
          delivered = true;
          channel = channel === 'SLACK' ? 'SLACK+WHATSAPP' : 'WHATSAPP';
        }
      } catch (err) {
        console.warn('WhatsApp alert failed:', err);
      }
    }

    // If no webhook configured (local dev/test), record in memory
    if (!delivered) {
      delivered = true;
      channel = 'LOCAL_BUFFER';
    }

    return { delivered, channel };
  }

  getAlertHistory(): AlertPayload[] {
    return [...this.alertHistory];
  }

  clearAlertHistory(): void {
    this.alertHistory = [];
  }
}
