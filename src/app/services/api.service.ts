import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  // We use localhost:3000 since testers will run both via docker-compose
  private baseUrl = 'http://localhost:3000';

  constructor() { }

  getXrays(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/xrays`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  getConsults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/consults`);
  }
}
