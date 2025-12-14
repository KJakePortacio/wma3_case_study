// src/pages/Cart.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonThumbnail,
  IonLabel,
  IonButton,
  IonIcon,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonFooter,
  useIonToast,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { addOutline, removeOutline, trashOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { databaseService } from '../database/db';
import { resolveImagePath } from '../utils/imageResolver';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [present] = useIonToast();
  const history = useHistory();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const db = await databaseService.getConnection();
      
      const result = await db.query(
        `SELECT 
          cart.id,
          cart.product_id,
          cart.quantity,
          products.name,
          products.price,
          products.image_url
         FROM cart
         JOIN products ON cart.product_id = products.id
         WHERE cart.user_id = ?`,
        [currentUser.id]
      );

      if (result.values) {
        setCartItems(result.values as CartItem[]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      present({
        message: 'Failed to load cart',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const db = await databaseService.getConnection();
      await db.run(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, cartId]
      );

      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      present({
        message: 'Failed to update quantity',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const removeItem = async (cartId: number) => {
    try {
      const db = await databaseService.getConnection();
      await db.run('DELETE FROM cart WHERE id = ?', [cartId]);

      present({
        message: 'Item removed from cart',
        duration: 2000,
        color: 'success'
      });

      await loadCart();
    } catch (error) {
      console.error('Error removing item:', error);
      present({
        message: 'Failed to remove item',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      present({
        message: 'Your cart is empty',
        duration: 2000,
        color: 'warning'
      });
      return;
    }
    // Navigate into the Tabs-scoped checkout route so the Tabs outlet remains mounted
    history.push('/tabs/checkout');
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadCart();
    event.detail.complete();
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Shopping Cart</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {cartItems.length === 0 ? (
          <div style={styles.emptyState}>
            <IonIcon
              icon={trashOutline}
              style={{ fontSize: '64px', color: '#ccc', marginBottom: '16px' }}
            />
            <IonText color="medium">
              <h2>Your cart is empty</h2>
              <p>Add some furniture to get started!</p>
            </IonText>
          </div>
        ) : (
          <IonList>
            {cartItems.map((item) => (
              <IonItemSliding key={item.id}>
                <IonItem>
                  <IonThumbnail slot="start">
                    <img src={resolveImagePath(item.image_url) ?? item.image_url} alt={item.name} />
                  </IonThumbnail>
                  
                  <IonLabel>
                    <h2 style={styles.itemName}>{item.name}</h2>
                    <p style={styles.itemPrice}>₱{item.price.toLocaleString()}</p>
                    
                    <div style={styles.quantityContainer}>
                      <IonButton
                        size="small"
                        fill="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <IonIcon icon={removeOutline} />
                      </IonButton>
                      
                      <IonText style={styles.quantity}>{item.quantity}</IonText>
                      
                      <IonButton
                        size="small"
                        fill="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <IonIcon icon={addOutline} />
                      </IonButton>
                    </div>
                  </IonLabel>

                  <IonText slot="end" style={styles.subtotal}>
                    ₱{(item.price * item.quantity).toLocaleString()}
                  </IonText>
                </IonItem>

                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => removeItem(item.id)}>
                    <IonIcon icon={trashOutline} />
                    Delete
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
      </IonContent>

      {cartItems.length > 0 && (
        <IonFooter>
          <IonToolbar style={styles.footer}>
            <div style={styles.footerContent}>
              <div style={styles.totalContainer}>
                <IonText style={styles.totalLabel}>Total:</IonText>
                <IonText style={styles.totalAmount}>
                  ₱{calculateTotal().toLocaleString()}
                </IonText>
              </div>
              
              <IonButton
                expand="block"
                onClick={handleCheckout}
                style={styles.checkoutButton}
              >
                Proceed to Checkout
              </IonButton>
            </div>
          </IonToolbar>
        </IonFooter>
      )}
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
  itemName: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '4px'
  },
  itemPrice: {
    color: '#2c6e49',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  quantityContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px'
  },
  quantity: {
    fontSize: '16px',
    fontWeight: 'bold',
    minWidth: '30px',
    textAlign: 'center' as const
  },
  subtotal: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c6e49'
  },
  footer: {
    '--background': '#ffffff',
    borderTop: '2px solid #e0e0e0'
  },
  footerContent: {
    padding: '16px'
  },
  totalContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  totalAmount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c6e49'
  },
  checkoutButton: {
    '--background': '#2c6e49',
    height: '48px',
    fontWeight: 'bold'
  }
};

export default Cart;