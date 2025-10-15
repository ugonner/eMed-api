import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Auth } from './auth.entity';
import { Gender } from '../shared/enums/user.enum';
import { AidService } from './aid-service.entity';
import { CallRoom } from './call.entity';
import { AidServiceProfile } from './aid-service-profile.entity';
import { Profile } from './user.entity';

@Entity()
export class ProfileWallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: "float", default: 0.00, precision: 2})
  fundedBalance: number;
  
  @Column({type: "float", default: 0.00, precision: 2})
  earnedBalance: number;
  
  @Column({type: "float", default: 0.00, precision: 2})
  pendingBalance: number;

  @OneToOne(() => Profile, (profile) => profile.wallet)
  profile: Profile;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  
  @Column({type: "bool", default: false})
  isDeleted: boolean;
}
