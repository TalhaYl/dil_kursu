// Configuration utility for API URLs
export const getApiUrl = () => {
  // First, check if there's a runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_URL) {
    return window.APP_CONFIG.API_URL;
  }
  
  // In development, use the environment variable or localhost
  if (process.env.NODE_ENV === 'development') {
    return process.env.VUE_APP_API_URL || 'http://localhost:3000';
  }
  
  // In production, try to get from environment variable first
  if (process.env.VUE_APP_API_URL) {
    return process.env.VUE_APP_API_URL;
  }
  
  // If no environment variable, try to construct from current location
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    // For DigitalOcean App Platform deployment, the backend URL should be provided as an environment variable
    // But if not, we can try to construct it
    if (host.includes('ondigitalocean.app')) {
      // For DigitalOcean App Platform, API routes are typically on the same domain with /api prefix
      return `${protocol}//${host}/api`;
    }
    
    // For other production deployments, assume API is on the same domain
    return `${protocol}//${host}`;
  }
  
  // Fallback
  return 'http://localhost:3000';
};

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${getApiUrl()}${path}`;
}; 