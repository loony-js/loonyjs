import {
  CanActivate,
  ExecutionContext,
  Reflector,
  Injectable,
  Inject,
  SetMetadata,
  ForbiddenException,
} from '@loonyjs/core';

export const ROLES_KEY = 'loony:roles';

/**
 * Attach required roles to a route or controller.
 *
 * @example
 *   @Roles('admin', 'superuser')
 *   @Get('dashboard')
 *   getDashboard() { ... }
 */
export function Roles(...roles: string[]): ClassDecorator & MethodDecorator {
  return SetMetadata(ROLES_KEY, roles);
}

/**
 * Guard that checks req.user.roles against the @Roles() metadata.
 * Requires your auth middleware to attach user to the request.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.roles) throw new ForbiddenException('No roles on request user');

    const hasRole = required.some((role) => (user.roles as string[]).includes(role));
    if (!hasRole) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
