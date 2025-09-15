import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeaveFormComponent } from './components/leave-form/leave-form.component';
import { LeaveTableComponent } from './components/leave-table/leave-table.component';
import { LeaveAnalyticsComponent } from './components/leave-analytics/leave-analytics.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule, LeaveFormComponent, LeaveTableComponent, LeaveAnalyticsComponent, ThemeToggleComponent],
  template: `
    <div class="container">
      <header>
        <div class="header-content">
          <h1>{{ title }}</h1>
          <div class="header-controls">
            <button class="analytics-toggle-btn" (click)="toggleAnalytics()">
              {{ showAnalytics ? '📊 Hide Analytics' : '📈 Show Analytics' }}
            </button>
            <app-theme-toggle></app-theme-toggle>
          </div>
        </div>
      </header>
      
      <main>
        <div class="main-content">
          <div class="left-section">
            <app-leave-form></app-leave-form>
          </div>
          
          <div class="right-section">
            <app-leave-table></app-leave-table>
          </div>
        </div>
        
        <div class="analytics-section" *ngIf="showAnalytics">
          <app-leave-analytics></app-leave-analytics>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--bg-primary);
      min-height: 100vh;
      transition: background-color 0.3s ease;
    }

    header {
      margin-bottom: 30px;
      padding: 20px 0;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      border-radius: 12px;
      box-shadow: var(--shadow-md);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .analytics-toggle-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      padding: 10px 16px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .analytics-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    h1 {
      color: white !important;
      margin: 0;
      font-size: 2.2em;
      font-weight: 300;
    }

    main {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .main-content {
      display: grid;
      grid-template-columns: 500px 1fr;
      gap: 30px;
      align-items: start;
    }

    .left-section {
      display: flex;
      flex-direction: column;
    }

    .right-section {
      display: flex;
      flex-direction: column;
    }

    .analytics-section {
      width: 100%;
      animation: slideDown 0.5s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1200px) {
      .main-content {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 15px;
      }
      
      .header-content {
        flex-direction: column;
        gap: 15px;
        padding: 0 15px;
      }
      
      .header-controls {
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }
      
      .analytics-toggle-btn {
        width: 100%;
        text-align: center;
      }
      
      h1 {
        font-size: 1.8em;
        text-align: center;
      }
      
      main {
        gap: 20px;
      }
      
      .main-content {
        gap: 20px;
      }
    }
  `]
})
export class AppComponent {
  title = 'Employee Leave Tracker';
  showAnalytics = true;

  toggleAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
  }
}