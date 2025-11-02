/**
 * HTTP 客戶端基礎配置與攔截器
 */

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class HttpClient {
  private config: Required<HttpConfig>;

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    };
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async get<T>(url: string, config?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, data?: any, config?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(url: string, data?: any, config?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(url: string, config?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// 預設 HTTP 客戶端實例
export const httpClient = new HttpClient({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  timeout: 10000
});