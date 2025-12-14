// src/App.tsx
import React, { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonLoading,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Import pages and components */
import Login from './pages/login';
import Tabs from './components/tab';

/* Import database service */
import databaseService from './database/db';

setupIonicReact();

const App: React.FC = () => {
  const [dbReady, setDbReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await databaseService.initializeDatabase();
      
      // Check if user is already logged in
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        setIsAuthenticated(true);
      }
      
      setDbReady(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      alert('Failed to initialize database. Please restart the app.');
    }
  };

  if (!dbReady) {
    return (
      <IonApp>
        <IonLoading
          isOpen={true}
          message="Initializing Furnitune..."
        />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={Login} />
          <Route path="/tabs" component={Tabs} />
          <Route exact path="/">
            {isAuthenticated ? (
              <Redirect to="/tabs/home" />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;