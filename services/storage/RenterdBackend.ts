import { Note, StorageBackend, StorageConfig, RenterdStorageConfig } from '@/types/storage';

const BUCKET_NAME = 'decanotes';
const NOTES_OBJECT_KEY = 'notes.json';

interface NotesData {
  notes: Note[];
  version: number;
}

/**
 * Renterd storage backend
 * 
 * Integrates with Sia Renterd for decentralized storage.
 * All notes are stored as a single JSON object in the 'decanotes' bucket.
 */
export class RenterdBackend implements StorageBackend {
  private ready: boolean = false;
  private config?: RenterdStorageConfig;
  private notes: Note[] = [];

  private getAuthHeader(): string {
    if (!this.config) {
      throw new Error('Backend not initialized');
    }
    // Format: ":<password>" encoded in base64
    const credentials = `:${this.config.password}`;
    return `Basic ${btoa(credentials)}`;
  }

  private async checkBucketExists(): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.config.host}/api/bus/bucket/${BUCKET_NAME}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': this.getAuthHeader(),
          },
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error checking bucket:', error);
      return false;
    }
  }

  private async createBucket(): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.host}/api/bus/buckets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          name: BUCKET_NAME,
          policy: {
            publicReadAccess: false,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
  }

  private async ensureBucketExists(): Promise<void> {
    const exists = await this.checkBucketExists();
    
    if (!exists) {
      const created = await this.createBucket();
      if (!created) {
        throw new Error('Failed to create bucket');
      }
    }
  }

  private async downloadNotesData(): Promise<NotesData | null> {
    if (!this.config) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.config.host}/api/worker/object/${NOTES_OBJECT_KEY}?bucket=${BUCKET_NAME}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream',
            'Authorization': this.getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Object doesn't exist yet, return empty data
          return { notes: [], version: 1 };
        }
        throw new Error(`Failed to download notes: ${response.statusText}`);
      }

      const text = await response.text();
      const data = JSON.parse(text) as NotesData;
      
      // Parse dates
      data.notes = data.notes.map(note => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        lastModified: new Date(note.lastModified),
      }));
      
      return data;
    } catch (error) {
      console.error('Error downloading notes:', error);
      return null;
    }
  }

  private async uploadNotesData(data: NotesData): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      const jsonData = JSON.stringify(data, null, 2);
      
      const response = await fetch(
        `${this.config.host}/api/worker/object/${NOTES_OBJECT_KEY}?bucket=${BUCKET_NAME}&mimetype=application/json`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': this.getAuthHeader(),
          },
          body: jsonData,
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error uploading notes:', error);
      return false;
    }
  }

  async initialize(config: StorageConfig): Promise<void> {
    if (config.type !== 'renterd') {
      throw new Error('Invalid config type for RenterdBackend');
    }
    
    this.config = config;
    
    // Ensure bucket exists
    await this.ensureBucketExists();
    
    // Load existing notes
    const data = await this.downloadNotesData();
    if (data) {
      this.notes = data.notes;
    } else {
      this.notes = [];
    }
    
    this.ready = true;
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      return false;
    }
    
    try {
      const response = await fetch(
        `${this.config.host}/api/bus/bucket/${BUCKET_NAME}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': this.getAuthHeader(),
          },
        }
      );

      // Connection successful if we get 200 or 404 (bucket doesn't exist yet)
      return response.ok || response.status === 404;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getNotes(): Promise<Note[]> {
    if (!this.ready) {
      throw new Error('Backend not ready');
    }
    return [...this.notes];
  }

  async getNote(id: string): Promise<Note | null> {
    if (!this.ready) {
      throw new Error('Backend not ready');
    }
    return this.notes.find(note => note.id === id) || null;
  }

  async saveNote(note: Note): Promise<Note> {
    if (!this.ready) {
      throw new Error('Backend not ready');
    }

    const now = new Date();
    const updatedNote = {
      ...note,
      updatedAt: now,
      lastModified: now,
    };

    // Update local cache
    const index = this.notes.findIndex(n => n.id === note.id);
    if (index >= 0) {
      this.notes[index] = updatedNote;
    } else {
      this.notes.unshift(updatedNote);
    }

    // Upload to renterd
    const data: NotesData = {
      notes: this.notes,
      version: 1,
    };

    const success = await this.uploadNotesData(data);
    if (!success) {
      throw new Error('Failed to upload note to renterd');
    }

    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.ready) {
      throw new Error('Backend not ready');
    }

    // Remove from local cache
    this.notes = this.notes.filter(n => n.id !== id);

    // Upload to renterd
    const data: NotesData = {
      notes: this.notes,
      version: 1,
    };

    const success = await this.uploadNotesData(data);
    if (!success) {
      throw new Error('Failed to delete note from renterd');
    }
  }

  async sync(): Promise<void> {
    if (!this.ready) {
      throw new Error('Backend not ready');
    }

    // Download latest notes from renterd
    const data = await this.downloadNotesData();
    if (data) {
      this.notes = data.notes;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async disconnect(): Promise<void> {
    this.config = undefined;
    this.notes = [];
    this.ready = false;
  }
}
