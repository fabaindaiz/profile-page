import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import stack from '../../../content/stack.json';
import { Stack } from '../models/stack';

/** Compiled into the bundle: typed against the model at build time, and never fetched. */
const STACK: Stack[] = stack;

@Injectable({
  providedIn: 'root'
})
export class StackService {

  getStack(): Observable<Stack[]> {
    return of(STACK);
  }
}
