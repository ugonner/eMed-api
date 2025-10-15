import { Injectable, NotFoundException, UseFilters, UseInterceptors } from '@nestjs/common';
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
import { IConnectedUser } from '../shared/interfaces/user';
import { IInitUserConnectionDTO, IPlainRTCSocketMessageDTO, JoinRoomDTO } from '../shared/dtos/call.dto';

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
  
  constructor() {}

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
  }

  @SubscribeMessage(BroadcastEvents.INIT_CONNECTED_USER)
  async initConnectedUser(client: Socket, payload: IInitUserConnectionDTO) {
    try {
      await this.insertUser(payload);
      return payload;
    } catch (error) {
      console.log("Error init user", error.message)
      return payload
    }
  }

  @SubscribeMessage(BroadcastEvents.JOIN_ROOM)
  async joinRoom(client: Socket, payload: JoinRoomDTO) {
    try {
    } catch (error) {
      
    }
  }

  @SubscribeMessage(BroadcastEvents.GET_ROOM_USERS)
  async getRoomProducers(
    client: Socket,
    payload: { roomId: string },
  ): Promise<IApiResponse<IConnectedUser[] | unknown>> {
    try{
      const users =  await this.connectedUsers.filter((usr) => usr.roomId === payload.roomId)
      return ApiResponse.success("Users fetched successsfully", users);
    }catch(error){
      return ApiResponse.fail(error.message, error)
    }
  }
  @SubscribeMessage(BroadcastEvents.PLAIN_RTC_CALL_MESSAGE)
  async sendRTCMessage(
    client: Socket,
    payload: IPlainRTCSocketMessageDTO<unknown>,
  ): Promise<IApiResponse<IPlainRTCSocketMessageDTO<unknown> | unknown>> {
    try{
      console.log("Msg received", payload);
      client.to(payload.peerSocketId).emit(BroadcastEvents.PLAIN_RTC_CALL_MESSAGE, payload);
      return ApiResponse.success("message sent successsfully", payload);
    }catch(error){
      return ApiResponse.fail(error.message, error)
    }
  }

  @SubscribeMessage(BroadcastEvents.GET_CONNECTED_USER)
  async getConnectedUser(
    client: Socket,
    payload: {peerId: string},
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try{
      const user =  await this.getUser(payload.peerId)
      return ApiResponse.success("User fetched successsfully", user);
    }catch(error){
      return ApiResponse.fail(error.message, error)
    }
  }

  @SubscribeMessage(BroadcastEvents.GET_CONNECTED_USERS)
  async getConnectedUsers(
    client: Socket,
    payload: {peerId: string},
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try{
      const users =  this.connectedUsers;
      return ApiResponse.success("Users fetched successsfully", users);
    }catch(error){
      return ApiResponse.fail(error.message, error)
    }
  }

  
  @SubscribeMessage(BroadcastEvents.UPDATE_USER_CALL_STATUS)
  async updateUserState(
    client: Socket,
    payload: IConnectedUser,
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try{
      const user = await this.updateUser(client.id, payload);
      return ApiResponse.success("Users fetched successsfully", user);
    }catch(error){
      return ApiResponse.fail(error.message, error)
    }
  }
  
  @SubscribeMessage(BroadcastEvents.LEAVE_ROOM)
  async leave(
    client: Socket,
    payload: IConnectedUser,
  ): Promise<IApiResponse<IConnectedUser | unknown>> {
    try{
      const user = await this.updateUser(client.id, {roomId: undefined, roomType: undefined} as IConnectedUser);
      return ApiResponse.success("Users fetched successsfully", user);
    }catch(error){
      return ApiResponse.fail(error.message, error)
    }
  }
  

  async getUser(socketIdOrPeerId: string): Promise<IConnectedUser> {
    return this.connectedUsers.find((user) => user.peerId === socketIdOrPeerId || user.socketId === socketIdOrPeerId)
  }

  async insertUser(dto: Partial<IConnectedUser>): Promise<IConnectedUser> {
    let user = this.connectedUsers.find((user) => user.socketId === dto.socketId || user.peerId === dto.peerId);
    if(user) return await this.updateUser(user.socketId, dto);
    user = {...dto};
    this.connectedUsers.push(user);
    return user;
  }
  
  async updateUser(socketOrPeerId: string, dto: Partial<IConnectedUser>): Promise<IConnectedUser> {
    const userIndex = this.connectedUsers.findIndex((user) => user.socketId === socketOrPeerId || user.peerId === socketOrPeerId);
    if(userIndex === -1) throw new NotFoundException("User not found");
    const user = {...(this.connectedUsers[userIndex] || {}), ...dto};
    this.connectedUsers[userIndex] = user;
    return user;
  }

  
async deleteUser(socketOrPeerId: string) {
    this.connectedUsers = this.connectedUsers.filter((user) => user.socketId === socketOrPeerId || user.peerId === socketOrPeerId)
  }


}
