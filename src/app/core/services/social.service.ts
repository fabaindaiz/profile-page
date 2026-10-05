import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import social from '../../../content/social.json';
import { Social } from '../models/social';

/** Compiled into the bundle: typed against the model at build time, and never fetched. */
const SOCIAL: Social[] = social;

@Injectable({
  providedIn: 'root'
})
export class SocialService {

  getSocial(): Observable<Social[]> {
    return of(SOCIAL);
  }
}
