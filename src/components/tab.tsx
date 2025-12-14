// src/components/Tabs.tsx (UPDATED with Orders tab)
import React, { useEffect, useState } from 'react';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge
} from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';
import { 
  homeOutline, 
  cartOutline, 
  receiptOutline,
  notificationsOutline, 
  personOutline 
} from 'ionicons/icons';

// Import pages
import Home from '../pages/home';
import Cart from '../pages/cart';
import OrderHistory from '../pages/orderHistory';
import Notifications from '../pages/notifications';
import Profile from '../pages/profile';
import ProductDetails from '../pages/productDetails';
import Checkout from '../pages/checkouts';
import OrderDetails from '../pages/orderDetails';
import EditProfile from '../pages/editProfile';
import Wishlist from '../pages/wishlist';
import Settings from '../pages/settings';

const Tabs: React.FC = () => {
  // Dynamic notification and cart counts
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!currentUser || !currentUser.id) {
          if (mounted) {
            setNotificationCount(0);
            setCartCount(0);
          }
          return;
        }

        // Lazy-import database to avoid circular issues
        const { default: databaseService } = await import('../database/db');
        const db = await databaseService.getConnection();

        const notifRes = await db.query(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
          [currentUser.id]
        );

        const cartRes = await db.query(
          'SELECT SUM(quantity) as sum FROM cart WHERE user_id = ?',
          [currentUser.id]
        );

        const n = notifRes.values && notifRes.values[0] ? (notifRes.values[0].count || 0) : 0;
        const c = cartRes.values && cartRes.values[0] ? (cartRes.values[0].sum || 0) : 0;

        if (mounted) {
          setNotificationCount(Number(n));
          setCartCount(Number(c));
        }
      } catch (err) {
        console.error('Failed to load tab counts', err);
      }
    };

    loadCounts();

    // Refresh counts when returning to the tab (every 10s as a simple fallback)
    const interval = setInterval(loadCounts, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <IonTabs>
      <IonRouterOutlet>
        {/* Main Tab Pages */}
        <Route exact path="/tabs/home" component={Home} />
        <Route exact path="/tabs/cart" component={Cart} />
        <Route exact path="/tabs/orders" component={OrderHistory} />
        <Route exact path="/tabs/notifications" component={Notifications} />
        <Route exact path="/tabs/profile" component={Profile} />
        
        {/* Detail Pages (scoped under /tabs so Tabs remains mounted) */}
        <Route exact path="/tabs/product-details/:id" component={ProductDetails} />
        <Route exact path="/tabs/checkout" component={Checkout} />
        <Route exact path="/tabs/order-details/:id" component={OrderDetails} />
        <Route exact path="/tabs/edit-profile" component={EditProfile} />
        <Route exact path="/tabs/wishlist" component={Wishlist} />
        <Route exact path="/tabs/settings" component={Settings} />
        
        {/* Default redirect */}
        <Route exact path="/tabs">
          <Redirect to="/tabs/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" style={styles.tabBar}>
        <IonTabButton tab="home" href="/tabs/home" style={styles.tabButton}>
          <IonIcon icon={homeOutline} style={styles.icon} />
          <IonLabel style={styles.label}>Home</IonLabel>
        </IonTabButton>

        <IonTabButton tab="cart" href="/tabs/cart" style={styles.tabButton}>
          <IonIcon icon={cartOutline} style={styles.icon} />
          <IonLabel style={styles.label}>Cart</IonLabel>
          {cartCount > 0 && (
            <IonBadge color="danger" style={styles.badge}>
              {cartCount}
            </IonBadge>
          )}
        </IonTabButton>

        <IonTabButton tab="orders" href="/tabs/orders" style={styles.tabButton}>
          <IonIcon icon={receiptOutline} style={styles.icon} />
          <IonLabel style={styles.label}>Orders</IonLabel>
        </IonTabButton>

        <IonTabButton tab="notifications" href="/tabs/notifications" style={styles.tabButton}>
          <IonIcon icon={notificationsOutline} style={styles.icon} />
          <IonLabel style={styles.label}>Notifications</IonLabel>
          {notificationCount > 0 && (
            <IonBadge color="danger" style={styles.badge}>
              {notificationCount}
            </IonBadge>
          )}
        </IonTabButton>

        <IonTabButton tab="profile" href="/tabs/profile" style={styles.tabButton}>
          <IonIcon icon={personOutline} style={styles.icon} />
          <IonLabel style={styles.label}>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

const styles = {
  tabBar: {
    '--background': '#ffffff',
    borderTop: '1px solid #e0e0e0',
    height: '60px'
  },
  tabButton: {
    '--color': '#666666',
    '--color-selected': '#2c6e49',
    position: 'relative' as const
  },
  icon: {
    fontSize: '24px'
  },
  label: {
    fontSize: '11px',
    marginTop: '4px'
  },
  badge: {
    position: 'absolute' as const,
    top: '4px',
    right: '20px',
    fontSize: '10px',
    minWidth: '18px',
    height: '18px'
  }
};

export default Tabs;