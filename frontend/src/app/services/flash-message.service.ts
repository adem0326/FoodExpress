import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FlashMessageService {
  readonly message = signal('');
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  showSuccess(message: string): void {
    this.clear();
    this.message.set(message);
    this.timeoutId = setTimeout(() => this.clear(), 4000);
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.message.set('');
  }
}
