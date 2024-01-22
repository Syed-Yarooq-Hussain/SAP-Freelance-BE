// app.module.ts

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
//import { User } from './user/user.model'; //

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
      synchronize: false,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
