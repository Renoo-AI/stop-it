import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarriorService } from './warrior.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center px-4">
      <div class="bg-surface-container-lowest w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center border border-surface-container-highest fade-in">
        
        <h2 class="text-3xl font-headline font-black text-on-surface mb-2 uppercase tracking-tight">Who goes<br>there?</h2>
        <p class="text-xs text-on-surface-variant mb-6 font-label tracking-widest uppercase">Select your avatar</p>
        
        <!-- Avatar Selection -->
        <div class="flex justify-center gap-3 mb-8">
          @for (avatar of avatars; track avatar.id) {
            <img 
              [src]="avatar.url" 
              [alt]="'Avatar ' + avatar.id"
              class="w-14 h-14 rounded-full object-cover avatar-option"
              [class.selected]="selectedAvatarId() === avatar.id"
              (click)="selectedAvatarId.set(avatar.id)"
              (keydown.enter)="selectedAvatarId.set(avatar.id)"
              tabindex="0"
              referrerpolicy="no-referrer"
            />
          }
        </div>

        <div class="relative mb-8">
          <input 
            type="text" 
            [(ngModel)]="username"
            class="w-full bg-surface-container-low border-2 border-surface-container-highest rounded-2xl px-4 py-4 text-center text-xl text-on-surface font-headline font-bold focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder-on-surface-variant/40" 
            placeholder="Warrior Name" 
            maxlength="15" 
            autocomplete="off"
          />
          @if (showWarning()) {
            <p class="absolute -bottom-6 left-0 right-0 text-error text-xs font-bold transition-opacity">Honor requires clean language.</p>
          }
        </div>
        
        <button 
          (click)="save()"
          class="w-full py-4 rounded-2xl bg-slate-900 text-white font-headline font-bold text-lg uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          [disabled]="!username().trim()"
        >
          Enter The Dojo
        </button>
      </div>
    </div>
  `
})
export class OnboardingComponent {
  private warriorService = inject(WarriorService);
  
  username = signal('');
  selectedAvatarId = signal('1');
  showWarning = signal(false);

  avatars = [
    { id: '1', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
    { id: '2', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
    { id: '3', url: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
    { id: '4', url: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' }
  ];

  private blockedWords = ['fuck', 'shit', 'bitch', 'ass', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'bastard', 'crap', 'admin', 'root'];

  async save() {
    const val = this.username().trim();
    if (!val) return;

    const lower = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (this.blockedWords.some(word => lower.includes(word))) {
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 3000);
      return;
    }

    await this.warriorService.updateProfile({
      username: val,
      avatarId: this.selectedAvatarId()
    });
  }
}
