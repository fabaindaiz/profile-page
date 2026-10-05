import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import about from '../../../assets/json/about.json';
import { About } from '../models/about';

/** Compiled into the bundle: typed against the model at build time, and never fetched. */
const ABOUT: About = about;

@Injectable({
  providedIn: 'root'
})
export class AboutService {

  getAbout(): Observable<About> {
    return of(ABOUT);
  }
}
