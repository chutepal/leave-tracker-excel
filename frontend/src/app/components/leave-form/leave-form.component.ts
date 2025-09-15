import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './leave-form.component.html',
  styleUrl: './leave-form.component.css'
})
export class LeaveFormComponent {
  selectedEmployee: string = '';
  startDate: string = '';
  endDate: string = '';
  selectedLeaveType: string = '';
  comment: string = '';
  isSubmitting: boolean = false;

  employees: string[] = [
    'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Wilson',
    'David Brown', 'Emily Davis', 'Robert Miller', 'Lisa Anderson',
    'James Taylor', 'Maria Garcia'
  ];

  leaveTypes: string[] = [
    'Annual Leave',
    'Sick Leave',
    'Personal Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Emergency Leave',
    'Bereavement Leave',
    'Study Leave',
    'Unpaid Leave',
    'Compensatory Leave'
  ];

  constructor(private leaveService: LeaveService) {}

  onStartDateChange(): void {
    if (this.startDate) {
      if (!this.endDate || new Date(this.endDate) < new Date(this.startDate)) {
        this.endDate = this.startDate;
      }
    }
    
    setTimeout(() => {
      const endDateInput = document.getElementById('endDate') as HTMLInputElement;
      if (endDateInput) {
        endDateInput.focus();
        if ('showPicker' in endDateInput) {
          (endDateInput as any).showPicker();
        }
      }
    }, 100);
  }

  validateDates(): boolean {
    if (this.startDate && this.endDate) {
      return new Date(this.startDate) <= new Date(this.endDate);
    }
    return true;
  }

  isPastDate(): boolean {
    if (!this.startDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(this.startDate) < today;
  }

  get selectedDaysCount(): number {
    if (this.startDate && this.endDate && this.validateDates()) {
      return this.getDateRange(new Date(this.startDate), new Date(this.endDate)).length;
    }
    return 0;
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedEmployee || !this.startDate || !this.endDate || !this.selectedLeaveType) {
      alert('Please fill in all required fields (Employee, Dates, and Leave Type)');
      return;
    }

    if (!this.validateDates()) {
      alert('End date cannot be before start date');
      return;
    }

    this.isSubmitting = true;
    
    try {
      const dates = this.getDateRange(new Date(this.startDate), new Date(this.endDate));
      
      for (const date of dates) {
        await this.leaveService.addLeaveRecord(
          this.selectedEmployee, 
          date, 
          this.selectedLeaveType, 
          this.comment.trim()
        );
      }
      
      // Reset form
      this.selectedEmployee = '';
      this.startDate = '';
      this.endDate = '';
      this.selectedLeaveType = '';
      this.comment = '';
      
      alert(`Added ${dates.length} ${this.selectedLeaveType} record(s) successfully!`);
    } catch (error) {
      console.error('Error adding leave record:', error);
      alert('Error adding leave record. Please ensure the backend server is running.');
    } finally {
      this.isSubmitting = false;
    }
  }

  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }
}