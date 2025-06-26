import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { trigger, state, style, transition, animate } from "@angular/animations";
import { NotificationsService, Notifications } from "../../services/notifications.service";

interface NotificationItem extends Notifications {
  id: string;
  timestamp: Date;
}

@Component({
  selector: "app-notification-popup",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./notification-popup.component.html",
  styleUrls: ["./notification-popup.component.css"],
  animations: [
    trigger("slideInOut", [
      state("in", style({ transform: "translateX(0)", opacity: 1 })),
      transition("void => *", [
        style({ transform: "translateX(100%)", opacity: 0 }),
        animate("300ms cubic-bezier(0.25, 0.8, 0.25, 1)"),
      ]),
      transition("* => void", [
        animate("200ms cubic-bezier(0.25, 0.8, 0.25, 1)", style({ transform: "translateX(100%)", opacity: 0 })),
      ]),
    ]),
  ],
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  activeNotifications: NotificationItem[] = [];
  private subscription: Subscription = new Subscription();
  private readonly AUTO_DISMISS_DELAY = 5000;

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    console.log("NotificationPopupComponent initialized and subscribing...");
    this.subscription.add(
      this.notificationsService.notifications$.subscribe((notification) => {
        console.log("Notification received inside component:", notification);
        if (notification) {
          this.addNotification(notification);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private addNotification(notification: Notifications): void {
    console.log("Adding notification to display list:", notification);
    const notificationItem: NotificationItem = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.activeNotifications.unshift(notificationItem);
    setTimeout(() => {
      this.dismissNotification(notificationItem.id);
    }, this.AUTO_DISMISS_DELAY);
    if (this.activeNotifications.length > 5) {
      this.activeNotifications = this.activeNotifications.slice(0, 5);
    }
  }

  dismissNotification(id: string): void {
    this.activeNotifications = this.activeNotifications.filter((n) => n.id !== id);
  }

  trackByNotificationId(index: number, notification: NotificationItem): string {
    return notification.id;
  }

  getNotificationTitle(type: string): string {
    switch (type) {
      case "FRIEND_REQUEST":
        return "Friend Request";
      case "MESSAGE":
        return "New Message";
      case "MENTION":
        return "You were mentioned";
      case "REPLY":
        return "New Reply";
      default:
        return "Notification";
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
