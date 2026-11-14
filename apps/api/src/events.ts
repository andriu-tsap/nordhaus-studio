import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import type { Principal } from './auth.js';
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:4200').split(','),
    credentials: true,
  },
})
export class Events implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  constructor(private jwt: JwtService) {}
  async handleConnection(client: Socket) {
    try {
      const user = await this.jwt.verifyAsync<Principal>(client.handshake.auth.token);
      if (!['admin', 'employee'].includes(user.role)) {
        client.disconnect();
        return;
      }
      await client.join('staff');
    } catch {
      client.disconnect();
    }
  }
  emit(event: string) {
    this.server?.to('staff').emit('notification', { event, at: new Date().toISOString() });
  }
}
