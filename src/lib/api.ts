/**
 * API client — stub ready for Google AppScript backend.
 * Replace fetch calls / wire in axios or keep native fetch.
 * BASE_URL is read from .env (see .env.example)
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const ENDPOINTS = {
  contacts: '/contacts',
  companies: '/companies',
  pipeline: '/pipeline',
  quotes: '/quotes',
  invoices: '/invoices',
  relances: '/relances',
  settings: '/settings',
} as const;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  if (!BASE_URL) {
    throw new Error('VITE_API_URL not configured — using local mock data.');
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p, 'GET'),
  post: <T>(p: string, body: unknown) => request<T>(p, 'POST', body),
  put: <T>(p: string, body: unknown) => request<T>(p, 'PUT', body),
  del: <T>(p: string) => request<T>(p, 'DELETE'),
};
