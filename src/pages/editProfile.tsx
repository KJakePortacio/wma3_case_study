// src/pages/editProfile.tsx
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
    IonInput,
    IonButton,
    useIonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { databaseService } from '../database/db';

const EditProfile: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [present] = useIonToast();
    const history = useHistory();

    useEffect(() => {
        const current = localStorage.getItem('currentUser');
        if (current) {
            const u = JSON.parse(current);
            setName(u.name || '');
            setEmail(u.email || '');
            setPhone(u.phone || '');
            setProfileImage(u.profile_image || null);
            setPreview(u.profile_image || null);
        }
    }, []);

    const saveProfile = async () => {
        if (!name.trim() || !email.trim()) {
            present({ message: 'Name and email are required', duration: 2000, color: 'warning' });
            return;
        }

        try {
            const current = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const db = await databaseService.getConnection();
            await db.run('UPDATE users SET name = ?, email = ?, phone = ?, profile_image = ? WHERE id = ?', [name, email, phone || null, profileImage || null, current.id]);

            // Update localStorage
            const updated = { ...current, name, email, phone, profile_image: profileImage || null };
            localStorage.setItem('currentUser', JSON.stringify(updated));

            present({ message: 'Profile updated', duration: 2000, color: 'success' });
            history.replace('/tabs/profile');
        } catch (err) {
            console.error('Failed to update profile', err);
            present({ message: 'Failed to update profile', duration: 2000, color: 'danger' });
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // store base64 data URL
            setPreview(result);
            setProfileImage(result);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setPreview(null);
        setProfileImage(null);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit Profile</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonList>
                    <IonItem>
                        <IonLabel position="stacked">Profile Photo</IonLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden', background: '#f0f0f0' }}>
                                {preview ? (
                                    <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>No photo</div>
                                )}
                            </div>
                            <div className="profile-upload">
                                <label htmlFor="profile-file" className="visually-hidden">
                                    Upload profile photo
                                </label>

                                <input
                                    id="profile-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    className="profile-file-input"
                                />

                                <IonButton
                                    onClick={removePhoto}
                                    color="medium"
                                    fill="outline"
                                >
                                    Remove
                                </IonButton>
                            </div>

                        </div>
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Name</IonLabel>
                        <IonInput value={name} onIonInput={(e: any) => setName(e.detail.value)} />
                    </IonItem>

                    <IonItem>
                        <IonLabel position="stacked">Email</IonLabel>
                        <IonInput value={email} onIonInput={(e: any) => setEmail(e.detail.value)} />
                    </IonItem>

                    <IonItem>
                        <IonLabel position="stacked">Phone</IonLabel>
                        <IonInput value={phone} onIonInput={(e: any) => setPhone(e.detail.value)} />
                    </IonItem>
                </IonList>

                <div style={{ padding: 16 }}>
                    <IonButton expand="block" onClick={saveProfile}>Save</IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default EditProfile;
