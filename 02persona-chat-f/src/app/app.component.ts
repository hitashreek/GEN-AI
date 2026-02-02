import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatTemplateComponent } from './component/chat-template/chat-template.component';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatTemplateComponent],
  providers: [ChatService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '02-persona-chat';

  currentComponent: 'hitesh' | 'piyush' = 'hitesh';

  showComponent(comp: 'hitesh' | 'piyush') {
    this.currentComponent = comp;
  }
}
