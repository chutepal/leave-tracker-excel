import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LeaveService } from '../../services/leave.service';
import { LeaveRecord } from '../../models/leave-record.model';

interface MonthGroup {
  monthYear: string;
  displayName: string;
  records: LeaveRecord[];
  totalDays: number;
}

@Component({
  selector: 'app-leave-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-table.component.html',
  styleUrl: './leave-table.component.css'
})
export class LeaveTableComponent implements OnInit, OnDestroy {
  leaveRecords: LeaveRecord[] = [];
  filteredRecords: LeaveRecord[] = [];
  monthGroups: MonthGroup[] = [];
  expandedMonths: Set<string> = new Set();
  private subscription: Subscription = new Subscription();

  // Filter properties
  fromDate: string = '';
  toDate: string = '';
  isFiltering: boolean = false;

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.leaveService.getLeaveRecords().subscribe(records => {
        this.leaveRecords = records;
        this.filteredRecords = [...records];
        this.groupRecordsByMonth();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private groupRecordsByMonth(): void {
    const groups: { [key: string]: LeaveRecord[] } = {};

    this.filteredRecords.forEach(record => {
      const date = new Date(record.leaveDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(record);
    });

    this.monthGroups = Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(monthYear => {
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const displayName = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });

        const records = groups[monthYear].sort((a, b) => 
          new Date(b.leaveDate).getTime() - new Date(a.leaveDate).getTime()
        );

        return {
          monthYear,
          displayName,
          records,
          totalDays: records.length
        };
      });

    // Auto-expand current month if not filtering
    if (!this.isFiltering) {
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      this.expandedMonths.add(currentMonth);
    } else {
      // Expand all months when filtering to show results
      this.monthGroups.forEach(group => {
        this.expandedMonths.add(group.monthYear);
      });
    }
  }

  // Date filter methods
  applyDateFilter(): void {
    if (!this.fromDate && !this.toDate) {
      this.clearFilter();
      return;
    }

    this.isFiltering = true;
    
    this.filteredRecords = this.leaveRecords.filter(record => {
      const recordDate = new Date(record.leaveDate);
      const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
      const toDateObj = this.toDate ? new Date(this.toDate) : null;

      let matchesFrom = true;
      let matchesTo = true;

      if (fromDateObj) {
        matchesFrom = recordDate >= fromDateObj;
      }

      if (toDateObj) {
        // Set to end of day for inclusive filtering
        toDateObj.setHours(23, 59, 59, 999);
        matchesTo = recordDate <= toDateObj;
      }

      return matchesFrom && matchesTo;
    });

    this.groupRecordsByMonth();
  }

  clearFilter(): void {
    this.fromDate = '';
    this.toDate = '';
    this.isFiltering = false;
    this.filteredRecords = [...this.leaveRecords];
    this.expandedMonths.clear();
    this.groupRecordsByMonth();
  }

  // Quick filter methods
  setQuickFilter(days: number): void {
    const today = new Date();
    const pastDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    
    this.fromDate = pastDate.toISOString().split('T')[0];
    this.toDate = today.toISOString().split('T')[0];
    this.applyDateFilter();
  }

  setCurrentMonthFilter(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.fromDate = firstDay.toISOString().split('T')[0];
    this.toDate = lastDay.toISOString().split('T')[0];
    this.applyDateFilter();
  }

  // Date validation
  get isValidDateRange(): boolean {
    if (!this.fromDate || !this.toDate) return true;
    return new Date(this.fromDate) <= new Date(this.toDate);
  }

  get filteredRecordsCount(): number {
    return this.filteredRecords.length;
  }

  get totalRecordsCount(): number {
    return this.leaveRecords.length;
  }

  // Existing methods
  toggleMonth(monthYear: string): void {
    if (this.expandedMonths.has(monthYear)) {
      this.expandedMonths.delete(monthYear);
    } else {
      this.expandedMonths.add(monthYear);
    }
  }

  isMonthExpanded(monthYear: string): boolean {
    return this.expandedMonths.has(monthYear);
  }

  getLeaveTypeClass(leaveType: string): string {
    if (!leaveType) return 'type-annual-leave';
    return 'type-' + leaveType.toLowerCase().replace(/\s+/g, '-');
  }

  async deleteMonth(monthGroup: MonthGroup): Promise<void> {
    const confirmMessage = `Are you sure you want to delete ALL ${monthGroup.totalDays} leave records for ${monthGroup.displayName}?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      try {
        for (const record of monthGroup.records) {
          await this.leaveService.removeLeaveRecord(record.id);
        }
        alert(`Successfully deleted all leave records for ${monthGroup.displayName}`);
      } catch (error: any) {
        console.error('Error deleting month records:', error);
        alert(`Error deleting month records: ${error.message || 'Please try again.'}`);
      }
    }
  }

  async cancelLeave(id: string): Promise<void> {
    if (confirm('Are you sure you want to cancel this leave record?')) {
      try {
        await this.leaveService.cancelLeaveRecord(id);
        alert('Leave record cancelled successfully!');
      } catch (error: any) {
        console.error('Error cancelling leave:', error);
        alert(`Error: ${error.message || 'Failed to cancel leave. Please try again.'}`);
      }
    }
  }

  async removeLeave(id: string): Promise<void> {
    if (confirm('Are you sure you want to remove this leave record completely?')) {
      try {
        await this.leaveService.removeLeaveRecord(id);
        alert('Leave record removed successfully!');
      } catch (error: any) {
        console.error('Error removing leave:', error);
        alert(`Error: ${error.message || 'Failed to remove leave. Please try again.'}`);
      }
    }
  }
}