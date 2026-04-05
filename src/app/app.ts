import { ChangeDetectionStrategy, Component, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WarriorService } from './warrior.service';
import { ThemeService } from './theme.service';
import { TranslationService, Language } from './translation.service';
import { OnboardingComponent } from './onboarding';
import { MissionComponent } from './mission';
import jsQR from 'jsqr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OnboardingComponent, MissionComponent],
  template: `
    <div [class.dark]="themeService.theme() === 'dark'" [dir]="translationService.isRtl ? 'rtl' : 'ltr'" class="min-h-screen bg-surface text-on-surface transition-colors duration-300">
      
      <!-- Loading Overlay -->
      @if (warriorService.isLoading()) {
        <div class="fixed inset-0 z-[300] bg-surface flex flex-col items-center justify-center">
          <div class="relative w-20 h-20 flex items-center justify-center mb-4">
            <div class="absolute inset-0 border-4 border-outline-variant rounded-full"></div>
            <div class="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <span class="text-2xl">⚔️</span>
          </div>
          <p class="font-headline font-bold text-on-surface-variant uppercase tracking-widest text-sm">
            {{ translationService.translate('loading_dojo') }}
          </p>
        </div>
      } @else {
        
        <!-- Auth Screen -->
        @if (!warriorService.currentUser()) {
          <div class="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
            
            <!-- Theme/Lang Toggles -->
            <div class="absolute top-4 right-4 flex gap-2">
              <button (click)="themeService.toggleTheme()" class="p-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
                {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
              </button>
              <select [value]="translationService.currentLang()" (change)="onLangChange($event)" class="bg-surface-container rounded-lg px-2 py-1 text-sm outline-none">
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>
            </div>

            <h1 class="text-4xl font-headline font-black text-primary mb-4 uppercase tracking-tighter">
              {{ translationService.translate('app_title') }}
            </h1>
            <p class="text-on-surface-variant mb-8 max-w-xs">
              {{ translationService.translate('app_subtitle') }}
            </p>
            
            @if (warriorService.currentError()) {
              <div class="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm max-w-xs">
                {{ warriorService.currentError() }}
              </div>
            }

            <div class="w-full max-w-xs space-y-4">
              <button 
                (click)="warriorService.loginWithGoogle()"
                class="w-full py-4 rounded-2xl bg-primary text-on-primary font-headline font-bold text-lg uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>🌐</span> {{ translationService.translate('google_login') }}
              </button>

              <button 
                (click)="warriorService.loginAsGuest()"
                class="w-full py-4 rounded-2xl bg-secondary-container text-on-secondary-container font-headline font-bold text-lg uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>👤</span> {{ translationService.translate('guest_login') }}
              </button>

              <button 
                (click)="showQrScanner = true; startScanner()"
                class="w-full py-4 rounded-2xl bg-tertiary-container text-on-tertiary-container font-headline font-bold text-lg uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>📷</span> {{ translationService.translate('qr_login') }}
              </button>
            </div>
          </div>

          <!-- QR Scanner Modal -->
          @if (showQrScanner) {
            <div class="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-4">
              <div class="relative w-full max-w-sm aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-primary">
                <video #scannerVideo class="w-full h-full object-cover"></video>
                <div class="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
                <div class="absolute inset-[40px] border-2 border-primary/50 pointer-events-none animate-pulse"></div>
              </div>
              <p class="text-white mt-6 mb-8 text-center">
                {{ translationService.translate('scan_instructions') }}
              </p>
              <button (click)="stopScanner()" class="px-8 py-3 rounded-full bg-white text-black font-bold">
                {{ translationService.translate('retreat') }}
              </button>
            </div>
          }

        } @else if (!warriorService.currentProfile()) {
          <app-onboarding />
        } @else {
          <app-mission />
        }
      }
    </div>
  `,
})
export class App {
  warriorService = inject(WarriorService);
  themeService = inject(ThemeService);
  translationService = inject(TranslationService);

  showQrScanner = false;
  @ViewChild('scannerVideo') scannerVideo!: ElementRef<HTMLVideoElement>;
  private scannerStream: MediaStream | null = null;
  private scannerInterval: ReturnType<typeof setInterval> | null = null;

  onLangChange(event: Event) {
    const lang = (event.target as HTMLSelectElement).value as Language;
    this.translationService.setLanguage(lang);
  }

  async startScanner() {
    try {
      this.scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setTimeout(() => {
        if (this.scannerVideo) {
          this.scannerVideo.nativeElement.srcObject = this.scannerStream;
          this.scannerVideo.nativeElement.play();
          this.scanFrame();
        }
      }, 100);
    } catch (err) {
      console.error('Camera access failed:', err);
      this.stopScanner();
    }
  }

  private scanFrame() {
    const video = this.scannerVideo.nativeElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    this.scannerInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          this.stopScanner();
          this.warriorService.loginWithPairingToken(code.data);
        }
      }
    }, 200);
  }

  stopScanner() {
    this.showQrScanner = false;
    if (this.scannerInterval) clearInterval(this.scannerInterval);
    if (this.scannerStream) {
      this.scannerStream.getTracks().forEach(track => track.stop());
    }
  }
}
