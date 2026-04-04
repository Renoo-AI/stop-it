import { Injectable, signal, computed } from '@angular/core';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';

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

  currentUser = computed(() => this.user());
  currentProfile = computed(() => this.profile());
  isLoading = computed(() => this.loading());

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.user.set(user);
      if (user) {
        this.subscribeToProfile(user.uid);
      } else {
        this.profile.set(null);
        this.loading.set(false);
      }
    });
  }

  async login() {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  private subscribeToProfile(userId: string) {
    const docRef = doc(db, 'users', userId);
    onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        this.profile.set(snapshot.data() as UserProfile);
      } else {
        this.profile.set(null);
      }
      this.loading.set(false);
    }, (error) => {
      console.error('Profile subscription error:', error);
      this.loading.set(false);
    });
  }

  async updateProfile(data: Partial<UserProfile>) {
    const userId = this.user()?.uid;
    if (!userId) return;

    const docRef = doc(db, 'users', userId);
    const currentData = this.profile();
    
    if (!currentData) {
      // Create new profile
      const newProfile = { ...DEFAULT_PROFILE, ...data };
      await setDoc(docRef, newProfile);
    } else {
      // Update existing profile
      await updateDoc(docRef, data);
    }
  }

  async resetData() {
    const userId = this.user()?.uid;
    if (!userId) return;
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, DEFAULT_PROFILE);
  }
}
