import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import S3 from 'aws-sdk/clients/s3';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiLink = 'http://localhost:8080/api/messages';
  constructor(private http:HttpClient) { }

  fetchMessages(channel: string, limit: number=50): Observable<any> {
    return this.http.get(`${this.apiLink}/${channel}`,{withCredentials:true});
  }

  uploadImage(channel: string, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('file',image);
    return this.http.post(`${this.apiLink}/upload/${channel}`, formData, {withCredentials:true});
  }

}
