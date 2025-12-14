// src/pages/Notifications.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonBadge,
  useIonToast,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import {
  notificationsOutline,
  trashOutline,
  checkmarkCircleOutline,
  giftOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { databaseService } from '../database/db';

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: number;
  created_at: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [present] = useIonToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [currentUser.id]
      );

      if (result.values) {
        setNotifications(result.values as Notification[]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      present({
        message: 'Failed to load notifications',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const db = await databaseService.getConnection();
      await db.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [notificationId]
      );

      await loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const db = await databaseService.getConnection();
      await db.run('DELETE FROM notifications WHERE id = ?', [notificationId]);

      present({
        message: 'Notification deleted',
        duration: 2000,
        color: 'success'
      });

      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      present({
        message: 'Failed to delete notification',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const db = await databaseService.getConnection();
      
      await db.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [currentUser.id]
      );

      present({
        message: 'All notifications marked as read',
        duration: 2000,
        color: 'success'
      });

      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadNotifications();
    event.detail.complete();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return checkmarkCircleOutline;
      case 'promotion':
      case 'sale':
        return giftOutline;
      case 'order':
        return notificationsOutline;
      default:
        return alertCircleOutline;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'success';
      case 'promotion':
      case 'sale':
        return 'warning';
      case 'order':
        return 'primary';
      default:
        return 'medium';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>
            Notifications
            {unreadCount > 0 && (
              <IonBadge color="danger" style={styles.headerBadge}>
                {unreadCount}
              </IonBadge>
            )}
          </IonTitle>
          {unreadCount > 0 && (
            <IonText
              slot="end"
              onClick={markAllAsRead}
              style={styles.markAllRead}
            >
              Mark all read
            </IonText>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {notifications.length === 0 ? (
          <div style={styles.emptyState}>
            <IonIcon
              icon={notificationsOutline}
              style={{ fontSize: '64px', color: '#ccc', marginBottom: '16px' }}
            />
            <IonText color="medium">
              <h2>No notifications</h2>
              <p>You're all caught up!</p>
            </IonText>
          </div>
        ) : (
          <IonList>
            {notifications.map((notification) => (
              <IonItemSliding key={notification.id}>
                <IonItem
                  onClick={() => {
                    if (notification.is_read === 0) {
                      markAsRead(notification.id);
                    }
                  }}
                  style={{
                    '--background': notification.is_read === 0 ? '#f0f7f4' : '#ffffff'
                  }}
                >
                  <IonIcon
                    slot="start"
                    icon={getNotificationIcon(notification.type)}
                    color={getNotificationColor(notification.type)}
                    style={styles.notificationIcon}
                  />
                  
                  <IonLabel>
                    <h2 style={styles.notificationTitle}>
                      {notification.title}
                      {notification.is_read === 0 && (
                        <span style={styles.unreadDot}>●</span>
                      )}
                    </h2>
                    <p style={styles.notificationBody}>{notification.body}</p>
                    <p style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </p>
                  </IonLabel>
                </IonItem>

                <IonItemOptions side="end">
                  <IonItemOption
                    color="danger"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <IonIcon icon={trashOutline} />
                    Delete
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

const styles = {
  headerBadge: {
    marginLeft: '8px',
    fontSize: '12px'
  },
  markAllRead: {
    fontSize: '14px',
    color: '#ffffff',
    padding: '0 16px',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: '20px',
    textAlign: 'center' as const
  },
  notificationIcon: {
    fontSize: '28px',
    marginRight: '8px'
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  unreadDot: {
    color: '#2c6e49',
    fontSize: '12px'
  },
  notificationBody: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px'
  },
  notificationTime: {
    fontSize: '12px',
    color: '#999'
  }
};

export default Notifications;