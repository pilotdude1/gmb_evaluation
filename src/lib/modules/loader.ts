/**
 * Module Loader
 *
 * Handles dynamic module loading, initialization, and integration with the module registry.
 * Provides automatic module discovery, loading, and lifecycle management.
 */

import {
  moduleRegistry,
  type Module,
  type ModuleMetadata,
  type ModuleConfig,
} from './registry.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ModuleLoaderConfig {
  autoLoad: boolean;
  loadOnDemand: boolean;
  cacheModules: boolean;
  validateOnLoad: boolean;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface ModuleLoadResult {
  success: boolean;
  module?: Module;
  error?: Error;
  loadTime: number;
  cached: boolean;
}

export interface ModuleDiscoveryResult {
  modules: string[];
  errors: Error[];
  totalFound: number;
  totalLoaded: number;
}

// ============================================================================
// MODULE LOADER CLASS
// ============================================================================

export class ModuleLoader {
  private config: ModuleLoaderConfig;
  private loadedModules: Map<string, Module> = new Map();
  private moduleCache: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<ModuleLoadResult>> = new Map();
  private discoveryPaths: string[] = [];

  constructor(config: Partial<ModuleLoaderConfig> = {}) {
    this.config = {
      autoLoad: true,
      loadOnDemand: true,
      cacheModules: true,
      validateOnLoad: true,
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...config,
    };

    this.initializeDiscoveryPaths();
  }

  // ============================================================================
  // MODULE DISCOVERY
  // ============================================================================

  /**
   * Initialize default discovery paths
   */
  private initializeDiscoveryPaths(): void {
    this.discoveryPaths = [
      '/src/lib/modules',
      '/src/modules',
      '/modules',
      '/node_modules/@saas/modules',
    ];
  }

  /**
   * Add a discovery path for module loading
   */
  addDiscoveryPath(path: string): void {
    if (!this.discoveryPaths.includes(path)) {
      this.discoveryPaths.push(path);
    }
  }

  /**
   * Remove a discovery path
   */
  removeDiscoveryPath(path: string): void {
    const index = this.discoveryPaths.indexOf(path);
    if (index > -1) {
      this.discoveryPaths.splice(index, 1);
    }
  }

  /**
   * Discover available modules in discovery paths
   */
  async discoverModules(): Promise<ModuleDiscoveryResult> {
    const result: ModuleDiscoveryResult = {
      modules: [],
      errors: [],
      totalFound: 0,
      totalLoaded: 0,
    };

    console.log('🔍 Discovering modules...');

    for (const path of this.discoveryPaths) {
      try {
        const modules = await this.scanDirectory(path);
        result.modules.push(...modules);
        result.totalFound += modules.length;
      } catch (error) {
        const discoveryError = new Error(
          `Failed to scan directory ${path}: ${error}`
        );
        result.errors.push(discoveryError);
        console.warn(`⚠️ ${discoveryError.message}`);
      }
    }

    console.log(
      `📦 Found ${result.totalFound} modules in ${result.modules.length} locations`
    );
    return result;
  }

  /**
   * Scan directory for module manifests
   */
  private async scanDirectory(path: string): Promise<string[]> {
    const modules: string[] = [];

    try {
      // In a real implementation, this would scan the filesystem
      // For now, we'll simulate module discovery
      const mockModules = await this.getMockModules(path);
      modules.push(...mockModules);
    } catch (error) {
      console.warn(`Failed to scan ${path}:`, error);
    }

    return modules;
  }

  /**
   * Get mock modules for development/testing
   */
  private async getMockModules(path: string): Promise<string[]> {
    // Simulate finding modules in different paths
    const mockModules: Record<string, string[]> = {
      '/src/lib/modules': ['auth', 'users', 'billing'],
      '/src/modules': ['analytics', 'notifications'],
      '/modules': ['integrations', 'ui-components'],
      '/node_modules/@saas/modules': ['utilities'],
    };

    return mockModules[path] || [];
  }

  // ============================================================================
  // MODULE LOADING
  // ============================================================================

  /**
   * Load a module by ID
   */
  async loadModule(moduleId: string): Promise<ModuleLoadResult> {
    const startTime = Date.now();
    const result: ModuleLoadResult = {
      success: false,
      loadTime: 0,
      cached: false,
    };

    try {
      // Check if already loading
      if (this.loadingPromises.has(moduleId)) {
        const existingResult = await this.loadingPromises.get(moduleId)!;
        return existingResult;
      }

      // Check cache first
      if (this.config.cacheModules && this.moduleCache.has(moduleId)) {
        const cachedModule = this.moduleCache.get(moduleId);
        result.success = true;
        result.module = cachedModule;
        result.cached = true;
        result.loadTime = Date.now() - startTime;
        console.log(`📦 Loaded module ${moduleId} from cache`);
        return result;
      }

      // Create loading promise
      const loadPromise = this.performModuleLoad(moduleId, startTime);
      this.loadingPromises.set(moduleId, loadPromise);

      const loadResult = await loadPromise;
      this.loadingPromises.delete(moduleId);

      return loadResult;
    } catch (error) {
      result.success = false;
      result.error = error as Error;
      result.loadTime = Date.now() - startTime;
      this.loadingPromises.delete(moduleId);
      console.error(`❌ Failed to load module ${moduleId}:`, error);
      return result;
    }
  }

  /**
   * Perform the actual module loading with retry logic
   */
  private async performModuleLoad(
    moduleId: string,
    startTime: number
  ): Promise<ModuleLoadResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(
          `🔄 Loading module ${moduleId} (attempt ${attempt}/${this.config.retryAttempts})`
        );

        // Load module factory
        const moduleFactory = await this.loadModuleFactory(moduleId);

        // Register module with registry
        const module = await moduleRegistry.registerModule(
          moduleId,
          moduleFactory
        );

        // Cache module if enabled
        if (this.config.cacheModules) {
          this.moduleCache.set(moduleId, module);
        }

        const result: ModuleLoadResult = {
          success: true,
          module,
          loadTime: Date.now() - startTime,
          cached: false,
        };

        console.log(
          `✅ Module ${moduleId} loaded successfully in ${result.loadTime}ms`
        );
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `⚠️ Attempt ${attempt} failed for module ${moduleId}:`,
          error
        );

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    const result: ModuleLoadResult = {
      success: false,
      error: lastError,
      loadTime: Date.now() - startTime,
      cached: false,
    };

    console.error(`❌ All attempts failed for module ${moduleId}`);
    return result;
  }

  /**
   * Load module factory function
   */
  private async loadModuleFactory(
    moduleId: string
  ): Promise<() => Promise<any>> {
    // In a real implementation, this would dynamically import the module
    // For now, we'll return mock module factories
    return async () => {
      const mockModule = await this.createMockModule(moduleId);
      return mockModule;
    };
  }

  /**
   * Create mock module for development/testing
   */
  private async createMockModule(moduleId: string): Promise<any> {
    const mockModules: Record<string, any> = {
      auth: {
        metadata: {
          id: 'auth',
          name: 'Authentication Module',
          version: '1.0.0',
          description: 'Secure authentication and user management',
          author: 'SaaS Template',
          dependencies: [],
          conflicts: [],
          category: 'authentication',
          tags: ['auth', 'security', 'users'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: true,
          settings: {},
          permissions: ['auth:read', 'auth:write'],
          routes: [
            {
              path: '/auth/login',
              component: 'LoginForm',
              title: 'Login',
              requiresAuth: false,
            },
            {
              path: '/auth/register',
              component: 'RegisterForm',
              title: 'Register',
              requiresAuth: false,
            },
          ],
          api: [
            {
              path: '/api/auth/login',
              method: 'POST',
              handler: 'loginHandler',
              description: 'User login endpoint',
            },
          ],
          components: [
            {
              name: 'LoginForm',
              path: '/components/LoginForm.svelte',
              description: 'User login form component',
              props: {},
              events: ['login', 'error'],
              slots: [],
            },
          ],
          stores: [
            {
              name: 'authStore',
              path: '/stores/authStore.ts',
              description: 'Authentication state management',
              initialState: { user: null, isAuthenticated: false },
            },
          ],
          hooks: {
            onInstall: async () => {
              console.log('🔧 Installing auth module...');
            },
            onEnable: async () => {
              console.log('✅ Enabling auth module...');
            },
            onDisable: async () => {
              console.log('❌ Disabling auth module...');
            },
          },
        },
      },
      users: {
        metadata: {
          id: 'users',
          name: 'User Management Module',
          version: '1.0.0',
          description: 'User profile and management features',
          author: 'SaaS Template',
          dependencies: ['auth'],
          conflicts: [],
          category: 'user-management',
          tags: ['users', 'profiles', 'management'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: false,
          settings: {},
          permissions: ['users:read', 'users:write'],
          routes: [],
          api: [],
          components: [],
          stores: [],
          hooks: {},
        },
      },
      billing: {
        metadata: {
          id: 'billing',
          name: 'Billing Module',
          version: '1.0.0',
          description: 'Payment processing and subscription management',
          author: 'SaaS Template',
          dependencies: ['auth'],
          conflicts: [],
          category: 'billing',
          tags: ['billing', 'payments', 'subscriptions'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: false,
          settings: {},
          permissions: ['billing:read', 'billing:write'],
          routes: [],
          api: [],
          components: [],
          stores: [],
          hooks: {},
        },
      },
      analytics: {
        metadata: {
          id: 'analytics',
          name: 'Analytics Module',
          version: '1.0.0',
          description: 'Data analytics and reporting features',
          author: 'SaaS Template',
          dependencies: [],
          conflicts: [],
          category: 'analytics',
          tags: ['analytics', 'data', 'reporting'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: false,
          settings: {},
          permissions: ['analytics:read'],
          routes: [],
          api: [],
          components: [],
          stores: [],
          hooks: {},
        },
      },
      notifications: {
        metadata: {
          id: 'notifications',
          name: 'Notifications Module',
          version: '1.0.0',
          description: 'Email, SMS, and push notification system',
          author: 'SaaS Template',
          dependencies: ['auth'],
          conflicts: [],
          category: 'notifications',
          tags: ['notifications', 'email', 'sms', 'push'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: false,
          settings: {},
          permissions: ['notifications:read', 'notifications:write'],
          routes: [],
          api: [],
          components: [],
          stores: [],
          hooks: {},
        },
      },
      integrations: {
        metadata: {
          id: 'integrations',
          name: 'Integrations Module',
          version: '1.0.0',
          description: 'Third-party service integrations',
          author: 'SaaS Template',
          dependencies: [],
          conflicts: [],
          category: 'integrations',
          tags: ['integrations', 'api', 'third-party'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: false,
          settings: {},
          permissions: ['integrations:read', 'integrations:write'],
          routes: [],
          api: [],
          components: [],
          stores: [],
          hooks: {},
        },
      },
      'ui-components': {
        metadata: {
          id: 'ui-components',
          name: 'UI Components Module',
          version: '1.0.0',
          description: 'Reusable UI component library',
          author: 'SaaS Template',
          dependencies: [],
          conflicts: [],
          category: 'ui-components',
          tags: ['ui', 'components', 'design-system'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: false,
          settings: {},
          permissions: [],
          routes: [],
          api: [],
          components: [],
          stores: [],
          hooks: {},
        },
      },
      utilities: {
        metadata: {
          id: 'utilities',
          name: 'Utilities Module',
          version: '1.0.0',
          description: 'Common utility functions and helpers',
          author: 'SaaS Template',
          dependencies: [],
          conflicts: [],
          category: 'utilities',
          tags: ['utilities', 'helpers', 'common'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        config: {
          enabled: false,
          settings: {},
          permissions: [],
          routes: [],
          api: [],
          components: [],
          stores: [],
          hooks: {},
        },
      },
    };

    const mockModule = mockModules[moduleId];
    if (!mockModule) {
      throw new Error(`Mock module ${moduleId} not found`);
    }

    return mockModule;
  }

  /**
   * Load multiple modules
   */
  async loadModules(moduleIds: string[]): Promise<ModuleLoadResult[]> {
    const results: ModuleLoadResult[] = [];

    console.log(`📦 Loading ${moduleIds.length} modules...`);

    // Load modules in parallel for better performance
    const loadPromises = moduleIds.map((moduleId) => this.loadModule(moduleId));
    const loadResults = await Promise.allSettled(loadPromises);

    for (let i = 0; i < loadResults.length; i++) {
      const result = loadResults[i];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          error: result.reason,
          loadTime: 0,
          cached: false,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `✅ Loaded ${successCount}/${moduleIds.length} modules successfully`
    );

    return results;
  }

  /**
   * Auto-load all discovered modules
   */
  async autoLoadModules(): Promise<ModuleLoadResult[]> {
    if (!this.config.autoLoad) {
      console.log('⏭️ Auto-loading disabled');
      return [];
    }

    console.log('🚀 Auto-loading modules...');

    const discovery = await this.discoverModules();
    const results = await this.loadModules(discovery.modules);

    return results;
  }

  // ============================================================================
  // MODULE MANAGEMENT
  // ============================================================================

  /**
   * Unload a module
   */
  async unloadModule(moduleId: string): Promise<void> {
    try {
      await moduleRegistry.unregisterModule(moduleId);
      this.loadedModules.delete(moduleId);
      this.moduleCache.delete(moduleId);
      console.log(`🗑️ Module ${moduleId} unloaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to unload module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Reload a module
   */
  async reloadModule(moduleId: string): Promise<ModuleLoadResult> {
    console.log(`🔄 Reloading module ${moduleId}...`);

    // Unload first
    try {
      await this.unloadModule(moduleId);
    } catch (error) {
      // Ignore errors if module wasn't loaded
    }

    // Load again
    return await this.loadModule(moduleId);
  }

  /**
   * Get loaded module
   */
  getLoadedModule(moduleId: string): Module | undefined {
    return (
      this.loadedModules.get(moduleId) || moduleRegistry.getModule(moduleId)
    );
  }

  /**
   * Get all loaded modules
   */
  getLoadedModules(): Module[] {
    return Array.from(this.loadedModules.values());
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return (
      this.loadedModules.has(moduleId) ||
      moduleRegistry.getModule(moduleId) !== undefined
    );
  }

  /**
   * Clear module cache
   */
  clearCache(): void {
    this.moduleCache.clear();
    console.log('🧹 Module cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; modules: string[] } {
    return {
      size: this.moduleCache.size,
      modules: Array.from(this.moduleCache.keys()),
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get loader configuration
   */
  getConfig(): ModuleLoaderConfig {
    return { ...this.config };
  }

  /**
   * Update loader configuration
   */
  updateConfig(newConfig: Partial<ModuleLoaderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Module loader configuration updated');
  }

  /**
   * Get loader statistics
   */
  getStats(): {
    loadedModules: number;
    cachedModules: number;
    loadingModules: number;
    discoveryPaths: number;
  } {
    return {
      loadedModules: this.loadedModules.size,
      cachedModules: this.moduleCache.size,
      loadingModules: this.loadingPromises.size,
      discoveryPaths: this.discoveryPaths.length,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
export const moduleLoader = new ModuleLoader();

// Export for use in components
export default moduleLoader;
