import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private apiLink = environment.apiUrl+'/channel'; 
  
  constructor(private http: HttpClient) {}

  createChannel(name: string, vanityId: string, photo?: File): Observable<any> {
    return this.http.post(`${this.apiLink}/create`, { name, vanityId, photo });
  }

  createInviteLink(vanityId:string,maxUses:number,expriesInMinutes:number): Observable<any> {
    return this.http.post(`${this.apiLink}/create-invite`, { vanityId, maxUses, expriesInMinutes });
  }

  joinChannel(vanityId: string): Observable<any> {
    return this.http.post(`${this.apiLink}/join/${vanityId}`, {});
  }
}
