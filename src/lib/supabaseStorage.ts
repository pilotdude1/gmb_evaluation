import { supabase } from './supabaseClient';

export interface UploadResult {
  path: string;
  url: string;
  error?: string;
}

export interface StorageBucket {
  name: string;
  public: boolean;
}

/**
 * Supabase Storage Service
 * Handles file uploads, downloads, and storage management
 */
export class SupabaseStorageService {
  private buckets = {
    avatars: 'avatars',
    documents: 'documents',
    uploads: 'uploads',
  };

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    bucket: keyof typeof this.buckets,
    path: string,
    file: File,
    options?: {
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(this.buckets[bucket])
        .upload(path, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false,
        });

      if (error) {
        return { path: '', url: '', error: error.message };
      }

      const url = await this.getPublicUrl(bucket, data.path);
      return { path: data.path, url };
    } catch (error) {
      return {
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get public URL for a file
   */
  async getPublicUrl(
    bucket: keyof typeof this.buckets,
    path: string
  ): Promise<string> {
    const { data } = supabase.storage
      .from(this.buckets[bucket])
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Download a file from Supabase Storage
   */
  async downloadFile(
    bucket: keyof typeof this.buckets,
    path: string
  ): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.buckets[bucket])
        .download(path);

      if (error) {
        console.error('Download error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(
    bucket: keyof typeof this.buckets,
    path: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.buckets[bucket])
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * List files in a bucket
   */
  async listFiles(
    bucket: keyof typeof this.buckets,
    path?: string
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.buckets[bucket])
        .list(path || '');

      if (error) {
        console.error('List error:', error);
        return [];
      }

      return data.map((file) => file.name);
    } catch (error) {
      console.error('List error:', error);
      return [];
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    const path = `${userId}/avatar.${file.name.split('.').pop()}`;
    return this.uploadFile('avatars', path, file, { upsert: true });
  }

  /**
   * Upload document
   */
  async uploadDocument(userId: string, file: File): Promise<UploadResult> {
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}-${file.name}`;
    return this.uploadFile('documents', path, file);
  }

  /**
   * Upload general file
   */
  async uploadGeneralFile(file: File): Promise<UploadResult> {
    const timestamp = Date.now();
    const path = `${timestamp}-${file.name}`;
    return this.uploadFile('uploads', path, file);
  }

  /**
   * Get user avatar URL
   */
  async getAvatarUrl(userId: string): Promise<string> {
    const files = await this.listFiles('avatars', userId);
    const avatarFile = files.find((file) => file.startsWith('avatar.'));

    if (avatarFile) {
      return this.getPublicUrl('avatars', `${userId}/${avatarFile}`);
    }

    return '';
  }
}

// Export singleton instance
export const storageService = new SupabaseStorageService();
