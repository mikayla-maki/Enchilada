import { Injectable } from '@angular/core';
import {Http} from "@angular/http";

@Injectable()
export class CrawlerService {

  constructor(private http: Http) { }

  crawlSite(site:String) {
    return this.http.get("/api/crawl?site=" +site);
  }
}
