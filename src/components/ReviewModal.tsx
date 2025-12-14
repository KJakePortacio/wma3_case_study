// src/components/ReviewModal.tsx
import React, { useState, useEffect } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonTextarea,
  IonIcon,
  IonText,
  useIonToast
} from '@ionic/react';
import { star, starOutline, close } from 'ionicons/icons';
import reviewsService from '../database/reviews';

interface ReviewModalProps {
  productId: number;
  onDismiss: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ productId, onDismiss }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [present] = useIonToast();

  useEffect(() => {
    loadExistingReview();
  }, [productId]);

  const loadExistingReview = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const review = await reviewsService.getUserProductReview(currentUser.id, productId);
      
      if (review) {
        setExistingReview(review);
        setRating(review.rating);
        setMessage(review.message || '');
      }
    } catch (error) {
      console.error('Error loading existing review:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      present({
        message: 'Please select a rating',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      const success = await reviewsService.createReview(
        currentUser.id,
        productId,
        rating,
        message.trim() || undefined
      );

      if (success) {
        present({
          message: existingReview ? 'Review updated!' : 'Review submitted!',
          duration: 2000,
          color: 'success'
        });
        onDismiss();
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      present({
        message: 'Failed to submit review. Please try again.',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((num) => {
          const isActive = num <= (hoverRating || rating);
          return (
            <div
              key={num}
              style={styles.starWrapper}
              onMouseEnter={() => setHoverRating(num)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(num)}
            >
              <IonIcon
                icon={isActive ? star : starOutline}
                style={{
                  ...styles.starIcon,
                  color: isActive ? '#FFD700' : '#ccc'
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const getRatingLabel = () => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[rating];
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{existingReview ? 'Edit Review' : 'Write a Review'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={styles.container}>
          {/* Rating Section */}
          <div style={styles.ratingSection}>
            <IonText style={styles.sectionLabel}>
              <h2>Rate this product</h2>
            </IonText>
            
            {renderStars()}

            {rating > 0 && (
              <IonText style={styles.ratingLabel}>
                {getRatingLabel()}
              </IonText>
            )}
          </div>

          {/* Review Message */}
          <div style={styles.messageSection}>
            <IonText style={styles.sectionLabel}>
              <h3>Share your experience (Optional)</h3>
            </IonText>
            
            <IonTextarea
              value={message}
              onIonInput={(e) => setMessage(e.detail.value!)}
              placeholder="Tell us what you think about this product..."
              rows={6}
              style={styles.textarea}
            />
          </div>

          {/* Submit Button */}
          <IonButton
            expand="block"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            style={styles.submitButton}
          >
            {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </IonButton>

          {existingReview && (
            <IonText color="medium" style={styles.editNote}>
              <small>You've already reviewed this product. Submitting will update your review.</small>
            </IonText>
          )}
        </div>
      </IonContent>
    </>
  );
};

const styles = {
  container: {
    padding: '20px 0'
  },
  ratingSection: {
    textAlign: 'center' as const,
    marginBottom: '32px'
  },
  sectionLabel: {
    marginBottom: '16px'
  },
  starsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  starWrapper: {
    cursor: 'pointer',
    transition: 'transform 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  starIcon: {
    fontSize: '48px',
    transition: 'color 0.2s'
  },
  ratingLabel: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c6e49',
    display: 'block',
    marginTop: '8px'
  },
  messageSection: {
    marginBottom: '24px'
  },
  textarea: {
    '--background': '#f5f5f5',
    '--padding-start': '16px',
    '--padding-end': '16px',
    '--padding-top': '12px',
    '--padding-bottom': '12px',
    borderRadius: '8px',
    marginTop: '8px'
  },
  submitButton: {
    '--background': '#2c6e49',
    height: '48px',
    fontWeight: 'bold',
    marginTop: '16px'
  },
  editNote: {
    display: 'block',
    textAlign: 'center' as const,
    marginTop: '12px',
    fontStyle: 'italic'
  }
};

export default ReviewModal;