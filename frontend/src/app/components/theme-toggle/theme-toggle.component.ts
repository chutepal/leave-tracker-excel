import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle"
      (click)="toggleTheme()"
      [title]="(themeService.isDarkMode$ | async) ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      <span class="theme-icon">
        {{ (themeService.isDarkMode$ | async) ? '☀️' : '🌙' }}
      </span>
      <span class="theme-text">
        {{ (themeService.isDarkMode$ | async) ? 'Light' : 'Dark' }}
      </span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--theme-toggle-bg);
      color: var(--theme-toggle-color);
      border: 2px solid var(--theme-toggle-border);
      padding: 10px 16px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: var(--theme-toggle-shadow);
    }

    .theme-toggle:hover {
      transform: translateY(-2px);
      box-shadow: var(--theme-toggle-hover-shadow);
    }

    .theme-icon {
      font-size: 16px;
    }

    .theme-text {
      letter-spacing: 0.5px;
    }
  `]
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}