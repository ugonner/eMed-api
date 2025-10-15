import { Module } from '@nestjs/common';
import { CallGateway } from './call.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../entities/room.entity';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Auth } from '../entities/auth.entity';
import { AidServiceModule } from '../aid-service/aid-service.module';
import { PeerGateway } from './peer/peer.gateway';
import { UserModule } from '../user/user.module';
import { CallService } from './call.service';
import { NotificationModule } from '../notifiction/notification.module';
import { CallController } from './call.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Auth]),
    AidServiceModule,
    UserModule,
    NotificationModule
  ],
  controllers: [RoomController, CallController],
  providers: [
    {
      provide: "CALL_GATEWWAY",
      useClass: CallGateway
    },
    CallGateway,
    RoomService,
    PeerGateway,
    CallService
  ],
  exports: [CallGateway]
})
export class CallModule {}
