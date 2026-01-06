/**
 * API请求工具类
 * 统一处理认证、错误处理和401自动退出
 */

class ApiClient {

  /**
   * 获取认证头
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * 处理401错误
   */
  private async handle401Error(): Promise<void> {
    console.log('Token expired or invalid, logging out...');

    // 清除认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');

    // 触发自定义事件显示登录过期提示
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);

      // 处理401错误
      if (response.status === 401) {
        await this.handle401Error();
        throw new Error('Unauthorized');
      }

      // 处理其他错误
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText || '请求失败'
        }));
        throw new Error(error.error || error.message || '请求失败');
      }

      return await response.json();
    } catch (error) {
      // 如果是401错误，已经处理过了，直接抛出
      if (error instanceof Error && error.message === 'Unauthorized') {
        throw error;
      }

      // 其他错误
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET请求
   */
  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST请求
   */
  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT请求
   */
  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

// 导出单例
export const apiClient = new ApiClient();
