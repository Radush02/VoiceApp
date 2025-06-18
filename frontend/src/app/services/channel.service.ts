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
  const formData = new FormData();
  formData.append('name', name);
  formData.append('vanityId', vanityId);
  if (photo) {
    formData.append('photo', photo);
  }

  return this.http.post(`${this.apiLink}/create`, formData,{withCredentials:true});
}

  createInviteLink(vanityId:string,maxUses:number,expriesInMinutes:number): Observable<any> {
    return this.http.post(`${this.apiLink}/create-invite`, { vanityId, maxUses, expriesInMinutes },{withCredentials:true});
  }

  joinChannel(vanityId: string): Observable<any> {
    return this.http.post(`${this.apiLink}/join/${vanityId}`, {withCredentials:true});
  }

  getMembers(vanityId: string): Observable<any> {
    return this.http.get(`${this.apiLink}/getUsers/${vanityId}`,{withCredentials:true});
  }
}
