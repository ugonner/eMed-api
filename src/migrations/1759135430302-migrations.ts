import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1759135430302 implements MigrationInterface {
    name = 'Migrations1759135430302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "role" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "permissions" json,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"),
                CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "auth" (
                "id" SERIAL NOT NULL,
                "email" character varying,
                "phoneNumber" character varying,
                "password" character varying NOT NULL,
                "userType" character varying NOT NULL DEFAULT 'Guest',
                "status" character varying NOT NULL DEFAULT 'Inactive',
                "userId" character varying NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "otp" integer,
                "otpTime" TIMESTAMP,
                "isVerified" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "roleId" integer,
                "profileId" integer,
                CONSTRAINT "REL_ca49e738c1e64b0c839cae30d4" UNIQUE ("profileId"),
                CONSTRAINT "PK_7e416cf6172bc5aec04244f6459" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_373ead146f110f04dad6084815" ON "auth" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "aid_service_tag" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "tagId" integer,
                "aidServiceId" integer,
                CONSTRAINT "PK_469ef1b7eb55b34f54c3dda25fc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "payment_transaction" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "paymentRef" character varying,
                "paymentMethod" character varying NOT NULL,
                "paymentStatus" character varying NOT NULL,
                "paymentPurpose" character varying NOT NULL,
                "amount" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "bookingId" integer,
                "profileId" integer,
                CONSTRAINT "REL_a0df4573f2a0c4d351fea2c598" UNIQUE ("bookingId"),
                CONSTRAINT "PK_82c3470854cf4642dfb0d7150cd" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "booking" (
                "id" SERIAL NOT NULL,
                "compositeBookingId" character varying NOT NULL,
                "bookingStatus" character varying NOT NULL DEFAULT 'Pending',
                "bookingStatusNote" character varying,
                "paymentStatus" character varying NOT NULL DEFAULT 'Not Paid',
                "totalAmount" integer NOT NULL DEFAULT '0',
                "bookingNote" character varying,
                "locationAddress" json,
                "virtualLocationAddress" json,
                "startDate" character varying NOT NULL,
                "endDate" character varying NOT NULL,
                "duration" integer NOT NULL DEFAULT '0',
                "isMatched" boolean NOT NULL DEFAULT false,
                "confirmedByProvider" boolean NOT NULL DEFAULT false,
                "confirmedByUser" boolean NOT NULL DEFAULT false,
                "isVirtualLocation" boolean NOT NULL DEFAULT false,
                "rating" double precision NOT NULL DEFAULT '0',
                "review" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "aidServiceId" integer,
                "aidServiceProfileId" integer,
                "profileId" integer,
                CONSTRAINT "PK_49171efc69702ed84c812f33540" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "profile_cluster" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "clusterId" integer,
                "profileId" integer,
                CONSTRAINT "PK_569df9b7fcd4bd84832a23fb62a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "cluster" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_b09d39b9491ce5cb1e8407761fd" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "aid_service_cluster" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "clusterId" integer,
                "aidServiceId" integer,
                CONSTRAINT "PK_8869d0dd7cc7354d5ddcde25668" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "aid_service" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "avatar" character varying,
                "noOfAidServiceProfiles" integer DEFAULT '0',
                "audioCallRate" integer,
                "videoCallRate" integer,
                "onSiteRate" integer,
                "virtualServiceRate" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "profileId" integer,
                CONSTRAINT "PK_8086806e93e94ac02ba64b0204f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "aid_service_profile" (
                "id" SERIAL NOT NULL,
                "verificationStatus" character varying NOT NULL DEFAULT 'Pending',
                "name" character varying,
                "description" character varying,
                "audioCallEarnings" integer NOT NULL DEFAULT '0',
                "videoCallEarnings" integer NOT NULL DEFAULT '0',
                "onSiteEarnings" integer NOT NULL DEFAULT '0',
                "virtualServiceEarnings" integer NOT NULL DEFAULT '0',
                "totalEarningsBalance" integer NOT NULL DEFAULT '0',
                "noOfAudioCallServices" integer NOT NULL DEFAULT '0',
                "noOfVideoCallServices" integer NOT NULL DEFAULT '0',
                "noOfOnSiteServices" integer NOT NULL DEFAULT '0',
                "noOfVirtualServices" integer NOT NULL DEFAULT '0',
                "totalServicesRendered" integer NOT NULL DEFAULT '0',
                "businessDocumentUrl" character varying,
                "mediaFile" character varying,
                "contactPhoneNumber" character varying,
                "socialMediaLinks" json,
                "locationAddress" json,
                "verificationComment" character varying,
                "averageRating" double precision NOT NULL DEFAULT '0',
                "noOfRatings" double precision NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "verifiedById" integer,
                "profileId" integer,
                "aidServiceId" integer,
                CONSTRAINT "PK_6f43a2449d8cc6a0e018dd22fcc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "call_room" (
                "id" SERIAL NOT NULL,
                "roomId" character varying NOT NULL,
                "roomType" character varying NOT NULL,
                "startTime" integer NOT NULL,
                "endTime" integer NOT NULL,
                "answered" boolean NOT NULL DEFAULT false,
                "callPurpose" character varying NOT NULL,
                "callType" character varying NOT NULL,
                "rating" double precision NOT NULL DEFAULT '0',
                "review" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "aidServiceProfileId" integer,
                "initiatedById" integer,
                CONSTRAINT "PK_8b1e229daf5424206a2a807896b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "profile" (
                "id" SERIAL NOT NULL,
                "userId" character varying NOT NULL,
                "email" character varying,
                "firstName" character varying,
                "lastName" character varying,
                "avatar" character varying,
                "gender" character varying,
                "phoneNumber" character varying,
                "disabilityType" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "walletId" integer,
                CONSTRAINT "REL_d307cd0f00be8c8efcc831102b" UNIQUE ("walletId"),
                CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
    CREATE TABLE "profile_wallet" (
        "id" SERIAL NOT NULL,
        "fundedBalance" double precision NOT NULL DEFAULT 0,
        "earnedBalance" double precision NOT NULL DEFAULT 0,
        "pendingBalance" double precision NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_fb95d592ca9968398673eea44fb" PRIMARY KEY ("id")
    )
`);
        await queryRunner.query(`
            CREATE TABLE "room" (
                "id" SERIAL NOT NULL,
                "startTime" TIMESTAMP NOT NULL,
                "endTime" TIMESTAMP NOT NULL,
                "roomId" character varying NOT NULL,
                "roomName" character varying NOT NULL,
                "aidServiceProviders" json,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "ownerId" integer,
                CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "report" (
                "id" SERIAL NOT NULL,
                "rating" integer NOT NULL,
                "review" character varying,
                "serviceType" character varying NOT NULL,
                "serviceTypeEntityId" integer NOT NULL,
                "profileId" integer NOT NULL,
                "isResolved" boolean NOT NULL DEFAULT false,
                "resolvedById" integer,
                "comment" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "profile_id" integer,
                "entityOwnerId" integer,
                CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "report_comment" (
                "id" SERIAL NOT NULL,
                "comment" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "profileId" integer,
                "reportId" integer,
                CONSTRAINT "PK_8bb2bc4a3d9c55e031bc5d015c5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "description" character varying,
                "data" json,
                "avatar" character varying,
                "notificationEventType" character varying NOT NULL,
                "context" character varying NOT NULL,
                "contextEntityId" integer,
                "viewed" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                "creatorId" integer,
                "receiverId" integer,
                CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "review_and_rating" (
                "id" SERIAL NOT NULL,
                "rating" integer NOT NULL,
                "review" character varying,
                "serviceType" character varying NOT NULL,
                "serviceTypeEntityId" integer NOT NULL,
                "profileId" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isDeleted" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_0e94fbac2d526b34300fa98005e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "CallMembersProfile" (
                "callRoomId" integer NOT NULL,
                "profileId" integer NOT NULL,
                CONSTRAINT "PK_16338ad901e237001184ebe914d" PRIMARY KEY ("callRoomId", "profileId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8c8a9e0c7f1de68e7c224bd812" ON "CallMembersProfile" ("callRoomId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2e6071a3f288260887df4e7083" ON "CallMembersProfile" ("profileId")
        `);
        await queryRunner.query(`
            CREATE TABLE "RoomParticipant" (
                "roomId" integer NOT NULL,
                "profileId" integer NOT NULL,
                CONSTRAINT "PK_6805950ca71e200a6f552ef9941" PRIMARY KEY ("roomId", "profileId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6b382d96f800cb7c2b480586f5" ON "RoomParticipant" ("roomId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cc54111ce7c27f56e4d83514f3" ON "RoomParticipant" ("profileId")
        `);
        await queryRunner.query(`
            ALTER TABLE "auth"
            ADD CONSTRAINT "FK_b368cb67ee97687c9fdc9a04153" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "auth"
            ADD CONSTRAINT "FK_ca49e738c1e64b0c839cae30d4e" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_tag"
            ADD CONSTRAINT "FK_c8e96e96979cd2bf2afd75e91d2" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_tag"
            ADD CONSTRAINT "FK_81a7eb4e5de9ec5fc0f0d548b37" FOREIGN KEY ("aidServiceId") REFERENCES "aid_service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_transaction"
            ADD CONSTRAINT "FK_a0df4573f2a0c4d351fea2c5986" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_transaction"
            ADD CONSTRAINT "FK_e25ef1ea9f15b50d4aa150731a1" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "booking"
            ADD CONSTRAINT "FK_9f755d011b9b8199461aaa06613" FOREIGN KEY ("aidServiceId") REFERENCES "aid_service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "booking"
            ADD CONSTRAINT "FK_1dc4b236b764ed8d1552eff2434" FOREIGN KEY ("aidServiceProfileId") REFERENCES "aid_service_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "booking"
            ADD CONSTRAINT "FK_e92ee85850420c227ec980ce76c" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "profile_cluster"
            ADD CONSTRAINT "FK_d97aad3ecb862bab0f395747f3c" FOREIGN KEY ("clusterId") REFERENCES "cluster"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "profile_cluster"
            ADD CONSTRAINT "FK_b1e2c1cc3a940ed52b1ea664477" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_cluster"
            ADD CONSTRAINT "FK_425b0a6f642f091a9a49975d8f0" FOREIGN KEY ("clusterId") REFERENCES "cluster"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_cluster"
            ADD CONSTRAINT "FK_bb1c821ee7b4c78c4ca909d657d" FOREIGN KEY ("aidServiceId") REFERENCES "aid_service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service"
            ADD CONSTRAINT "FK_bf0c29f8bba419447fde8fbed43" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_profile"
            ADD CONSTRAINT "FK_30f9690697699badf6c50a3fee5" FOREIGN KEY ("verifiedById") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_profile"
            ADD CONSTRAINT "FK_16657f3f9d33e6ab8b9b97b5971" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_profile"
            ADD CONSTRAINT "FK_79fd8bfcb413d9445bb5d2662ad" FOREIGN KEY ("aidServiceId") REFERENCES "aid_service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "call_room"
            ADD CONSTRAINT "FK_a2e7bdbfd1f3660a328eb7735be" FOREIGN KEY ("aidServiceProfileId") REFERENCES "aid_service_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "call_room"
            ADD CONSTRAINT "FK_d65554b5e3c256591d360527635" FOREIGN KEY ("initiatedById") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "profile"
            ADD CONSTRAINT "FK_d307cd0f00be8c8efcc831102b2" FOREIGN KEY ("walletId") REFERENCES "profile_wallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "room"
            ADD CONSTRAINT "FK_65283be59094a73fed31ffeee4e" FOREIGN KEY ("ownerId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "report"
            ADD CONSTRAINT "FK_72e61826547d60306404d4786ea" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "report"
            ADD CONSTRAINT "FK_e66c500f263ab1aaaf63f501d51" FOREIGN KEY ("entityOwnerId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "report_comment"
            ADD CONSTRAINT "FK_3f3504bbd85a4bc8546ac4d1392" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "report_comment"
            ADD CONSTRAINT "FK_78fb2f5b494cf91bc899f28ead7" FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification"
            ADD CONSTRAINT "FK_dd9610f49f6281c705287cf8e67" FOREIGN KEY ("creatorId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification"
            ADD CONSTRAINT "FK_758d70a0e61243171e785989070" FOREIGN KEY ("receiverId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "CallMembersProfile"
            ADD CONSTRAINT "FK_8c8a9e0c7f1de68e7c224bd812b" FOREIGN KEY ("callRoomId") REFERENCES "call_room"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "CallMembersProfile"
            ADD CONSTRAINT "FK_2e6071a3f288260887df4e70839" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "RoomParticipant"
            ADD CONSTRAINT "FK_6b382d96f800cb7c2b480586f59" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "RoomParticipant"
            ADD CONSTRAINT "FK_cc54111ce7c27f56e4d83514f33" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "RoomParticipant" DROP CONSTRAINT "FK_cc54111ce7c27f56e4d83514f33"
        `);
        await queryRunner.query(`
            ALTER TABLE "RoomParticipant" DROP CONSTRAINT "FK_6b382d96f800cb7c2b480586f59"
        `);
        await queryRunner.query(`
            ALTER TABLE "CallMembersProfile" DROP CONSTRAINT "FK_2e6071a3f288260887df4e70839"
        `);
        await queryRunner.query(`
            ALTER TABLE "CallMembersProfile" DROP CONSTRAINT "FK_8c8a9e0c7f1de68e7c224bd812b"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification" DROP CONSTRAINT "FK_758d70a0e61243171e785989070"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification" DROP CONSTRAINT "FK_dd9610f49f6281c705287cf8e67"
        `);
        await queryRunner.query(`
            ALTER TABLE "report_comment" DROP CONSTRAINT "FK_78fb2f5b494cf91bc899f28ead7"
        `);
        await queryRunner.query(`
            ALTER TABLE "report_comment" DROP CONSTRAINT "FK_3f3504bbd85a4bc8546ac4d1392"
        `);
        await queryRunner.query(`
            ALTER TABLE "report" DROP CONSTRAINT "FK_e66c500f263ab1aaaf63f501d51"
        `);
        await queryRunner.query(`
            ALTER TABLE "report" DROP CONSTRAINT "FK_72e61826547d60306404d4786ea"
        `);
        await queryRunner.query(`
            ALTER TABLE "room" DROP CONSTRAINT "FK_65283be59094a73fed31ffeee4e"
        `);
        await queryRunner.query(`
            ALTER TABLE "profile" DROP CONSTRAINT "FK_d307cd0f00be8c8efcc831102b2"
        `);
        await queryRunner.query(`
            ALTER TABLE "call_room" DROP CONSTRAINT "FK_d65554b5e3c256591d360527635"
        `);
        await queryRunner.query(`
            ALTER TABLE "call_room" DROP CONSTRAINT "FK_a2e7bdbfd1f3660a328eb7735be"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_profile" DROP CONSTRAINT "FK_79fd8bfcb413d9445bb5d2662ad"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_profile" DROP CONSTRAINT "FK_16657f3f9d33e6ab8b9b97b5971"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_profile" DROP CONSTRAINT "FK_30f9690697699badf6c50a3fee5"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service" DROP CONSTRAINT "FK_bf0c29f8bba419447fde8fbed43"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_cluster" DROP CONSTRAINT "FK_bb1c821ee7b4c78c4ca909d657d"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_cluster" DROP CONSTRAINT "FK_425b0a6f642f091a9a49975d8f0"
        `);
        await queryRunner.query(`
            ALTER TABLE "profile_cluster" DROP CONSTRAINT "FK_b1e2c1cc3a940ed52b1ea664477"
        `);
        await queryRunner.query(`
            ALTER TABLE "profile_cluster" DROP CONSTRAINT "FK_d97aad3ecb862bab0f395747f3c"
        `);
        await queryRunner.query(`
            ALTER TABLE "booking" DROP CONSTRAINT "FK_e92ee85850420c227ec980ce76c"
        `);
        await queryRunner.query(`
            ALTER TABLE "booking" DROP CONSTRAINT "FK_1dc4b236b764ed8d1552eff2434"
        `);
        await queryRunner.query(`
            ALTER TABLE "booking" DROP CONSTRAINT "FK_9f755d011b9b8199461aaa06613"
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_transaction" DROP CONSTRAINT "FK_e25ef1ea9f15b50d4aa150731a1"
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_transaction" DROP CONSTRAINT "FK_a0df4573f2a0c4d351fea2c5986"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_tag" DROP CONSTRAINT "FK_81a7eb4e5de9ec5fc0f0d548b37"
        `);
        await queryRunner.query(`
            ALTER TABLE "aid_service_tag" DROP CONSTRAINT "FK_c8e96e96979cd2bf2afd75e91d2"
        `);
        await queryRunner.query(`
            ALTER TABLE "auth" DROP CONSTRAINT "FK_ca49e738c1e64b0c839cae30d4e"
        `);
        await queryRunner.query(`
            ALTER TABLE "auth" DROP CONSTRAINT "FK_b368cb67ee97687c9fdc9a04153"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cc54111ce7c27f56e4d83514f3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6b382d96f800cb7c2b480586f5"
        `);
        await queryRunner.query(`
            DROP TABLE "RoomParticipant"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2e6071a3f288260887df4e7083"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8c8a9e0c7f1de68e7c224bd812"
        `);
        await queryRunner.query(`
            DROP TABLE "CallMembersProfile"
        `);
        await queryRunner.query(`
            DROP TABLE "review_and_rating"
        `);
        await queryRunner.query(`
            DROP TABLE "notification"
        `);
        await queryRunner.query(`
            DROP TABLE "report_comment"
        `);
        await queryRunner.query(`
            DROP TABLE "report"
        `);
        await queryRunner.query(`
            DROP TABLE "room"
        `);
        await queryRunner.query(`
            DROP TABLE "profile_wallet"
        `);
        await queryRunner.query(`
            DROP TABLE "profile"
        `);
        await queryRunner.query(`
            DROP TABLE "call_room"
        `);
        await queryRunner.query(`
            DROP TABLE "aid_service_profile"
        `);
        await queryRunner.query(`
            DROP TABLE "aid_service"
        `);
        await queryRunner.query(`
            DROP TABLE "aid_service_cluster"
        `);
        await queryRunner.query(`
            DROP TABLE "cluster"
        `);
        await queryRunner.query(`
            DROP TABLE "profile_cluster"
        `);
        await queryRunner.query(`
            DROP TABLE "booking"
        `);
        await queryRunner.query(`
            DROP TABLE "payment_transaction"
        `);
        await queryRunner.query(`
            DROP TABLE "aid_service_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "tag"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_373ead146f110f04dad6084815"
        `);
        await queryRunner.query(`
            DROP TABLE "auth"
        `);
        await queryRunner.query(`
            DROP TABLE "role"
        `);
    }

}
