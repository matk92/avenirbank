import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { PushService } from './push.service';

@Controller()
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('push/vapid-public-key')
  async getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Body() body: any, @Req() req: any) {
    await this.pushService.upsertSubscriptionForUser(req.user.sub, body);
    return { ok: true };
  }

  @Post('push/unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Body() body: { endpoint?: string }, @Req() req: any) {
    if (body?.endpoint) {
      await this.pushService.removeSubscriptionByEndpoint(req.user.sub, body.endpoint);
    }
    return { ok: true };
  }
}