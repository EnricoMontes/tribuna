import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dns from 'node:dns';
import { AppModule } from './app.module.js';

// Algunos DNS no resuelven los registros SRV de "mongodb+srv://" (error querySrv ECONNREFUSED).
// Si pasa, se definen servidores DNS públicos en el .env (mismo workaround que el ejemplo del profe).
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(','));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // El front vive en otro dominio (localhost:4200 / Vercel): sin CORS el navegador bloquea las respuestas.
  app.enableCors({
    origin: (process.env.FRONT_URL ?? 'http://localhost:4200').split(','),
  });

  // Valida TODOS los body contra su DTO. Si algo no cumple -> 400 Bad Request automático.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta propiedades que no están en el DTO
      forbidNonWhitelisted: true, // ...y si mandan alguna de más, responde 400
      transform: true, // convierte el body en una instancia del DTO
      stopAtFirstError: true, // un solo mensaje por campo (el primero que falla)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
