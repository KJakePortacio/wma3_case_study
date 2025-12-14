// src/pages/Profile.tsx
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
  IonButton,
  IonAvatar,
  IonCard,
  IonCardContent,
  useIonAlert,
  useIonToast
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  callOutline,
  cartOutline,
  heartOutline,
  settingsOutline,
  logOutOutline,
  starOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { databaseService } from '../database/db';
import { resolveImagePath } from '../utils/imageResolver';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  profile_image?: string | null;
}

interface ProfileStats {
  totalOrders: number;
  totalReviews: number;
  cartItems: number;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalOrders: 0,
    totalReviews: 0,
    cartItems: 0
  });
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  const history = useHistory();

  useEffect(() => {
    loadUserProfile();
    loadStats();
  }, []);

  const loadUserProfile = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
  };

  const loadStats = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const db = await databaseService.getConnection();

      // Get total orders
      const ordersResult = await db.query(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
        [currentUser.id]
      );

      // Get total reviews
      const reviewsResult = await db.query(
        'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
        [currentUser.id]
      );

      // Get cart items count
      const cartResult = await db.query(
        'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
        [currentUser.id]
      );

      setStats({
        totalOrders: ordersResult.values?.[0]?.count || 0,
        totalReviews: reviewsResult.values?.[0]?.count || 0,
        cartItems: cartResult.values?.[0]?.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    presentAlert({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          role: 'confirm',
          handler: () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('rememberMe');
            
            present({
              message: 'Logged out successfully',
              duration: 2000,
              color: 'success'
            });

            history.replace('/login');
          }
        }
      ]
    });
  };

  if (!user) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonText>Loading profile...</IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Profile Header */}
        <IonCard style={styles.profileCard}>
          <IonCardContent style={styles.profileContent}>
              <IonAvatar style={styles.avatar}>
                {user.profile_image ? (
                    <img src={resolveImagePath(user.profile_image) ?? user.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                  <div style={styles.avatarPlaceholder}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </IonAvatar>
            
            <div style={styles.profileInfo}>
              <h2 style={styles.userName}>{user.name}</h2>
              <p style={styles.userEmail}>{user.email}</p>
              {user.phone && (
                <p style={styles.userPhone}>📱 {user.phone}</p>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Stats Cards */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <IonIcon icon={cartOutline} style={styles.statIcon} />
            <div style={styles.statNumber}>{stats.totalOrders}</div>
            <div style={styles.statLabel}>Orders</div>
          </div>

          <div style={styles.statCard}>
            <IonIcon icon={starOutline} style={styles.statIcon} />
            <div style={styles.statNumber}>{stats.totalReviews}</div>
            <div style={styles.statLabel}>Reviews</div>
          </div>

          <div style={styles.statCard}>
            <IonIcon icon={heartOutline} style={styles.statIcon} />
            <div style={styles.statNumber}>{stats.cartItems}</div>
            <div style={styles.statLabel}>In Cart</div>
          </div>
        </div>

        {/* Menu Options */}
        <IonList style={styles.menuList}>
          <IonItem button detail onClick={() => history.push('/tabs/edit-profile')}>
            <IonIcon icon={personOutline} slot="start" color="primary" />
            <IonLabel>Edit Profile</IonLabel>
          </IonItem>

          <IonItem button detail onClick={() => history.push('/tabs/orders')}>
            <IonIcon icon={cartOutline} slot="start" color="primary" />
            <IonLabel>My Orders</IonLabel>
          </IonItem>

          <IonItem button detail onClick={() => history.push('/tabs/wishlist')}>
            <IonIcon icon={heartOutline} slot="start" color="primary" />
            <IonLabel>Wishlist</IonLabel>
          </IonItem>

          <IonItem button detail onClick={() => history.push('/tabs/settings')}>
            <IonIcon icon={settingsOutline} slot="start" color="primary" />
            <IonLabel>Settings</IonLabel>
          </IonItem>
        </IonList>

        {/* Logout Button */}
        <div style={styles.logoutContainer}>
          <IonButton
            expand="block"
            color="danger"
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>

        {/* App Info */}
        <div style={styles.appInfo}>
          <IonText color="medium">
            <p style={styles.appVersion}>Furnitune v1.0.0</p>
            <p style={styles.appCopyright}>© 2024 All Rights Reserved</p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

const styles = {
  profileCard: {
    margin: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  profileContent: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px'
  },
  avatar: {
    width: '80px',
    height: '80px',
    marginRight: '20px'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c6e49',
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: 'bold'
  },
  profileInfo: {
    flex: 1
  },
  userName: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333'
  },
  userEmail: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    color: '#666'
  },
  userPhone: {
    margin: 0,
    fontSize: '14px',
    color: '#666'
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px',
    gap: '12px'
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statIcon: {
    fontSize: '32px',
    color: '#2c6e49',
    marginBottom: '8px'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666'
  },
  menuList: {
    margin: '16px 16px 0'
  },
  logoutContainer: {
    padding: '16px',
    marginTop: '24px'
  },
  logoutButton: {
    '--background': '#d32f2f',
    height: '48px',
    fontWeight: 'bold'
  },
  appInfo: {
    textAlign: 'center' as const,
    padding: '20px',
    marginTop: '16px'
  },
  appVersion: {
    margin: '0 0 4px 0',
    fontSize: '12px'
  },
  appCopyright: {
    margin: 0,
    fontSize: '12px'
  }
};

export default Profile;