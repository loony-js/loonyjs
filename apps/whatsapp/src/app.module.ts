import { Module } from '@loonyjs/core';
import { TypeOrmModule } from '@loonyjs/typeorm';
import { ChatModule } from './modules/chat.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['DB_PORT'] ?? 5432),
      username: process.env['DB_USER'] ?? 'postgres',
      password: process.env['DB_PASS'] ?? 'postgres',
      database: process.env['DB_NAME'] ?? 'whatsapp_clone',
      entities: [__dirname + '/entities/*.entity.{ts,js}'],
      synchronize: process.env['NODE_ENV'] !== 'production',
      logging: process.env['NODE_ENV'] === 'development',
    }),
    ChatModule,
  ],
})
export class AppModule {}
