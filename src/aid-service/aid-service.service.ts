import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  Not,
  QueryResult,
  QueryRunner,
  SelectQueryBuilder,
} from 'typeorm';
import {
  AidServiceProfileVerificationStatus,
  AidServiceType,
} from '../shared/enums/aid-service.enum';
import { AidService } from '../entities/aid-service.entity';
import { MailService } from '../mail/mail.service';

import { AidServiceProvider, Room } from '../entities/room.entity';
import { IQueryResult } from '../shared/interfaces/api-response.interface';
import {
  AidServiceDTO,
  AidServiceProfileApplicationDTO,
  QueryAidServiceDTO,
  QueryAidServiceProfileDTO,
  VerifyAidServiceProfileDTO,
} from '../shared/dtos/aid-service.dto';
import { Console } from 'console';
import { Profile } from '../entities/user.entity';
import { AidServiceProfile } from '../entities/aid-service-profile.entity';
import { FileUploadService } from '../file-upload/file-upload.service';
import path from 'path';
import { QueryRequestDTO } from '../shared/dtos/query-request.dto';
import { Tag } from '../entities/tag.entity';
import { TagDTO } from '../shared/dtos/tag.dto';
import { AidServiceTag } from '../entities/aid-service-tag.entity';
import { handleDateQuery } from '../shared/helpers/db';
import { AidServiceProfileSelectFields } from './datasets/aid-service-profile-select';
import { AidServiceSelectFields } from './datasets/aid-service-selection';
import { MailDTO } from '../mail/dtos/mail.dto';
import { NotificationService } from '../notifiction/notification.service';
import { NotificationDto } from '../notifiction/dtos/notification.dto';
import {
  NotificationContext,
  NotificationEventType,
} from '../notifiction/enums/notification.enum';
import { AidServiceCluster } from '../entities/aid-service-cluster.entity';
import { Cluster } from '../entities/cluster.entity';
import { AddOrRemoveAction } from '../user/enums/cluster.enum';
import { ManageClustersDTO } from '../shared/dtos/cluster.dto';

@Injectable()
export class AidServiceService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private readonly fileUploadService: FileUploadService,
    private notificationService: NotificationService,
  ) {}

  async setAidServiceTags(
    queryRunner: QueryRunner,
    aidService: AidService,
    tags: TagDTO[],
  ): Promise<AidServiceTag[]> {
    const existingTags = await queryRunner.manager.findBy(Tag, {
      name: In(tags.map((tag) => tag.name.toLowerCase())),
    });
    let newDTOTags: Partial<Tag>[] = [];
    let existingDTOTags: Tag[] = [];

    tags.forEach((tag) => {
      const existingTag = existingTags.find(
        (eTag) => eTag.name === tag.name.toLowerCase(),
      );
      if (existingTag) {
        existingDTOTags.push(existingTag);
      } else {
        const tagInstance = queryRunner.manager.create(Tag, {
          ...tag,
          name: tag.name.toLowerCase(),
        });
        newDTOTags.push(tagInstance);
      }
    });
    const newTags = await queryRunner.manager.save(Tag, newDTOTags);
    if (aidService.aidServiceTags?.length) {
      await queryRunner.manager.remove(
        AidServiceTag,
        aidService.aidServiceTags,
      );
    }
    const aidServiceTags = await queryRunner.manager.save(
      AidServiceTag,
      [...existingDTOTags, ...newTags].map((tag) => ({
        aidService,
        tag,
      })),
    );
    return aidServiceTags;
  }

  async saveAidServiceClusters(
    aidService: AidService,
    clusterIds: number[],
    action: AddOrRemoveAction,
    queryRunner: QueryRunner,
  ): Promise<AidServiceCluster[]> {
    let savedAidServiceClusters: AidServiceCluster[] =
      aidService.aidServiceClusters;

    if (action === AddOrRemoveAction.ADD) {
      if(aidService.aidServiceClusters?.length) await queryRunner.manager.remove(
        AidServiceCluster,
        aidService.aidServiceClusters,
      );

      const clusters = await queryRunner.manager.findBy(Cluster, {
        id: In(clusterIds),
      });
      const aidServiceClusters = queryRunner.manager.create(
        AidServiceCluster,
        clusters.map((cluster) => ({
          aidService,
          cluster,
        })),
      );
      savedAidServiceClusters = await queryRunner.manager.save(
        AidServiceCluster,
        aidServiceClusters,
      );
    } else if (action === AddOrRemoveAction.REMOVE) {
      const targetsERVICEClusters = aidService.aidServiceClusters.filter(
        (aCluster) =>
          Boolean(clusterIds.find((clusterId) => clusterId == aCluster.id)),
      );
      if(targetsERVICEClusters?.length) await queryRunner.manager.remove(
        AidServiceCluster,
        targetsERVICEClusters,
      );
    }
    return savedAidServiceClusters;
  }

  async createAidService(
    userId: string,
    dto: AidServiceDTO,
  ): Promise<AidService> {
    let newAidServiceData: AidService;
    let errorData: unknown;
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      const { tags, clusterIds, ...aidServiceDto } = dto;

      const adminProfile = await queryRunner.manager.findOneBy(Profile, {
        userId,
      });

      const name = aidServiceDto.name.toLowerCase();
      const serviceExists = await queryRunner.manager.findOneBy(AidService, {
        name,
      });
      if (serviceExists)
        throw new BadRequestException('Aid Service alreay exists');

      const aidServiceInit = queryRunner.manager.create(AidService, {
        ...(aidServiceDto || {}),
        name,
        profile: adminProfile,
      });

      const aidService = await queryRunner.manager.save(
        AidService,
        aidServiceInit,
      );
      if (tags?.length) {
        const aidServiceTags = await this.setAidServiceTags(
          queryRunner,
          aidService,
          tags,
        );
        //aidService.aidServiceTags = aidServiceTags;
      }

      if(clusterIds?.length){
        await this.saveAidServiceClusters(aidService, clusterIds, AddOrRemoveAction.ADD, queryRunner);
      }

      await queryRunner.commitTransaction();
      newAidServiceData = aidService;
    } catch (error) {
      errorData = error;
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (errorData) throw errorData;
      return newAidServiceData;
    }
  }

  async updateAidService(
    aidServiceId: number,
    dto: AidServiceDTO,
  ): Promise<AidService> {
    let newAidServiceData: AidService;
    let errorData: unknown;
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      const name = dto.name.toLowerCase();
      const { tags, clusterIds, ...aidServiceDto } = dto;

      let aidService = await queryRunner.manager.findOne(AidService, {
        where: {id: aidServiceId},
        relations: ["aidServiceClusters", "aidServiceTags"]
      });
      if (!aidService) throw new NotFoundException('Service not found');
      const aidServiceExists = await queryRunner.manager.findOne(AidService, {
        where: { id: Not(aidServiceId), name },
      });
      if (aidServiceExists)
        throw new BadRequestException(
          'Another Service with same name already exists',
        );
      const aidServiceData = { ...aidService, ...aidServiceDto, name };
      aidService = await queryRunner.manager.save(AidService, aidServiceData);

      if (tags?.length) {
        const aidServiceTags = await this.setAidServiceTags(
          queryRunner,
          aidService,
          tags,
        );
        //aidService.aidServiceTags = aidServiceTags;
      }
      if(clusterIds?.length){
        await this.saveAidServiceClusters(
          aidService, clusterIds, AddOrRemoveAction.ADD, queryRunner
        );
      }
      await queryRunner.commitTransaction();
      newAidServiceData = aidService;
    } catch (error) {
      errorData = error;
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (errorData) throw errorData;
      return newAidServiceData;
    }
  }

  async updateAidServiceClusters(aidServiceId: number, dto: ManageClustersDTO): Promise<AidServiceCluster[]> {
    let updatedAidServiceClusters: AidServiceCluster[];
    let errorData: unknown;
    const queryRunner = this.dataSource.createQueryRunner();
    try{
      await queryRunner.startTransaction();
      const aidService = await queryRunner.manager.findOne(AidService, {
        where: {id: aidServiceId},
        relations: ["aidServiceClusters"]
      });
      if(!aidService) throw new NotFoundException("aid service not found");
      const saved = await this.saveAidServiceClusters(
        aidService, dto.clusterIds, dto.options.action, queryRunner
      )
      await queryRunner.commitTransaction();
      updatedAidServiceClusters = saved;
    }catch(error){
      errorData = error;
      await queryRunner.rollbackTransaction();
    }finally{
      await queryRunner.release();
      if(errorData) throw errorData;
      return updatedAidServiceClusters;
    }
  }

  getQueryBuilder(): SelectQueryBuilder<AidService> {
    const repository = this.dataSource.manager.getRepository(AidService);
    return repository
      .createQueryBuilder('aidService')
      .select(AidServiceSelectFields)
      .leftJoinAndSelect('aidService.aidServiceTags', 'aidServiceTags')
      .leftJoinAndSelect('aidServiceTags.tag', 'tags')
      .leftJoinAndSelect("aidService.aidServiceClusters", "aidServiceClusters")
      .leftJoinAndSelect("aidServiceClusters.cluster", "clusters")
  }

  async getAidServices(
    dto: QueryAidServiceDTO,
  ): Promise<IQueryResult<AidService>> {
    const {
      tags,
      clusterIds,
      searchTerm,
      startDate,
      endDate,
      dDate,
      order,
      page,
      limit,
      ...queryFields
    } = dto;
    const queryPage = page ? Number(page) : 1;
    const queryLimit = limit ? Number(limit) : 10;
    const queryOrder = order ? order.toUpperCase() : 'DESC';
    const queryOrderBy = 'createdAt';

    let queryBuilder = this.getQueryBuilder();
    queryBuilder.where('aidService.isDeleted != :isDeleted', {
      isDeleted: true,
    });

    if (queryFields) {
      Object.keys(queryFields).forEach((field) => {
        queryBuilder.andWhere(`aidService.${field} = :value`, {
          value: queryFields[field],
        });
      });
    }

    if (startDate || endDate || dDate) {
      queryBuilder = handleDateQuery<AidService>(
        { startDate, endDate, dDate, entityAlias: 'aidService' },
        queryBuilder,
        'createdAt',
      );
    }

    if (tags) {
      const tagArr = tags.split(',');
      queryBuilder.andWhere('tags.id IN (:...tagArr)', { tagArr });
    }

    if (clusterIds) {
      const clusterArr = clusterIds.split(',');
      queryBuilder.andWhere('clusters.id IN (:...clusterArr)', { clusterArr });
    }

    if (searchTerm) {
      const searchFields = ['name', 'description'];
      let queryStr = `LOWER(aidService.name) LIKE :searchTerm`;
      searchFields.forEach((field) => {
        queryStr += ` OR LOWER(aidService.${field}) LIKE :searchTerm`;
      });

      ['name'].forEach((field) => {
        queryStr += ` OR LOWER(tags.${field}) LIKE :searchTerm`;
      });

      queryBuilder.andWhere(queryStr, {
        searchTerm: `%${searchTerm.toLowerCase().trim()}%`,
      });
    }

    //queryBuilder.andWhere(`aidService.isDeleted = :isDeleted`, {isDeleted: true})

    const [data, total] = await queryBuilder
      .orderBy(`aidService.${queryOrderBy}`, queryOrder as 'ASC' | 'DESC')
      .skip((queryPage - 1) * queryLimit)
      .limit(queryLimit)
      .getManyAndCount();

    return { page: queryPage, limit: queryLimit, total, data };
  }

  async createOrUpdateAidServiceProfile(
    userId: string,
    dto: AidServiceProfileApplicationDTO,
  ): Promise<AidServiceProfile> {
    let updatedAidServiceProfile: AidServiceProfile;
    let errorData: unknown;
    const staledFiles = [];

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();

      const { aidServiceId, ...applicationDto } = dto;
      let aidServiceProfile = await queryRunner.manager.findOne(
        AidServiceProfile,
        {
          where: { aidService: { id: aidServiceId }, profile: { userId } },
        },
      );

      let isNewProfile = false;
      if (aidServiceProfile) {
        if (
          applicationDto.businessDocumentUrl.trim() &&
          applicationDto.businessDocumentUrl?.trim() !==
            aidServiceProfile.businessDocumentUrl?.trim()
        ) {
          staledFiles.push(aidServiceProfile.businessDocumentUrl);
        }

        if (
          applicationDto.mediaFile?.trim() &&
          applicationDto.mediaFile?.trim() !==
            aidServiceProfile.mediaFile?.trim()
        ) {
          staledFiles.push(aidServiceProfile.mediaFile);
        }
        aidServiceProfile = { ...aidServiceProfile, ...applicationDto };
      } else {
        const profile = await queryRunner.manager.findOneBy(Profile, {
          userId,
        });

        const aidService = await queryRunner.manager.findOneBy(AidService, {
          id: aidServiceId,
        });

        if (!profile) throw new NotFoundException('User not found');
        if (!aidService)
          throw new NotFoundException('Aidservice does not exist');

        aidServiceProfile = queryRunner.manager.create(AidServiceProfile, {
          ...applicationDto,
          profile,
          aidService,
        });
        isNewProfile = true;
      }

      const savedAidServiceProfile = await queryRunner.manager.save(
        AidServiceProfile,
        aidServiceProfile,
      );
      if (isNewProfile && savedAidServiceProfile.aidService) {
        savedAidServiceProfile.aidService.noOfAidServiceProfiles =
          Number(savedAidServiceProfile.aidService.noOfAidServiceProfiles) + 1;
        await queryRunner.manager.save(
          AidService,
          savedAidServiceProfile.aidService,
        );
      }
      await queryRunner.commitTransaction();
      updatedAidServiceProfile = savedAidServiceProfile;

      const notDto: NotificationDto = {
        creator: savedAidServiceProfile.profile,
        receivers: [
          savedAidServiceProfile.aidService?.profile,
          savedAidServiceProfile?.profile,
        ],
        context: NotificationContext.SERVICE_PROFILE,
        contextEntityId: savedAidServiceProfile?.id,
        notificationEventType: isNewProfile
          ? NotificationEventType.AID_SERVICE_PROFILE_APPLICATION
          : NotificationEventType.AID_SERVICE_PROFILE_APPLICATION_UPDATE,
        title: isNewProfile
          ? NotificationEventType.AID_SERVICE_PROFILE_APPLICATION
          : NotificationEventType.AID_SERVICE_PROFILE_APPLICATION_UPDATE,
        description: isNewProfile
          ? `A New Application has been received`
          : `Profile Application detail updated`,
        data: {
          link: `${process.env.APP_URL}/aid-service/profile?aspi=${savedAidServiceProfile?.id}`,
        },
      };
      this.notificationService.sendNotification(notDto, {
        sendEmail: true,
        notifyAdmin: true,
      });
    } catch (error) {
      errorData = error;
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (staledFiles.length > 0) {
        staledFiles.forEach((fileUrl) =>
          this.fileUploadService.deletEeFileCloudinary(fileUrl),
        );
      }

      if (errorData) throw errorData;
      return updatedAidServiceProfile;
    }
  }

  async updateUserAidServiceVerificationStatus(
    aidServiceProfileId: number,
    dto: VerifyAidServiceProfileDTO,
    userId: string,
  ): Promise<AidServiceProfile> {
    let updatedAidServiceProfile: AidServiceProfile;
    let errorData: unknown;
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      let aidServiceProfile = await queryRunner.manager.findOne(
        AidServiceProfile,
        {
          where: { id: aidServiceProfileId },
          relations: ['profile'],
        },
      );
      if (!aidServiceProfile)
        throw new BadRequestException('Aid service profile not found');

      const verifiedBy = await queryRunner.manager.findOneBy(Profile, {
        userId,
      });
      aidServiceProfile.verificationStatus = dto.verificationStatus;
      aidServiceProfile.verificationComment = dto.verificationComment;
      aidServiceProfile.verifiedBy = verifiedBy;

      const savedAidServiceProfile = await queryRunner.manager.save(
        AidServiceProfile,
        aidServiceProfile,
      );
      await queryRunner.commitTransaction();
      updatedAidServiceProfile = savedAidServiceProfile;

      const notDto: NotificationDto = {
        creator: aidServiceProfile?.profile,
        receivers: [aidServiceProfile.profile],
        context: NotificationContext.SERVICE_PROFILE,
        contextEntityId: aidServiceProfile.id,
        notificationEventType:
          dto.verificationStatus ===
          AidServiceProfileVerificationStatus.VERIFIED
            ? NotificationEventType.AID_SERVICE_PROFILE_APPLICATION_APPROVED
            : NotificationEventType.AID_SERVICE_PROFILE_VERIFICATION_UPDATE,
        title:
          dto.verificationStatus ===
          AidServiceProfileVerificationStatus.VERIFIED
            ? NotificationEventType.AID_SERVICE_PROFILE_APPLICATION_APPROVED
            : NotificationEventType.AID_SERVICE_PROFILE_VERIFICATION_UPDATE,
        description: `The verification status of this profile has been updated to: ${dto.verificationStatus}`,
        data: {
          link: `${process.env.APP_URL}/aid-service/profile?aspi=${savedAidServiceProfile?.id}`,
          receiverName: aidServiceProfile.profile?.firstName,
          verification: dto.verificationStatus,
          comment: dto.verificationComment,
        },
      };
      this.notificationService.sendNotification(notDto, {
        sendEmail: true,
        notifyAdmin: false,
      });
    } catch (error) {
      errorData = error;
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (errorData) throw errorData;
      return updatedAidServiceProfile;
    }
  }

  async updateUserAidService(
    userId: string,
    aidServiceId: number,
    action: 'add' | 'remove',
  ): Promise<AidServiceProfile> {
    let updatedAidServiceProfile: AidServiceProfile;
    let errorData: unknown;
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      let aidServiceProfile = await queryRunner.manager.findOne(
        AidServiceProfile,
        {
          where: { aidService: { id: aidServiceId }, profile: { userId } },
        },
      );

      if (action === 'add') {
        if (aidServiceProfile) {
          if (!aidServiceProfile.isDeleted)
            throw new BadRequestException(
              'Aid service has not been removed earlier',
            );
          aidServiceProfile.isDeleted = false;
        } else {
          const profile = await queryRunner.manager.findOneBy(Profile, {
            userId,
          });

          const aidService = await queryRunner.manager.findOneBy(AidService, {
            id: aidServiceId,
          });

          if (!profile) throw new NotFoundException('User not found');
          if (!aidService)
            throw new NotFoundException('Aidservice does not exist');

          aidServiceProfile = queryRunner.manager.create(AidServiceProfile, {
            profile,
            aidService,
          });
        }
      }
      if (action === 'remove') {
        if (!aidServiceProfile)
          throw new BadRequestException('Aid service NOT already added');
        aidServiceProfile.isDeleted = true;
      }

      const savedAidServiceProfile = await queryRunner.manager.save(
        AidServiceProfile,
        aidServiceProfile,
      );
      await queryRunner.commitTransaction();
      updatedAidServiceProfile = savedAidServiceProfile;
    } catch (error) {
      errorData = error;
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (errorData) throw errorData;
      return updatedAidServiceProfile;
    }
  }

  async getAidServiceProfiles(
    dto: QueryAidServiceProfileDTO,
  ): Promise<IQueryResult<AidServiceProfile>> {
    const { clusterIds, verificationStatus, aidServiceId, aidServiceProfileId, userId, searchTerm } = dto;

    const queryOrder = dto.order ? dto.order : 'ASC';
    const queryPage = dto.page ? Number(dto.page) : 1;
    const queryLimit = dto.limit ? Number(dto.limit) : 10;

    const queryBuilder = this.dataSource
      .getRepository(AidServiceProfile)
      .createQueryBuilder('aidServiceProfile')
      .select(AidServiceProfileSelectFields)
      .leftJoinAndSelect('aidServiceProfile.profile', 'profile')
      .leftJoin('aidServiceProfile.aidService', 'aidService')
      .leftJoinAndSelect("aidService.aidServiceClusters", "aidServiceClusters")
      .leftJoinAndSelect("aidServiceClusters.cluster", "clusters")
      .where('aidServiceProfile.isDeleted = false');

    if (aidServiceId) {
      queryBuilder.andWhere('aidService.id = :aidServiceId', { aidServiceId });
    }
    

    if (clusterIds) {
      const clusterArr = clusterIds.split(',');
      queryBuilder.andWhere('clusters.id IN (:...clusterArr)', { clusterArr });
    }


    if (userId) {
      queryBuilder.andWhere('profile.userId = :userId', { userId });
    }
    if (aidServiceId) {
      queryBuilder.andWhere('aidService.id = :aidServiceId', { aidServiceId });
    }

    if(aidServiceProfileId){
      queryBuilder.andWhere(`aidServiceProfile.id = :aidServiceProfileId`, {aidServiceProfileId})
    }

    if (verificationStatus) {
      queryBuilder.andWhere(
        'aidServiceProfile.verificationStatus = :verificationStatus',
        { verificationStatus },
      );
    }

    if (searchTerm) {
      let queryStr = `LOWER(aidServiceProfile.name) LIKE :searchTerm`;

      let searchFields = ['email', 'firstName', 'lastName', 'disabilityType'];
      searchFields.forEach((field) => {
        queryStr += ` OR LOWER(profile.${field}) LIKE :searchTerm`;
      });

      queryBuilder.andWhere(queryStr, {
        searchTerm: `%${searchTerm.toLowerCase().trim()}%`,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('aidServiceProfile.createdAt', queryOrder)
      .skip((queryPage - 1) * queryLimit)
      .limit(queryLimit)
      .getManyAndCount();

    return { limit: queryLimit, page: queryPage, total, data };
  }

  async getAidService(aidServiceId: number): Promise<AidService> {
    return await this.dataSource.getRepository(AidService).findOne({
      where: { id: aidServiceId },
    });
  }

  async getAidServiceProfile(
    aidServiceProfileId: number,
  ): Promise<AidServiceProfile> {
    return await this.dataSource.getRepository(AidServiceProfile).findOne({
      where: { id: aidServiceProfileId },
      relations: ['profile', 'aidService'],
    });
  }
  async getTags(): Promise<Tag[]> {
    return await this.dataSource.getRepository(Tag).find();
  }
}
