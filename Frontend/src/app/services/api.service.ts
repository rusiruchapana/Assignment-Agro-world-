import { Injectable } from '@angular/core';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: environment.apiUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, { params });
  }

  post<T>(url: string, data: any): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data);
  }

  put<T>(url: string, data: any): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data);
  }

  patch<T>(url: string, data: any): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data);
  }

  delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url);
  }
}