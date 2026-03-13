/**
 * Offline Service Worker & Network Service
 * Enables offline functionality and graceful degradation
 */

// ============= NETWORK STATUS MONITOR =============
export class NetworkStatusService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.init();
  }

  init() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online!');
      this.isOnline = true;
      this.notifyListeners('online');
    });

    window.addEventListener('offline', () => {
      console.log('📡 Offline detected');
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  subscribe(callback) {
    this.listeners.push(callback);
    // Call immediately with current status
    callback(this.isOnline ? 'online' : 'offline');
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }

  getStatus() {
    return this.isOnline ? 'online' : 'offline';
  }
}

// ============= LOCAL STORAGE CACHE =============
export class CacheService {
  constructor(storageName = 'sparkhub_cache') {
    this.storageName = storageName;
  }

  set(key, value, expirationMs = null) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiration: expirationMs ? Date.now() + expirationMs : null
      };
      localStorage.setItem(`${this.storageName}:${key}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Cache set error:', e);
      return false;
    }
  }

  get(key) {
    try {
      const data = JSON.parse(localStorage.getItem(`${this.storageName}:${key}`));
      if (!data) return null;

      // Check expiration
      if (data.expiration && Date.now() > data.expiration) {
        this.remove(key);
        return null;
      }

      return data.value;
    } catch (e) {
      console.error('Cache get error:', e);
      return null;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(`${this.storageName}:${key}`);
      return true;
    } catch (e) {
      console.error('Cache remove error:', e);
      return false;
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.storageName));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.error('Cache clear error:', e);
      return false;
    }
  }

  getAllKeys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.storageName))
      .map(k => k.replace(`${this.storageName}:`, ''));
  }
}

// ============= API FALLBACK SERVICE =============
export class APIFallbackService {
  constructor(cacheService) {
    this.cache = cacheService;
    this.mockData = {
      '/api/freelance/projects': {
        projects: [
          {
            id: 1,
            title: 'E-commerce Website Development',
            description: 'Build a responsive e-commerce platform',
            budget: { min: 5000, max: 10000 },
            timeline: '8 weeks',
            status: 'open'
          },
          {
            id: 2,
            title: 'Mobile App - iOS & Android',
            description: 'Cross-platform mobile application',
            budget: { min: 15000, max: 25000 },
            timeline: '12 weeks',
            status: 'open'
          }
        ]
      },
      '/api/rag-query': {
        response: {
          text: 'Information about budget, timeline, and requirements available offline. Please check the documents section.',
          confidence: 0.6,
          source: 'offline_fallback'
        }
      }
    };
  }

  async fetchWithFallback(url, options = {}, cacheKey = null, cacheExpiration = 3600000) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Cache successful response
      if (cacheKey) {
        this.cache.set(cacheKey, data, cacheExpiration);
      }

      return {
        success: true,
        data,
        source: 'network'
      };
    } catch (error) {
      console.error('❌ Network request failed:', error);

      // Try to return cached data
      if (cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log('📦 Using cached data for:', cacheKey);
          return {
            success: true,
            data: cached,
            source: 'cache'
          };
        }
      }

      // Use mock data as last resort
      if (this.mockData[url]) {
        console.log('🎭 Using mock data for:', url);
        return {
          success: true,
          data: this.mockData[url],
          source: 'mock',
          message: 'Offline mode: showing sample data'
        };
      }

      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }
}

// ============= SERVICE WORKER REGISTRATION =============
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => console.log('✅ Service Worker registered'))
      .catch(err => console.log('⚠️ Service Worker registration failed:', err));
  }
}

// ============= EXPORTS =============
export const networkStatusService = new NetworkStatusService();
export const cacheService = new CacheService();
export const apiFallbackService = new APIFallbackService(cacheService);
