import { Injectable, signal, computed } from '@angular/core';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firestore-error-handler';

export interface UserProfile {
  username: string;
  avatarId: string;
  currentDay: number;
  week: number;
  streak: number;
  xp: number;
  completedDays: number[];
  lastCompletedDate: string | null;
  lastCompletedTimestamp: number | null;
  totalDaysCompleted: number;
  totalDojoWins: number;
  longestStreak: number;
}

const DEFAULT_PROFILE: UserProfile = {
  username: '',
  avatarId: '1',
  currentDay: 1,
  week: 1,
  streak: 0,
  xp: 0,
  completedDays: [],
  lastCompletedDate: null,
  lastCompletedTimestamp: null,
  totalDaysCompleted: 0,
  totalDojoWins: 0,
  longestStreak: 0
};

@Injectable({
  providedIn: 'root'
})
export class WarriorService {
  private user = signal<User | null>(null);
  private profile = signal<UserProfile | null>(null);
  private loading = signal<boolean>(true);
  private error = signal<string | null>(null);

  currentUser = computed(() => this.user());
  currentProfile = computed(() => this.profile());
  isLoading = computed(() => this.loading());
  currentError = computed(() => this.error());

  constructor() {
    this.initAuth();
    this.testConnection();
  }

  private async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }

  private initAuth() {
    onAuthStateChanged(auth, async (user) => {
      this.user.set(user);
      if (user) {
        this.subscribeToProfile(user.uid);
      } else {
        this.profile.set(null);
        this.loading.set(false);
      }
    });
  }

  private subscribeToProfile(userId: string) {
    const path = `profiles/${userId}`;
    const profileRef = doc(db, 'profiles', userId);
    onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        this.profile.set(snapshot.data() as UserProfile);
      } else {
        this.profile.set(null);
      }
      this.loading.set(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    });
  }

  async loginAsGuest() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      const error = err as Error;
      this.error.set(error.message);
      this.loading.set(false);
    }
  }

  async loginWithGoogle() {
    this.loading.set(true);
    this.error.set(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const error = err as Error;
      this.error.set(error.message);
      this.loading.set(false);
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  async updateProfile(data: Partial<UserProfile>) {
    const user = this.user();
    if (!user) return;

    const path = `profiles/${user.uid}`;
    const profileRef = doc(db, 'profiles', user.uid);
    try {
      const snapshot = await getDoc(profileRef);
      if (!snapshot.exists()) {
        await setDoc(profileRef, { ...DEFAULT_PROFILE, ...data });
      } else {
        await updateDoc(profileRef, data);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async resetData() {
    const user = this.user();
    if (!user) return;
    const profileRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(profileRef, { ...DEFAULT_PROFILE });
    } catch (err) {
      console.error('Reset data failed:', err);
    }
  }

  async generatePairingToken(): Promise<string> {
    const user = this.user();
    if (!user) throw new Error('Not logged in');
    
    const pairingId = Math.random().toString(36).substring(2, 15);
    const pairingRef = doc(db, 'pairings', pairingId);
    
    await setDoc(pairingRef, {
      uid: user.uid,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    return pairingId;
  }

  async loginWithPairingToken(token: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const pairingRef = doc(db, 'pairings', token);
      const snapshot = await getDoc(pairingRef);
      
      if (!snapshot.exists()) {
        throw new Error('Invalid or expired QR code');
      }
      
      const data = snapshot.data();
      if (data && data['expiresAt'] < Date.now()) {
        throw new Error('QR code expired');
      }

      await this.loginAsGuest();
      this.error.set('QR Sync: In a production app, this would use Firebase Custom Tokens to link devices.');
      
    } catch (err) {
      const error = err as Error;
      this.error.set(error.message);
      this.loading.set(false);
    }
  }
}
