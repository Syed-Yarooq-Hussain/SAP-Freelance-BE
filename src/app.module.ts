import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';
import { User } from '../models/user';  
import { ModelCtor } from 'sequelize/types';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'crystal_user',
      autoLoadModels: true,
      synchronize: true,
      models: [User as any], // Use ModelCtor<Model> as the correct type
    }),
    UserModule,
    AuthModule, PassportModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
