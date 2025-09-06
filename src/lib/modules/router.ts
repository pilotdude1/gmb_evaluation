/**
 * Module Router
 * 
 * Handles automatic route generation for modules, integrating with SvelteKit's routing system.
 * Provides dynamic route registration, middleware support, and route management.
 */

import { moduleRegistry, type Module, type ModuleRoute } from './registry.js';
import { writable, type Writable } from 'svelte/store';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ModuleRouteConfig {
  path: string;
  component: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  permissions?: string[];
  layout?: string;
  middleware?: RouteMiddleware[];
  meta?: Record<string, any>;
}

export interface RouteMiddleware {
  name: string;
  handler: (context: RouteContext) => Promise<RouteMiddlewareResult>;
  priority: number;
}

export interface RouteContext {
  url: URL;
  params: Record<string, string>;
  user?: any;
  module?: Module;
  route?: ModuleRouteConfig;
}

export interface RouteMiddlewareResult {
  allow: boolean;
  redirect?: string;
  error?: string;
  context?: Partial<RouteContext>;
}

export interface RouteMatch {
  route: ModuleRouteConfig;
  params: Record<string, string>;
  score: number;
}

export interface ModuleRouterConfig {
  autoRegister: boolean;
  enableMiddleware: boolean;
  enableCaching: boolean;
  routePrefix: string;
  defaultLayout: string;
  errorPage: string;
  notFoundPage: string;
}

// ============================================================================
// MODULE ROUTER CLASS
// ============================================================================

export class ModuleRouter {
  private config: ModuleRouterConfig;
  private routes: Map<string, ModuleRouteConfig> = new Map();
  private middleware: Map<string, RouteMiddleware> = new Map();
  private routeCache: Map<string, RouteMatch[]> = new Map();
  private routeHistory: string[] = [];

  // Svelte stores for reactive updates
  public readonly routesStore = writable<ModuleRouteConfig[]>([]);
  public readonly activeRouteStore = writable<ModuleRouteConfig | null>(null);
  public readonly routeHistoryStore = writable<string[]>([]);

  constructor(config: Partial<ModuleRouterConfig> = {}) {
    this.config = {
      autoRegister: true,
      enableMiddleware: true,
      enableCaching: true,
      routePrefix: '',
      defaultLayout: 'default',
      errorPage: '/error',
      notFoundPage: '/404',
      ...config
    };

    this.initializeDefaultMiddleware();
  }

  // ============================================================================
  // ROUTE REGISTRATION
  // ============================================================================

  /**
   * Register a module's routes
   */
  registerModuleRoutes(moduleId: string, routes: ModuleRoute[]): void {
    console.log(`🛣️ Registering routes for module ${moduleId}...`);

    for (const route of routes) {
      const routeId = `${moduleId}:${route.path}`;
      const routeConfig: ModuleRouteConfig = {
        path: this.normalizePath(route.path),
        component: route.component,
        title: route.title,
        description: route.description,
        requiresAuth: route.requiresAuth || false,
        permissions: route.permissions || [],
        layout: route.layout || this.config.defaultLayout,
        middleware: [],
        meta: {
          moduleId,
          originalPath: route.path
        }
      };

      this.routes.set(routeId, routeConfig);
      console.log(`✅ Registered route: ${routeConfig.path}`);
    }

    this.updateStores();
    this.clearRouteCache();
  }

  /**
   * Unregister a module's routes
   */
  unregisterModuleRoutes(moduleId: string): void {
    console.log(`🗑️ Unregistering routes for module ${moduleId}...`);

    const routesToRemove: string[] = [];
    
    for (const [routeId, route] of this.routes.entries()) {
      if (route.meta?.moduleId === moduleId) {
        routesToRemove.push(routeId);
      }
    }

    for (const routeId of routesToRemove) {
      this.routes.delete(routeId);
      console.log(`✅ Unregistered route: ${routeId}`);
    }

    this.updateStores();
    this.clearRouteCache();
  }

  /**
   * Register a single route
   */
  registerRoute(routeId: string, routeConfig: ModuleRouteConfig): void {
    const normalizedConfig = {
      ...routeConfig,
      path: this.normalizePath(routeConfig.path)
    };

    this.routes.set(routeId, normalizedConfig);
    this.updateStores();
    this.clearRouteCache();

    console.log(`✅ Registered route: ${normalizedConfig.path}`);
  }

  /**
   * Unregister a single route
   */
  unregisterRoute(routeId: string): void {
    const route = this.routes.get(routeId);
    if (route) {
      this.routes.delete(routeId);
      this.updateStores();
      this.clearRouteCache();
      console.log(`✅ Unregistered route: ${route.path}`);
    }
  }

  // ============================================================================
  // ROUTE MATCHING
  // ============================================================================

  /**
   * Find matching routes for a given path
   */
  findRoutes(path: string): RouteMatch[] {
    const normalizedPath = this.normalizePath(path);
    
    // Check cache first
    if (this.config.enableCaching && this.routeCache.has(normalizedPath)) {
      return this.routeCache.get(normalizedPath)!;
    }

    const matches: RouteMatch[] = [];

    for (const [routeId, route] of this.routes.entries()) {
      const match = this.matchRoute(normalizedPath, route);
      if (match) {
        matches.push({
          route,
          params: match.params,
          score: match.score
        });
      }
    }

    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    // Cache result
    if (this.config.enableCaching) {
      this.routeCache.set(normalizedPath, matches);
    }

    return matches;
  }

  /**
   * Find the best matching route for a given path
   */
  findBestRoute(path: string): RouteMatch | null {
    const matches = this.findRoutes(path);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Match a specific route against a path
   */
  private matchRoute(path: string, route: ModuleRouteConfig): { params: Record<string, string>; score: number } | null {
    const routePath = route.path;
    const routeSegments = routePath.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);

    if (routeSegments.length !== pathSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};
    let score = 0;

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const pathSegment = pathSegments[i];

      if (routeSegment.startsWith('[') && routeSegment.endsWith(']')) {
        // Dynamic parameter
        const paramName = routeSegment.slice(1, -1);
        params[paramName] = pathSegment;
        score += 1;
      } else if (routeSegment === pathSegment) {
        // Static segment match
        score += 10;
      } else {
        // No match
        return null;
      }
    }

    return { params, score };
  }

  // ============================================================================
  // MIDDLEWARE SYSTEM
  // ============================================================================

  /**
   * Register middleware
   */
  registerMiddleware(name: string, middleware: RouteMiddleware): void {
    this.middleware.set(name, middleware);
    console.log(`🔧 Registered middleware: ${name}`);
  }

  /**
   * Unregister middleware
   */
  unregisterMiddleware(name: string): void {
    this.middleware.delete(name);
    console.log(`🗑️ Unregistered middleware: ${name}`);
  }

  /**
   * Execute middleware for a route
   */
  async executeMiddleware(route: ModuleRouteConfig, context: RouteContext): Promise<RouteMiddlewareResult> {
    if (!this.config.enableMiddleware) {
      return { allow: true };
    }

    // Get all middleware for this route
    const middlewareList = [...this.middleware.values()];
    
    // Add route-specific middleware
    if (route.middleware) {
      middlewareList.push(...route.middleware);
    }

    // Sort by priority (highest first)
    middlewareList.sort((a, b) => b.priority - a.priority);

    // Execute middleware
    for (const middleware of middlewareList) {
      try {
        const result = await middleware.handler(context);
        
        if (!result.allow) {
          return result;
        }

        // Update context with middleware result
        if (result.context) {
          Object.assign(context, result.context);
        }
      } catch (error) {
        console.error(`❌ Middleware ${middleware.name} failed:`, error);
        return {
          allow: false,
          error: `Middleware ${middleware.name} failed: ${error}`
        };
      }
    }

    return { allow: true };
  }

  /**
   * Initialize default middleware
   */
  private initializeDefaultMiddleware(): void {
    // Authentication middleware
    this.registerMiddleware('auth', {
      name: 'auth',
      priority: 100,
      handler: async (context: RouteContext): Promise<RouteMiddlewareResult> => {
        const route = context.route;
        if (!route?.requiresAuth) {
          return { allow: true };
        }

        if (!context.user) {
          return {
            allow: false,
            redirect: '/auth/login'
          };
        }

        return { allow: true };
      }
    });

    // Permission middleware
    this.registerMiddleware('permissions', {
      name: 'permissions',
      priority: 90,
      handler: async (context: RouteContext): Promise<RouteMiddlewareResult> => {
        const route = context.route;
        if (!route?.permissions || route.permissions.length === 0) {
          return { allow: true };
        }

        if (!context.user) {
          return {
            allow: false,
            redirect: '/auth/login'
          };
        }

        // Check if user has required permissions
        const userPermissions = context.user.permissions || [];
        const hasPermission = route.permissions.some(permission => 
          userPermissions.includes(permission)
        );

        if (!hasPermission) {
          return {
            allow: false,
            error: 'Insufficient permissions'
          };
        }

        return { allow: true };
      }
    });

    // Logging middleware
    this.registerMiddleware('logging', {
      name: 'logging',
      priority: 10,
      handler: async (context: RouteContext): Promise<RouteMiddlewareResult> => {
        console.log(`📊 Route accessed: ${context.url.pathname}`);
        return { allow: true };
      }
    });
  }

  // ============================================================================
  // ROUTE NAVIGATION
  // ============================================================================

  /**
   * Navigate to a route
   */
  async navigateTo(path: string, context: Partial<RouteContext> = {}): Promise<RouteMiddlewareResult> {
    const match = this.findBestRoute(path);
    
    if (!match) {
      console.warn(`⚠️ No route found for path: ${path}`);
      return {
        allow: false,
        redirect: this.config.notFoundPage
      };
    }

    const routeContext: RouteContext = {
      url: new URL(path, 'http://localhost'),
      params: match.params,
      route: match.route,
      ...context
    };

    // Execute middleware
    const middlewareResult = await this.executeMiddleware(match.route, routeContext);
    
    if (middlewareResult.allow) {
      // Update active route
      this.activeRouteStore.set(match.route);
      
      // Add to history
      this.routeHistory.push(path);
      if (this.routeHistory.length > 50) {
        this.routeHistory.shift();
      }
      this.routeHistoryStore.set([...this.routeHistory]);
    }

    return middlewareResult;
  }

  /**
   * Get route history
   */
  getRouteHistory(): string[] {
    return [...this.routeHistory];
  }

  /**
   * Clear route history
   */
  clearRouteHistory(): void {
    this.routeHistory = [];
    this.routeHistoryStore.set([]);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Normalize path
   */
  private normalizePath(path: string): string {
    let normalized = path.startsWith('/') ? path : `/${path}`;
    normalized = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
    return normalized || '/';
  }

  /**
   * Update Svelte stores
   */
  private updateStores(): void {
    const routes = Array.from(this.routes.values());
    this.routesStore.set(routes);
  }

  /**
   * Clear route cache
   */
  private clearRouteCache(): void {
    this.routeCache.clear();
  }

  /**
   * Get all registered routes
   */
  getAllRoutes(): ModuleRouteConfig[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get routes by module
   */
  getRoutesByModule(moduleId: string): ModuleRouteConfig[] {
    return Array.from(this.routes.values()).filter(route => 
      route.meta?.moduleId === moduleId
    );
  }

  /**
   * Get routes by pattern
   */
  getRoutesByPattern(pattern: string): ModuleRouteConfig[] {
    const regex = new RegExp(pattern);
    return Array.from(this.routes.values()).filter(route => 
      regex.test(route.path)
    );
  }

  /**
   * Get router configuration
   */
  getConfig(): ModuleRouterConfig {
    return { ...this.config };
  }

  /**
   * Update router configuration
   */
  updateConfig(newConfig: Partial<ModuleRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Module router configuration updated');
  }

  /**
   * Get router statistics
   */
  getStats(): {
    totalRoutes: number;
    totalMiddleware: number;
    cachedRoutes: number;
    routeHistoryLength: number;
  } {
    return {
      totalRoutes: this.routes.size,
      totalMiddleware: this.middleware.size,
      cachedRoutes: this.routeCache.size,
      routeHistoryLength: this.routeHistory.length
    };
  }

  /**
   * Generate route manifest for SvelteKit
   */
  generateRouteManifest(): Record<string, any> {
    const manifest: Record<string, any> = {};

    for (const [routeId, route] of this.routes.entries()) {
      manifest[routeId] = {
        path: route.path,
        component: route.component,
        title: route.title,
        requiresAuth: route.requiresAuth,
        permissions: route.permissions,
        layout: route.layout,
        meta: route.meta
      };
    }

    return manifest;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
export const moduleRouter = new ModuleRouter();

// Export for use in components
export const { 
  routesStore, 
  activeRouteStore, 
  routeHistoryStore 
} = moduleRouter;
