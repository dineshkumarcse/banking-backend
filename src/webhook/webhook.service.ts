import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class WebhookService {
  constructor(private readonly httpService: HttpService) {}

  async sendNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      await this.httpService.post(webhookUrl, payload).toPromise();
      console.log('Webhook notification sent successfully.');
    } catch (error) {
      console.error('Error sending webhook notification:', error);
    }
  }
}
