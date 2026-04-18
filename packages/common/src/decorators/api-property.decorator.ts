/**
 * DTO field decorators for documentation and validation metadata.
 *
 * These decorators store metadata that ValidationPipe and documentation
 * generators can read.  They do NOT require class-validator as a dependency.
 */

const PROP_META = Symbol.for('loony:api_property');
const VALIDATE_META = Symbol.for('loony:validate_rules');

export interface ApiPropertyOptions {
  description?: string;
  example?: any;
  required?: boolean;
  type?: string | Function;
  isArray?: boolean;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ValidationRule {
  type: string;
  options?: any;
  message?: string;
}

/** Documents a DTO field (for future OpenAPI generation). */
export function ApiProperty(options: ApiPropertyOptions = {}): PropertyDecorator {
  return (target, propertyKey) => {
    const existing: Record<string, ApiPropertyOptions> =
      Reflect.getMetadata(PROP_META, target.constructor) ?? {};
    existing[propertyKey as string] = options;
    Reflect.defineMetadata(PROP_META, existing, target.constructor);
  };
}

/** Marks a field as not required in the DTO. */
export function ApiPropertyOptional(options: ApiPropertyOptions = {}): PropertyDecorator {
  return ApiProperty({ ...options, required: false });
}

// ------------------------------------------------------------------
// Validation decorators (no external deps)
// ------------------------------------------------------------------

function addRule(target: any, key: string | symbol, rule: ValidationRule): void {
  const existing: Record<string, ValidationRule[]> =
    Reflect.getMetadata(VALIDATE_META, target.constructor) ?? {};
  const fieldRules = existing[key as string] ?? [];
  fieldRules.push(rule);
  existing[key as string] = fieldRules;
  Reflect.defineMetadata(VALIDATE_META, existing, target.constructor);
}

export function IsString(message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsString', message });
}

export function IsNumber(message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsNumber', message });
}

export function IsBoolean(message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsBoolean', message });
}

export function IsEmail(message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsEmail', message });
}

export function IsNotEmpty(message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsNotEmpty', message });
}

export function MinLength(min: number, message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'MinLength', options: { min }, message });
}

export function MaxLength(max: number, message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'MaxLength', options: { max }, message });
}

export function Min(min: number, message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'Min', options: { min }, message });
}

export function Max(max: number, message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'Max', options: { max }, message });
}

export function IsOptional(): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsOptional' });
}

export function IsArray(message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsArray', message });
}

export function IsEnum(enumObj: object, message?: string): PropertyDecorator {
  return (t, k) => addRule(t, k, { type: 'IsEnum', options: { enumObj }, message });
}

// ------------------------------------------------------------------
// Validation runner (used by ValidationPipe internally)
// ------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateObject(value: any, metatype: Function): string[] {
  if (!value || typeof value !== 'object') return [];

  const rules: Record<string, ValidationRule[]> =
    Reflect.getMetadata(VALIDATE_META, metatype) ?? {};

  const errors: string[] = [];

  for (const [field, fieldRules] of Object.entries(rules)) {
    const fieldValue = value[field];
    let isOptional = false;

    for (const rule of fieldRules) {
      if (rule.type === 'IsOptional') { isOptional = true; break; }
    }

    if (isOptional && (fieldValue === undefined || fieldValue === null)) continue;

    for (const rule of fieldRules) {
      const msg = rule.message ?? `${field}: ${rule.type} check failed`;
      switch (rule.type) {
        case 'IsString':
          if (typeof fieldValue !== 'string') errors.push(msg);
          break;
        case 'IsNumber':
          if (typeof fieldValue !== 'number' || isNaN(fieldValue)) errors.push(msg);
          break;
        case 'IsBoolean':
          if (typeof fieldValue !== 'boolean') errors.push(msg);
          break;
        case 'IsEmail':
          if (!EMAIL_REGEX.test(String(fieldValue))) errors.push(msg);
          break;
        case 'IsNotEmpty':
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') errors.push(msg);
          break;
        case 'MinLength':
          if (typeof fieldValue === 'string' && fieldValue.length < rule.options.min)
            errors.push(msg || `${field} must be at least ${rule.options.min} characters`);
          break;
        case 'MaxLength':
          if (typeof fieldValue === 'string' && fieldValue.length > rule.options.max)
            errors.push(msg || `${field} must not exceed ${rule.options.max} characters`);
          break;
        case 'Min':
          if (typeof fieldValue === 'number' && fieldValue < rule.options.min)
            errors.push(msg || `${field} must be >= ${rule.options.min}`);
          break;
        case 'Max':
          if (typeof fieldValue === 'number' && fieldValue > rule.options.max)
            errors.push(msg || `${field} must be <= ${rule.options.max}`);
          break;
        case 'IsArray':
          if (!Array.isArray(fieldValue)) errors.push(msg);
          break;
        case 'IsEnum':
          if (!Object.values(rule.options.enumObj).includes(fieldValue)) errors.push(msg);
          break;
      }
    }
  }

  return errors;
}
