import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallModule } from './call/call.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notifiction/notification.module';
import { AidServiceModule } from './aid-service/aid-service.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailModule } from './mail/mail.module';
import { TalkableModule } from './talkable/talkable.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import * as path from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BookingModule } from './booking/booking.module';
import { ReviewModule } from './review/review.module';
import { ReportModule } from './report/report.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    TalkableModule,
    CallModule,
    ConfigModule.forRoot({isGlobal: true}),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        entities: ['dist/**/*.entity.js'],
      synchronize: false,
      ssl: process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false } 
  : false,
      }),
      inject: [ConfigService]
    }),
    AuthModule,
    UserModule,
    NotificationModule,
    AidServiceModule,
    MailerModule.forRoot({
      transport: {
        host: `${process.env.NODEMAILER_HOST}`, // Replace with your SMTP server
        port: 587, // SMTP port
        secure: false, // Use TLS or not
        auth: {
          user: process.env.NODEMAILER_USER,
          pass: process.env.NODEMAILER_PASS
        },
      },
      defaults: {
        from: `${process.env.NODEMAILER_USERNAME} <${process.env.NODEMAILER_USER}>`, // Default sender
      },
      template: {
        dir: path.join(__dirname, '../src/mail/templates'), // Path to email templates
        adapter: new HandlebarsAdapter(), // Template engine adapter
        options: {
          strict: true,
        },
      },
    }),
    MailModule,
    FileUploadModule,
    BookingModule,
    ReviewModule,
    ReportModule,
    NotificationModule,
    TransactionModule
  

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
