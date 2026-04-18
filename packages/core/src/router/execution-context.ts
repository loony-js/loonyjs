import { ExecutionContext, HttpArgumentsHost } from '../interfaces';

/**
 * Concrete ExecutionContext implementation.
 * Created per-request by the RouterExecutor.
 */
export class ExecutionContextHost implements ExecutionContext {
  constructor(
    private readonly args: [any, any, any],
    private readonly controllerClass: Function,
    private readonly handler: Function,
  ) {}

  getHandler(): Function {
    return this.handler;
  }

  getClass(): Function {
    return this.controllerClass;
  }

  switchToHttp(): HttpArgumentsHost {
    const [req, res, next] = this.args;
    return {
      getRequest: <T = any>() => req as T,
      getResponse: <T = any>() => res as T,
      getNext: <T = any>() => next as T,
    };
  }
}
