import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, StorageBackend, StorageConfig, AuthState, StorageBackendType } from '@/types/storage';
import { LocalStorageBackend } from '@/services/storage/LocalStorageBackend';
import { RenterdBackend } from '@/services/storage/RenterdBackend';
import { IPFSBackend } from '@/services/storage/IPFSBackend';

const AUTH_STATE_KEY = '@decanotes:auth_state';

interface StorageContextType {
  // Auth state
  authState: AuthState;
  isLoading: boolean;
  
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
      const authStateJson = await AsyncStorage.getItem(AUTH_STATE_KEY);
      if (authStateJson) {
        const savedAuthState: AuthState = JSON.parse(authStateJson);
        
        if (savedAuthState.isAuthenticated && savedAuthState.config) {
          // Recreate backend
          const newBackend = createBackend(savedAuthState.config.type);
          await newBackend.initialize(savedAuthState.config);
          setBackend(newBackend);
          setAuthState(savedAuthState);
          
          // Load notes
          const loadedNotes = await newBackend.getNotes();
          setNotes(loadedNotes);
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
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
      
      // Save auth state
      const newAuthState: AuthState = {
        isAuthenticated: true,
        backendType,
        config,
      };
      await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(newAuthState));
      
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

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Disconnect backend
      if (backend) {
        await backend.disconnect();
      }
      
      // Clear auth state
      await AsyncStorage.removeItem(AUTH_STATE_KEY);
      
      setBackend(null);
      setAuthState({ isAuthenticated: false });
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
