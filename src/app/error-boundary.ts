import { Component, signal, ErrorHandler, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  static errorSignal = signal<string | null>(null);

  handleError(error: Error) {
    console.error('Global Error:', error);
    let message = 'An unexpected error occurred.';
    
    try {
      // Check if it's our JSON error info
      const errorObj = JSON.parse(error.message);
      if (errorObj.error && errorObj.operationType) {
        message = `Firestore Error: ${errorObj.operationType} on ${errorObj.path || 'unknown path'} failed. ${errorObj.error}`;
      }
    } catch {
      message = error.message || String(error);
    }
    
    GlobalErrorHandler.errorSignal.set(message);
  }
}

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (error()) {
      <div class="fixed top-4 left-4 right-4 z-[1000] bg-error text-on-error p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between animate-bounce-in">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <p class="text-sm font-bold font-headline">{{ error() }}</p>
        </div>
        <button (click)="clear()" class="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
          <span>✕</span>
        </button>
      </div>
    }
  `,
  styles: [`
    .animate-bounce-in {
      animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    @keyframes bounceIn {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ErrorBoundaryComponent {
  error = GlobalErrorHandler.errorSignal;

  clear() {
    this.error.set(null);
  }
}
