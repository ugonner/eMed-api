import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Auth } from './auth.entity';
import { Profile } from './user.entity';
import { CallRoom } from './call.entity';
import { AidServiceProfileVerificationStatus } from '../shared/enums/aid-service.enum';
import { AidService } from './aid-service.entity';
import { ILocationAddressDTO, ISocialMediaLinksDTO } from '../shared/dtos/aid-service.dto';
import { Booking } from './booking.entity';

@Entity()
export class AidServiceProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: AidServiceProfileVerificationStatus.PENDING })
  verificationStatus: AidServiceProfileVerificationStatus;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0.0 })
  audioCallEarnings?: number;
  @Column({ default: 0.0 })
  videoCallEarnings?: number;
  @Column({ default: 0.0 })
  onSiteEarnings?: number;
  @Column({ default: 0.0 })
  virtualServiceEarnings?: number;
  
  @Column({ default: 0.0 })
  totalEarningsBalance?: number;

  @Column({ default: 0 })
  noOfAudioCallServices?: number;
  
  @Column({ default: 0 })
  noOfVideoCallServices?: number;
  
  @Column({ default: 0 })
  noOfOnSiteServices?: number;

  @Column({ default: 0 })
  noOfVirtualServices?: number;
  
  @Column({ default: 0 })
  totalServicesRendered: number;

  @Column({nullable: true})
  businessDocumentUrl?: string;
  
  @Column({nullable: true})
  mediaFile?: string;
  
  @Column({nullable: true})
  contactPhoneNumber?: string;
  
  @Column({nullable: true, type: "json"})
  socialMediaLinks: ISocialMediaLinksDTO;
  
  @Column({nullable: true, type: "json"})
  locationAddress: ILocationAddressDTO;
  
  @Column({nullable: true})
  verificationComment: string;
  
  @Column({type: "float", default: 0})
  averageRating: number;

  @Column({type: "float", default: 0})
  noOfRatings: number;
  
  @ManyToOne(() => Profile)
  @JoinColumn()
  verifiedBy: Profile;


  @ManyToOne(() => Profile, (user) => user.aidServiceProfiles)
  @JoinColumn()
  profile: Profile;

  @ManyToOne(() => AidService, (aidService) => aidService.aidServiceProfiles)
  @JoinColumn()
  aidService: AidService;

  @OneToMany(() => CallRoom, (callRoom) => callRoom.aidServiceProfile)
  calls: CallRoom[];

  @OneToMany(() => Booking, (booking) => booking.aidServiceProfile)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({type: "bool", default: false})
  isDeleted: boolean;
}
