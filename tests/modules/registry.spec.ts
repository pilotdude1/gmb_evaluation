/**
 * Module Registry System Tests
 *
 * Tests for the core module registry functionality.
 */

import { test, expect } from '@playwright/test';
import { ModuleRegistry } from '../../src/lib/modules/registry';

// Mock the browser environment for Node.js testing
const mockBrowser = {
  browser: false,
};

// Mock Svelte stores
const mockWritable = (initialValue: any) => {
  let value = initialValue;
  const subscribers = new Set<(value: any) => void>();

  return {
    subscribe: (callback: (value: any) => void) => {
      subscribers.add(callback);
      callback(value);
      return () => subscribers.delete(callback);
    },
    set: (newValue: any) => {
      value = newValue;
      subscribers.forEach((callback) => callback(value));
    },
    update: (fn: (value: any) => any) => {
      value = fn(value);
      subscribers.forEach((callback) => callback(value));
    },
  };
};

// Mock the module system for testing
class MockModuleRegistry {
  private modules = new Map();
  private stores = new Map();

  public readonly modulesStore = mockWritable([]);
  public readonly enabledModulesStore = mockWritable([]);
  public readonly moduleStatusStore = mockWritable({});
  public readonly errorsStore = mockWritable({});

  async registerModule(
    moduleId: string,
    moduleFactory: () => Promise<any>
  ): Promise<any> {
    const moduleInstance = await moduleFactory();
    const module = {
      metadata: moduleInstance.metadata,
      config: moduleInstance.config,
      instance: moduleInstance,
      status: 'installed',
      errors: [],
    };

    this.modules.set(moduleId, module);
    this.updateStores();
    return module;
  }

  getModule(moduleId: string): any {
    return this.modules.get(moduleId);
  }

  getAllModules(): any[] {
    return Array.from(this.modules.values());
  }

  getEnabledModules(): any[] {
    return Array.from(this.modules.values()).filter(
      (module) => module.config.enabled
    );
  }

  async enableModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (module) {
      module.status = 'enabled';
      module.config.enabled = true;
      this.updateStores();
    }
  }

  async disableModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (module) {
      module.status = 'disabled';
      module.config.enabled = false;
      this.updateStores();
    }
  }

  getModuleStats(): any {
    const modules = Array.from(this.modules.values());
    return {
      total: modules.length,
      enabled: modules.filter((m) => m.config.enabled).length,
      disabled: modules.filter((m) => !m.config.enabled).length,
      errors: modules.filter((m) => m.status === 'error').length,
      byCategory: {},
    };
  }

  private updateStores(): void {
    const modules = Array.from(this.modules.values());
    const enabledModules = modules.filter((m) => m.config.enabled);
    const statusMap: Record<string, string> = {};
    const errorsMap: Record<string, any[]> = {};

    modules.forEach((module) => {
      statusMap[module.metadata.id] = module.status;
      errorsMap[module.metadata.id] = module.errors;
    });

    this.modulesStore.set(modules);
    this.enabledModulesStore.set(enabledModules);
    this.moduleStatusStore.set(statusMap);
    this.errorsStore.set(errorsMap);
  }
}

class MockModuleLoader {
  private loadedModules = new Map();
  private moduleCache = new Map();

  async loadModule(moduleId: string): Promise<any> {
    const mockModule = await this.createMockModule(moduleId);
    this.loadedModules.set(moduleId, mockModule);
    return {
      success: true,
      module: mockModule,
      loadTime: 100,
      cached: false,
    };
  }

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
          api: [],
          components: [],
          stores: [],
          hooks: {},
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
    };

    return mockModules[moduleId] || null;
  }

  getStats(): any {
    return {
      loadedModules: this.loadedModules.size,
      cachedModules: this.moduleCache.size,
      loadingModules: 0,
      discoveryPaths: 3,
    };
  }
}

class MockModuleRouter {
  private routes = new Map();
  private middleware = new Map();

  registerModuleRoutes(moduleId: string, routes: any[]): void {
    routes.forEach((route) => {
      const routeId = `${moduleId}:${route.path}`;
      this.routes.set(routeId, {
        ...route,
        meta: { moduleId },
      });
    });
  }

  getAllRoutes(): any[] {
    return Array.from(this.routes.values());
  }

  getStats(): any {
    return {
      totalRoutes: this.routes.size,
      totalMiddleware: this.middleware.size,
      cachedRoutes: 0,
      routeHistoryLength: 0,
    };
  }
}

test.describe('Module Registry System', () => {
  let moduleRegistry: MockModuleRegistry;
  let moduleLoader: MockModuleLoader;
  let moduleRouter: MockModuleRouter;

  test.beforeEach(async () => {
    moduleRegistry = new MockModuleRegistry();
    moduleLoader = new MockModuleLoader();
    moduleRouter = new MockModuleRouter();
  });

  test('should register and load modules correctly', async () => {
    // Load a test module
    const result = await moduleLoader.loadModule('auth');

    expect(result.success).toBe(true);
    expect(result.module).toBeDefined();
    expect(result.module.metadata.id).toBe('auth');
    expect(result.module.metadata.name).toBe('Authentication Module');

    const stats = moduleRegistry.getModuleStats();
    expect(stats.total).toBe(0); // No modules registered yet
  });

  test('should handle module lifecycle correctly', async () => {
    // Register a module
    const mockFactory = async () => ({
      metadata: {
        id: 'test',
        name: 'Test Module',
        version: '1.0.0',
        description: 'Test module',
        author: 'Test',
        dependencies: [],
        conflicts: [],
        category: 'custom',
        tags: [],
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
    });

    const module = await moduleRegistry.registerModule('test', mockFactory);
    expect(module.metadata.id).toBe('test');
    expect(module.status).toBe('installed');

    // Enable the module
    await moduleRegistry.enableModule('test');
    const enabledModule = moduleRegistry.getModule('test');
    expect(enabledModule.config.enabled).toBe(true);
    expect(enabledModule.status).toBe('enabled');

    // Disable the module
    await moduleRegistry.disableModule('test');
    const disabledModule = moduleRegistry.getModule('test');
    expect(disabledModule.config.enabled).toBe(false);
    expect(disabledModule.status).toBe('disabled');
  });

  test('should register routes for modules', async () => {
    // Register routes for auth module
    const authRoutes = [
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
    ];

    moduleRouter.registerModuleRoutes('auth', authRoutes);

    const routes = moduleRouter.getAllRoutes();
    expect(routes.length).toBe(2);

    // Check for auth-specific routes
    const authRoutesFound = routes.filter(
      (route) => route.meta?.moduleId === 'auth'
    );
    expect(authRoutesFound.length).toBe(2);
  });

  test('should provide comprehensive statistics', async () => {
    const registryStats = moduleRegistry.getModuleStats();
    const loaderStats = moduleLoader.getStats();
    const routerStats = moduleRouter.getStats();

    expect(registryStats).toHaveProperty('total');
    expect(registryStats).toHaveProperty('enabled');
    expect(registryStats).toHaveProperty('disabled');
    expect(registryStats).toHaveProperty('errors');

    expect(loaderStats).toHaveProperty('loadedModules');
    expect(loaderStats).toHaveProperty('cachedModules');
    expect(loaderStats).toHaveProperty('loadingModules');
    expect(loaderStats).toHaveProperty('discoveryPaths');

    expect(routerStats).toHaveProperty('totalRoutes');
    expect(routerStats).toHaveProperty('totalMiddleware');
    expect(routerStats).toHaveProperty('cachedRoutes');
    expect(routerStats).toHaveProperty('routeHistoryLength');
  });

  test('should handle module dependencies', async () => {
    // Load users module which depends on auth
    const result = await moduleLoader.loadModule('users');

    expect(result.success).toBe(true);
    expect(result.module).toBeDefined();
    expect(result.module.metadata.dependencies).toContain('auth');
  });

  test('should provide reactive stores', async () => {
    // Register a module
    const mockFactory = async () => ({
      metadata: {
        id: 'test',
        name: 'Test Module',
        version: '1.0.0',
        description: 'Test module',
        author: 'Test',
        dependencies: [],
        conflicts: [],
        category: 'custom',
        tags: [],
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
    });

    await moduleRegistry.registerModule('test', mockFactory);

    // Check that stores are updated
    const modules = moduleRegistry.getAllModules();
    expect(modules.length).toBe(1);

    // Enable the module
    await moduleRegistry.enableModule('test');

    const enabledModules = moduleRegistry.getEnabledModules();
    expect(enabledModules.length).toBe(1);
    expect(enabledModules[0].metadata.id).toBe('test');
  });

  test('enables dependent modules once dependencies are available', async () => {
    const registry = new ModuleRegistry();

    const baseMetadata = {
      description: 'Test module',
      author: 'Test',
      conflicts: [],
      category: 'custom' as const,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await registry.registerModule('core', async () => ({
      metadata: {
        ...baseMetadata,
        id: 'core',
        name: 'Core Module',
        version: '1.0.0',
        dependencies: []
      },
      config: {
        enabled: false,
        settings: {},
        permissions: [],
        routes: [],
        api: [],
        components: [],
        stores: [],
        hooks: {}
      }
    }));

    await registry.registerModule('reports', async () => ({
      metadata: {
        ...baseMetadata,
        id: 'reports',
        name: 'Reports Module',
        version: '1.0.0',
        dependencies: ['core']
      },
      config: {
        enabled: false,
        settings: {},
        permissions: [],
        routes: [],
        api: [],
        components: [],
        stores: [],
        hooks: {}
      }
    }));

    await expect(registry.enableModule('reports')).rejects.toThrow(/dependency errors/);

    const reportsModuleWithErrors = registry.getModule('reports');
    expect(reportsModuleWithErrors?.status).toBe('error');
    expect(
      reportsModuleWithErrors?.errors.some(error =>
        error.message.includes('Required dependency core is not enabled')
      )
    ).toBe(true);

    await registry.enableModule('core');

    await registry.enableModule('reports');

    const reportsModule = registry.getModule('reports');
    expect(reportsModule?.config.enabled).toBe(true);
    expect(reportsModule?.status).toBe('enabled');
    expect(
      reportsModule?.errors.some(error => error.message.includes('Required dependency'))
    ).toBe(false);
  });
});
