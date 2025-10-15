import {
  Injectable,
  NotFoundException,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import MediaSoup, { createWorker } from 'mediasoup';
import { Server, Socket } from 'socket.io';
import { EventExceptionHandler } from '../shared/interceptors/exception.filter';
import { ResponseInterceptor } from '../shared/interceptors/response.interceptor';
import { BroadcastEvents } from '../shared/enums/events.enum';
import { ApiResponse, IApiResponse } from '../shared/helpers/apiresponse';
import { IConnectedSocketUsersRecord, IConnectedUser } from '../shared/interfaces/user';
import {
  IInitUserConnectionDTO,
  IPlainRTCSocketMessageDTO,
  JoinRoomDTO,
} from '../shared/dtos/call.dto';
import { UserCallState } from '../shared/enums/user.enum';
import { UserService } from '../user/user.service';
import { PlainRTCSocketMessageType } from '../shared/enums/socket.enum';
import { Broadcaster } from 'typeorm/subscriber/Broadcaster';
import { AidServiceDTO } from '../shared/dtos/aid-service.dto';
import { totalmem } from 'os';

@UseFilters(EventExceptionHandler)
@UseInterceptors(ResponseInterceptor)
@WebSocketGateway({
  namespace: '/call',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class CallGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  getServer(): Server {
    return this.server;
  }

  private connectedUsers: IConnectedUser[];

  constructor(
    private userService: UserService
  ) {}

  // private recognizeStream;

  async afterInit() {
    try {
      this.connectedUsers = [];
      console.log('Gateway started');
    } catch (error) {
      console.log('Error in AfterInit', error.message);
    }
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.log('connected', client.id);
  
  }

  async handleDisconnect(client: Socket) {
    this.deleteUser(client.id);
    const usersRecord = await this.getConnectedUsersRecord();
    const res = ApiResponse.success("users fetched successfully", usersRecord);
    this.server.emit(BroadcastEvents.UPDATE_CONNECTED_USERS_RECORD, res);
  }

  @SubscribeMessage(BroadcastEvents.INIT_CONNECTED_USER)
  async initConnectedUser(client: Socket, payload: IInitUserConnectionDTO) {
    try {
      
      await this.insertUser(payload);
      const record = await this.getConnectedUsersRecord();
       const res = ApiResponse.success("users fetched successfully", record);
    this.server.emit(BroadcastEvents.UPDATE_CONNECTED_USERS_RECORD, res);
     return payload;
    } catch (error) {
      console.log('Error init user', error.message);
      return payload;
    }
  }

  @SubscribeMessage(BroadcastEvents.JOIN_ROOM)
  async joinRoom(client: Socket, payload: JoinRoomDTO) {
    try {
    } catch (error) {}
  }

  @SubscribeMessage(BroadcastEvents.GET_ROOM_USERS)
  async getRoomProducers(
    client: Socket,
    payload: { roomId: string },
  ): Promise<IApiResponse<IConnectedUser[] | unknown>> {
    try {
      const users = await this.connectedUsers.filter(
        (usr) => usr.roomId === payload.roomId,
      );
      return ApiResponse.success('Users fetched successsfully', users);
    } catch (error) {
      return ApiResponse.fail(error.message, error);
    }
  }
  @SubscribeMessage(BroadcastEvents.PLAIN_RTC_CALL_MESSAGE)
  async sendRTCMessage(
    client: Socket,
    payload: IPlainRTCSocketMessageDTO<unknown>,
  ): Promise<IApiResponse<IPlainRTCSocketMessageDTO<unknown> | unknown>> {
    try {
      if (payload.messageType === PlainRTCSocketMessageType.CALL_STATE)
        console.log('Msg received', payload);
      if (payload.roomId)
        client
          .to(payload.roomId)
          .emit(BroadcastEvents.PLAIN_RTC_CALL_MESSAGE, payload);
      else
        client
          .to(payload.peerSocketId)
          .emit(BroadcastEvents.PLAIN_RTC_CALL_MESSAGE, payload);
      return ApiResponse.success('message sent successsfully', payload);
    } catch (error) {
      return ApiResponse.fail(error.message, error);
    }
  }

  @SubscribeMessage(BroadcastEvents.GET_CONNECTED_USER)
  async getConnectedUser(
    client: Socket,
    payload: { socketId: string },
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try {
      const user = await this.getUser(payload.socketId);
      return ApiResponse.success('User fetched successsfully', user);
    } catch (error) {
      return ApiResponse.fail(error.message, error);
    }
  }

  @SubscribeMessage(BroadcastEvents.GET_CONNECTED_USERS)
  async getConnectedUsers(
    client: Socket,
    payload: { roomId: string },
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try {
      const users = this.connectedUsers;
      return ApiResponse.success('Users fetched successsfully', users);
    } catch (error) {
      return ApiResponse.fail(error.message, error);
    }
  }


  @SubscribeMessage(BroadcastEvents.UPDATE_USER_CALL_STATUS)
  async updateUserState(
    client: Socket,
    payload: IConnectedUser,
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try {
      const user = await this.updateUser(client.id, payload);
      if (payload.roomId) {
        if (
          client.rooms.has(payload.roomId) &&
          (payload.callState === UserCallState.NONE ||
            payload.callState === UserCallState.DROPPED)
        ) {
          client.leave(payload.roomId);
        } else if (
          !client.rooms.has(payload.roomId) &&
          payload.callState !== UserCallState.NONE &&
          payload.callState !== UserCallState.DROPPED
        ) {
          client.join(payload.roomId);
        }
      }
      return ApiResponse.success('Users fetched successsfully', user);
    } catch (error) {
      return ApiResponse.fail(error.message, error);
    }
  }

  @SubscribeMessage(BroadcastEvents.LEAVE_ROOM)
  async leave(
    client: Socket,
    payload: IConnectedUser,
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try {
      const user = await this.updateUser(client.id, {
        roomId: undefined,
        roomType: undefined,
      } as IConnectedUser);
      return ApiResponse.success('Users fetched successsfully', user);
    } catch (error) {
      return ApiResponse.fail(error.message, error);
    }
  }

  @SubscribeMessage(BroadcastEvents.GET_AVALABLE_AID_SERVICE_PROVIDERS)
  async getAidServiceUsers(client: Socket, payload: {aidServiceId: number}): Promise<IApiResponse<IConnectedUser[]>> {
    try{
      const users = this.connectedUsers.filter((usr) => usr.aidServiceProfiles.find((aidProfile) => aidProfile.aidService?.id === Number(payload.aidServiceId)))
      return ApiResponse.success("Aid service providers fetched successfully", users);

    }catch(error){
      console.log("Error getting aid service providers", error.message);
      return ApiResponse.fail("Error getting service providers", error)
    }
  }
  async getUser(socketIdOrPeerId: string): Promise<IConnectedUser> {
    return this.connectedUsers.find(
      (user) => user.socketId === socketIdOrPeerId,
    );
  }

  async insertUser(dto: Partial<IConnectedUser>): Promise<IConnectedUser> {
    let user = this.connectedUsers.find(
      (user) => user.socketId === dto.socketId,
    );
    if (user) return await this.updateUser(user.socketId, dto);
    const userProfile = await this.userService.getUser(dto.userId);


    user = { ...dto, aidServiceProfiles: userProfile?.aidServiceProfiles.map((aidProfile) => ({
      id: aidProfile.id,
      name: aidProfile.name,
      aidService: {id: aidProfile.aidService?.id, name: aidProfile.aidService?.name} as AidServiceDTO,
      verificationStatus: aidProfile.verificationStatus,
      isDeleted: aidProfile.isDeleted
    })) };
    this.connectedUsers.push(user);
    return user;
  }

  async updateUser(
    socketOrPeerId: string,
    dto: Partial<IConnectedUser>,
  ): Promise<IConnectedUser> {
    const userIndex = this.connectedUsers.findIndex(
      (user) => user.socketId === socketOrPeerId,
    );
    if (userIndex === -1) throw new NotFoundException('User not found');
    const user = { ...(this.connectedUsers[userIndex] || {}), ...dto };
    this.connectedUsers[userIndex] = user;
    return user;
  }

  async deleteUser(socketOrPeerId: string) {
    this.connectedUsers = this.connectedUsers.filter(
      (user) => user.socketId !== socketOrPeerId,
    );
  }

  async getConnectedUsersRecord(): Promise<IConnectedSocketUsersRecord> {
    return {
      totalUsers: this.connectedUsers.length,
      totalAidServiceProfiles: (this.connectedUsers?.filter((usr) => usr.aidServiceProfiles?.length > 0))?.length
    }
  }
}
