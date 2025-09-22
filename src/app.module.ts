import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';
import { User } from '../models/user.model';  
import { ModelCtor } from 'sequelize/types';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { ConsultantDetail } from 'models/consultant-detail.model';

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
    AuthModule, PassportModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
