import 'reflect-metadata';
import { LoonyFactory } from '@loonyjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await LoonyFactory.create(AppModule);
  const port = Number(process.env['PORT'] ?? 3001);
  await app.listen(port);
  console.log(`WhatsApp clone running on http://localhost:${port}`);
}

bootstrap().catch(console.error);
