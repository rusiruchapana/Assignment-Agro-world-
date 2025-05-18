import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
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

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    this.loadUser();
  }

  private loadUser() {
    const token = this.storage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUser = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        };
      } catch {
        this.logout();
      }
    }
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/users/register', {
      username,
      email,
      password
    });
    this.storage.setItem('token', response.data.token);
    this.loadUser();
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/users/login', { email, password });
    this.storage.setItem('token', response.data.token);
    this.loadUser();
    return response.data;
  }

  logout(): void {
    this.storage.removeItem('token');
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  get user(): User | null {
    return this.currentUser;
  }

  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}