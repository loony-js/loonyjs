import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Reflector } from '@loonyjs/core';

const IS_PUBLIC_KEY = 'isPublic';

/**
 * JWT auth guard — blocks unauthenticated requests unless the route is @Public().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}
