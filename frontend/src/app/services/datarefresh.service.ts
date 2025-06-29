import { Injectable } from "@angular/core"
import { Subject } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class DataRefreshService {
  private refreshSubject = new Subject<string>()

  refresh$ = this.refreshSubject.asObservable()

  triggerRefresh(component?: string) {
    this.refreshSubject.next(component || "all")
  }
}