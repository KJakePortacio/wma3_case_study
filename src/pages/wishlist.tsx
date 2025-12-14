// src/pages/wishlist.tsx
import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonText,
  IonButton,
  useIonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import productsService from '../database/products';
import wishlistService from '../database/wishlist';
import { Product } from '../database/products';
import { resolveImagePath } from '../utils/imageResolver';

const Wishlist: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [present] = useIonToast();
  const history = useHistory();

  const loadWishlist = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        setItems([]);
        return;
      }

      const products = await wishlistService.getWishlistProducts(currentUser.id);
      setItems(products || []);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const removeItem = async (id: number) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        present({ message: 'Please login to manage wishlist', duration: 1500, color: 'warning' });
        return;
      }

      const ok = await wishlistService.removeFromWishlist(currentUser.id, id);
      if (ok) {
        present({ message: 'Removed from wishlist', duration: 1500, color: 'success' });
        loadWishlist();
      } else {
        present({ message: 'Failed to remove', duration: 1500, color: 'danger' });
      }
    } catch (err) {
      console.error('Failed to remove wishlist item', err);
      present({ message: 'Failed to remove', duration: 1500, color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Wishlist</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {items.length === 0 ? (
          <div style={{ padding: 16 }}>
            <IonText color="medium">Your wishlist is empty.</IonText>
          </div>
        ) : (
          <IonList>
            {items.map((p) => (
              <IonItem key={p.id} button onClick={() => history.push(`/tabs/product-details/${p.id}`)}>
                <IonThumbnail slot="start">
                  <img src={resolveImagePath(p.image_url) ?? p.image_url} alt={p.name} />
                </IonThumbnail>
                <IonLabel>
                  <h3>{p.name}</h3>
                  <p>₱{p.price.toLocaleString()}</p>
                </IonLabel>
                <IonButton slot="end" color="danger" fill="clear" onClick={(e) => { e.stopPropagation(); removeItem(p.id); }}>Remove</IonButton>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Wishlist;
