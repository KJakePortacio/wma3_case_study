// src/pages/Checkout.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonText,
  IonCard,
  IonCardContent,
  IonRadioGroup,
  IonRadio,
  IonIcon,
  useIonToast,
  useIonAlert,
  IonThumbnail,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { 
  cashOutline, 
  cardOutline, 
  phonePortraitOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { databaseService } from '../database/db';
import { resolveImagePath } from '../utils/imageResolver';
import ordersService from '../database/orders';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  selected_color?: string;
  selected_size?: string;
}

const Checkout: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'gcash' | 'card'>('cod');
  
  // Card payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // GCash fields
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashName, setGcashName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
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
          cart.selected_color,
          cart.selected_size,
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
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const shippingFee = 100;
  const total = calculateSubtotal() + shippingFee;

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\s/g, '');
    const formatted = numbers.match(/.{1,4}/g)?.join(' ') || numbers;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
    }
    return numbers;
  };

  const validatePaymentDetails = (): boolean => {
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        present({
          message: 'Please enter a valid 16-digit card number',
          duration: 2000,
          color: 'warning'
        });
        return false;
      }
      if (!cardName.trim()) {
        present({
          message: 'Please enter the cardholder name',
          duration: 2000,
          color: 'warning'
        });
        return false;
      }
      if (!expiryDate || expiryDate.length !== 5) {
        present({
          message: 'Please enter a valid expiry date (MM/YY)',
          duration: 2000,
          color: 'warning'
        });
        return false;
      }
      if (!cvv || cvv.length < 3) {
        present({
          message: 'Please enter a valid CVV',
          duration: 2000,
          color: 'warning'
        });
        return false;
      }
    } else if (paymentMethod === 'gcash') {
      if (!gcashNumber || gcashNumber.length !== 11) {
        present({
          message: 'Please enter a valid 11-digit GCash number',
          duration: 2000,
          color: 'warning'
        });
        return false;
      }
      if (!gcashName.trim()) {
        present({
          message: 'Please enter the account name',
          duration: 2000,
          color: 'warning'
        });
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      present({
        message: 'Please enter your shipping address',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    if (!contactNumber.trim()) {
      present({
        message: 'Please enter your contact number',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    if (!validatePaymentDetails()) {
      return;
    }

    // Show confirmation for online payments
    if (paymentMethod !== 'cod') {
      presentAlert({
        header: 'Confirm Payment',
        message: `You will be charged ₱${total.toLocaleString()}. Continue?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Confirm',
            handler: () => processOrder()
          }
        ]
      });
    } else {
      processOrder();
    }
  };

  const processOrder = async () => {
    setLoading(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      const addressData = JSON.stringify({
        address: shippingAddress,
        contact: contactNumber,
        notes: notes,
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'card' 
          ? { lastFourDigits: cardNumber.slice(-4) }
          : paymentMethod === 'gcash'
          ? { gcashNumber: gcashNumber }
          : {}
      });

      const orderId = await ordersService.createOrder(
        currentUser.id,
        addressData,
        paymentMethod === 'cod' ? '' : 'paid' // Payment proof for online payments
      );

      if (orderId) {
        // Create notification
        const db = await databaseService.getConnection();
        await db.run(
          `INSERT INTO notifications (user_id, title, body, type) 
           VALUES (?, ?, ?, ?)`,
          [
            currentUser.id,
            'Order Placed Successfully! 🎉',
            `Your order #${orderId} has been placed. Total: ₱${total.toLocaleString()}. Payment: ${getPaymentMethodLabel()}`,
            'order'
          ]
        );

        // Show success message based on payment method
        let successMessage = 'Order placed successfully!';
        if (paymentMethod === 'card') {
          successMessage = 'Payment processed! Your order has been confirmed.';
        } else if (paymentMethod === 'gcash') {
          successMessage = 'GCash payment received! Your order has been confirmed.';
        } else {
          successMessage = 'Order placed! Pay upon delivery.';
        }

        present({
          message: successMessage,
          duration: 3000,
          color: 'success'
        });

        // Navigate to order history
        history.replace('/tabs/orders');
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      present({
        message: 'Failed to place order. Please try again.',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'cod': return 'Cash on Delivery';
      case 'gcash': return 'GCash';
      case 'card': return 'Visa/Mastercard';
      default: return '';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/cart" />
          </IonButtons>
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Order Summary */}
        <IonCard>
          <IonCardContent>
            <h2 style={styles.sectionTitle}>Order Summary</h2>
            {cartItems.map((item) => (
              <div key={item.id} style={styles.orderItem}>
                <IonThumbnail style={styles.thumbnail}>
                  <img src={resolveImagePath(item.image_url) ?? item.image_url} alt={item.name} />
                </IonThumbnail>
                <div style={styles.itemDetails}>
                  <IonText style={styles.itemName}>{item.name}</IonText>
                  {item.selected_color && (
                    <IonText style={styles.itemOption}>Color: {item.selected_color}</IonText>
                  )}
                  {item.selected_size && (
                    <IonText style={styles.itemOption}>Size: {item.selected_size}</IonText>
                  )}
                  <IonText style={styles.itemQuantity}>Qty: {item.quantity}</IonText>
                </div>
                <IonText style={styles.itemPrice}>
                  ₱{(item.price * item.quantity).toLocaleString()}
                </IonText>
              </div>
            ))}

            <div style={styles.divider} />

            <div style={styles.totalRow}>
              <IonText>Subtotal</IonText>
              <IonText>₱{calculateSubtotal().toLocaleString()}</IonText>
            </div>
            <div style={styles.totalRow}>
              <IonText>Shipping Fee</IonText>
              <IonText>₱{shippingFee.toLocaleString()}</IonText>
            </div>
            <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
              <IonText style={styles.totalLabel}>Total</IonText>
              <IonText style={styles.totalAmount}>
                ₱{total.toLocaleString()}
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Shipping Information */}
        <IonCard>
          <IonCardContent>
            <h2 style={styles.sectionTitle}>Shipping Information</h2>
            
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Shipping Address *</IonLabel>
                <IonTextarea
                  value={shippingAddress}
                  onIonInput={(e) => setShippingAddress(e.detail.value!)}
                  placeholder="Enter your complete address"
                  rows={3}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Contact Number *</IonLabel>
                <IonInput
                  type="tel"
                  value={contactNumber}
                  onIonInput={(e) => setContactNumber(e.detail.value!)}
                  placeholder="09XX XXX XXXX"
                  maxlength={11}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Order Notes (Optional)</IonLabel>
                <IonTextarea
                  value={notes}
                  onIonInput={(e) => setNotes(e.detail.value!)}
                  placeholder="Any special instructions?"
                  rows={2}
                />
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Payment Method Selection */}
        <IonCard>
          <IonCardContent>
            <h2 style={styles.sectionTitle}>Payment Method</h2>
            
            <IonRadioGroup value={paymentMethod} onIonChange={(e) => setPaymentMethod(e.detail.value)}>
              {/* Cash on Delivery */}
              <IonItem button detail={false} style={styles.paymentOption}>
                <IonIcon icon={cashOutline} slot="start" color="success" style={styles.paymentIcon} />
                <IonLabel>
                  <h3 style={styles.paymentTitle}>Cash on Delivery (COD)</h3>
                  <p style={styles.paymentDesc}>Pay when you receive your order</p>
                </IonLabel>
                <IonRadio slot="end" value="cod" />
              </IonItem>

              {/* GCash */}
              <IonItem button detail={false} style={styles.paymentOption}>
                <IonIcon icon={phonePortraitOutline} slot="start" color="primary" style={styles.paymentIcon} />
                <IonLabel>
                  <h3 style={styles.paymentTitle}>GCash</h3>
                  <p style={styles.paymentDesc}>Pay instantly via GCash</p>
                </IonLabel>
                <IonRadio slot="end" value="gcash" />
              </IonItem>

              {/* Credit/Debit Card */}
              <IonItem button detail={false} style={styles.paymentOption}>
                <IonIcon icon={cardOutline} slot="start" color="warning" style={styles.paymentIcon} />
                <IonLabel>
                  <h3 style={styles.paymentTitle}>Credit/Debit Card</h3>
                  <p style={styles.paymentDesc}>Visa, Mastercard accepted</p>
                </IonLabel>
                <IonRadio slot="end" value="card" />
              </IonItem>
            </IonRadioGroup>
          </IonCardContent>
        </IonCard>

        {/* Payment Details Forms */}
        {paymentMethod === 'card' && (
          <IonCard>
            <IonCardContent>
              <div style={styles.securePayment}>
                <IonIcon icon={shieldCheckmarkOutline} color="success" />
                <IonText color="medium">
                  <small>Your payment information is secure and encrypted</small>
                </IonText>
              </div>

              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Card Number *</IonLabel>
                  <IonInput
                    value={cardNumber}
                    onIonInput={(e) => setCardNumber(formatCardNumber(e.detail.value!))}
                    placeholder="1234 5678 9012 3456"
                    type="tel"
                    maxlength={19}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Cardholder Name *</IonLabel>
                  <IonInput
                    value={cardName}
                    onIonInput={(e) => setCardName(e.detail.value!)}
                    placeholder="JOHN DOE"
                  />
                </IonItem>

                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <IonItem>
                        <IonLabel position="stacked">Expiry Date *</IonLabel>
                        <IonInput
                          value={expiryDate}
                          onIonInput={(e) => setExpiryDate(formatExpiryDate(e.detail.value!))}
                          placeholder="MM/YY"
                          type="tel"
                          maxlength={5}
                        />
                      </IonItem>
                    </IonCol>
                    <IonCol size="6">
                      <IonItem>
                        <IonLabel position="stacked">CVV *</IonLabel>
                        <IonInput
                          value={cvv}
                          onIonInput={(e) => setCvv(e.detail.value!.replace(/\D/g, ''))}
                          placeholder="123"
                          type="tel"
                          maxlength={4}
                        />
                      </IonItem>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {paymentMethod === 'gcash' && (
          <IonCard>
            <IonCardContent>
              <div style={styles.securePayment}>
                <IonIcon icon={shieldCheckmarkOutline} color="success" />
                <IonText color="medium">
                  <small>Secure GCash payment gateway</small>
                </IonText>
              </div>

              <IonList>
                <IonItem>
                  <IonLabel position="stacked">GCash Number *</IonLabel>
                  <IonInput
                    value={gcashNumber}
                    onIonInput={(e) => setGcashNumber(e.detail.value!.replace(/\D/g, ''))}
                    placeholder="09XXXXXXXXX"
                    type="tel"
                    maxlength={11}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Account Name *</IonLabel>
                  <IonInput
                    value={gcashName}
                    onIonInput={(e) => setGcashName(e.detail.value!)}
                    placeholder="Enter your registered name"
                  />
                </IonItem>
              </IonList>

              <IonText color="medium" style={styles.gcashNote}>
                <small>
                  You will be redirected to GCash to complete the payment
                </small>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {paymentMethod === 'cod' && (
          <IonCard>
            <IonCardContent>
              <IonText color="medium">
                <p style={styles.codNote}>
                  💰 <strong>Cash on Delivery</strong>
                </p>
                <p style={styles.codNote}>
                  Please prepare exact amount of <strong>₱{total.toLocaleString()}</strong> when receiving your order.
                </p>
                <p style={styles.codNote}>
                  Payment will be collected by our delivery partner upon delivery.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        <div style={{ height: '100px' }} />
      </IonContent>

      {/* Place Order Button */}
      <div style={styles.bottomBar}>
        <IonButton
          expand="block"
          onClick={handlePlaceOrder}
          disabled={loading}
          style={styles.placeOrderButton}
        >
          {loading ? 'Processing...' : `Place Order - ₱${total.toLocaleString()}`}
        </IonButton>
      </div>
    </IonPage>
  );
};

const styles = {
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 16px 0'
  },
  orderItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '12px'
  },
  thumbnail: {
    '--size': '60px',
    '--border-radius': '8px'
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'block'
  },
  itemOption: {
    fontSize: '12px',
    color: '#666',
    display: 'block'
  },
  itemQuantity: {
    fontSize: '12px',
    color: '#666',
    display: 'block'
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2c6e49'
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
  paymentOption: {
    '--padding-start': '16px',
    marginBottom: '8px'
  },
  paymentIcon: {
    fontSize: '28px',
    marginRight: '16px'
  },
  paymentTitle: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '4px'
  },
  paymentDesc: {
    fontSize: '13px',
    color: '#666'
  },
  securePayment: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f0f7f4',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  gcashNote: {
    display: 'block',
    padding: '12px',
    textAlign: 'center' as const,
    fontStyle: 'italic'
  },
  codNote: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '8px'
  },
  bottomBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e0e0e0',
    zIndex: 10
  },
  placeOrderButton: {
    '--background': '#2c6e49',
    height: '48px',
    fontWeight: 'bold'
  }
};

export default Checkout;