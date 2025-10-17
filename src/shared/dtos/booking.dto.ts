import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsBooleanString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ILocationAddressDTO } from './aid-service.dto';
import { QueryDateDTO } from './query-request.dto copy';
import { BookingStatus, BookingUpdateBookingStatus } from '../enums/booking.enum';

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

  @ApiProperty()
  @IsString()
  startDate: string;


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
