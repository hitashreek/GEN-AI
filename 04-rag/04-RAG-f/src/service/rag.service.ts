import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RagService {
  private baseUrl = 'http://localhost:3000/api'; // <--- include /api
  // private baseUrl = 'https://ragone.vercel.app/api'; // <--- include /api

  constructor(private http: HttpClient) { }

  indexDocuments(payload: FormData) {
    return this.http.post(`${this.baseUrl}/indexing`, payload);
  }

  chat(query: string) {
    return this.http.post<{
      answer: string;
      files: { fileName: string; hasText: boolean }[];
    }>(`${this.baseUrl}/chatHyDE`, {
      query,
      userId: 'demo-user-123'
    });
  }

}

