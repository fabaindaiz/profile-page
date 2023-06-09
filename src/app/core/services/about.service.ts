import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { About } from '../models/about';


@Injectable({
  providedIn: 'root'
})
export class AboutService {

  constructor(private http: HttpClient) { }

  getAbout() {
    return this.http.get<About>('assets/json/about.json');
  }
}