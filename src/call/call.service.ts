import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, SelectQueryBuilder } from 'typeorm';
import { Profile } from '../entities/user.entity';
import { IQueryResult } from '../shared/interfaces/api-response.interface';
import { MailDTO } from '../shared/dtos/mail.dto';
import { NotificationService } from '../notifiction/notification.service';
import { CallRoomDTO, QueryCallRoomDTO } from '../shared/dtos/call.dto';
import { CallRoom } from '../entities/call.entity';
import { callPurpose, CallType } from '../shared/enums/call.enum';
import { AidServiceProfile } from '../entities/aid-service-profile.entity';
import { ProfileWallet } from '../entities/user-wallet.entity';

@Injectable()
export class CallService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private notificationService: NotificationService,
  ) {}

  async createAidServiceCall(dto: CallRoomDTO): Promise<CallRoom> {
    let newCallRoom: CallRoom;
    let errorData: unknown;

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      if(dto.callPurpose !== callPurpose.AID_SERVICE) throw new BadRequestException("This is not an aid-service call");

      const aidServiceProfile = await queryRunner.manager.findOne(AidServiceProfile, {
        where: {id: dto.aidServiceProfileId},
        relations: ["aidService", "profile"]
      })

      if(!aidServiceProfile) throw new NotFoundException("Aid service profile not found");

      const {aidService, profile} = aidServiceProfile;

      const callDuration = dto.startTime ? Math.floor(((Number(dto.endTime) - Number(dto.startTime)) / 60)) : 0;
      const aidServiciecostRate = dto.callType === CallType.AUDIO ? Number(aidService.audioCallRate) : Number(aidService.videoCallRate);
      const callCost = callDuration * Number(aidServiciecostRate);
      if(dto.callType === CallType.AUDIO) {
        aidServiceProfile.audioCallEarnings = Number(aidServiceProfile.audioCallEarnings) + callCost;
      
        aidServiceProfile.noOfAudioCallServices = Number(aidServiceProfile.noOfAudioCallServices) + 1;
      }
      else {
        aidServiceProfile.videoCallEarnings = Number(aidServiceProfile.videoCallEarnings) + callCost;
        aidServiceProfile.noOfVideoCallServices = Number(aidServiceProfile.noOfVideoCallServices) + 1;
      }

      aidServiceProfile.totalEarningsBalance = Number(aidServiceProfile.totalEarningsBalance) + callCost;
      aidServiceProfile.totalServicesRendered = Number(aidServiceProfile.totalServicesRendered) + 1;
      
      await queryRunner.manager.save(AidServiceProfile, aidServiceProfile);


      const {callMembers,initiatedBy, aidServiceProfileId, ...restCallRoomDto} = dto;
      const callMembersProfiles = await queryRunner.manager.find(Profile, {
        where: {userId: In(callMembers.map((usr) => usr.userId))}
      });
      
      const initiatedByProfile = await queryRunner.manager.findOne(Profile, {
        where: {userId: initiatedBy},
      });

    
      const initiatorWallet = await queryRunner.manager.findOne(ProfileWallet, {where: {profile: {userId: initiatedByProfile.userId}}})
      initiatorWallet.earnedBalance = Number(initiatorWallet.earnedBalance) - callCost;
      await queryRunner.manager.save(ProfileWallet, initiatorWallet);


      const callRoomData: Partial<CallRoom> = {...restCallRoomDto, callMembers: callMembersProfiles, aidServiceProfile, initiatedBy: initiatedByProfile};

      const callRoom = queryRunner.manager.create(CallRoom, callRoomData)
      const savedCallRoom = await queryRunner.manager.save(CallRoom, callRoom);
      await queryRunner.commitTransaction();
      newCallRoom = savedCallRoom

    } catch (error) {
      errorData = error;
      await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
      if (errorData) throw errorData;
      return newCallRoom;
    }
  }

  async createPlainCall(dto: CallRoomDTO): Promise<CallRoom> {
    let newCallRoom: CallRoom;
    let errorData: unknown;

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      if(dto.callPurpose !== callPurpose.NORMAL) throw new BadRequestException("This is not a non-service call");

      const {callMembers,initiatedBy, aidServiceProfileId, ...restCallRoomDto} = dto;
      const callMembersProfiles = await queryRunner.manager.find(Profile, {
        where: {userId: In(callMembers.map((usr) => usr.userId))}
      });
      
      const initiatedByProfile = await queryRunner.manager.findOne(Profile, {
        where: {userId: initiatedBy},
      });

    
      const callRoomData: Partial<CallRoom> = {...restCallRoomDto, callMembers: callMembersProfiles, initiatedBy: initiatedByProfile};

      const callRoom = queryRunner.manager.create(CallRoom, callRoomData)
      const savedCallRoom = await queryRunner.manager.save(CallRoom, callRoom);
      await queryRunner.commitTransaction();
      newCallRoom = savedCallRoom

    } catch (error) {
      errorData = error;
      await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
      if (errorData) throw errorData;
      return newCallRoom;
    }
  }

  getQueryBuilder(): SelectQueryBuilder<CallRoom> {
    const repository = this.dataSource.manager.getRepository(CallRoom);
    return repository.createQueryBuilder('callRoom')
    .leftJoinAndSelect("callRoom.initiatedBy", "initiatedBy")
    .leftJoinAndSelect("callRoom.aidServiceProfile", "aidServiceProfile")
    .leftJoinAndSelect("aidServiceProfile.aidService", "aidService")
    .leftJoinAndSelect("callRoom.callMembers", "callMembers")
  }

  async getCallRooms(
    dto: QueryCallRoomDTO,
    userid?: string,
  ): Promise<IQueryResult<CallRoom>> {
    const {userId, aidServiceProfileId, aidServiceId, searchTerm, order, page, limit, ...queryFields } = dto;
    const queryPage = page ? Number(page) : 1;
    const queryLimit = limit ? Number(limit) : 10;
    const queryOrder = order ? order.toUpperCase() : 'DESC';
    const queryOrderBy = 'createdAt';

    const queryBuilder = this.getQueryBuilder();

    if (queryFields) {
      Object.keys(queryFields).forEach((field) => {
        queryBuilder.andWhere(`callRoom.${field} = :value`, {
          value: queryFields[field],
        });
      });
    }


    if (userId) {
        queryBuilder.andWhere(`callMembers.userId = :userId || initiatedBy.userId = :userId`, { userId });
    }

    if(aidServiceProfileId) {
      queryBuilder.andWhere(`aidServiceProfile.id = :aidServiceProfileId`, {aidServiceProfileId})
    }
    if(aidServiceId) {
      queryBuilder.andWhere(`aidService.id = :aidServiceId`, {aidServiceId})
    }

    if (searchTerm) {
      const searchFields = ['address'];
      let queryStr = `LOWER(CallMembersProfiles.firstName) LIKE :searchTerm OR LOWER(users.lastName) LIKE :searchTerm OR LOWER(users.email) LIKE :searchTerm OR LOWER(users.phoneNumber) LIKE :searchTerm`;
      searchFields.forEach((field) => {
        queryStr += ` OR LOWER(CallMembersProfiles.${field}) LIKE :searchTerm`;
      });
      queryBuilder.andWhere(queryStr, {
        searchTerm: `%${searchTerm.toLowerCase().trim()}%`,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy(`callRoom.${queryOrderBy}`, queryOrder as 'ASC' | 'DESC')
      .skip((queryPage - 1) * queryLimit)
      .limit(queryLimit)
      .getManyAndCount();

    return { page: queryPage, limit: queryLimit, total, data };
  }

  async getUserCalls(userId: string): Promise<CallRoom[]> {
     return await this.dataSource.getRepository(CallRoom).find({
        where: {callMembers: {userId}},
        relations: ["aidServiceProfile", "aidServiceProfile.aidService"]
     })
  }

 async getCallRoom(callRoomId: number): Promise<CallRoom>{
    return await this.dataSource.createQueryRunner().manager.findOneBy(CallRoom, {id: callRoomId})
  }


}
