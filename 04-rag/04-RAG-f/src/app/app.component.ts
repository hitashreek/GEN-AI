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
  @ViewChild('fileInput') input!: ElementRef<HTMLInputElement>;

  textContent: string = '';
  files: { pdf?: File } = {};
  chatMessages: ChatMessage[] = [];
  chatInput: string = ''; // Track chat input state

  isUploading: boolean = false;
  isChatLoading: boolean = false;
  uploadMessage: { type: 'success' | 'error', text: string } | null = null;

  userId: string;
  userDocuments: any[] = []; //  Store user's documents
  isLoadingDocuments: boolean = false;

  private readonly MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
  private readonly MAX_TEXT_SIZE = 30 * 1024; // 30KB 

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

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + 'KB';
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
  }

  onFileChange(event: Event, type: 'pdf') {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      if (file.size > this.MAX_FILE_SIZE) {
        this.uploadMessage = {
          type: 'error',
          text: `File too large. Maximum size is 4MB. Your file is ${this.formatFileSize(file.size)}`
        };
        (event.target as HTMLInputElement).value = '';
        setTimeout(() => this.uploadMessage = null, 5000);
        return;
      }
      this.files[type] = file;
    }
  }

  // Monitor text input and warn user in real-time
  onTextChange() {
    if (this.textContent) {
      const textSizeInBytes = new Blob([this.textContent]).size;
      const percentUsed = (textSizeInBytes / this.MAX_TEXT_SIZE) * 100;

      if (percentUsed > 90) {
        console.warn(`z Text is ${percentUsed.toFixed(0)}% of limit (${this.formatFileSize(textSizeInBytes)})`);
      }
    }
  }

  submit() {
    // Validate at least one content exists
    if (!this.files.pdf && !this.textContent.trim()) {
      this.uploadMessage = {
        type: 'error',
        text: 'Please upload a file or paste text content.'
      };
      setTimeout(() => this.uploadMessage = null, 5000);
      return;
    }

    // Validate text content size
    if (this.textContent) {
      const textSizeInBytes = new Blob([this.textContent]).size;

      if (textSizeInBytes > this.MAX_TEXT_SIZE) {
        const textSizeFormatted = this.formatFileSize(textSizeInBytes);
        const maxSizeFormatted = this.formatFileSize(this.MAX_TEXT_SIZE);
        this.uploadMessage = {
          type: 'error',
          text: `Text is too large (${textSizeFormatted}). Maximum is ${maxSizeFormatted}. Please paste less content.`
        };
        setTimeout(() => this.uploadMessage = null, 5000);
        return;
      }
    }

    const formData = new FormData();
    if (this.files.pdf) formData.append('pdf', this.files.pdf);
    if (this.textContent) formData.append('textContent', this.textContent);
    formData.append('userId', this.userId);

    this.isUploading = true;
    this.uploadMessage = null;

    this.ragService.indexDocuments(formData).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          this.uploadMessage = {
            type: 'success',
            text: 'Document uploaded successfully!'
          };
          if (this.input?.nativeElement) this.input.nativeElement.value = '';
          this.isUploading = false;
          this.textContent = '';
          this.files = {};

          //  Reload documents after upload
          this.loadUserDocuments();

          setTimeout(() => this.uploadMessage = null, 5000);
        }
      },
      error: (err: any) => {
        console.error(err);

        // Better error messages
        let errorText = 'Failed to upload document. Please try again.';
        if (err.status === 500) {
          errorText = 'Server error: Content might be too large. Please reduce the size and try again.';
        } else if (err.status === 413) {
          errorText = 'Content too large for server. Please reduce the file/text size.';
        }

        this.uploadMessage = {
          type: 'error',
          text: errorText
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

        let errorMessage = 'Sorry, there was an error processing your request.';
        if (err.status === 500) {
          errorMessage = 'Server error: Too much content to process. Please ask more specific questions.';
        }

        this.chatMessages.push({
          role: 'system',
          content: errorMessage
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