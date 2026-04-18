#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import {
  generateModule,
  generateController,
  generateService,
  generateGuard,
  generateInterceptor,
  generateMiddleware,
} from '../generators/module.generator';

const args = process.argv.slice(2);
const [command, subCommand, name, ...rest] = args;

const HELP = `
╔══════════════════════════════════════════╗
║          LoonyJS CLI  v0.1.0             ║
╚══════════════════════════════════════════╝

Usage:
  loony generate <schematic> <name>   (alias: g)
  loony new <project-name>            (alias: n)
  loony build                         (alias: b)
  loony start                         (alias: s)

Schematics:
  module (mo)         Generate a feature module
  controller (co)     Generate a controller
  service (s)         Generate a service
  guard (gu)          Generate a guard
  interceptor (in)    Generate an interceptor
  middleware (mi)     Generate middleware

Examples:
  loony g module users
  loony g controller users
  loony g service users
  loony new my-project
`;

switch (command) {
  case 'generate':
  case 'g':
    handleGenerate(subCommand ?? '', name ?? '');
    break;

  case 'new':
  case 'n':
    handleNew(subCommand ?? '');
    break;

  case 'build':
  case 'b':
    runScript('build');
    break;

  case 'start':
  case 's':
    runScript('start');
    break;

  default:
    console.log(HELP);
}

function handleGenerate(schematic: string, resourceName: string): void {
  if (!schematic || !resourceName) {
    console.error('Usage: loony generate <schematic> <name>');
    process.exit(1);
  }

  console.log(`\nGenerating ${schematic}: ${resourceName}\n`);

  switch (schematic) {
    case 'module':
    case 'mo':
      generateModule(resourceName);
      break;
    case 'controller':
    case 'co':
      generateController(resourceName);
      break;
    case 'service':
    case 'sv':
      generateService(resourceName);
      break;
    case 'guard':
    case 'gu':
      generateGuard(resourceName);
      break;
    case 'interceptor':
    case 'in':
      generateInterceptor(resourceName);
      break;
    case 'middleware':
    case 'mi':
      generateMiddleware(resourceName);
      break;
    default:
      console.error(`Unknown schematic: ${schematic}`);
      process.exit(1);
  }

  console.log('\nDone!\n');
}

function handleNew(projectName: string): void {
  if (!projectName) {
    console.error('Usage: loony new <project-name>');
    process.exit(1);
  }

  const dir = path.resolve(process.cwd(), projectName);
  console.log(`\nCreating new LoonyJS project: ${projectName}\n`);

  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });

  // package.json
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        scripts: {
          build: 'tsc -p tsconfig.json',
          start: 'node dist/main.js',
          dev: 'ts-node -r tsconfig-paths/register src/main.ts',
        },
        dependencies: {
          '@loonyjs/core': '^0.1.0',
          '@loonyjs/common': '^0.1.0',
          'reflect-metadata': '^0.2.2',
        },
        devDependencies: {
          typescript: '^5.4.5',
          '@types/node': '^20.14.0',
          'ts-node': '^10.9.2',
        },
      },
      null,
      2,
    ),
  );

  // tsconfig.json
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'CommonJS',
          moduleResolution: 'node',
          strict: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          outDir: 'dist',
          rootDir: 'src',
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src/**/*'],
      },
      null,
      2,
    ),
  );

  // main.ts
  fs.writeFileSync(
    path.join(dir, 'src', 'main.ts'),
    `import 'reflect-metadata';
import { LoonyFactory } from '@loonyjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await LoonyFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on http://localhost:3000');
}

bootstrap().catch(console.error);
`,
  );

  // app.module.ts
  fs.writeFileSync(
    path.join(dir, 'src', 'app.module.ts'),
    `import { Module } from '@loonyjs/core';

@Module({
  imports: [],
  providers: [],
  controllers: [],
})
export class AppModule {}
`,
  );

  console.log(`  created  ${projectName}/`);
  console.log(`  created  ${projectName}/src/main.ts`);
  console.log(`  created  ${projectName}/src/app.module.ts`);
  console.log(`  created  ${projectName}/package.json`);
  console.log(`  created  ${projectName}/tsconfig.json`);
  console.log(`
Next steps:
  cd ${projectName}
  npm install
  npm run dev
`);
}

function runScript(script: string): void {
  const { execSync } = require('child_process');
  try {
    execSync(`npm run ${script}`, { stdio: 'inherit', cwd: process.cwd() });
  } catch (e) {
    process.exit(1);
  }
}
