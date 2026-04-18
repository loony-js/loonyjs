import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '../decorators/injectable.decorator';
import { DynamicModule } from '../decorators/module.decorator';

export interface ConfigModuleOptions {
  /** Path to .env file (default: process.cwd()/.env). */
  envFilePath?: string | string[];
  /** Whether config variables are global (default: false). */
  isGlobal?: boolean;
  /** Throw on missing required variables. */
  validationSchema?: Record<string, { required?: boolean; default?: any; type?: 'string' | 'number' | 'boolean' }>;
}

/**
 * Typed configuration service.
 * Reads from environment variables, .env files, and optional defaults.
 *
 * Design decision: strongly typed get<T>() avoids the "any soup" that
 * process.env gives you by default.
 */
@Injectable()
export class ConfigService {
  private readonly store: Map<string, any> = new Map();

  constructor(config: Record<string, any> = {}) {
    // Seed with process.env first, then override with explicit config
    for (const [k, v] of Object.entries(process.env)) {
      if (v !== undefined) this.store.set(k, v);
    }
    for (const [k, v] of Object.entries(config)) {
      this.store.set(k, v);
    }
  }

  get<T = string>(key: string, defaultValue?: T): T {
    const raw = this.store.get(key);
    if (raw !== undefined) return this.coerce(raw) as T;
    if (defaultValue !== undefined) return defaultValue;
    return undefined as unknown as T;
  }

  getOrThrow<T = string>(key: string): T {
    const val = this.get<T>(key);
    if (val === undefined || val === null) {
      throw new Error(`Configuration key "${key}" is required but was not found.`);
    }
    return val;
  }

  set(key: string, value: any): void {
    this.store.set(key, value);
  }

  private coerce(value: any): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    if (!isNaN(num) && value !== '') return num;
    return value;
  }
}

/** Sentinel class used as the DynamicModule identity for ConfigModule. */
class _ConfigModuleClass {}

/**
 * Dynamic config module that parses .env files and registers ConfigService.
 */
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    const envConfig = ConfigModule.loadEnvFiles(options.envFilePath);
    ConfigModule.validate(envConfig, options.validationSchema);

    const configService = new ConfigService(envConfig);

    return {
      module: _ConfigModuleClass as any,
      global: options.isGlobal ?? false,
      providers: [
        { provide: ConfigService, useValue: configService },
      ],
      exports: [ConfigService],
    };
  }

  private static loadEnvFiles(paths?: string | string[]): Record<string, string> {
    const files = paths
      ? (Array.isArray(paths) ? paths : [paths])
      : [path.resolve(process.cwd(), '.env')];

    const config: Record<string, string> = {};

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        // Strip surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"'))
          || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        config[key] = value;
      }
    }

    return config;
  }

  private static validate(
    config: Record<string, string>,
    schema?: ConfigModuleOptions['validationSchema'],
  ): void {
    if (!schema) return;
    const errors: string[] = [];
    for (const [key, rules] of Object.entries(schema)) {
      const value = config[key] ?? process.env[key];
      if (rules.required && value === undefined) {
        if (rules.default !== undefined) {
          config[key] = String(rules.default);
        } else {
          errors.push(`  - "${key}" is required`);
        }
      }
    }
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }
}

