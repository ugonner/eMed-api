import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RoomService } from "./room.service";
import { QueryRoomDTO, RoomDTO, UpdateRoomInviteesDTO } from "../shared/dtos/room.dto";
import { ApiResponse } from "../shared/helpers/apiresponse";
import { User } from "../shared/guards/decorators/user.decorator";
import { JwtGuard } from "../shared/guards/jwt.guards";

@ApiTags("room")
@Controller("room")
export class RoomController {
    constructor(
        private roomService: RoomService,
    ){}

    @Post()
    @UseGuards(JwtGuard)
    async createRoom(
        @Body() payload: RoomDTO,
        @User("userId") userId: string
    ){
        const room = await this.roomService.createRoom(userId, payload);
        if(!room) throw new InternalServerErrorException("Something went wrong creating room");
        return ApiResponse.success("Room created successfully", room);
    }

    @Post("/add-invitees")
    async addInvitees(@Body() payload: UpdateRoomInviteesDTO){
        const res = await this.roomService.addParticipantsToRoom(payload.userPhonesOrEmailss, payload.roomId);
        if(!res) throw new InternalServerErrorException("Somethingwent wrong adding paricipants");
        return ApiResponse.success("Participants added successfully", res);
    }

    
    @Get()
    async getRooms(@Query() payload: QueryRoomDTO){
        const res = await this.roomService.getRooms(payload);
        if(!res) throw new InternalServerErrorException("Somethingwent wrong adding paricipants");
        return ApiResponse.success("Participants added successfully", res);
    }
   
    @Get(":roomId")
    async getRoom(@Param("roomId") roomId: string){
        const res = await this.roomService.getRoom(roomId);
        if(!res) throw new InternalServerErrorException("Somethingwent wrong adding paricipants");
        return ApiResponse.success("Participants added successfully", res);
    }

    // @Get("/request-to-join/:roomId/:userId")
    // async requestToJoinRoomParticipants(
    //     @Param("roomId") roomId: string,
    //     @Param("userId") userId: string,
        
    // ){
    //     const res = await this.roomService.requestToJoinRoomParticipants(roomId, userId);
    //     ApiResponse.success("Request Response done", res);
    // }
    
}