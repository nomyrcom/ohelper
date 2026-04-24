import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Expose auth for error handler
    (window as any).firebaseAuth = auth;
    
    let userUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous listener if any
      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
      }

      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          
          // Initial check to create user if doesn't exist
          const userSnap = await getDoc(userRef).catch(e => handleFirestoreError(e, 'get', `users/${firebaseUser.uid}`));
          
          if (!userSnap.exists()) {
             // New user, create profile with defaults
             const newUser: User = {
                _id: firebaseUser.uid,
                tokenIdentifier: firebaseUser.uid,
                name: firebaseUser.displayName || 'مستخدم جديد',
                email: firebaseUser.email || '',
                points: 100, // Starting bonus
                ratingSum: 0,
                ratingCount: 0,
                city: 'sanaa',
                isAdmin: false
              };
              
              if (firebaseUser.photoURL) {
                newUser.photoUrl = firebaseUser.photoURL;
              }
  
              await setDoc(userRef, newUser).catch(e => handleFirestoreError(e, 'create', `users/${firebaseUser.uid}`));
          }

          // Set up real-time listener
          userUnsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              setUser({ _id: doc.id, ...doc.data() } as User);
            } else {
              setUser(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Firestore user listener error:", error);
            handleFirestoreError(error, 'get', `users/${firebaseUser.uid}`);
            setLoading(false);
          });

        } catch (error) {
          console.error("Auth initialization error:", error);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user._id);
    const updatedUser = { ...user, ...data };
    await setDoc(userRef, updatedUser).catch(e => handleFirestoreError(e, 'update', `users/${user._id}`));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
