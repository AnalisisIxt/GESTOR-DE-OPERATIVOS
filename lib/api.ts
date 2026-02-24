
import { Operative, User, CatalogEntry } from '../types';

/**
 * MOCK API SERVICE
 * En una implementación real, estas funciones harían llamadas fetch() a un servidor.
 */

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  // --- OPERATIVOS ---
  getOperatives: async (): Promise<Operative[]> => {
    const res = await fetch('/api/operatives');
    return res.json();
  },

  saveOperative: async (op: Operative): Promise<void> => {
    await fetch('/api/operatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(op)
    });
  },

  updateOperative: async (id: string, updates: Partial<Operative>): Promise<void> => {
    await fetch(`/api/operatives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  deleteOperative: async (id: string): Promise<void> => {
    await fetch(`/api/operatives/${id}`, {
      method: 'DELETE'
    });
  },

  // --- USUARIOS ---
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },

  saveUsers: async (users: User[]): Promise<void> => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  },

  // --- CATALOGOS ---
  getCatalog: async <T>(key: string, defaultValue: T): Promise<T> => {
    const res = await fetch(`/api/catalog/${key}`);
    const data = await res.json();
    return data !== null ? data : defaultValue;
  },

  saveCatalog: async (key: string, data: any): Promise<void> => {
    await fetch(`/api/catalog/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};
