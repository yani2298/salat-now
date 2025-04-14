import axios, { AxiosRequestConfig } from 'axios';

// Default configuration for all axios requests
export const axiosConfig: AxiosRequestConfig = {
  timeout: 5000,
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024,
  // Don't verify SSL certificates (compatible with both Node.js and browser)
  httpsAgent: {
    rejectUnauthorized: false
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

// Create a preconfigured axios instance
export const secureAxios = axios.create(axiosConfig);

// Export a function to apply config to existing axios calls
export const withSSLConfig = (config: AxiosRequestConfig = {}): AxiosRequestConfig => {
  return {
    ...axiosConfig,
    ...config,
    headers: {
      ...axiosConfig.headers,
      ...config.headers
    }
  };
}; 