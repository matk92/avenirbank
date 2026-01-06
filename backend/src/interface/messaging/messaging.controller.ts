import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { MessagingService } from './messaging.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  async getMyConversations(@Req() req: any) {
    return this.messagingService.getConversationsForUser(req.user.sub);
  }

  @Get('conversations/:id')
  async getConversationById(@Param('id') id: string, @Req() req: any) {
    return this.messagingService.getConversationById(id, req.user.sub);
  }

  @Get('conversations/:id/messages')
  async getConversationMessages(@Param('id') id: string, @Req() req: any) {
    return this.messagingService.getMessages(id, req.user.sub);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: any,
  ) {
    return this.messagingService.createMessage(id, req.user.sub, body.content);
  }

  @Post('conversations/:id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    await this.messagingService.markMessagesAsRead(id, req.user.sub);
    return { success: true };
  }

  @Get('users')
  async getUsers(@Req() req: any) {
    return this.messagingService.getAllUsers(req.user.sub);
  }

  @Get('users/search')
  async searchUsers(
    @Query('email') email: string,
    @Query('role') role: string,
    @Req() req: any,
  ) {
    return this.messagingService.searchUsersByEmail(email, role, req.user.sub);
  }

  @Post('conversations/start')
  async startConversation(
    @Body() body: { userId: string },
    @Req() req: any,
  ) {
    return this.messagingService.getOrCreateConversation(req.user.sub, body.userId);
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Req() req: any) {
    const success = await this.messagingService.deleteConversation(id, req.user.sub);
    return { success };
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string, @Req() req: any) {
    const success = await this.messagingService.deleteMessage(id, req.user.sub);
    return { success };
  }
}