import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  error = false;
  targetSite:string;

  constructor(  private router: Router) { }

  ngOnInit() {
  }

   static isValidURL(str) {
     if (!/^https*:\/\//.test(str)) {
       str = "http://" + str;
     }

     let a  = document.createElement('a');
    a.href = str;
    return (a.host && a.host != window.location.host);
  }

  crawl() {
    debugger;
   if(HomeComponent.isValidURL(this.targetSite)) {
     this.error = false;
     this.router.navigate(['/crawl', this.targetSite]);
   } else {
     this.error = true;
   }
  }
}
