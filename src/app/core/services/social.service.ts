import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Social } from '../models/social';

@Injectable({
  providedIn: 'root'
})
export class SocialService {

  constructor(private http: HttpClient) { }

  getSocial() {
    return this.http.get<Social[]>('assets/json/social.json');
  }
}