import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { AppComponent } from './app.component';

@NgModule({ declarations: [
        AppComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        TableModule,
        ButtonModule], providers: [
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
