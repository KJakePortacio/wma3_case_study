// src/pages/Login.tsx
import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonSpinner,
  IonCheckbox,
  IonItem,
  IonLabel,
  useIonToast
} from '@ionic/react';
import { eyeOutline, eyeOffOutline, logInOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import usersService from '../database/users';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [present] = useIonToast();
  const history = useHistory();

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      present({
        message: 'Please enter both email and password',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      const result = await usersService.login(email, password);

      if (result.success && result.user) {
        // Save user to localStorage
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        present({
          message: '✅ Login successful!',
          duration: 2000,
          color: 'success'
        });

        // Navigate to home page
        history.push('/tabs/home');
      } else {
        present({
          message: result.message || 'Login failed',
          duration: 2000,
          color: 'danger'
        });
      }
    } catch (error) {
      present({
        message: 'An error occurred. Please try again.',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={styles.container}>
          {/* Logo/Brand */}
          <div style={styles.header}>
            <h1 style={styles.brandTitle}>FURNITUNE</h1>
            <p style={styles.brandSubtitle}>Welcome Back!</p>
          </div>

          {/* Login Form */}
          <div style={styles.form}>
            {/* Email Input */}
            <div style={styles.inputGroup}>
              <IonLabel>Email</IonLabel>
              <IonInput
                type="email"
                placeholder="Enter your email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div style={styles.inputGroup}>
              <IonLabel>Password</IonLabel>
              <div style={styles.passwordWrapper}>
                <IonInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  style={styles.input}
                  disabled={loading}
                />
                <IonIcon
                  icon={showPassword ? eyeOffOutline : eyeOutline}
                  style={styles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={styles.optionsRow}>
              <IonItem lines="none" style={styles.checkboxItem}>
                <IonCheckbox
                  checked={rememberMe}
                  onIonChange={(e) => setRememberMe(e.detail.checked)}
                  slot="start"
                />
                <IonLabel>Remember Me</IonLabel>
              </IonItem>

              <IonText color="primary" style={styles.forgotPassword}>
                Forgot Password?
              </IonText>
            </div>

            {/* Login Button */}
            <IonButton
              expand="block"
              onClick={handleLogin}
              disabled={loading}
              style={styles.loginButton}
            >
              {loading ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon icon={logInOutline} slot="start" />
                  LOG IN
                </>
              )}
            </IonButton>

            {/* Quick Login Info */}
            <div style={styles.demoAccounts}>
              <IonText color="medium" style={styles.demoTitle}>
                <small>Demo Accounts:</small>
              </IonText>
              <div style={styles.demoRow}>
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={() => {
                    setEmail('jake@gmail.com');
                    setPassword('12345');
                  }}
                  style={styles.demoButton}
                >
                  Jake
                </IonButton>
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={() => {
                    setEmail('enrico@gmail.com');
                    setPassword('12345');
                  }}
                  style={styles.demoButton}
                >
                  Enrico
                </IonButton>
              </div>
            </div>

            {/* Sign Up Link */}
            <div style={styles.signupSection}>
              <IonText color="medium">Don't have an account? </IonText>
              <IonText color="primary" style={styles.signupLink}>
                Sign Up
              </IonText>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    padding: '20px'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px'
  },
  brandTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c6e49',
    marginBottom: '8px',
    letterSpacing: '2px'
  },
  brandSubtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0
  },
  form: {
    width: '100%',
    maxWidth: '400px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  input: {
    '--background': '#f5f5f5',
    '--padding-start': '16px',
    '--padding-end': '16px',
    '--border-radius': '8px',
    marginTop: '8px'
  },
  passwordWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center'
  },
  eyeIcon: {
    position: 'absolute' as const,
    right: '16px',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666'
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  checkboxItem: {
    '--padding-start': '0',
    '--inner-padding-end': '0'
  },
  forgotPassword: {
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  loginButton: {
    '--background': '#2c6e49',
    '--border-radius': '8px',
    height: '48px',
    fontWeight: 'bold',
    marginBottom: '24px'
  },
  demoAccounts: {
    textAlign: 'center' as const,
    marginBottom: '24px',
    padding: '16px',
    background: '#f0f7f4',
    borderRadius: '8px'
  },
  demoTitle: {
    display: 'block',
    marginBottom: '8px'
  },
  demoRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  demoButton: {
    '--border-color': '#2c6e49',
    '--color': '#2c6e49'
  },
  signupSection: {
    textAlign: 'center' as const,
    marginTop: '16px'
  },
  signupLink: {
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
};

export default Login;