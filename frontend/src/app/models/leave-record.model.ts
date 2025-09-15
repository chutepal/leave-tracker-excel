export interface LeaveRecord {
    id: string;
    employeeName: string;
    leaveDate: Date;
    status: 'Active' | 'Cancelled';
    leaveType: string;
    comment?: string;
  }