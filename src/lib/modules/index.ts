/**
 * Module System - SaaS Template Core
 *
 * Unified interface for the modular SaaS template system.
 * Provides module registry, loading, routing, and management capabilities.
 */

// ============================================================================
// CORE EXPORTS
// ============================================================================

// Module Registry
export {
  moduleRegistry,
  type Module,
  type ModuleMetadata,
  type ModuleConfig,
  type ModuleRoute,
  type ModuleAPI,
  type ModuleComponent,
  type ModuleStore,
  type ModuleHooks,
  type ModuleCategory,
  type ModuleStatus,
  type ModuleDependency,
  type ModuleConflict,
} from './registry.js';

// Module Loader
export {
  moduleLoader,
  type ModuleLoaderConfig,
  type ModuleLoadResult,
  type ModuleDiscoveryResult,
} from './loader.js';

// Module Router
export {
  moduleRouter,
  type ModuleRouteConfig,
  type RouteMiddleware,
  type RouteContext,
  type RouteMiddlewareResult,
  type RouteMatch,
  type ModuleRouterConfig,
} from './router.js';

// ============================================================================
// UNIFIED MODULE SYSTEM CLASS
// ============================================================================

import { moduleRegistry, type Module } from './registry.js';
import { moduleLoader, type ModuleLoadResult } from './loader.js';
import { moduleRouter } from './router.js';

export interface ModuleSystemConfig {
  autoInitialize: boolean;
  autoLoadModules: boolean;
  autoRegisterRoutes: boolean;
  enableMiddleware: boolean;
  enableCaching: boolean;
}

export interface ModuleSystemStats {
  registry: {
    totalModules: number;
    enabledModules: number;
    disabledModules: number;
    errorModules: number;
  };
  loader: {
    loadedModules: number;
    cachedModules: number;
    loadingModules: number;
    discoveryPaths: number;
  };
  router: {
    totalRoutes: number;
    totalMiddleware: number;
    cachedRoutes: number;
    routeHistoryLength: number;
  };
}

/**
 * Unified Module System for SaaS Template
 *
 * Provides a single interface for all module system operations.
 */
export class ModuleSystem {
  private config: ModuleSystemConfig;
  private initialized: boolean = false;

  constructor(config: Partial<ModuleSystemConfig> = {}) {
    this.config = {
      autoInitialize: true,
      autoLoadModules: true,
      autoRegisterRoutes: true,
      enableMiddleware: true,
      enableCaching: true,
      ...config,
    };

    if (this.config.autoInitialize) {
      this.initialize();
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the module system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ Module system already initialized');
      return;
    }

    console.log('🚀 Initializing Module System...');

    try {
      // Configure components
      this.configureComponents();

      // Auto-load modules if enabled
      if (this.config.autoLoadModules) {
        await this.autoLoadModules();
      }

      // Auto-register routes if enabled
      if (this.config.autoRegisterRoutes) {
        this.autoRegisterRoutes();
      }

      this.initialized = true;
      console.log('✅ Module System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Module System:', error);
      throw error;
    }
  }

  /**
   * Configure module system components
   */
  private configureComponents(): void {
    // Configure module loader
    moduleLoader.updateConfig({
      autoLoad: this.config.autoLoadModules,
      cacheModules: this.config.enableCaching,
    });

    // Configure module router
    moduleRouter.updateConfig({
      enableMiddleware: this.config.enableMiddleware,
      enableCaching: this.config.enableCaching,
    });

    console.log('⚙️ Module system components configured');
  }

  /**
   * Auto-load discovered modules
   */
  private async autoLoadModules(): Promise<void> {
    console.log('📦 Auto-loading modules...');

    const results = await moduleLoader.autoLoadModules();
    const successCount = results.filter((r) => r.success).length;

    console.log(`✅ Auto-loaded ${successCount}/${results.length} modules`);
  }

  /**
   * Auto-register routes for loaded modules
   */
  private autoRegisterRoutes(): void {
    console.log('🛣️ Auto-registering routes...');

    const modules = moduleRegistry.getAllModules();
    let routeCount = 0;

    for (const module of modules) {
      if (module.config.routes && module.config.routes.length > 0) {
        moduleRouter.registerModuleRoutes(
          module.metadata.id,
          module.config.routes
        );
        routeCount += module.config.routes.length;
      }
    }

    console.log(
      `✅ Auto-registered ${routeCount} routes from ${modules.length} modules`
    );
  }

  // ============================================================================
  // MODULE MANAGEMENT
  // ============================================================================

  /**
   * Load a module
   */
  async loadModule(moduleId: string): Promise<ModuleLoadResult> {
    return await moduleLoader.loadModule(moduleId);
  }

  /**
   * Load multiple modules
   */
  async loadModules(moduleIds: string[]): Promise<ModuleLoadResult[]> {
    return await moduleLoader.loadModules(moduleIds);
  }

  /**
   * Enable a module
   */
  async enableModule(moduleId: string): Promise<void> {
    await moduleRegistry.enableModule(moduleId);

    // Auto-register routes if enabled
    if (this.config.autoRegisterRoutes) {
      const module = moduleRegistry.getModule(moduleId);
      if (module && module.config.routes) {
        moduleRouter.registerModuleRoutes(moduleId, module.config.routes);
      }
    }
  }

  /**
   * Disable a module
   */
  async disableModule(moduleId: string): Promise<void> {
    await moduleRegistry.disableModule(moduleId);

    // Auto-unregister routes if enabled
    if (this.config.autoRegisterRoutes) {
      moduleRouter.unregisterModuleRoutes(moduleId);
    }
  }

  /**
   * Unload a module
   */
  async unloadModule(moduleId: string): Promise<void> {
    await moduleLoader.unloadModule(moduleId);
  }

  /**
   * Get a module
   */
  getModule(moduleId: string): Module | undefined {
    return moduleRegistry.getModule(moduleId);
  }

  /**
   * Get all modules
   */
  getAllModules(): Module[] {
    return moduleRegistry.getAllModules();
  }

  /**
   * Get enabled modules
   */
  getEnabledModules(): Module[] {
    return moduleRegistry.getEnabledModules();
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: string): Module[] {
    return moduleRegistry.getModulesByCategory(category as any);
  }

  // ============================================================================
  // ROUTE MANAGEMENT
  // ============================================================================

  /**
   * Register routes for a module
   */
  registerModuleRoutes(moduleId: string, routes: any[]): void {
    moduleRouter.registerModuleRoutes(moduleId, routes);
  }

  /**
   * Unregister routes for a module
   */
  unregisterModuleRoutes(moduleId: string): void {
    moduleRouter.unregisterModuleRoutes(moduleId);
  }

  /**
   * Navigate to a route
   */
  async navigateTo(path: string, context: any = {}): Promise<any> {
    return await moduleRouter.navigateTo(path, context);
  }

  /**
   * Find routes for a path
   */
  findRoutes(path: string): any[] {
    return moduleRouter.findRoutes(path);
  }

  /**
   * Get all routes
   */
  getAllRoutes(): any[] {
    return moduleRouter.getAllRoutes();
  }

  // ============================================================================
  // MIDDLEWARE MANAGEMENT
  // ============================================================================

  /**
   * Register middleware
   */
  registerMiddleware(name: string, middleware: any): void {
    moduleRouter.registerMiddleware(name, middleware);
  }

  /**
   * Unregister middleware
   */
  unregisterMiddleware(name: string): void {
    moduleRouter.unregisterMiddleware(name);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get module system statistics
   */
  getStats(): ModuleSystemStats {
    const registryStats = moduleRegistry.getModuleStats();
    return {
      registry: {
        totalModules: registryStats.total,
        enabledModules: registryStats.enabled,
        disabledModules: registryStats.disabled,
        errorModules: registryStats.errors,
      },
      loader: moduleLoader.getStats(),
      router: moduleRouter.getStats(),
    };
  }

  /**
   * Get module system configuration
   */
  getConfig(): ModuleSystemConfig {
    return { ...this.config };
  }

  /**
   * Update module system configuration
   */
  updateConfig(newConfig: Partial<ModuleSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.configureComponents();
    console.log('⚙️ Module system configuration updated');
  }

  /**
   * Check if module system is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset the module system
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting Module System...');

    // Clear all modules
    await moduleRegistry.clearAllModules();

    // Clear loader cache
    moduleLoader.clearCache();

    // Clear router cache and history
    moduleRouter.clearRouteHistory();

    this.initialized = false;
    console.log('✅ Module System reset complete');
  }

  /**
   * Shutdown the module system
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Module System...');

    // Disable all modules
    const modules = moduleRegistry.getAllModules();
    for (const module of modules) {
      if (module.config.enabled) {
        try {
          await moduleRegistry.disableModule(module.metadata.id);
        } catch (error) {
          console.warn(
            `Failed to disable module ${module.metadata.id}:`,
            error
          );
        }
      }
    }

    // Clear caches
    moduleLoader.clearCache();
    moduleRouter.clearRouteHistory();

    this.initialized = false;
    console.log('✅ Module System shutdown complete');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
export const moduleSystem = new ModuleSystem();

// Export for use in components
export default moduleSystem;

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Svelte stores for reactive components
export const {
  modulesStore,
  enabledModulesStore,
  moduleStatusStore,
  errorsStore,
} = moduleRegistry;

export const { routesStore, activeRouteStore, routeHistoryStore } =
  moduleRouter;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Note: These types are already exported above in the class definition
