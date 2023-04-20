import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Stack } from '../models/stack';


@Injectable({
  providedIn: 'root'
})
export class StackService {

  constructor(private http: HttpClient) { }

  getStack() {
    return this.http.get<Stack[]>('assets/json/stack.json');
  }
}