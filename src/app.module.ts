import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConsultantDetail } from 'models/consultant-detail.model';
import { User } from '../models/user.model';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin',
      database: 'sap_freelancer_portal',
      autoLoadModels: true,
      synchronize: true,
      models: [User, ConsultantDetail], // Use ModelCtor<Model> as the correct type
    }),
    UserModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
