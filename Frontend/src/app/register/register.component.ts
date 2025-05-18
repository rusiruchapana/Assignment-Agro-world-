import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  async onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.auth.register(this.username, this.email, this.password);
      this.router.navigate(['/tasks']);
    } catch (err: any) {
      this.error = err.response?.data?.message || 'Registration failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}