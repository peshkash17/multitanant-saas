import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../organizations/entities/membership.entity';
import { getJwtVerifyConfig } from '../common/config/jwt.config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, { userId: string; orgIds: string[] }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
  ) {}

  private getSecret(): string {
    return getJwtVerifyConfig(this.configService).secretOrKey;
  }

  private getAlgorithms(): ('HS256' | 'RS256')[] {
    return getJwtVerifyConfig(this.configService).algorithms;
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.getSecret(),
        algorithms: this.getAlgorithms(),
      });
      const userId: string = payload.sub;

      const memberships = await this.membershipRepo.find({
        where: { userId },
      });

      const orgIds = memberships.map((m) => m.organizationId);
      this.connectedUsers.set(client.id, { userId, orgIds });

      for (const orgId of orgIds) {
        client.join(`org:${orgId}`);
      }

      this.logger.log(`Client ${client.id} (user ${userId}) connected to orgs: ${orgIds.join(', ')}`);
    } catch (e) {
      this.logger.warn(`Invalid WS token: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const info = this.connectedUsers.get(client.id);
    if (info) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('joinOrg')
  async handleJoinOrg(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orgId: string },
  ) {
    const info = this.connectedUsers.get(client.id);
    if (info && info.orgIds.includes(data.orgId)) {
      client.join(`org:${data.orgId}`);
    }
  }

  emitToOrg(orgId: string, event: string, payload: any) {
    this.server.to(`org:${orgId}`).emit(event, payload);
  }

  getConnectedCount(orgId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`org:${orgId}`);
    return room ? room.size : 0;
  }
}
