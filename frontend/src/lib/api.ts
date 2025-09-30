import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: any) => {
    const originalRequest = error.config

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          
          const { token } = response.data
          localStorage.setItem('token', token)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Generic API methods
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.get(url, config)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message)
    }
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.post(url, data, config)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message)
    }
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.put(url, data, config)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message)
    }
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.delete(url, config)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message)
    }
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.patch(url, data, config)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message)
    }
  }
}

export default apiClient 