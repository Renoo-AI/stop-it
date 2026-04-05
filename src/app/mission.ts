import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WarriorService } from './warrior.service';
import { TranslationService } from './translation.service';
import { ThemeService } from './theme.service';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';

export interface Todo {
  id: string;
  name: string;
  is_completed: boolean;
  user_id: string;
  inserted_at: Timestamp;
}

@Component({
  selector: 'app-mission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mission.html'
})
export class MissionComponent implements OnInit, OnDestroy {
  private warriorService = inject(WarriorService);
  translationService = inject(TranslationService);
  themeService = inject(ThemeService);
  
  profile = this.warriorService.currentProfile;
  todos = signal<Todo[]>([]);
  newTodoName = signal('');
  
  isDojoActive = signal(false);
  dojoTimeLeft = signal(30);
  dojoInterval: ReturnType<typeof setInterval> | null = null;
  dojoInstruction = signal('breathe_in');
  
  showSettings = signal(false);
  showPairingQr = signal(false);
  pairingQrDataUrl = signal<string | null>(null);
  
  private todosUnsubscribe: Unsubscribe | null = null;

  ngOnInit() {
    this.subscribeToTodos();
  }

  ngOnDestroy() {
    if (this.todosUnsubscribe) this.todosUnsubscribe();
    if (this.dojoInterval) clearInterval(this.dojoInterval);
  }

  private subscribeToTodos() {
    const user = this.warriorService.currentUser();
    if (!user) return;

    const q = query(
      collection(db, 'todos'),
      where('user_id', '==', user.uid),
      orderBy('inserted_at', 'desc')
    );

    this.todosUnsubscribe = onSnapshot(q, (snapshot) => {
      const items: Todo[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Todo);
      });
      this.todos.set(items);
    });
  }

  async addTodo() {
    const name = this.newTodoName().trim();
    const user = this.warriorService.currentUser();
    if (!name || !user) return;

    try {
      await addDoc(collection(db, 'todos'), {
        name,
        is_completed: false,
        user_id: user.uid,
        inserted_at: Timestamp.now()
      });
      this.newTodoName.set('');
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  }

  async toggleTodo(todo: Todo) {
    try {
      const todoRef = doc(db, 'todos', todo.id);
      await updateDoc(todoRef, { is_completed: !todo.is_completed });
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  }

  async deleteTodo(id: string) {
    try {
      const todoRef = doc(db, 'todos', id);
      await deleteDoc(todoRef);
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  }

  async generatePairingQr() {
    try {
      const token = await this.warriorService.generatePairingToken();
      const url = await QRCode.toDataURL(token);
      this.pairingQrDataUrl.set(url);
      this.showPairingQr.set(true);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  }

  ranks = [
    { threshold: 0, name: "Novice", icon: "🌱" },
    { threshold: 100, name: "Rookie", icon: "🥉" },
    { threshold: 200, name: "Warrior", icon: "⚔️" },
    { threshold: 300, name: "Elite", icon: "🦅" },
    { threshold: 500, name: "Master", icon: "🧘" },
    { threshold: 1000, name: "Grandmaster", icon: "👑" },
    { threshold: 2000, name: "Legend", icon: "⭐" },
    { threshold: 5000, name: "Immortal", icon: "🔥" }
  ];

  avatarUrls: Record<string, string> = {
    "1": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    "2": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    "3": "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    "4": "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
  };

  progressPercent = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    return Math.round((p.completedDays.length / 7) * 100);
  });

  currentRank = computed(() => {
    const xp = this.profile()?.xp || 0;
    return this.ranks.slice().reverse().find(r => xp >= r.threshold) || this.ranks[0];
  });

  nextRank = computed(() => {
    const xp = this.profile()?.xp || 0;
    return this.ranks.find(r => xp < r.threshold) || null;
  });

  rankProgress = computed(() => {
    const xp = this.profile()?.xp || 0;
    const current = this.currentRank();
    const next = this.nextRank();
    if (!next) return 100;
    return ((xp - current.threshold) / (next.threshold - current.threshold)) * 100;
  });

  canCompleteToday = computed(() => {
    const p = this.profile();
    if (!p || !p.lastCompletedDate) return true;
    return p.lastCompletedDate !== new Date().toDateString();
  });

  async completeDay(day: number) {
    const p = this.profile();
    if (!p || !this.canCompleteToday() || day !== p.currentDay) return;

    const today = new Date().toDateString();
    const newCompletedDays = [...p.completedDays, day];
    const newXp = p.xp + 10;
    const newStreak = p.streak + 1;
    let newCurrentDay = p.currentDay;
    let newWeek = p.week;

    if (day === 7) {
      newWeek += 1;
      await this.warriorService.updateProfile({
        completedDays: [],
        currentDay: 1,
        week: newWeek,
        xp: newXp + 50,
        streak: newStreak,
        lastCompletedDate: today,
        lastCompletedTimestamp: Date.now(),
        totalDaysCompleted: p.totalDaysCompleted + 1,
        longestStreak: Math.max(p.longestStreak, newStreak)
      });
    } else {
      newCurrentDay += 1;
      await this.warriorService.updateProfile({
        completedDays: newCompletedDays,
        currentDay: newCurrentDay,
        xp: newXp,
        streak: newStreak,
        lastCompletedDate: today,
        lastCompletedTimestamp: Date.now(),
        totalDaysCompleted: p.totalDaysCompleted + 1,
        longestStreak: Math.max(p.longestStreak, newStreak)
      });
    }
  }

  enterDojo() {
    this.isDojoActive.set(true);
    this.dojoTimeLeft.set(30);
    this.dojoInstruction.set('breathe_in');
    
    this.dojoInterval = setInterval(() => {
      this.dojoTimeLeft.update(t => t - 1);
      
      const elapsed = 30 - this.dojoTimeLeft();
      if (elapsed % 8 === 0) this.dojoInstruction.set('breathe_in');
      else if (elapsed % 8 === 4) this.dojoInstruction.set('breathe_out');

      if (this.dojoTimeLeft() <= 0) {
        this.finishDojo(true);
      }
    }, 1000);
  }

  async finishDojo(success: boolean) {
    if (this.dojoInterval) clearInterval(this.dojoInterval);
    if (success) {
      const p = this.profile();
      if (p) {
        await this.warriorService.updateProfile({
          xp: p.xp + 20,
          totalDojoWins: p.totalDojoWins + 1
        });
      }
    }
    this.isDojoActive.set(false);
  }

  async resetData() {
    if (confirm('Are you sure you want to reset all your progress?')) {
      await this.warriorService.resetData();
      this.showSettings.set(false);
    }
  }

  async logout() {
    await this.warriorService.logout();
  }
}
