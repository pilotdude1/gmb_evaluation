/**
 * Module Registry System
 * 
 * Core infrastructure for managing modules in the SaaS template.
 * Handles module discovery, registration, lifecycle management, and dependency resolution.
 */

import { writable, type Writable } from 'svelte/store';
// import { browser } from '$app/environment';
// Mock browser environment for now
const browser = typeof window !== 'undefined';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: string[];
  conflicts: string[];
  category: ModuleCategory;
  tags: string[];
  icon?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleConfig {
  enabled: boolean;
  settings: Record<string, any>;
  permissions: string[];
  routes: ModuleRoute[];
  api: ModuleAPI[];
  components: ModuleComponent[];
  stores: ModuleStore[];
  hooks: ModuleHooks;
}

export interface ModuleRoute {
  path: string;
  component: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  permissions?: string[];
  layout?: string;
}

export interface ModuleAPI {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  description: string;
  requiresAuth?: boolean;
  permissions?: string[];
  rateLimit?: number;
}

export interface ModuleComponent {
  name: string;
  path: string;
  description: string;
  props: Record<string, any>;
  events: string[];
  slots: string[];
}

export interface ModuleStore {
  name: string;
  path: string;
  description: string;
  initialState: any;
}

export interface ModuleHooks {
  onInstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onUpdate?: (fromVersion: string, toVersion: string) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

export interface Module {
  metadata: ModuleMetadata;
  config: ModuleConfig;
  instance?: any;
  status: ModuleStatus;
  errors: Error[];
  lastError?: Date;
}

export interface ModuleDependency {
  moduleId: string;
  version: string;
  required: boolean;
}

export interface ModuleConflict {
  moduleId: string;
  reason: string;
  severity: 'warning' | 'error';
}

export type ModuleCategory = 
  | 'authentication'
  | 'user-management'
  | 'billing'
  | 'analytics'
  | 'notifications'
  | 'integrations'
  | 'ui-components'
  | 'utilities'
  | 'custom';

export type ModuleStatus = 
  | 'installing'
  | 'installed'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'updating'
  | 'uninstalling';

// ============================================================================
// MODULE REGISTRY CLASS
// ============================================================================

export class ModuleRegistry {
  private modules: Map<string, Module> = new Map();
  private stores: Map<string, Writable<any>> = new Map();
  private hooks: Map<string, Function[]> = new Map();
  private dependencies: Map<string, ModuleDependency[]> = new Map();
  private conflicts: Map<string, ModuleConflict[]> = new Map();

  // Svelte stores for reactive updates
  public readonly modulesStore = writable<Module[]>([]);
  public readonly enabledModulesStore = writable<Module[]>([]);
  public readonly moduleStatusStore = writable<Record<string, ModuleStatus>>({});
  public readonly errorsStore = writable<Record<string, Error[]>>({});

  constructor() {
    this.initializeStores();
    if (browser) {
      this.loadModulesFromStorage();
    }
  }

  // ============================================================================
  // MODULE REGISTRATION & DISCOVERY
  // ============================================================================

  /**
   * Register a new module with the registry
   */
  async registerModule(moduleId: string, moduleFactory: () => Promise<any>): Promise<Module> {
    try {
      // Check if module already exists
      if (this.modules.has(moduleId)) {
        throw new Error(`Module ${moduleId} is already registered`);
      }

      // Create module instance
      const moduleInstance = await moduleFactory();
      
      // Validate module structure
      this.validateModule(moduleInstance);

      // Create module object
      const module: Module = {
        metadata: moduleInstance.metadata,
        config: moduleInstance.config,
        instance: moduleInstance,
        status: 'installed',
        errors: []
      };

      // Register module
      this.modules.set(moduleId, module);

      // Update stores
      this.updateStores();

      // Run install hook if available
      if (module.config.hooks.onInstall) {
        await module.config.hooks.onInstall();
      }

      // Check dependencies
      await this.checkDependencies(moduleId);

      // Check conflicts
      await this.checkConflicts(moduleId);

      console.log(`✅ Module ${moduleId} registered successfully`);
      return module;

    } catch (error) {
      console.error(`❌ Failed to register module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a module from the registry
   */
  async unregisterModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      // Run uninstall hook if available
      if (module.config.hooks.onUninstall) {
        await module.config.hooks.onUninstall();
      }

      // Remove module
      this.modules.delete(moduleId);

      // Update stores
      this.updateStores();

      console.log(`✅ Module ${moduleId} unregistered successfully`);

    } catch (error) {
      console.error(`❌ Failed to unregister module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get a registered module
   */
  getModule(moduleId: string): Module | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get enabled modules only
   */
  getEnabledModules(): Module[] {
    return Array.from(this.modules.values()).filter(module => module.config.enabled);
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: ModuleCategory): Module[] {
    return Array.from(this.modules.values()).filter(module => module.metadata.category === category);
  }

  // ============================================================================
  // MODULE LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Enable a module
   */
  async enableModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    if (module.config.enabled) {
      return; // Already enabled
    }

    try {
      // Check dependencies
      await this.checkDependencies(moduleId);
      if (this.hasDependencyErrors(moduleId)) {
        throw new Error(`Module ${moduleId} has dependency errors`);
      }

      // Check conflicts
      await this.checkConflicts(moduleId);
      if (this.hasConflictErrors(moduleId)) {
        throw new Error(`Module ${moduleId} has conflicts`);
      }

      // Update status
      module.status = 'enabled';
      module.config.enabled = true;

      // Run enable hook if available
      if (module.config.hooks.onEnable) {
        await module.config.hooks.onEnable();
      }

      // Update stores
      this.updateStores();

      console.log(`✅ Module ${moduleId} enabled successfully`);

    } catch (error) {
      module.status = 'error';
      module.errors.push(error as Error);
      module.lastError = new Date();
      this.updateStores();
      console.error(`❌ Failed to enable module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Disable a module
   */
  async disableModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    if (!module.config.enabled) {
      return; // Already disabled
    }

    try {
      // Run disable hook if available
      if (module.config.hooks.onDisable) {
        await module.config.hooks.onDisable();
      }

      // Update status
      module.status = 'disabled';
      module.config.enabled = false;

      // Update stores
      this.updateStores();

      console.log(`✅ Module ${moduleId} disabled successfully`);

    } catch (error) {
      module.status = 'error';
      module.errors.push(error as Error);
      module.lastError = new Date();
      this.updateStores();
      console.error(`❌ Failed to disable module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Update a module
   */
  async updateModule(moduleId: string, newVersion: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      const oldVersion = module.metadata.version;
      module.status = 'updating';

      // Run update hook if available
      if (module.config.hooks.onUpdate) {
        await module.config.hooks.onUpdate(oldVersion, newVersion);
      }

      // Update version
      module.metadata.version = newVersion;
      module.metadata.updatedAt = new Date();
      module.status = module.config.enabled ? 'enabled' : 'disabled';

      // Update stores
      this.updateStores();

      console.log(`✅ Module ${moduleId} updated from ${oldVersion} to ${newVersion}`);

    } catch (error) {
      module.status = 'error';
      module.errors.push(error as Error);
      module.lastError = new Date();
      this.updateStores();
      console.error(`❌ Failed to update module ${moduleId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // DEPENDENCY & CONFLICT MANAGEMENT
  // ============================================================================

  /**
   * Check module dependencies
   */
  private async checkDependencies(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) return;

    const dependencies: ModuleDependency[] = [];
    const errors: Error[] = [];

    for (const depId of module.metadata.dependencies) {
      const depModule = this.modules.get(depId);
      
      if (!depModule) {
        errors.push(new Error(`Required dependency ${depId} not found`));
        dependencies.push({ moduleId: depId, version: '*', required: true });
      } else if (!depModule.config.enabled) {
        errors.push(new Error(`Required dependency ${depId} is not enabled`));
        dependencies.push({ moduleId: depId, version: depModule.metadata.version, required: true });
      } else {
        dependencies.push({ moduleId: depId, version: depModule.metadata.version, required: true });
      }
    }

    this.dependencies.set(moduleId, dependencies);
    
    if (errors.length > 0) {
      module.errors.push(...errors);
    }
  }

  /**
   * Check module conflicts
   */
  private async checkConflicts(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) return;

    const conflicts: ModuleConflict[] = [];

    for (const conflictId of module.metadata.conflicts) {
      const conflictModule = this.modules.get(conflictId);
      
      if (conflictModule && conflictModule.config.enabled) {
        conflicts.push({
          moduleId: conflictId,
          reason: `Module ${moduleId} conflicts with ${conflictId}`,
          severity: 'error'
        });
      }
    }

    this.conflicts.set(moduleId, conflicts);
  }

  /**
   * Check if module has dependency errors
   */
  private hasDependencyErrors(moduleId: string): boolean {
    const module = this.modules.get(moduleId);
    if (!module) return false;

    return module.errors.some(error => 
      error.message.includes('Required dependency') || 
      error.message.includes('not enabled')
    );
  }

  /**
   * Check if module has conflict errors
   */
  private hasConflictErrors(moduleId: string): boolean {
    const conflicts = this.conflicts.get(moduleId);
    if (!conflicts) return false;

    return conflicts.some(conflict => conflict.severity === 'error');
  }

  // ============================================================================
  // STORE MANAGEMENT
  // ============================================================================

  /**
   * Get or create a module store
   */
  getModuleStore(moduleId: string, initialState: any = {}): Writable<any> {
    if (!this.stores.has(moduleId)) {
      this.stores.set(moduleId, writable(initialState));
    }
    return this.stores.get(moduleId)!;
  }

  /**
   * Subscribe to module events
   */
  subscribeToModuleEvents(moduleId: string, event: string, callback: Function): () => void {
    const key = `${moduleId}:${event}`;
    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }
    this.hooks.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const hooks = this.hooks.get(key);
      if (hooks) {
        const index = hooks.indexOf(callback);
        if (index > -1) {
          hooks.splice(index, 1);
        }
      }
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Validate module structure
   */
  private validateModule(moduleInstance: any): void {
    if (!moduleInstance.metadata) {
      throw new Error('Module must have metadata');
    }

    if (!moduleInstance.metadata.id) {
      throw new Error('Module metadata must have an id');
    }

    if (!moduleInstance.metadata.name) {
      throw new Error('Module metadata must have a name');
    }

    if (!moduleInstance.metadata.version) {
      throw new Error('Module metadata must have a version');
    }

    if (!moduleInstance.config) {
      throw new Error('Module must have config');
    }

    if (typeof moduleInstance.config.enabled !== 'boolean') {
      throw new Error('Module config must have enabled property');
    }
  }

  /**
   * Initialize Svelte stores
   */
  private initializeStores(): void {
    this.modulesStore.set([]);
    this.enabledModulesStore.set([]);
    this.moduleStatusStore.set({});
    this.errorsStore.set({});
  }

  /**
   * Update all stores with current state
   */
  private updateStores(): void {
    const modules = Array.from(this.modules.values());
    const enabledModules = modules.filter(m => m.config.enabled);
    const statusMap: Record<string, ModuleStatus> = {};
    const errorsMap: Record<string, Error[]> = {};

    modules.forEach(module => {
      statusMap[module.metadata.id] = module.status;
      errorsMap[module.metadata.id] = module.errors;
    });

    this.modulesStore.set(modules);
    this.enabledModulesStore.set(enabledModules);
    this.moduleStatusStore.set(statusMap);
    this.errorsStore.set(errorsMap);

    // Save to storage if in browser
    if (browser) {
      this.saveModulesToStorage();
    }
  }

  /**
   * Load modules from storage
   */
  private loadModulesFromStorage(): void {
    try {
      const stored = localStorage.getItem('saas-modules');
      if (stored) {
        const data = JSON.parse(stored);
        // Restore module states
        // Note: This is a simplified version - in production you'd want more robust state restoration
        console.log('📦 Loaded module states from storage');
      }
    } catch (error) {
      console.warn('Failed to load modules from storage:', error);
    }
  }

  /**
   * Save modules to storage
   */
  private saveModulesToStorage(): void {
    try {
      const data = {
        modules: Array.from(this.modules.entries()),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('saas-modules', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save modules to storage:', error);
    }
  }

  /**
   * Get module statistics
   */
  getModuleStats(): {
    total: number;
    enabled: number;
    disabled: number;
    errors: number;
    byCategory: Record<ModuleCategory, number>;
  } {
    const modules = Array.from(this.modules.values());
    const stats = {
      total: modules.length,
      enabled: modules.filter(m => m.config.enabled).length,
      disabled: modules.filter(m => !m.config.enabled).length,
      errors: modules.filter(m => m.status === 'error').length,
      byCategory: {} as Record<ModuleCategory, number>
    };

    // Count by category
    modules.forEach(module => {
      const category = module.metadata.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all modules (for testing/reset)
   */
  async clearAllModules(): Promise<void> {
    const moduleIds = Array.from(this.modules.keys());
    
    for (const moduleId of moduleIds) {
      await this.unregisterModule(moduleId);
    }

    this.modules.clear();
    this.stores.clear();
    this.hooks.clear();
    this.dependencies.clear();
    this.conflicts.clear();

    this.updateStores();
    console.log('🧹 All modules cleared');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
export const moduleRegistry = new ModuleRegistry();

// Export for use in components
export const { 
  modulesStore, 
  enabledModulesStore, 
  moduleStatusStore, 
  errorsStore 
} = moduleRegistry;
