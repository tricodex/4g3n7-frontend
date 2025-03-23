/**
 * API Client configuration and utility methods
 */

// Default API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3222',
  ENDPOINTS: {
    HEALTH: '/api/health',
    AGENT_STATUS: '/api/agent/status',
    ATTESTATION: '/api/attestation',
    TRADE: '/api/trade',
  }
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  // Update the base URL (useful for switching to a different server)
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  // Generic GET request
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Use Next.js 15's new caching behavior
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Generic POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Health check endpoint
  async getHealth() {
    return this.get<{ status: string; version: string }>(API_CONFIG.ENDPOINTS.HEALTH);
  }

  // Get agent status
  async getAgentStatus() {
    return this.get<{ status: string; type: string; walletAddress?: string }>(API_CONFIG.ENDPOINTS.AGENT_STATUS);
  }

  // Get attestation status
  async getAttestationStatus() {
    return this.get<{
      status: 'verified' | 'failed' | 'in_progress' | 'not_started';
      enclaveIP: string;
      timestamp: string;
      pcrValues: any[];
      digest: string;
      pcrsVerified: number;
      pcrsTotal: number;
      error?: string;
    }>(API_CONFIG.ENDPOINTS.ATTESTATION);
  }

  // Execute a trade
  async executeTrade(tradeData: {
    type: string;
    from: string;
    to: string;
    amount: number;
  }) {
    return this.post<{
      status: string;
      tradeId: string;
      timestamp: string;
    }>(API_CONFIG.ENDPOINTS.TRADE, tradeData);
  }
}

// Create and export an instance of the API client
const apiClient = new ApiClient();
export default apiClient;