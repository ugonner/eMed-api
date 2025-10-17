import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AidServiceTag } from './aid-service-tag.entity';
import { BookingStatus } from '../shared/enums/booking.enum';
import { ILocationAddressDTO } from '../shared/dtos/aid-service.dto';
import { Profile } from './user.entity';
import { AidService } from './aid-service.entity';
import { PaymentTransaction } from './transaction.entity';
import { PaymentStatus } from '../transaction/enums/payment.enum';
import { AidServiceProfile } from './aid-service-profile.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  compositeBookingId: string;

  @Column({ default: BookingStatus.PENDING })
  bookingStatus: BookingStatus;

  @Column({ nullable: true })
  bookingStatusNote?: string;

  @Column({ default: PaymentStatus.NOT_PAID })
  paymentStatus: PaymentStatus;

  @Column({ default: 0.0 })
  totalAmount: number;

  @Column({ nullable: true })
  bookingNote: string;

  @Column({ type: 'json', nullable: true })
  locationAddress: ILocationAddressDTO;

  @Column()
  startDate: string;

  @Column()
  endDate: string;

  @Column({ type: 'bool', default: false })
  confirmedByProvider: boolean;
  @Column({ type: 'bool', default: false })
  confirmedByUser: boolean;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ nullable: true })
  review: string;

  @Column({type: "bool", default: false})
  isMatched: boolean;

  @ManyToOne(() => AidService, (aidService) => aidService.bookings)
  aidService: AidService;

  @ManyToOne(
    () => AidServiceProfile,
    (aidServiceProfile) => aidServiceProfile.bookings,
  )
  aidServiceProfile: AidServiceProfile;

  @ManyToOne(() => Profile, (profile) => profile.bookings)
  profile: Profile;

  @OneToOne(() => PaymentTransaction, (trx) => trx.booking)
  paymentTransaction: PaymentTransaction;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'bool', default: false })
  isDeleted: boolean;
}
