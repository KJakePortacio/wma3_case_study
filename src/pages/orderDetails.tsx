// src/pages/OrderDetails.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonCard,
  IonCardContent,
  IonText,
  IonBadge,
  IonButton,
  IonIcon,
  IonSpinner,
  useIonToast,
  useIonModal
} from '@ionic/react';
import { starOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import ordersService, { OrderWithItems } from '../database/orders';
import reviewsService from '../database/reviews';
import ReviewModal from '../components/ReviewModal';
import { resolveImagePath } from '../utils/imageResolver';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [present] = useIonToast();

  const [presentReview, dismissReview] = useIonModal(ReviewModal, {
    productId: selectedProductId,
    onDismiss: () => {
      dismissReview();
      setSelectedProductId(null);
      loadOrderDetails(); // Reload to refresh review status
    }
  });

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const orderData = await ordersService.getOrderById(parseInt(id), currentUser.id);
      
      if (orderData) {
        setOrder(orderData);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      present({
        message: 'Failed to load order details',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProduct = (productId: number) => {
    setSelectedProductId(productId);
    presentReview({
      cssClass: 'review-modal',
      onWillDismiss: (ev) => {
        setSelectedProductId(null);
        if (ev.detail.role !== 'backdrop') {
          loadOrderDetails(); // Reload to refresh review status
        }
      }
    });
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  if (!order) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonText>Order not found</IonText>
        </IonContent>
      </IonPage>
    );
  }

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

  const shippingInfo = order.shipping_address ? JSON.parse(order.shipping_address) : null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/orders" />
          </IonButtons>
          <IonTitle>Order Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Order Info */}
        <IonCard>
          <IonCardContent>
            <div style={styles.orderHeader}>
              <div>
                <IonText style={styles.orderId}>Order #{order.id}</IonText>
                <IonText style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </IonText>
              </div>
              <IonBadge color={getStatusColor(order.status)} style={styles.statusBadge}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </IonBadge>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Order Items */}
        <IonCard>
          <IonCardContent>
            <h2 style={styles.sectionTitle}>Order Items</h2>
            {order.items.map((item) => (
              <div key={item.id} style={styles.orderItem}>
                <img
                  src={resolveImagePath(item.image_url) ?? item.image_url ?? 'https://via.placeholder.com/80'}
                  alt={item.product_name}
                  style={styles.itemImage}
                />
                <div style={styles.itemInfo}>
                  <IonText style={styles.itemName}>{item.product_name}</IonText>
                  {item.selected_color && (
                    <IonText style={styles.itemOption}>Color: {item.selected_color}</IonText>
                  )}
                  {item.selected_size && (
                    <IonText style={styles.itemOption}>Size: {item.selected_size}</IonText>
                  )}
                  <IonText style={styles.itemQuantity}>Quantity: {item.quantity}</IonText>
                  <IonText style={styles.itemPrice}>
                    ₱{item.price.toLocaleString()} × {item.quantity}
                  </IonText>

                  {order.status === 'completed' && (
                    <IonButton
                      fill="outline"
                      size="small"
                      style={styles.reviewButton}
                      onClick={() => handleReviewProduct(item.product_id)}
                    >
                      <IonIcon icon={starOutline} slot="start" />
                      Write Review
                    </IonButton>
                  )}
                </div>
                <IonText style={styles.itemTotal}>
                  ₱{(item.price * item.quantity).toLocaleString()}
                </IonText>
              </div>
            ))}

            <div style={styles.divider} />

            <div style={styles.totalRow}>
              <IonText>Subtotal</IonText>
              <IonText>₱{(order.total - 100).toLocaleString()}</IonText>
                      </div>
                      <div style={styles.totalRow}>
                          <IonText>Shipping Fee</IonText>
                          <IonText>₱100</IonText>
                      </div>
                      <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
                          <IonText style={styles.totalLabel}>Total</IonText>
                          <IonText style={styles.totalAmount}>
                              ₱{order.total.toLocaleString()}
                          </IonText>
                      </div>
                  </IonCardContent>
              </IonCard>

        {/* Shipping Information */}
        {shippingInfo && (
          <IonCard>
            <IonCardContent>
              <h2 style={styles.sectionTitle}>Shipping Information</h2>
              <div style={styles.shippingInfo}>
                <div style={styles.infoRow}>
                  <IonText style={styles.infoLabel}>Address:</IonText>
                  <IonText style={styles.infoValue}>{shippingInfo.address}</IonText>
                </div>
                <div style={styles.infoRow}>
                  <IonText style={styles.infoLabel}>Contact:</IonText>
                  <IonText style={styles.infoValue}>{shippingInfo.contact}</IonText>
                </div>
                {shippingInfo.notes && (
                  <div style={styles.infoRow}>
                    <IonText style={styles.infoLabel}>Notes:</IonText>
                    <IonText style={styles.infoValue}>{shippingInfo.notes}</IonText>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Payment Information */}
        <IonCard>
          <IonCardContent>
            <h2 style={styles.sectionTitle}>Payment Information</h2>
            <div style={styles.paymentInfo}>
              <IonText>Payment Method: Cash on Delivery (COD)</IonText>
              <IonText style={styles.paymentNote}>
                Please prepare ₱{order.total.toLocaleString()} when receiving your order
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

const styles = {
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  orderId: {
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '4px'
  },
  orderDate: {
    fontSize: '14px',
    color: '#666',
    display: 'block'
  },
  statusBadge: {
    fontSize: '14px',
    padding: '8px 12px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 16px 0'
  },
  orderItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0'
  },
  itemImage: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover' as const
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '6px'
  },
  itemOption: {
    fontSize: '13px',
    color: '#666',
    display: 'block',
    marginBottom: '2px'
  },
  itemQuantity: {
    fontSize: '13px',
    color: '#666',
    display: 'block',
    marginBottom: '4px'
  },
  itemPrice: {
    fontSize: '13px',
    color: '#666',
    display: 'block',
    marginBottom: '8px'
  },
  itemTotal: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c6e49'
  },
  reviewButton: {
    marginTop: '8px',
    '--border-color': '#2c6e49',
    '--color': '#2c6e49'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '16px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  grandTotal: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '2px solid #e0e0e0'
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c6e49'
  },
  shippingInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  infoRow: {
    display: 'flex',
    gap: '8px'
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '80px'
  },
  infoValue: {
    fontSize: '14px',
    color: '#666',
    flex: 1
  },
  paymentInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  paymentNote: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    display: 'block'
  }
};

export default OrderDetails;