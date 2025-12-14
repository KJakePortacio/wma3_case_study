// src/pages/Home.tsx (UPDATED with product navigation)
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonChip,
  IonIcon,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  useIonToast
} from '@ionic/react';
import { resolveImagePath } from '../utils/imageResolver';
import { starOutline, cartOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { databaseService } from '../database/db';
import'../theme/variables.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
  rating_avg: number;
  reviews_count: number;
}

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [present] = useIonToast();
  const history = useHistory();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const db = await databaseService.getConnection();
      const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
      
      if (result.values) {
        setProducts(result.values as Product[]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      present({
        message: 'Failed to load products',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadProducts();
    event.detail.complete();
  };

  const addToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent navigation to product details
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const db = await databaseService.getConnection();
      
      await db.run(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [currentUser.id, product.id, 1]
      );

      present({
        message: `${product.name} added to cart!`,
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      present({
        message: 'Failed to add to cart',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const viewProductDetails = (productId: number) => {
    // try if mawowork kapag ganto route path 
    history.push(`/tabs/product-details/${productId}`);
  };

  const categories = ['All', 'Sofas', 'Chairs', 'Tables', 'Beds', 'Sectionals', 'Ottomans'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>FURNITUNE</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search furniture..."
          />
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Categories */}
        <div style={styles.categoriesContainer}>
          {categories.map((category) => (
            <IonChip
              key={category}
              color={selectedCategory === category ? 'primary' : 'medium'}
              onClick={() => setSelectedCategory(category)}
              style={styles.categoryChip}
            >
              {category}
            </IonChip>
          ))}
        </div>

        {/* Products Grid */}
        <IonGrid>
          <IonRow>
            {filteredProducts.map((product) => (
              <IonCol size="6" key={product.id}>
                <IonCard 
                  style={styles.productCard}
                  onClick={() => viewProductDetails(product.id)}
                  button
                >
                  <IonImg
                    src={resolveImagePath(product.image_url) ?? product.image_url}
                    alt={product.name}
                    style={styles.productImage}
                  />
                  <IonCardHeader style={styles.cardHeader}>
                    <IonCardTitle style={styles.productName}>
                      {product.name}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent style={styles.cardContent}>
                    <IonText color="success" style={styles.price}>
                      ₱{product.price.toLocaleString()}
                    </IonText>
                    
                    <div style={styles.ratingContainer}>
                      <IonIcon icon={starOutline} color="warning" />
                      <IonText style={styles.rating}>
                        {product.rating_avg.toFixed(1)} ({product.reviews_count})
                      </IonText>
                    </div>

                    <IonButton
                      expand="block"
                      size="small"
                      onClick={(e) => addToCart(e, product)}
                      style={styles.addButton}
                    >
                      <IonIcon icon={cartOutline} slot="start" />
                      Add to Cart
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {filteredProducts.length === 0 && (
          <div style={styles.emptyState}>
            <IonText color="medium">
              <p>No products found</p>
            </IonText>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

const styles = {
  categoriesContainer: {
    display: 'flex',
    overflowX: 'auto' as const,
    padding: '12px',
    gap: '8px',
    whiteSpace: 'nowrap' as const
  },
  categoryChip: {
    cursor: 'pointer'
  },
  productCard: {
    margin: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer'
  },
  productImage: {
    height: '150px',
    objectFit: 'cover' as const
  },
  cardHeader: {
    padding: '12px 12px 0'
  },
  productName: {
    fontSize: '14px',
    fontWeight: 'bold'
  },
  cardContent: {
    padding: '8px 12px 12px'
  },
  price: {
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '8px'
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '8px'
  },
  rating: {
    fontSize: '12px',
    color: '#666'
  },
  addButton: {
    '--background': '#2c6e49',
    fontSize: '12px',
    height: '32px'
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    textAlign: 'center' as const
  }
};

export default Home;