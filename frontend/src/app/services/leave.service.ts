import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { LeaveRecord } from '../models/leave-record.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  debug?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private readonly API_URL = 'http://localhost:3001/api';
  private leaveRecordsSubject = new BehaviorSubject<LeaveRecord[]>([]);
  public leaveRecords$ = this.leaveRecordsSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  public loading$ = this.isLoading.asObservable();

  constructor(private http: HttpClient) {
    this.loadLeaveRecords();
  }

  private generateId(employeeName: string, leaveDate: string): string {
    const cleanName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanDate = leaveDate.replace(/[^0-9]/g, '_');
    const timestamp = Date.now();
    return `${cleanName}_${cleanDate}_${timestamp}`;
  }

  async loadLeaveRecords(): Promise<void> {
    this.isLoading.next(true);
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<LeaveRecord[]>>(`${this.API_URL}/leave-records`)
      );
      
      if (response.success && response.data) {
        const records = response.data.map(record => ({
          ...record,
          leaveDate: new Date(record.leaveDate)
        }));
        
        this.leaveRecordsSubject.next(records);
        console.log(`Loaded ${response.count || 0} records:`, records);
      } else {
        throw new Error(response.error || 'Failed to load records');
      }
    } catch (error) {
      console.error('Error loading leave records:', error);
      this.leaveRecordsSubject.next([]);
    } finally {
      this.isLoading.next(false);
    }
  }

  async addLeaveRecord(employeeName: string, leaveDate: Date, leaveType: string, comment?: string): Promise<void> {
    this.isLoading.next(true);
    try {
      const formattedDate = leaveDate.toLocaleDateString('en-US');
      const generatedId = this.generateId(employeeName, formattedDate);
      
      console.log('Adding record:', { 
        id: generatedId, 
        employeeName, 
        leaveDate: formattedDate,
        leaveType,
        comment
      });
      
      const response = await firstValueFrom(
        this.http.post<ApiResponse<LeaveRecord>>(`${this.API_URL}/leave-records`, {
          id: generatedId,
          employeeName: employeeName.trim(),
          leaveDate: formattedDate,
          leaveType: leaveType,
          comment: comment || ''
        })
      );

      if (response.success && response.data) {
        const newRecord = {
          ...response.data,
          leaveDate: new Date(response.data.leaveDate)
        };
        
        const currentRecords = this.leaveRecordsSubject.value;
        this.leaveRecordsSubject.next([...currentRecords, newRecord]);
        console.log('Added new record:', newRecord);
      } else {
        throw new Error(response.error || 'Failed to add record');
      }
    } catch (error) {
      console.error('Error adding leave record:', error);
      throw error;
    } finally {
      this.isLoading.next(false);
    }
  }

  async cancelLeaveRecord(id: string): Promise<void> {
    this.isLoading.next(true);
    try {
      console.log('Cancelling record with ID:', id);
      const encodedId = encodeURIComponent(id);
      
      const response = await firstValueFrom(
        this.http.put<ApiResponse<LeaveRecord>>(`${this.API_URL}/leave-records/${encodedId}/cancel`, {})
      );

      if (response.success && response.data) {
        const updatedRecord = {
          ...response.data,
          leaveDate: new Date(response.data.leaveDate)
        };
        
        const currentRecords = this.leaveRecordsSubject.value;
        const updatedRecords = currentRecords.map(record => 
          record.id === id ? updatedRecord : record
        );
        this.leaveRecordsSubject.next(updatedRecords);
        console.log('Successfully cancelled record');
      } else {
        throw new Error(response.error || 'Failed to cancel record');
      }
    } catch (error: any) {
      console.error('Error cancelling leave record:', error);
      throw new Error(`Failed to cancel leave: ${error.error?.error || error.message || 'Unknown error'}`);
    } finally {
      this.isLoading.next(false);
    }
  }

  async removeLeaveRecord(id: string): Promise<void> {
    this.isLoading.next(true);
    try {
      console.log('Removing record with ID:', id);
      const encodedId = encodeURIComponent(id);
      
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${this.API_URL}/leave-records/${encodedId}`)
      );

      if (response.success) {
        const currentRecords = this.leaveRecordsSubject.value;
        const filteredRecords = currentRecords.filter(record => record.id !== id);
        this.leaveRecordsSubject.next(filteredRecords);
        console.log('Successfully removed record');
      } else {
        throw new Error(response.error || 'Failed to remove record');
      }
    } catch (error: any) {
      console.error('Error removing leave record:', error);
      throw new Error(`Failed to remove leave: ${error.error?.error || error.message || 'Unknown error'}`);
    } finally {
      this.isLoading.next(false);
    }
  }

  async refreshFromExcel(): Promise<void> {
    await this.loadLeaveRecords();
  }

  getLeaveRecords(): Observable<LeaveRecord[]> {
    return this.leaveRecords$;
  }
}