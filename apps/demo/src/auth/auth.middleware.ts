import { Injectable, LoonyMiddleware } from '@loonyjs/core';
import { Logger } from '@loonyjs/core';

/**
 * Demo auth middleware — attaches a mock user to every request.
 * In production this would verify a JWT or session.
 */
@Injectable()
export class AuthMiddleware implements LoonyMiddleware {
  private readonly log = new Logger('AuthMiddleware');

  use(req: any, _res: any, next: () => void): void {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (token === 'admin-token') {
      req.user = { id: '1', email: 'alice@example.com', roles: ['admin', 'user'] };
    } else if (token) {
      req.user = { id: '2', email: 'bob@example.com', roles: ['user'] };
    } else {
      req.user = null;
    }

    this.log.verbose(`Auth: ${req.user?.email ?? 'anonymous'} → ${req.method} ${req.url}`);
    next();
  }
}
