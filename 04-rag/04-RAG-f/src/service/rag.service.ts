import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RagService {
  // private baseUrl = 'http://localhost:3000/api'; 
  private baseUrl = 'https://04-rag-b.vercel.app/api';
  constructor(private http: HttpClient) { }

  indexDocuments(payload: FormData) {
    return this.http.post(`${this.baseUrl}/indexing`, payload);
  }

  chat(query: string, userId: string) {
    return this.http.post<{
      answer: string; files: { fileName: string; hasText: boolean }[];
    }>(`${this.baseUrl}/chatHyDE`, { query, userId });
  }

  getUserDocuments(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/${userId}`);
  }

  deleteDocument(userId: string, source: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${userId}/${encodeURIComponent(source)}`);
  }
}

