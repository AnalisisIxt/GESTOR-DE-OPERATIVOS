
import { Operative, User, CatalogEntry } from '../types';

/**
 * MOCK API SERVICE
 * En una implementación real, estas funciones harían llamadas fetch() a un servidor.
 */

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  // --- OPERATIVOS ---
  getOperatives: async (): Promise<Operative[]> => {
    try {
      const res = await fetch('/api/operatives');
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      return [];
    }
  },

  saveOperative: async (op: Operative): Promise<void> => {
    try {
      await fetch('/api/operatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op)
      });
    } catch (e) {}
  },

  updateOperative: async (id: string, updates: Partial<Operative>): Promise<void> => {
    try {
      await fetch(`/api/operatives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {}
  },

  deleteOperative: async (id: string): Promise<void> => {
    try {
      await fetch(`/api/operatives/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {}
  },

  // --- USUARIOS ---
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      return [];
    }
  },

  saveUsers: async (users: User[]): Promise<void> => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
    } catch (e) {}
  },

  // --- CATALOGOS ---
  getCatalog: async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      const res = await fetch(`/api/catalog/${key}`);
      if (!res.ok) return defaultValue;
      const data = await res.json();
      return data !== null ? data : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  saveCatalog: async (key: string, data: any): Promise<void> => {
    try {
      await fetch(`/api/catalog/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {}
  }
};
