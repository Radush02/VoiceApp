import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { ServerPopupComponent } from './components/server-popup/server-popup.component';

export const routes: Routes = [
    {path: '', redirectTo: '/chat', pathMatch: 'full'},
    {path: 'chat', component: ChatComponent},
    {path: 'create', component: ServerPopupComponent}  
];
