import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private readonly isBrowser: boolean;

  constructor(
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadUser();
    }
  }

  private loadUser(): void {
    try {
      const token = this.isBrowser ? localStorage.getItem('token') : null;
      if (token) {
        const decoded: any = jwtDecode(token);
        this.currentUser = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        };
      }
    } catch (error) {
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    this.currentUser = null;
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/users/register', {
      username,
      email,
      password
    });
    if (this.isBrowser) {
      localStorage.setItem('token', response.data.token);
    }
    this.loadUser();
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/users/login', { email, password });
    if (this.isBrowser) {
      localStorage.setItem('token', response.data.token);
    }
    this.loadUser();
    return response.data;
  }

  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  get user(): User | null {
    return this.currentUser;
  }

  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}