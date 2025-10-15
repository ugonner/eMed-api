import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiResponse } from '../shared/helpers/apiresponse';
import { ApiTags } from '@nestjs/swagger';
import { AllExceptionFilter } from '../shared/interceptors/all-exceptions.filter';
import { CallService } from './call.service';
import { CallRoomDTO, QueryCallRoomDTO } from '../shared/dtos/call.dto';
import { UpdateUserAidServiceDTO } from '../shared/dtos/aid-service.dto';
import { User } from '../shared/guards/decorators/user.decorator';
import { JwtGuard } from '../shared/guards/jwt.guards';

@ApiTags("call-room")
@UseFilters(AllExceptionFilter)
@Controller('call-room')
export class CallController {
    constructor(
        private callRoomService: CallService
    ){}

    @Post()
    async createCallRoom(
        @Body() payload: CallRoomDTO
    ){
        const res = await this.callRoomService.createPlainCall(payload);
        return ApiResponse.success("call recorded", res);
    }

    @Post("/aid-service")
    async createAidServiceCallRoom(
        @Body() payload: CallRoomDTO
    ){
        const res = await this.callRoomService.createAidServiceCall(payload);
        return ApiResponse.success("call recorded", res);
    }


    @Get("/user")
    @UseGuards(JwtGuard)
    async getUserCallRoom(
        @User("userId") userId: string
    ){
        const res = await this.callRoomService.getUserCalls(userId);
        return ApiResponse.success("user calls fetched successfuly", res);
    }

    @Get()
    async getCallRoom(
        @Query() payload: QueryCallRoomDTO
    ){
        const res = await this.callRoomService.getCallRooms(payload);
        return ApiResponse.success("Call rooms fetched successfuly", res);
    }
}
