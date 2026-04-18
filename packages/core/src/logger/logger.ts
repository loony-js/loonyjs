export type LogLevel = 'verbose' | 'debug' | 'log' | 'warn' | 'error' | 'fatal';

const LEVEL_ORDER: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

export interface LoggerService {
  verbose(message: any, context?: string): void;
  debug(message: any, context?: string): void;
  log(message: any, context?: string): void;
  warn(message: any, context?: string): void;
  error(message: any, trace?: string, context?: string): void;
  fatal(message: any, trace?: string, context?: string): void;
  setLogLevels?(levels: LogLevel[]): void;
}

const COLOURS: Record<LogLevel, string> = {
  verbose: '\x1b[37m',  // white
  debug:   '\x1b[34m',  // blue
  log:     '\x1b[32m',  // green
  warn:    '\x1b[33m',  // yellow
  error:   '\x1b[31m',  // red
  fatal:   '\x1b[35m',  // magenta
};
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

/**
 * Built-in structured logger.
 *
 * Design decision: context is first-class rather than embedded in the message.
 * Each Logger instance carries its own context string (set at construction time
 * or via setContext), but global log-level filtering is static so it applies
 * to all instances without needing a central registry.
 */
export class Logger implements LoggerService {
  private static activeLevels: Set<LogLevel> = new Set(LEVEL_ORDER);
  static instance: LoggerService = new Logger('System');

  constructor(private context = '') {}

  static setLogLevels(levels: LogLevel[]): void {
    Logger.activeLevels = new Set(levels);
  }

  setContext(context: string): void {
    this.context = context;
  }

  verbose(message: any, context?: string): void {
    this.print('verbose', message, context);
  }

  debug(message: any, context?: string): void {
    this.print('debug', message, context);
  }

  log(message: any, context?: string): void {
    this.print('log', message, context);
  }

  warn(message: any, context?: string): void {
    this.print('warn', message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.print('error', message, context);
    if (trace) process.stderr.write(`${COLOURS.error}${trace}${RESET}\n`);
  }

  fatal(message: any, trace?: string, context?: string): void {
    this.print('fatal', message, context);
    if (trace) process.stderr.write(`${COLOURS.fatal}${trace}${RESET}\n`);
  }

  private print(level: LogLevel, message: any, context?: string): void {
    if (!this.isActive(level)) return;

    const ctx = context ?? this.context;
    const timestamp = new Date().toISOString();
    const colour = COLOURS[level];
    const label = level.toUpperCase().padEnd(7);
    const contextStr = ctx ? ` ${BOLD}[${ctx}]${RESET}` : '';
    const stream = level === 'error' || level === 'fatal' ? process.stderr : process.stdout;

    const msg =
      typeof message === 'string' ? message : JSON.stringify(message, null, 2);

    stream.write(
      `${colour}${label}${RESET} ${BOLD}${timestamp}${RESET}${contextStr} ${msg}\n`,
    );
  }

  private isActive(level: LogLevel): boolean {
    return Logger.activeLevels.has(level);
  }
}

/** Convenience static logger — use when you don't want to inject. */
export const logger = new Logger('LoonyJS');
