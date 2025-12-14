// src/pages/settings.tsx
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
  IonToggle,
  IonText,
  useIonToast
} from '@ionic/react';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [present] = useIonToast();

  useEffect(() => {
    setDarkMode(localStorage.getItem('pref_darkMode') === '1');
    setNotificationsEnabled(localStorage.getItem('pref_notifications') !== '0');
  }, []);

  const toggleDark = (val: boolean) => {
    setDarkMode(val);
    localStorage.setItem('pref_darkMode', val ? '1' : '0');
    present({ message: `Dark mode ${val ? 'enabled' : 'disabled'}`, duration: 1500 });
  };

  const toggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    localStorage.setItem('pref_notifications', val ? '1' : '0');
    present({ message: `Notifications ${val ? 'enabled' : 'disabled'}`, duration: 1500 });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle checked={darkMode} onIonChange={(e) => toggleDark(e.detail.checked)} />
          </IonItem>

          <IonItem>
            <IonLabel>Enable Notifications</IonLabel>
            <IonToggle checked={notificationsEnabled} onIonChange={(e) => toggleNotifications(e.detail.checked)} />
          </IonItem>
        </IonList>

        <div style={{ padding: 16 }}>
          <IonText color="medium">More settings coming soon</IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
