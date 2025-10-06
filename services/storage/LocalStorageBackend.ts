import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, StorageBackend, StorageConfig } from '@/types/storage';

const NOTES_STORAGE_KEY = '@decanotes:notes';
const CONFIG_STORAGE_KEY = '@decanotes:config';

/**
 * Local storage backend implementation using AsyncStorage
 */
export class LocalStorageBackend implements StorageBackend {
  private ready: boolean = false;
  private notes: Map<string, Note> = new Map();

  async initialize(config: StorageConfig): Promise<void> {
    try {
      // Load existing notes from AsyncStorage
      const notesJson = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (notesJson) {
        const notesArray: Note[] = JSON.parse(notesJson);
        // Convert dates back from strings
        notesArray.forEach(note => {
          note.createdAt = new Date(note.createdAt);
          note.updatedAt = new Date(note.updatedAt);
          note.lastModified = new Date(note.lastModified);
          this.notes.set(note.id, note);
        });
      }

      // Save config
      await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      
      this.ready = true;
    } catch (error) {
      console.error('Failed to initialize LocalStorageBackend:', error);
      throw new Error('Failed to initialize local storage');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test if we can read/write to AsyncStorage
      const testKey = '@decanotes:test';
      await AsyncStorage.setItem(testKey, 'test');
      const value = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      return value === 'test';
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getNotes(): Promise<Note[]> {
    if (!this.ready) {
      throw new Error('Backend not initialized');
    }
    return Array.from(this.notes.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async getNote(id: string): Promise<Note | null> {
    if (!this.ready) {
      throw new Error('Backend not initialized');
    }
    return this.notes.get(id) || null;
  }

  async saveNote(note: Note): Promise<Note> {
    if (!this.ready) {
      throw new Error('Backend not initialized');
    }

    const now = new Date();
    const savedNote: Note = {
      ...note,
      updatedAt: now,
      lastModified: now,
    };

    // If it's a new note, set createdAt
    if (!this.notes.has(note.id)) {
      savedNote.createdAt = now;
    } else {
      // Preserve original createdAt
      const existingNote = this.notes.get(note.id);
      if (existingNote) {
        savedNote.createdAt = existingNote.createdAt;
      }
    }

    this.notes.set(note.id, savedNote);
    await this.persistNotes();
    return savedNote;
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.ready) {
      throw new Error('Backend not initialized');
    }

    this.notes.delete(id);
    await this.persistNotes();
  }

  async sync(): Promise<void> {
    if (!this.ready) {
      throw new Error('Backend not initialized');
    }
    // For local storage, sync is just persisting to AsyncStorage
    await this.persistNotes();
  }

  isReady(): boolean {
    return this.ready;
  }

  async disconnect(): Promise<void> {
    await this.persistNotes();
    this.notes.clear();
    this.ready = false;
  }

  /**
   * Persist notes to AsyncStorage
   */
  private async persistNotes(): Promise<void> {
    try {
      const notesArray = Array.from(this.notes.values());
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesArray));
    } catch (error) {
      console.error('Failed to persist notes:', error);
      throw new Error('Failed to save notes to local storage');
    }
  }

  /**
   * Clear all local storage data (useful for testing or resetting)
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(NOTES_STORAGE_KEY);
    await AsyncStorage.removeItem(CONFIG_STORAGE_KEY);
    this.notes.clear();
    this.ready = false;
  }
}
