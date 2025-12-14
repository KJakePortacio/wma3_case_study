// src/pages/OrderHistory.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonText,
  IonBadge,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  useIonToast,
  useIonAlert
} from '@ionic/react';
import { eyeOutline, closeCircleOutline, timeOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import ordersService, { OrderWithItems } from '../database/orders';
import { useHistory } from 'react-router-dom';
import { resolveImagePath } from '../utils/imageResolver';

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const history = useHistory();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const ordersData = await ordersService.getUserOrders(currentUser.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      present({
        message: 'Failed to load orders',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadOrders();
    event.detail.complete();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleCancelOrder = (orderId: number) => {
    presentAlert({
      header: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          role: 'destructive',
          handler: async () => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const success = await ordersService.cancelOrder(orderId, currentUser.id);
            
            if (success) {
              present({
                message: 'Order cancelled successfully',
                duration: 2000,
                color: 'success'
              });
              await loadOrders();
            } else {
              present({
                message: 'Cannot cancel this order',
                duration: 2000,
                color: 'danger'
              });
            }
          }
        }
      ]
    });
  };

  const viewOrderDetails = (orderId: number) => {
    history.push(`/tabs/order-details/${orderId}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Order History</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {orders.length === 0 ? (
          <div style={styles.emptyState}>
            <IonIcon
              icon={timeOutline}
              style={{ fontSize: '64px', color: '#ccc', marginBottom: '16px' }}
            />
            <IonText color="medium">
              <h2>No orders yet</h2>
              <p>Your order history will appear here</p>
            </IonText>
          </div>
        ) : (
          <div style={styles.ordersContainer}>
            {orders.map((order) => (
              <IonCard key={order.id} style={styles.orderCard}>
                <IonCardContent>
                  {/* Order Header */}
                  <div style={styles.orderHeader}>
                    <div>
                      <IonText style={styles.orderId}>Order #{order.id}</IonText>
                      <IonText style={styles.orderDate}>
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </IonText>
                    </div>
                    <IonBadge color={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </IonBadge>
                  </div>

                  {/* Order Items */}
                  <div style={styles.itemsSection}>
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item.id} style={styles.orderItem}>
                        <img
                          src={resolveImagePath(item.image_url) ?? item.image_url ?? 'https://via.placeholder.com/50'}
                          alt={item.product_name}
                          style={styles.itemImage}
                        />
                        <div style={styles.itemInfo}>
                          <IonText style={styles.itemName}>{item.product_name}</IonText>
                          <IonText style={styles.itemDetails}>
                            Qty: {item.quantity}
                            {item.selected_color && ` • ${item.selected_color}`}
                            {item.selected_size && ` • ${item.selected_size}`}
                          </IonText>
                        </div>
                        <IonText style={styles.itemPrice}>
                          ₱{(item.price * item.quantity).toLocaleString()}
                        </IonText>
                      </div>
                    ))}
                    
                    {order.items.length > 2 && (
                      <IonText color="medium" style={styles.moreItems}>
                        +{order.items.length - 2} more item(s)
                      </IonText>
                    )}
                  </div>

                  {/* Order Total */}
                  <div style={styles.totalSection}>
                    <IonText style={styles.totalLabel}>Total:</IonText>
                    <IonText style={styles.totalAmount}>
                      ₱{order.total.toLocaleString()}
                    </IonText>
                  </div>

                  {/* Action Buttons */}
                  <div style={styles.actionButtons}>
                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => viewOrderDetails(order.id)}
                    >
                      <IonIcon icon={eyeOutline} slot="start" />
                      View Details
                    </IonButton>

                    {order.status === 'processing' && (
                      <IonButton
                        fill="outline"
                        size="small"
                        color="danger"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <IonIcon icon={closeCircleOutline} slot="start" />
                        Cancel
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

const styles = {
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: '20px',
    textAlign: 'center' as const
  },
  ordersContainer: {
    padding: '16px'
  },
  orderCard: {
    marginBottom: '16px'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  orderId: {
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '4px'
  },
  orderDate: {
    fontSize: '12px',
    color: '#666',
    display: 'block'
  },
  itemsSection: {
    marginBottom: '16px'
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  itemImage: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    objectFit: 'cover' as const
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '4px'
  },
  itemDetails: {
    fontSize: '12px',
    color: '#666',
    display: 'block'
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2c6e49'
  },
  moreItems: {
    fontSize: '12px',
    display: 'block',
    marginTop: '8px',
    fontStyle: 'italic'
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '16px'
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  totalAmount: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c6e49'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between'
  }
};

export default OrderHistory;