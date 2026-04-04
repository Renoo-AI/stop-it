import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WarriorService } from './warrior.service';
import { OnboardingComponent } from './onboarding';
import { MissionComponent } from './mission';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OnboardingComponent, MissionComponent],
  template: `
    @if (warriorService.isLoading()) {
      <div class="fixed inset-0 z-[300] bg-surface-container-lowest flex flex-col items-center justify-center">
        <div class="relative w-20 h-20 flex items-center justify-center mb-4">
          <div class="absolute inset-0 border-4 border-surface-container-highest rounded-full"></div>
          <div class="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
          <span class="text-2xl">⚔️</span>
        </div>
        <p class="font-headline font-bold text-on-surface-variant uppercase tracking-widest text-sm">Entering the Dojo...</p>
      </div>
    } @else {
      @if (!warriorService.currentUser()) {
        <div class="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
          <h1 class="text-4xl font-headline font-black text-white mb-4 uppercase tracking-tighter">Mind Warrior</h1>
          <p class="text-slate-400 mb-8 max-w-xs">Master your discipline. Conquer your focus. Build the life you deserve.</p>
          <button 
            (click)="warriorService.login()"
            class="w-full max-w-xs py-4 rounded-2xl bg-primary-container text-on-primary-container font-headline font-bold text-lg uppercase tracking-widest shadow-xl shadow-primary-container/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Begin Journey
          </button>
        </div>
      } @else if (!warriorService.currentProfile()) {
        <app-onboarding />
      } @else {
        <app-mission />
      }
    }
  `,
})
export class App {
  warriorService = inject(WarriorService);
}
