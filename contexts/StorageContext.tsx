import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, StorageBackend, StorageConfig, AuthState, StorageBackendType } from '@/types/storage';
import { LocalStorageBackend } from '@/services/storage/LocalStorageBackend';
import { RenterdBackend } from '@/services/storage/RenterdBackend';
import { IPFSBackend } from '@/services/storage/IPFSBackend';

const AUTH_STATE_KEY = '@decanotes:auth_state';
const BACKEND_TYPE_KEY = '@decanotes:backend_type';
const BACKEND_CONFIG_KEY = '@decanotes:backend_config'; // Only for non-sensitive config

interface StorageContextType {
  // Auth state
  authState: AuthState;
  isLoading: boolean;
  needsCredentials: boolean; // True if backend needs credentials on startup
  savedBackendType: StorageBackendType | null; // The saved backend type
  
  // Notes state
  notes: Note[];
  currentNote: Note | null;
  hasUnsavedChanges: boolean;
  
  // Auth actions
  signIn: (backendType: StorageBackendType, config: StorageConfig) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Note actions
  loadNotes: () => Promise<void>;
  loadNote: (id: string) => Promise<Note | null>;
  saveNote: (note: Note) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  markAsChanged: () => void;
  clearUnsavedChanges: () => void;
  
  // Backend actions
  sync: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [needsCredentials, setNeedsCredentials] = useState(false);
  const [savedBackendType, setSavedBackendType] = useState<StorageBackendType | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [backend, setBackend] = useState<StorageBackend | null>(null);

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      // Load saved backend type
      const backendTypeStr = await AsyncStorage.getItem(BACKEND_TYPE_KEY);
      
      if (backendTypeStr) {
        const backendType = backendTypeStr as StorageBackendType;
        setSavedBackendType(backendType);
        
        // Check if this backend needs credentials
        if (requiresCredentials(backendType)) {
          // Don't auto-login, wait for user to enter credentials
          setNeedsCredentials(true);
        } else {
          // Auto-login for non-secure backends (like local storage)
          const configJson = await AsyncStorage.getItem(BACKEND_CONFIG_KEY);
          if (configJson) {
            const config: StorageConfig = JSON.parse(configJson);
            const newBackend = createBackend(backendType);
            await newBackend.initialize(config);
            setBackend(newBackend);
            setAuthState({
              isAuthenticated: true,
              backendType,
              config,
            });
            
            // Load notes
            const loadedNotes = await newBackend.getNotes();
            setNotes(loadedNotes);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requiresCredentials = (backendType: StorageBackendType): boolean => {
    // Returns true for backends that require sensitive credentials
    return backendType === 'renterd' || backendType === 'ipfs';
  };

  const createBackend = (type: StorageBackendType): StorageBackend => {
    switch (type) {
      case 'local':
        return new LocalStorageBackend();
      case 'renterd':
        return new RenterdBackend();
      case 'ipfs':
        return new IPFSBackend();
      default:
        throw new Error(`Unknown backend type: ${type}`);
    }
  };

  const signIn = useCallback(async (backendType: StorageBackendType, config: StorageConfig) => {
    try {
      setIsLoading(true);
      
      // Create and initialize backend
      const newBackend = createBackend(backendType);
      await newBackend.initialize(config);
      
      // Test connection
      const isConnected = await newBackend.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to storage backend');
      }
      
      // Save backend type (always)
      await AsyncStorage.setItem(BACKEND_TYPE_KEY, backendType);
      
      // Save config only for non-secure backends
      if (!requiresCredentials(backendType)) {
        await AsyncStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(config));
      } else {
        // For secure backends, only save non-sensitive config
        const safeConfig = getSafeConfig(config);
        if (safeConfig) {
          await AsyncStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(safeConfig));
        }
      }
      
      // Update auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        backendType,
        config,
      };
      
      setSavedBackendType(backendType);
      setNeedsCredentials(false);
      setBackend(newBackend);
      setAuthState(newAuthState);
      
      // Load notes
      const loadedNotes = await newBackend.getNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSafeConfig = (config: StorageConfig): Partial<StorageConfig> | null => {
    // Return config without sensitive fields
    if (config.type === 'renterd') {
      return {
        type: 'renterd',
        host: config.host,
        // Don't save password
      } as Partial<StorageConfig>;
    }
    if (config.type === 'ipfs') {
      return {
        type: 'ipfs',
        node: config.node,
        // Don't save apiKey
      } as Partial<StorageConfig>;
    }
    return null;
  };

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Disconnect backend
      if (backend) {
        await backend.disconnect();
      }
      
      // Clear all auth data
      await AsyncStorage.removeItem(BACKEND_TYPE_KEY);
      await AsyncStorage.removeItem(BACKEND_CONFIG_KEY);
      
      setBackend(null);
      setAuthState({ isAuthenticated: false });
      setSavedBackendType(null);
      setNeedsCredentials(false);
      setNotes([]);
      setCurrentNote(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  const loadNotes = useCallback(async () => {
    if (!backend) {
      throw new Error('No backend available');
    }
    
    try {
      const loadedNotes = await backend.getNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      throw error;
    }
  }, [backend]);

  const loadNote = useCallback(async (id: string): Promise<Note | null> => {
    if (!backend) {
      throw new Error('No backend available');
    }
    
    try {
      const note = await backend.getNote(id);
      if (note) {
        setCurrentNote(note);
        setHasUnsavedChanges(false);
      }
      return note;
    } catch (error) {
      console.error('Failed to load note:', error);
      throw error;
    }
  }, [backend]);

  const saveNote = useCallback(async (note: Note): Promise<Note> => {
    if (!backend) {
      throw new Error('No backend available');
    }
    
    try {
      const savedNote = await backend.saveNote(note);
      
      // Update notes list
      setNotes(prevNotes => {
        const index = prevNotes.findIndex(n => n.id === savedNote.id);
        if (index >= 0) {
          const newNotes = [...prevNotes];
          newNotes[index] = savedNote;
          return newNotes;
        } else {
          return [savedNote, ...prevNotes];
        }
      });
      
      // Update current note if it matches
      if (currentNote?.id === savedNote.id) {
        setCurrentNote(savedNote);
      }
      
      setHasUnsavedChanges(false);
      return savedNote;
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }, [backend, currentNote]);

  const deleteNote = useCallback(async (id: string) => {
    if (!backend) {
      throw new Error('No backend available');
    }
    
    try {
      await backend.deleteNote(id);
      
      // Update notes list
      setNotes(prevNotes => prevNotes.filter(n => n.id !== id));
      
      // Clear current note if it was deleted
      if (currentNote?.id === id) {
        setCurrentNote(null);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }, [backend, currentNote]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const clearUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const sync = useCallback(async () => {
    if (!backend) {
      throw new Error('No backend available');
    }
    
    try {
      await backend.sync();
      await loadNotes();
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }, [backend, loadNotes]);

  const value: StorageContextType = {
    authState,
    isLoading,
    needsCredentials,
    savedBackendType,
    notes,
    currentNote,
    hasUnsavedChanges,
    signIn,
    signOut,
    loadNotes,
    loadNote,
    saveNote,
    deleteNote,
    setCurrentNote,
    markAsChanged,
    clearUnsavedChanges,
    sync,
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
