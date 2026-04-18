import 'reflect-metadata';
import { LoonyFactory, Logger } from '@loonyjs/core';
import { LoggingInterceptor, HttpExceptionFilter, ValidationPipe } from '@loonyjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Reflector } from '@loonyjs/core';

const log = new Logger('Bootstrap');

async function bootstrap() {
  const app = await LoonyFactory.create(AppModule);

  // ── Global exception filter (outermost safety net) ──────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global validation pipe ───────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe());

  // ── Global logging interceptor ───────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Start listening ──────────────────────────────────────────────
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  await app.listen(port);

  log.log(`
╔════════════════════════════════════════════╗
║        LoonyJS Demo Application            ║
╠════════════════════════════════════════════╣
║  http://localhost:${port}                     ║
║                                            ║
║  GET  /health          Health check        ║
║  GET  /users           List users          ║
║  GET  /users/count     User count          ║
║  GET  /users/:id       Get user            ║
║  POST /users           Create user         ║
║  PATCH /users/:id      Update user         ║
║  DELETE /users/:id     Delete user         ║
║                                            ║
║  Auth: Authorization: Bearer admin-token   ║
╚════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  log.error('Failed to start application', err.stack);
  process.exit(1);
});
