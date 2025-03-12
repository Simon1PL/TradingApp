import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

interface Column {
  field: string;
  header: string;
}

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [ButtonModule, TableModule, CommonModule, RatingModule, TagModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'TradingWebApp.UI';

  products: any[] = [
    {
      id: '1000',
      code: 'f230fh0g3',
      name: 'Bamboo Watch',
      description: 'Product Description',
      image: 'bamboo-watch.jpg',
      price: 65,
      category: 'Accessories',
      quantity: 24,
      inventoryStatus: 'INSTOCK',
      rating: 5
  },
  ];

  cols!: Column[];

  constructor() {}

  getSeverity(status: string) {
    switch (status) {
        case 'INSTOCK':
            return 'success';
        case 'LOWSTOCK':
            return 'warn';
        case 'OUTOFSTOCK':
            return 'danger';
        default:
          return 'danger';
    }
}

  toggleDarkMode() {
    const element = document.querySelector('html');
    element?.classList.toggle('dark-mode');
  }
}
