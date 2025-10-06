import { EditorBlock } from './editor';

/**
 * Storage backend types
 */
export type StorageBackendType = 'local' | 'renterd' | 'ipfs';

/**
 * Note structure
 */
export interface Note {
  id: string;
  title: string;
  content: EditorBlock[];
  preview: string; // First few lines of content for display
  color?: 'default' | 'cream' | 'sage' | 'sky' | 'lavender' | 'peach';
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date; // For backwards compatibility
}

/**
 * Storage configuration for different backends
 */
export interface LocalStorageConfig {
  type: 'local';
}

export interface RenterdStorageConfig {
  type: 'renterd';
  host: string;
  password: string;
}

export interface IPFSStorageConfig {
  type: 'ipfs';
  node?: string;
  apiKey?: string;
}

export type StorageConfig = LocalStorageConfig | RenterdStorageConfig | IPFSStorageConfig;

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  backendType?: StorageBackendType;
  config?: StorageConfig;
}

/**
 * Storage backend interface
 * All storage backends must implement this interface
 */
export interface StorageBackend {
  /**
   * Initialize the storage backend
   */
  initialize(config: StorageConfig): Promise<void>;

  /**
   * Test connection to the backend
   */
  testConnection(): Promise<boolean>;

  /**
   * Get all notes
   */
  getNotes(): Promise<Note[]>;

  /**
   * Get a single note by ID
   */
  getNote(id: string): Promise<Note | null>;

  /**
   * Save a note (create or update)
   */
  saveNote(note: Note): Promise<Note>;

  /**
   * Delete a note
   */
  deleteNote(id: string): Promise<void>;

  /**
   * Sync notes with backend
   */
  sync(): Promise<void>;

  /**
   * Check if backend is ready
   */
  isReady(): boolean;

  /**
   * Disconnect from backend
   */
  disconnect(): Promise<void>;
}

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
