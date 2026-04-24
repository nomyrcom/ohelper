import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch or create user profile in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef).catch(e => handleFirestoreError(e, 'get', `users/${firebaseUser.uid}`));

          if (userSnap.exists()) {
            const userData = { _id: userSnap.id, ...userSnap.data() } as User;
            setUser(userData);
          } else {
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
            setUser(newUser);
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
