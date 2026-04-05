import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarriorService } from './warrior.service';
import { TranslationService } from './translation.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[200] bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center px-4">
      <div class="bg-surface-container-lowest w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center border border-outline-variant fade-in">
        
        <h2 class="text-3xl font-headline font-black text-on-surface mb-2 uppercase tracking-tight">
          {{ translationService.translate('onboarding_title') }}
        </h2>
        <p class="text-xs text-on-surface-variant mb-6 font-label tracking-widest uppercase">
          {{ translationService.translate('onboarding_subtitle') }}
        </p>
        
        <!-- Avatar Selection -->
        <div class="flex justify-center gap-3 mb-8">
          @for (avatar of avatars; track avatar.id) {
            <img 
              [src]="avatar.url" 
              [alt]="'Avatar ' + avatar.id"
              class="w-14 h-14 rounded-full object-cover avatar-option cursor-pointer transition-all border-2"
              [class.border-primary]="selectedAvatarId() === avatar.id"
              [class.border-transparent]="selectedAvatarId() !== avatar.id"
              [class.scale-110]="selectedAvatarId() === avatar.id"
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
            class="w-full bg-surface-container-low border-2 border-outline-variant rounded-2xl px-4 py-4 text-center text-xl text-on-surface font-headline font-bold focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder-on-surface-variant/40" 
            [placeholder]="translationService.translate('username_placeholder')" 
            maxlength="15" 
            autocomplete="off"
          />
          @if (showWarning()) {
            <p class="absolute -bottom-6 left-0 right-0 text-error text-xs font-bold transition-opacity">Honor requires clean language.</p>
          }
        </div>
        
        <button 
          (click)="save()"
          class="w-full py-4 rounded-2xl bg-primary text-on-primary font-headline font-bold text-lg uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          [disabled]="!username().trim()"
        >
          {{ translationService.translate('continue') }}
        </button>
      </div>
    </div>
  `
})
export class OnboardingComponent {
  private warriorService = inject(WarriorService);
  translationService = inject(TranslationService);
  
  username = signal('');
  selectedAvatarId = signal('1');
  showWarning = signal(false);

  avatars = [
    { id: '1', url: 'https://dropshare.42web.io/1/files/3Yyti1xLzn.jpg' },
    { id: '2', url: 'https://dropshare.42web.io/1/files/VZ5NlazkGs.jpg' },
    { id: '3', url: 'https://i.pinimg.com/736x/7c/e4/da/7ce4da76cb56694091613a297431595c.jpg' },
    { id: '4', url: 'https://i.pinimg.com/736x/c4/2a/91/c42a91ae99d8db8355479f47c708963c.jpg' },
    { id: '5', url: 'https://i.pinimg.com/1200x/6d/c5/57/6dc557aa6a11204aec3e630ca66cc864.jpg' }
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
