import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  isNumberString,
  IsNumberString,
  IsOptional,
  isString,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AidServiceProfileVerificationStatus } from '../enums/aid-service.enum';
import { Type } from 'class-transformer';
import { QueryRequestDTO } from './query-request.dto';
import { TagDTO } from './tag.dto';
import { QueryDateDTO } from './query-request.dto copy';

export class AidServiceDTO {
  id?: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  audioCallRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  videoCallRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  onSiteRate?: number;

  @ApiPropertyOptional()
  @ValidateNested({each: true})
  @Type(() => TagDTO)
  @IsOptional()
  tags: TagDTO[];

  @ApiPropertyOptional()
  @IsNumber({}, {each: true})
  @IsOptional()
  clusterIds?: number[]
}

export class UpdateUserAidServiceDTO {
  @ApiProperty()
  @IsNumber()
  id: number;
}

export class RequestAidServiceDTO {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;
}

export class ISocialMediaLinksDTO {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  x: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedIn?: string;
}

export class ILocationAddressDTO {
  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locality?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landmark?: string;
}

export class AidServiceProfileApplicationDTO {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  aidServiceId: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessDocumentUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mediaFile: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => ISocialMediaLinksDTO)
  @IsOptional()
  socialMediaLinks: ISocialMediaLinksDTO;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => ILocationAddressDTO)
  @IsOptional()
  locationAddress: ILocationAddressDTO;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPhoneNumber?: string;
}

export class VerifyAidServiceProfileDTO {
  @ApiProperty()
  @IsEnum(AidServiceProfileVerificationStatus)
  verificationStatus: AidServiceProfileVerificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  verificationComment: string;
}

export class QueryAidServiceDTO extends QueryDateDTO {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tags?: string;

@ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clusterIds?: string;


}

export class QueryAidServiceProfileDTO extends QueryDateDTO {
  
@ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aidServiceProfileId?: string;
  
@ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aidServiceId?: string;

  @ApiPropertyOptional()
  @IsEnum(AidServiceProfileVerificationStatus)
  @IsOptional()
  verificationStatus?: AidServiceProfileVerificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  
@ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clusterIds?: string;
}
export interface ICallAidServiceProfileDTO {
  id: number;
  verificationStatus: AidServiceProfileVerificationStatus;
  aidService: AidServiceDTO;
  isDeleted: boolean;
}
