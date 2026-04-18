import { Module, MiddlewareConfigurable, MiddlewareConsumer } from '@loonyjs/core';
import { ConfigModule } from '@loonyjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { AuthMiddleware } from './auth/auth.middleware';

/**
 * Root application module.
 *
 * Design decision: AppModule is the composition root.
 * It wires together feature modules and applies global middleware.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule implements MiddlewareConfigurable {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}
