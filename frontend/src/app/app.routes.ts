import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { ServerPopupComponent } from './components/server-popup/server-popup.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { LoggedGuard } from './guards/logged.guard';
import { DmComponent } from './components/dm/dm.component';
import { FriendsGuard } from './guards/friends.guard';
import { RegisterComponent } from './components/register/register.component';
import { JoinServerComponent } from './components/join-server/join-server.component';
export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'chat', component: HomeComponent, canActivate: [AuthGuard]},
    {path: 'chat/:channel', component: ChatComponent, canActivate: [AuthGuard]},
    {path: 'create', component: ServerPopupComponent, canActivate: [AuthGuard]},
    {path: 'login', component: LoginComponent,canActivate:[LoggedGuard]},
    {path: "private/:recipient", component: DmComponent, canActivate: [AuthGuard,FriendsGuard]},
    {path: 'register', component: RegisterComponent, canActivate: [LoggedGuard]},
    {path: 'join/:code', component: JoinServerComponent, canActivate: [AuthGuard]},
    {path: 'invite/:code', component: JoinServerComponent, canActivate: [AuthGuard]}

];
