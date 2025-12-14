// src/pages/ProductDetails.tsx
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
  IonIcon,
  IonText,
  IonChip,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  useIonToast,
  IonSpinner
} from '@ionic/react';
import { cartOutline, starOutline, star, heartOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import productsService, { Product } from '../database/products';
import reviewsService, { Review } from '../database/reviews';
import { databaseService } from '../database/db';
import { resolveImagePath } from '../utils/imageResolver';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [present] = useIonToast();

  useEffect(() => {
    loadProductDetails();
  }, [id]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      const productData = await productsService.getProductById(parseInt(id));
      
      if (productData) {
        setProduct(productData);
        
        // Set default selections
        const colors = productsService.getProductColors(productData);
        const sizes = productsService.getProductSizes(productData);
        
        if (colors.length > 0) setSelectedColor(colors[0]);
        if (sizes.length > 0) setSelectedSize(sizes[0]);
        
        // Load reviews
        const reviewsData = await reviewsService.getProductReviews(productData.id);
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      present({
        message: 'Failed to load product details',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!product) return;

    const colors = productsService.getProductColors(product);
    const sizes = productsService.getProductSizes(product);

    if (colors.length > 0 && !selectedColor) {
      present({
        message: 'Please select a color',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    if (sizes.length > 0 && !selectedSize) {
      present({
        message: 'Please select a size',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const db = await databaseService.getConnection();
      
      await db.run(
        'INSERT INTO cart (user_id, product_id, quantity, selected_color, selected_size) VALUES (?, ?, ?, ?, ?)',
        [currentUser.id, product.id, quantity, selectedColor || null, selectedSize || null]
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <IonIcon
        key={i}
        icon={i < Math.floor(rating) ? star : starOutline}
        color={i < Math.floor(rating) ? 'warning' : 'medium'}
        style={{ fontSize: '16px' }}
      />
    ));
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

  if (!product) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonText>Product not found</IonText>
        </IonContent>
      </IonPage>
    );
  }

  const colors = productsService.getProductColors(product);
  const sizes = productsService.getProductSizes(product);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>{product.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Product Image */}
        <div style={styles.imageContainer}>
          <img src={resolveImagePath(product.image_url) ?? product.image_url} alt={product.name} style={styles.image} />
        </div>

        {/* Product Info */}
        <div style={styles.infoContainer}>
          <h1 style={styles.productName}>{product.name}</h1>
          
          <div style={styles.ratingRow}>
            {renderStars(product.rating_avg)}
            <IonText style={styles.ratingText}>
              {product.rating_avg.toFixed(1)} ({product.reviews_count} reviews)
            </IonText>
          </div>

          <IonText color="success" style={styles.price}>
            ₱{product.price.toLocaleString()}
          </IonText>

          <p style={styles.description}>{product.description}</p>

          <div style={styles.stockBadge}>
            <IonChip color={product.stock > 0 ? 'success' : 'danger'}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </IonChip>
          </div>

          {/* Color Selection */}
          {colors.length > 0 && (
            <div style={styles.optionSection}>
              <IonText style={styles.optionLabel}>
                <strong>Color:</strong> {selectedColor}
              </IonText>
              <div style={styles.chipContainer}>
                {colors.map((color) => (
                  <IonChip
                    key={color}
                    color={selectedColor === color ? 'primary' : 'medium'}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </IonChip>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div style={styles.optionSection}>
              <IonText style={styles.optionLabel}>
                <strong>Size:</strong> {selectedSize}
              </IonText>
              <div style={styles.chipContainer}>
                {sizes.map((size) => (
                  <IonChip
                    key={size}
                    color={selectedSize === size ? 'primary' : 'medium'}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </IonChip>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={styles.quantitySection}>
            <IonText style={styles.optionLabel}>
              <strong>Quantity:</strong>
            </IonText>
            <div style={styles.quantityControls}>
              <IonButton
                fill="outline"
                size="small"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </IonButton>
              <IonText style={styles.quantityText}>{quantity}</IonText>
              <IonButton
                fill="outline"
                size="small"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </IonButton>
            </div>
          </div>

          {/* Reviews Section */}
          <div style={styles.reviewsSection}>
            <h2 style={styles.reviewsTitle}>Customer Reviews</h2>
            
            {reviews.length === 0 ? (
              <IonText color="medium">
                <p>No reviews yet. Be the first to review!</p>
              </IonText>
            ) : (
              <IonList>
                {reviews.map((review) => (
                  <IonItem key={review.id} lines="full">
                    <IonAvatar slot="start">
                      <div style={styles.avatarPlaceholder}>
                        {review.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </IonAvatar>
                    <IonLabel>
                      <h3 style={styles.reviewUserName}>{review.user_name}</h3>
                      <div style={styles.reviewStars}>
                        {renderStars(review.rating)}
                      </div>
                      <p style={styles.reviewMessage}>{review.message}</p>
                      <p style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>
        </div>
      </IonContent>

      {/* Fixed Bottom Buttons */}
      <div style={styles.bottomBar}>
        <IonButton
          expand="block"
          onClick={addToCart}
          disabled={product.stock === 0}
          style={styles.addToCartButton}
        >
          <IonIcon icon={cartOutline} slot="start" />
          Add to Cart
        </IonButton>
      </div>
    </IonPage>
  );
};

const styles = {
  imageContainer: {
    width: '100%',
    height: '300px',
    backgroundColor: '#f5f5f5'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const
  },
  infoContainer: {
    padding: '20px',
    paddingBottom: '100px'
  },
  productName: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 12px 0'
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  ratingText: {
    fontSize: '14px',
    color: '#666'
  },
  price: {
    fontSize: '28px',
    fontWeight: 'bold',
    display: 'block',
    margin: '12px 0'
  },
  description: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    margin: '16px 0'
  },
  stockBadge: {
    marginBottom: '20px'
  },
  optionSection: {
    marginBottom: '20px'
  },
  optionLabel: {
    display: 'block',
    fontSize: '14px',
    marginBottom: '8px'
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px'
  },
  quantitySection: {
    marginBottom: '20px'
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '8px'
  },
  quantityText: {
    fontSize: '18px',
    fontWeight: 'bold',
    minWidth: '40px',
    textAlign: 'center' as const
  },
  reviewsSection: {
    marginTop: '32px',
    borderTop: '1px solid #e0e0e0',
    paddingTop: '20px'
  },
  reviewsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c6e49',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  reviewUserName: {
    fontWeight: 'bold',
    fontSize: '14px'
  },
  reviewStars: {
    marginTop: '4px',
    marginBottom: '8px'
  },
  reviewMessage: {
    fontSize: '14px',
    color: '#333',
    marginTop: '8px'
  },
  reviewDate: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  bottomBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e0e0e0'
  },
  addToCartButton: {
    '--background': '#2c6e49',
    height: '48px',
    fontWeight: 'bold'
  }
};

export default ProductDetails;