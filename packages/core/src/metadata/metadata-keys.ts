/**
 * All reflect-metadata keys used by LoonyJS.
 * Centralised here to avoid typo bugs and naming collisions.
 */
export const METADATA_KEYS = {
  // DI
  INJECTABLE: Symbol('loony:injectable'),
  INJECT_TOKENS: Symbol('loony:inject_tokens'),
  SCOPE: Symbol('loony:scope'),

  // Module
  MODULE: Symbol('loony:module'),
  GLOBAL_MODULE: Symbol('loony:global_module'),

  // Controller
  CONTROLLER: Symbol('loony:controller'),

  // Routing
  ROUTES: Symbol('loony:routes'),
  HTTP_METHOD: Symbol('loony:http_method'),
  PATH: Symbol('loony:path'),

  // Param decorators
  ROUTE_PARAMS: Symbol('loony:route_params'),

  // Pipeline
  GUARDS: Symbol('loony:guards'),
  INTERCEPTORS: Symbol('loony:interceptors'),
  PIPES: Symbol('loony:pipes'),
  FILTERS: Symbol('loony:filters'),

  // Middleware
  MIDDLEWARE: Symbol('loony:middleware'),

  // Lifecycle
  ON_MODULE_INIT: Symbol('loony:on_module_init'),
  ON_MODULE_DESTROY: Symbol('loony:on_module_destroy'),
  ON_APP_BOOTSTRAP: Symbol('loony:on_app_bootstrap'),
  ON_APP_SHUTDOWN: Symbol('loony:on_app_shutdown'),

  // reflect-metadata built-ins we rely on
  DESIGN_PARAMTYPES: 'design:paramtypes',
  DESIGN_TYPE: 'design:type',
  DESIGN_RETURNTYPE: 'design:returntype',
} as const;
