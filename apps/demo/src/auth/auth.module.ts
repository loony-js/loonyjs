import { Module } from '@loonyjs/core';
import { AuthMiddleware } from './auth.middleware';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  providers: [AuthMiddleware, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
