import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { ServerPopupComponent } from './components/server-popup/server-popup.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { LoggedGuard } from './guards/logged.guard';
export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'chat', component: ChatComponent, canActivate: [AuthGuard]},
    {path: 'create', component: ServerPopupComponent,   canActivate: [AuthGuard]},
    {path: 'login', component: LoginComponent,canActivate: [LoggedGuard]}
];
