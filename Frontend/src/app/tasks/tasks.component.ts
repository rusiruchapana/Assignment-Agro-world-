import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  created_by_username: string;
  assigned_to_username: string;
}

interface TasksResponse {
  data: Task[];
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;
  showCreateModal = false;
  
  newTask = {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  };

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    if (!this.auth.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    
    await this.loadTasks();
  }

  async loadTasks() {
    try {
      this.loading = true;
      const response = await this.api.get<Task[]>('/tasks');
      this.tasks = response.data;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async createTask() {
    try {
      await this.api.post('/tasks', this.newTask);
      this.showCreateModal = false;
      this.resetNewTask();
      await this.loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async updateStatus(taskId: number, newStatus: string) {
    try {
      await this.api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      await this.loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  resetNewTask() {
    this.newTask = {
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      assigned_to: ''
    };
  }

  formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}