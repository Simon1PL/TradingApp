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
  public azureFunctionResponse: string = '';

  constructor() {
  }

  toggleDarkMode() {
    const element = document.querySelector('html');
    element?.classList.toggle('dark-mode');
  }
}
