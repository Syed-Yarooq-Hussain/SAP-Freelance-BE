import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './config/allexceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import * as express from 'express';
import * as path from 'path';
import session = require('express-session');
import * as passport from 'passport';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.enableCors({
    origin: process.env.FE_URL,
    credentials: true,
  });

  app.use(
    session({
      name: 'sap.sid',
      secret: process.env.SESSION_SECRET || 'super-secret',
      resave: false,
      saveUninitialized: false,
      proxy: isProduction,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use('/pdf', express.static(path.join(process.cwd(), 'pdf')));

  const options = new DocumentBuilder()
    .setTitle('SAP-freelance-portal-api')
    .setDescription('This application is a freelance portal API')
    .setVersion('1.0')
    .addTag('Crystal')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`App running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});