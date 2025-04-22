import { Component } from '@angular/core';
import { MainTableComponent } from './main-table/main-table.component';
import { Button } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [MainTableComponent, Button],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'TradingWebApp.UI';
  azureFunctionResponse: string = '';
  isDarkMode: boolean = true;

  constructor() {
    if (localStorage.getItem('dark-mode') === 'false') {
      this.toggleDarkMode();
    };
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('dark-mode', this.isDarkMode.toString());
    const element = document.querySelector('html');
    if (this.isDarkMode !== element?.classList.contains('dark-mode')) {
      element?.classList.toggle('dark-mode');
    }
  }
}
