import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  @Post()
  @HttpCode(HttpStatus.OK) // Return 200 OK on success
  handleWebhook(@Body() body: any) {
    // Capture the event, timestamp, and message
    const event = body.event || 'Unknown Event';
    const timestamp = new Date().toISOString();
    const message = body.message || 'No message provided';

    // Logging the incoming data for debugging
    console.log('Received Webhook:', body);
    console.log('Event:', event);
    console.log('Timestamp:', timestamp);
    console.log('Message:', message);

    // Return a response with additional details
    return {
      message: 'Webhook received successfully',
      event,
      timestamp,
      details: message,
    };
  }
}
