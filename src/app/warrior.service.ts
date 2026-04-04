import { Injectable, signal, computed } from '@angular/core';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User } from '@supabase/supabase-js';

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
  isConfigured = isSupabaseConfigured;

  constructor() {
    if (this.isConfigured) {
      this.initAuth();
    } else {
      this.loading.set(false);
      this.error.set('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your secrets in the Settings menu.');
    }
  }

  private async initAuth() {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      this.handleUser(session?.user ?? null);

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        this.handleUser(session?.user ?? null);
      });
    } catch (err) {
      console.error('Auth initialization failed:', err);
      this.error.set('Failed to connect to Supabase. Please check your network connection and credentials.');
      this.loading.set(false);
    }
  }

  private async handleUser(user: User | null) {
    this.user.set(user);
    if (user) {
      await this.fetchProfile(user.id);
      this.subscribeToProfile(user.id);
    } else {
      this.profile.set(null);
      this.loading.set(false);
    }
  }

  async login() {
    if (!this.isConfigured) {
      this.error.set('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your secrets.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      // Supabase anonymous sign in (if enabled in dashboard)
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (err: unknown) {
      console.error('Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('fetch')) {
        this.error.set('Network error: Could not reach Supabase. Please check your internet connection and ensure your Supabase URL is correct.');
      } else {
        this.error.set(`Login failed: ${errorMessage}`);
      }
      this.loading.set(false);
    }
  }

  private async fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching profile:', error);
    }

    if (data) {
      this.profile.set(this.mapFromDb(data));
    } else {
      this.profile.set(null);
    }
    this.loading.set(false);
  }

  private subscribeToProfile(userId: string) {
    supabase
      .channel('public:profiles')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${userId}` 
      }, payload => {
        if (payload.new) {
          this.profile.set(this.mapFromDb(payload.new));
        }
      })
      .subscribe();
  }

  async updateProfile(data: Partial<UserProfile>) {
    const user = this.user();
    if (!user) return;

    const dbData = this.mapToDb(data);
    const currentProfile = this.profile();

    if (!currentProfile) {
      // Insert new profile
      const newProfile = { ...this.mapToDb(DEFAULT_PROFILE), ...dbData, id: user.id };
      const { error } = await supabase.from('profiles').insert(newProfile);
      if (error) console.error('Error creating profile:', error);
    } else {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', user.id);
      if (error) console.error('Error updating profile:', error);
    }
  }

  async resetData() {
    const user = this.user();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(this.mapToDb(DEFAULT_PROFILE))
      .eq('id', user.id);
    if (error) console.error('Error resetting profile:', error);
  }

  private mapToDb(profile: Partial<UserProfile>) {
    const mapping: Record<string, unknown> = {};
    if (profile.username !== undefined) mapping['username'] = profile.username;
    if (profile.avatarId !== undefined) mapping['avatar_id'] = profile.avatarId;
    if (profile.currentDay !== undefined) mapping['current_day'] = profile.currentDay;
    if (profile.week !== undefined) mapping['week'] = profile.week;
    if (profile.streak !== undefined) mapping['streak'] = profile.streak;
    if (profile.xp !== undefined) mapping['xp'] = profile.xp;
    if (profile.completedDays !== undefined) mapping['completed_days'] = profile.completedDays;
    if (profile.lastCompletedDate !== undefined) mapping['last_completed_date'] = profile.lastCompletedDate;
    if (profile.lastCompletedTimestamp !== undefined) mapping['last_completed_timestamp'] = profile.lastCompletedTimestamp;
    if (profile.totalDaysCompleted !== undefined) mapping['total_days_completed'] = profile.totalDaysCompleted;
    if (profile.totalDojoWins !== undefined) mapping['total_dojo_wins'] = profile.totalDojoWins;
    if (profile.longestStreak !== undefined) mapping['longest_streak'] = profile.longestStreak;
    return mapping;
  }

  private mapFromDb(dbProfile: Record<string, unknown>): UserProfile {
    return {
      username: dbProfile['username'] as string,
      avatarId: dbProfile['avatar_id'] as string,
      currentDay: dbProfile['current_day'] as number,
      week: dbProfile['week'] as number,
      streak: dbProfile['streak'] as number,
      xp: dbProfile['xp'] as number,
      completedDays: (dbProfile['completed_days'] as number[]) || [],
      lastCompletedDate: dbProfile['last_completed_date'] as string,
      lastCompletedTimestamp: dbProfile['last_completed_timestamp'] as number,
      totalDaysCompleted: dbProfile['total_days_completed'] as number,
      totalDojoWins: dbProfile['total_dojo_wins'] as number,
      longestStreak: dbProfile['longest_streak'] as number
    };
  }
}
