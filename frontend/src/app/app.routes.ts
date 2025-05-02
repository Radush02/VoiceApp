import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { ServerPopupComponent } from './components/server-popup/server-popup.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { LoggedGuard } from './guards/logged.guard';
import { DmComponent } from './components/dm/dm.component';
import { FriendsGuard } from './guards/friends.guard';
export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'chat', component: HomeComponent, canActivate: [AuthGuard]},
    {path: 'chat/:channel', component: ChatComponent, canActivate: [AuthGuard]},
    {path: 'create', component: ServerPopupComponent, canActivate: [AuthGuard]},
    {path: 'login', component: LoginComponent,canActivate:[LoggedGuard]},
    {path: "private/:recipient", component: DmComponent, canActivate: [AuthGuard,FriendsGuard]},
];
