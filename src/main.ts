import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './config/allexceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import * as express from 'express';
import * as path from 'path';
import session from 'express-session';
import * as passport from 'passport';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({
    origin: process.env.FE_URL,
    credentials: true,
  });

  const redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on('error', (error) => {
    console.error('Redis error:', error);
  });

  await redisClient.connect();

  app.use(
    session({
      name: 'sap.sid',

      store: new RedisStore({
        client: redisClient,
        prefix: 'sap:sess:',
      }),

      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,

      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite:
          process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

  await app.listen(port);

  console.log(`App running on port ${port}`);
}

bootstrap();