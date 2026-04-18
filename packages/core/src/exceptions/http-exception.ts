/**
 * Base class for all HTTP-layer exceptions.
 *
 * Design decision: keep exceptions serialisable so interceptors can
 * format them consistently without needing extra instanceof checks.
 */
export class HttpException extends Error {
  readonly statusCode: number;
  readonly response: string | Record<string, unknown>;

  constructor(response: string | Record<string, unknown>, statusCode: number) {
    super(typeof response === 'string' ? response : JSON.stringify(response));
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.response = response;
    // Preserve prototype chain across transpilers
    Object.setPrototypeOf(this, new.target.prototype);
  }

  getStatus(): number {
    return this.statusCode;
  }

  getResponse(): string | Record<string, unknown> {
    return this.response;
  }

  toJSON(): Record<string, unknown> {
    const body =
      typeof this.response === 'string'
        ? { message: this.response, statusCode: this.statusCode }
        : { ...this.response, statusCode: this.statusCode };
    return body;
  }
}

// ------------------------------------------------------------------
// Convenience subclasses (mirrors HTTP status codes)
// ------------------------------------------------------------------

export class BadRequestException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Not Found') {
    super(message, 404);
  }
}

export class MethodNotAllowedException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Method Not Allowed') {
    super(message, 405);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Conflict') {
    super(message, 409);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Unprocessable Entity') {
    super(message, 422);
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Internal Server Error') {
    super(message, 500);
  }
}

export class NotImplementedException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Not Implemented') {
    super(message, 501);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message: string | Record<string, unknown> = 'Service Unavailable') {
    super(message, 503);
  }
}
