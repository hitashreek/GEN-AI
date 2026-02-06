import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RagService } from '../service/rag.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [RagService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  textContent: string = '';
  files: { pdf?: File } = {};
  chatMessages: ChatMessage[] = [];

  isUploading: boolean = false;
  isChatLoading: boolean = false;
  uploadMessage: { type: 'success' | 'error', text: string } | null = null;

  userId: string;
  userDocuments: any[] = []; //  Store user's documents
  isLoadingDocuments: boolean = false;
  input!: HTMLInputElement;

  constructor(private ragService: RagService) {
    this.userId = this.getOrCreateUserId();
  }

  //  Load documents on init
  ngOnInit() {
    this.loadUserDocuments();
  }


  // This lifecycle hook fires every time the UI changes
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Container might not be initialized yet
    }
  }

  //  Load user's documents
  loadUserDocuments() {
    this.isLoadingDocuments = true;
    this.ragService.getUserDocuments(this.userId).subscribe({
      next: (res: any) => {
        this.userDocuments = res.documents;
        this.isLoadingDocuments = false;
      },
      error: (err: any) => {
        console.error('Error loading documents:', err);
        this.isLoadingDocuments = false;
      }
    });
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('rag-userId');

    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rag-userId', userId);
    }

    return userId;
  }

  get hasContent(): boolean {
    return !!(this.files.pdf || this.textContent.trim());
  }

  onFileChange(event: any, type: 'pdf') {
    this.input = event.target as HTMLInputElement;
    const file = this.input.files?.[0];

    if (file) {
      this.files[type] = file;
    }
  }


  submit() {
    const formData = new FormData();
    if (this.files.pdf) formData.append('pdf', this.files.pdf);
    if (this.textContent) formData.append('textContent', this.textContent);
    formData.append('userId', this.userId);

    this.isUploading = true;
    this.uploadMessage = null;

    this.ragService.indexDocuments(formData).subscribe({
      next: (res: any) => {
        this.uploadMessage = {
          type: 'success',
          text: 'Document uploaded successfully!'
        };
        this.input.value = '';
        this.isUploading = false;
        this.textContent = '';
        this.files = {};

        //  Reload documents after upload
        this.loadUserDocuments();

        setTimeout(() => this.uploadMessage = null, 5000);
      },
      error: (err: any) => {
        console.error(err);
        this.uploadMessage = {
          type: 'error',
          text: 'Failed to upload document. Please try again.'
        };
        this.isUploading = false;
      }
    });
  }

  sendQuery(query: string) {
    if (!query.trim()) return;

    this.isChatLoading = true;
    this.chatMessages.push({ role: 'user', content: query });

    this.ragService.chat(query, this.userId).subscribe({
      next: (res: any) => {
        this.chatMessages.push({ role: 'system', content: res.answer });
        this.isChatLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.chatMessages.push({
          role: 'system',
          content: 'Sorry, there was an error processing your request.'
        });
        this.isChatLoading = false;
      }
    });
  }

  docToDelete: any;

  openDeleteConfirm(doc: any) {
    this.docToDelete = doc;
  }

  cancelDelete() {
    this.docToDelete = null;
  }

  confirmDelete() {
    this.deleteDocument(this.docToDelete);
    this.docToDelete = null;
  }

  deleteDocument(doc: any) {
    this.ragService.deleteDocument(this.userId, doc.source).subscribe({
      next: (res: any) => {
        this.loadUserDocuments();
        this.uploadMessage = {
          type: 'success',
          text: 'Document deleted successfully!'
        };
        setTimeout(() => this.uploadMessage = null, 3000);
      },
      error: (err: any) => {
        console.error('Error deleting document:', err);
        this.uploadMessage = {
          type: 'error',
          text: 'Failed to delete document.'
        };
        setTimeout(() => this.uploadMessage = null, 3000);
      }
    });
  }

}

interface ChatMessage {
  role: 'user' | 'system';
  content: string;
}