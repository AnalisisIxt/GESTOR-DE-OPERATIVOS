
import { Operative, User, CatalogEntry } from '../types';

/**
 * MOCK API SERVICE
 * En una implementación real, estas funciones harían llamadas fetch() a un servidor.
 */

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  // --- OPERATIVOS ---
  getOperatives: async (): Promise<Operative[]> => {
    await delay(600);
    const data = localStorage.getItem('ixta_operatives');
    return data ? JSON.parse(data) : [];
  },

  saveOperative: async (op: Operative): Promise<void> => {
    await delay(1000); // Simular latencia de red
    const ops = await api.getOperatives();
    const newOps = [op, ...ops];
    localStorage.setItem('ixta_operatives', JSON.stringify(newOps));
  },

  updateOperative: async (id: string, updates: Partial<Operative>): Promise<void> => {
    await delay(800);
    const ops = await api.getOperatives();
    const newOps = ops.map(op => op.id === id ? { ...op, ...updates } : op);
    localStorage.setItem('ixta_operatives', JSON.stringify(newOps));
  },

  deleteOperative: async (id: string): Promise<void> => {
    await delay(500);
    const ops = await api.getOperatives();
    const newOps = ops.filter(op => op.id !== id);
    localStorage.setItem('ixta_operatives', JSON.stringify(newOps));
  },

  // --- USUARIOS ---
  getUsers: async (): Promise<User[]> => {
    await delay(400);
    const data = localStorage.getItem('ixta_users');
    return data ? JSON.parse(data) : [];
  },

  saveUsers: async (users: User[]): Promise<void> => {
    await delay(1200);
    localStorage.setItem('ixta_users', JSON.stringify(users));
  },

  // --- CATALOGOS ---
  getCatalog: async <T>(key: string, defaultValue: T): Promise<T> => {
    await delay(300);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },

  saveCatalog: async (key: string, data: any): Promise<void> => {
    await delay(1000);
    localStorage.setItem(key, JSON.stringify(data));
  }
};
