import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsBooleanString,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ILocationAddressDTO } from './aid-service.dto';
import { QueryDateDTO } from './query-request.dto copy';
import { BookingStatus, BookingUpdateBookingStatus } from '../enums/booking.enum';

export class VirtualLocationAddressDTO {
  @ApiProperty()
  @IsUrl()
  linkAddress: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  additionalNotes?: string;
}

export class BookingDTO {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bookingNote?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => ILocationAddressDTO)
  @IsOptional()
  locationAddress?: ILocationAddressDTO;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => VirtualLocationAddressDTO)
  @IsOptional()
  virtualLocationAddress?: VirtualLocationAddressDTO;

  @ApiProperty()
  @IsBoolean()
  isVirtualLocation: boolean;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

}

export class CreateBookingDTO extends BookingDTO {
  
  @ApiProperty()
  @IsNumber()
  aidServiceId: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  aidServiceProfileId?: number;
}

export class QueryBookingDTO extends QueryDateDTO {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId: string;

  @ApiPropertyOptional()
  @IsEnum(BookingStatus)
  @IsOptional()
  bookingStatus?: BookingStatus;

  @ApiPropertyOptional()
  @IsBooleanString()
  @IsOptional()
  isMatched: string;

  
@ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aidServiceProfileId?: string;
  
@ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aidServiceId?: string;
}

export class ServiceDeliveryConfirmationDTO {
  @ApiProperty()
  @IsBoolean()
  isVirtualLocation: boolean;
}

export class UpdateBookinDTO  extends BookingDTO{
  @ApiProperty()
  @IsEnum(BookingUpdateBookingStatus)
  bookingStatus: BookingUpdateBookingStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bookingStatusNote?: string;
}
