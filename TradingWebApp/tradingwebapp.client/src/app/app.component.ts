import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit {
  public azureFunctionResponse: string = '';
  public forecasts: WeatherForecast[] = [];
  public products: any[] = [
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
      rating: 5,
      orders: [
        {
          id: '1000-0',
          productCode: 'f230fh0g3',
          date: '2020-09-13',
          amount: 65,
          quantity: 1,
          customer: 'David James',
          status: 'PENDING'
        },
      ]
    },
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
      rating: 5,
      orders: [
        {
          id: '1000-0',
          productCode: 'f230fh0g3',
          date: '2020-09-13',
          amount: 65,
          quantity: 1,
          customer: 'David James',
          status: 'PENDING'
        },
      ]
    },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getForecasts();
    this.getFromAzureFunction();
  }

  getFromAzureFunction() {
    this.http.get<string>('https://azurefunctionstradingapp.azurewebsites.net/api/TradingHistory', { responseType: 'text' as 'json' }).subscribe(
      (result) => {
        console.log(result);
        this.azureFunctionResponse = result;
      },
      (error) => {
        console.error(error);
        this.azureFunctionResponse = error.message;
      }
    );
  }

  getForecasts() {
    this.http.get<WeatherForecast[]>('/weatherforecast').subscribe(
      (result) => {
        this.forecasts = result;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  title = 'tradingwebapp.client';
}
