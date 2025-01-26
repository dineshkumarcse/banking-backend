export default () => ({
  webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3000/webhook',
});
