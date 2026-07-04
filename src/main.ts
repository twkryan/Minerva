import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';


async function bootstrap() {
  //Cria o server https
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // ValidationPipe valida os dados automáticamente
  app.enableCors();

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Plataforma de Estudos - API MVP')
    .setDescription('Documentação das rotas de Onboarding com NestJS + Clerk')
    .setVersion('1.0')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3333);
  console.log('🚀 Backend NestJS rodando em: http://localhost:3333');
  console.log('📑 Swagger disponível em: http://localhost:3333/api');
}
bootstrap();