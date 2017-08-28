import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AppComponent} from './app.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { CrawlerComponent } from './crawler/crawler.component';
import {environment} from "../environments/environment";
import { HomeComponent } from './home/home.component';

import { FormsModule } from '@angular/forms';
import { CrawlerService } from './crawler-service/crawler.service';
import {Http, HttpModule} from "@angular/http";
import {D3Service} from "d3-ng2-service";


const appRoutes: Routes = [
  {
    path: 'crawl/:hostname',
    component: CrawlerComponent,
    data: {title: 'Results'}
  },
  {
    path: '',
    component: HomeComponent,
    data: {title: ''}
  },
  {path: '**', component: PageNotFoundComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    CrawlerComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    RouterModule.forRoot(
      appRoutes,
      {enableTracing: environment.production} // <-- debugging purposes only
    ),
    FormsModule
  ],
  providers: [CrawlerService, D3Service],
  bootstrap: [AppComponent]
})
export class AppModule {
}
