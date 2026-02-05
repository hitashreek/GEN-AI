import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { RagService } from '../service/rag.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  // websiteUrl: string = '';
  textContent: string = '';
  files: { pdf?: File; csv?: File } = {};
  chatMessages: ChatMessage[] = [];

  constructor(private ragService: RagService) { }

  onFileChange(event: any, type: 'pdf') {
    const file = event.target.files[0];
    if (file) this.files[type] = file;
  }

  submit() {
    const formData = new FormData();
    if (this.files.pdf) formData.append('pdf', this.files.pdf);
    // if (this.websiteUrl) formData.append('websiteUrl', this.websiteUrl);
    if (this.textContent) formData.append('textContent', this.textContent);

    this.ragService.indexDocuments(formData).subscribe({
      next: (res: any) => console.log('Indexing done', res),
      error: (err: any) => console.error(err)
    });
  }


  sendQuery(query: string) {
    if (!query.trim()) return;
    this.chatMessages.push({ role: 'user', content: query });

    this.ragService.chat(query).subscribe({
      next: (res: any) => this.chatMessages.push({ role: 'system', content: res.answer }),
      error: (err: any) => console.error(err)
    });
  }
}

interface ChatMessage {
  role: 'user' | 'system';
  content: string;
}
