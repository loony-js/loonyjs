import * as fs from 'fs';
import * as path from 'path';
import { toPascalCase, toKebabCase } from '../utils/strings';

export function generateModule(name: string, targetDir = 'src'): void {
  const kebab = toKebabCase(name);
  const pascal = toPascalCase(name);
  const dir = path.resolve(process.cwd(), targetDir, kebab);

  fs.mkdirSync(dir, { recursive: true });

  const moduleFile = path.join(dir, `${kebab}.module.ts`);
  if (!fs.existsSync(moduleFile)) {
    fs.writeFileSync(
      moduleFile,
      `import { Module } from '@loonyjs/core';
import { ${pascal}Controller } from './${kebab}.controller';
import { ${pascal}Service } from './${kebab}.service';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
  exports: [${pascal}Service],
})
export class ${pascal}Module {}
`,
    );
    console.log(`  created  ${path.relative(process.cwd(), moduleFile)}`);
  }

  generateController(name, dir, false);
  generateService(name, dir, false);
}

export function generateController(name: string, dir?: string, standalone = true): void {
  const kebab = toKebabCase(name);
  const pascal = toPascalCase(name);
  const targetDir = dir ?? path.resolve(process.cwd(), 'src', kebab);

  if (standalone) fs.mkdirSync(targetDir, { recursive: true });

  const file = path.join(targetDir, `${kebab}.controller.ts`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      `import { Controller, Get, Post, Put, Delete, Body, Param } from '@loonyjs/core';
import { ${pascal}Service } from './${kebab}.service';

@Controller('${kebab}')
export class ${pascal}Controller {
  constructor(private readonly ${name.toLowerCase()}Service: ${pascal}Service) {}

  @Get()
  findAll() {
    return this.${name.toLowerCase()}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${name.toLowerCase()}Service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.${name.toLowerCase()}Service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.${name.toLowerCase()}Service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${name.toLowerCase()}Service.remove(id);
  }
}
`,
    );
    console.log(`  created  ${path.relative(process.cwd(), file)}`);
  }
}

export function generateService(name: string, dir?: string, standalone = true): void {
  const kebab = toKebabCase(name);
  const pascal = toPascalCase(name);
  const targetDir = dir ?? path.resolve(process.cwd(), 'src', kebab);

  if (standalone) fs.mkdirSync(targetDir, { recursive: true });

  const file = path.join(targetDir, `${kebab}.service.ts`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      `import { Injectable, NotFoundException } from '@loonyjs/core';

export interface ${pascal}Entity {
  id: string;
  [key: string]: any;
}

@Injectable()
export class ${pascal}Service {
  private items: ${pascal}Entity[] = [];

  findAll(): ${pascal}Entity[] {
    return this.items;
  }

  findOne(id: string): ${pascal}Entity {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new NotFoundException(\`${pascal} \${id} not found\`);
    return item;
  }

  create(dto: Partial<${pascal}Entity>): ${pascal}Entity {
    const item: ${pascal}Entity = { id: Date.now().toString(), ...dto };
    this.items.push(item);
    return item;
  }

  update(id: string, dto: Partial<${pascal}Entity>): ${pascal}Entity {
    const item = this.findOne(id);
    Object.assign(item, dto);
    return item;
  }

  remove(id: string): { deleted: true } {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new NotFoundException(\`${pascal} \${id} not found\`);
    this.items.splice(idx, 1);
    return { deleted: true };
  }
}
`,
    );
    console.log(`  created  ${path.relative(process.cwd(), file)}`);
  }
}

export function generateGuard(name: string): void {
  const kebab = toKebabCase(name);
  const pascal = toPascalCase(name);
  const dir = path.resolve(process.cwd(), 'src', 'guards');
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${kebab}.guard.ts`);
  fs.writeFileSync(
    file,
    `import { CanActivate, ExecutionContext, Injectable } from '@loonyjs/core';

@Injectable()
export class ${pascal}Guard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO: implement guard logic
    return true;
  }
}
`,
  );
  console.log(`  created  ${path.relative(process.cwd(), file)}`);
}

export function generateInterceptor(name: string): void {
  const kebab = toKebabCase(name);
  const pascal = toPascalCase(name);
  const dir = path.resolve(process.cwd(), 'src', 'interceptors');
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${kebab}.interceptor.ts`);
  fs.writeFileSync(
    file,
    `import { LoonyInterceptor, ExecutionContext, CallHandler, Observable, Injectable } from '@loonyjs/core';

@Injectable()
export class ${pascal}Interceptor implements LoonyInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // TODO: implement interceptor logic
    return next.handle();
  }
}
`,
  );
  console.log(`  created  ${path.relative(process.cwd(), file)}`);
}

export function generateMiddleware(name: string): void {
  const kebab = toKebabCase(name);
  const pascal = toPascalCase(name);
  const dir = path.resolve(process.cwd(), 'src', 'middleware');
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${kebab}.middleware.ts`);
  fs.writeFileSync(
    file,
    `import { Injectable, LoonyMiddleware } from '@loonyjs/core';

@Injectable()
export class ${pascal}Middleware implements LoonyMiddleware {
  use(req: any, res: any, next: () => void): void {
    // TODO: implement middleware logic
    next();
  }
}
`,
  );
  console.log(`  created  ${path.relative(process.cwd(), file)}`);
}
