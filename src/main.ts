import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './config/allexceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import * as express from 'express';
import * as path from 'path';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  // 🔥 VERY IMPORTANT FOR RAILWAY / PROXY
  const server = app.getHttpAdapter().getInstance();
  server.set('trust proxy', 1);

  app.enableCors({
    origin: process.env.FE_URL,
    credentials: true,
  });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use('/pdf', express.static(path.join(process.cwd(), 'pdf')));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'super-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true, 
        sameSite: 'none',     
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const options = new DocumentBuilder()
    .setTitle('SAP-freelance-portal-api')
    .setDescription('This application is a freelance portal API')
    .setVersion('1.0')
    .addTag('Crystal')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`App running on port ${port}`);
  
}

bootstrap();
