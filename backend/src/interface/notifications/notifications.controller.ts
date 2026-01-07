import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { filter } from 'rxjs/operators';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    sub: string;
    email: string;
    role: string;
  };
}

@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getNotificationsForUser(req.user.id);
  }

  @Post('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const result = await this.notificationsService.markNotificationAsRead(id, req.user.id);
    if (!result) {
      throw new ForbiddenException();
    }
    return result;
  }

  @Get('activities')
  @UseGuards(JwtAuthGuard)
  async getActivities() {
    return this.notificationsService.getActivities();
  }

  @Post('advisor/activities')
  @UseGuards(JwtAuthGuard)
  async createActivity(
    @Body() body: { title: string; description: string },
    @Req() req: any,
  ) {
    if (req.user.role !== 'ADVISOR' && req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException();
    }
    const result = await this.notificationsService.createActivity(
      req.user.id,
      body.title,
      body.description,
    );
    if (!result) {
      throw new ForbiddenException();
    }
    return result;
  }

  @Post('advisor/notifications')
  @UseGuards(JwtAuthGuard)
  async sendNotification(
    @Body() body: { clientId: string; message: string },
    @Req() req: any,
  ) {
    if (req.user.role !== 'ADVISOR' && req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException();
    }
    const result = await this.notificationsService.sendNotificationToClient(
      req.user.id,
      body.clientId,
      body.message,
    );
    if (!result) {
      throw new ForbiddenException();
    }
    return result;
  }

  @Get('advisor/notifications/recent')
  @UseGuards(JwtAuthGuard)
  async getRecentNotifications(@Req() req: any) {
    if (req.user.role !== 'ADVISOR' && req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException();
    }
    return this.notificationsService.getRecentNotifications();
  }

  @Get('sse/notifications')
  async sseNotifications(
    @Headers('authorization') authHeader: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    let userId: string;
    try {
      const tokenFromQuery = req.query?.token as string;
      const tokenFromHeader = authHeader?.replace('Bearer ', '');
      const token = tokenFromQuery || tokenFromHeader;
      if (!token) {
        res.status(401).send('Unauthorized');
        return;
      }
      const payload = await this.jwtService.verifyAsync(token);
      userId = payload.sub;
    } catch {
      res.status(401).send('Unauthorized');
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    const subscription = this.notificationsService.notificationStream$
      .pipe(filter((event) => event.data.recipientId === userId))
      .subscribe((event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });

    const keepAlive = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);

    res.on('close', () => {
      clearInterval(keepAlive);
      subscription.unsubscribe();
      res.end();
    });
  }

  @Get('sse/activities')
  async sseActivities(
    @Headers('authorization') authHeader: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const tokenFromQuery = req.query?.token as string;
      const tokenFromHeader = authHeader?.replace('Bearer ', '');
      const token = tokenFromQuery || tokenFromHeader;
      if (!token) {
        res.status(401).send('Unauthorized');
        return;
      }
      await this.jwtService.verifyAsync(token);
    } catch {
      res.status(401).send('Unauthorized');
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    const subscription = this.notificationsService.activityStream$.subscribe((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    const keepAlive = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);

    res.on('close', () => {
      clearInterval(keepAlive);
      subscription.unsubscribe();
      res.end();
    });
  }
}