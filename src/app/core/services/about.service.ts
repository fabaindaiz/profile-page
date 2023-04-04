import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { About, Stack } from '../models/about';


@Injectable({
  providedIn: 'root'
})
export class AboutService {

  constructor(private http: HttpClient) { }

  getAbout() {
    return this.http.get<About>('assets/json/about.json');
  }

  getStack() {
    return this.http.get<Stack[]>('assets/json/stack.json');
  }
}