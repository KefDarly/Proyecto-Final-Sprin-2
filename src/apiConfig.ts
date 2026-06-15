// API configuration for Petro Mapi SAC
// This allows configuring a custom backend endpoint for Vercel or local builds
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Returns the fully resolved API URL for any given endpoint path.
 * If API_BASE_URL is set to '/api' and the endpoint is '/api/personal',
 * this returns '/api/personal' instead of duplicate '/api/api/personal'.
 */
export function getApiUrl(endpoint: string): string {
  const base = API_BASE_URL.trim();
  if (!base) {
    return endpoint;
  }

  // Handle case where base ends with '/api' and the endpoint starts with '/api'
  if (base.endsWith('/api') && endpoint.startsWith('/api/')) {
    return `${base}${endpoint.substring(4)}`;
  }

  // Standard safe path join
  const baseHasSlash = base.endsWith('/');
  const endpointHasSlash = endpoint.startsWith('/');

  if (baseHasSlash && endpointHasSlash) {
    return `${base}${endpoint.substring(1)}`;
  } else if (!baseHasSlash && !endpointHasSlash) {
    return `${base}/${endpoint}`;
  }
  return `${base}${endpoint}`;
}
