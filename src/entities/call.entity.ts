import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { callPurpose, CallType, RoomType } from "../shared/enums/call.enum";
import { Profile } from "./user.entity";
import { AidService } from "./aid-service.entity";
import { AidServiceProfile } from "./aid-service-profile.entity";


@Entity()
export class CallRoom {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    roomId: string;

    @Column()
    roomType: RoomType;

    @Column()
    startTime: number;

    @Column()
    endTime: number;

    @Column({type: "bool", default: false})
    answered?: boolean;

    @Column()
    callPurpose: callPurpose;
    
    @Column()
    callType: CallType;

    
  @Column({type: "float", default: 0})
  rating: number;

  @Column({nullable: true})
  review: string;

    @ManyToOne(() => AidServiceProfile, (aidServiceProfile) => aidServiceProfile.calls)
    @JoinColumn()
    aidServiceProfile: AidServiceProfile;

    @ManyToMany(() => Profile, (profile) => profile.calls )
    @JoinTable({
        name: "CallMembersProfile"
    })
    callMembers: Profile[];

    @ManyToOne(() => Profile, (profile) => profile.initiatedCalls)
    @JoinColumn()
    initiatedBy: Profile;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    
  @Column({type: "bool", default: false})
  isDeleted: boolean;
}