import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';
import { LeaveService } from '../../services/leave.service';
import { LeaveRecord } from '../../models/leave-record.model';
import { FormsModule } from '@angular/forms';

interface MonthlyData {
  month: string;
  monthDate: Date;
  totalLeaves: number;
  leaveTypes: { [key: string]: number };
  employees: string[];
}

interface OverallData {
  leaveTypes: { type: string; count: number; percentage: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  totalStats: {
    totalLeaves: number;
    activeLeaves: number;
    cancelledLeaves: number;
    uniqueEmployees: number;
    avgLeavesPerEmployee: number;
    mostUsedLeaveType: string;
  };
}

interface EmployeeData {
  employeeName: string;
  totalLeaves: number;
  activeLeaves: number;
  cancelledLeaves: number;
  leaveTypes: { [key: string]: number };
  monthlyTrend: { month: string; count: number }[];
}

@Component({
  selector: 'app-leave-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <h2>📊 Leave Analytics Dashboard</h2>
        <div class="analysis-selector">
          <button 
            *ngFor="let analysis of analysisTypes" 
            class="analysis-btn"
            [class.active]="activeAnalysis === analysis.type"
            (click)="switchAnalysis(analysis.type)">
            {{ analysis.icon }} {{ analysis.name }}
          </button>
        </div>
      </div>

      <!-- Monthly Analysis -->
      <div class="analysis-section" *ngIf="activeAnalysis === 'monthly'">
        <div class="section-header">
          <h3>📅 Monthly Leave Analysis</h3>
          <p class="section-description">Track leave patterns and trends over time</p>
        </div>
        
        <div class="chart-grid">
          <div class="chart-card">
            <h4>Monthly Leave Trends</h4>
            <div #monthlyTrendChart class="chart-container"></div>
          </div>
          
          <div class="chart-card">
            <h4>Leave Types by Month</h4>
            <div #monthlyTypeChart class="chart-container"></div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card" *ngFor="let stat of monthlyStats">
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Analysis -->
      <div class="analysis-section" *ngIf="activeAnalysis === 'overall'">
        <div class="section-header">
          <h3>📈 Overall Leave Analysis</h3>
          <p class="section-description">Complete overview of leave patterns and distribution</p>
        </div>
        
        <div class="chart-grid">
          <div class="chart-card">
            <h4>Leave Types Distribution</h4>
            <div #overallTypeChart class="chart-container"></div>
          </div>
          
          <div class="chart-card">
            <h4>Status Distribution</h4>
            <div #overallStatusChart class="chart-container"></div>
          </div>
        </div>

        <div class="overall-stats">
          <div class="stats-row">
            <div class="large-stat-card">
              <div class="large-stat-icon">📋</div>
              <div class="large-stat-content">
                <div class="large-stat-value">{{ overallData.totalStats.totalLeaves }}</div>
                <div class="large-stat-label">Total Leaves</div>
              </div>
            </div>
            <div class="large-stat-card">
              <div class="large-stat-icon">👥</div>
              <div class="large-stat-content">
                <div class="large-stat-value">{{ overallData.totalStats.uniqueEmployees }}</div>
                <div class="large-stat-label">Employees</div>
              </div>
            </div>
            <div class="large-stat-card">
              <div class="large-stat-icon">📊</div>
              <div class="large-stat-content">
                <div class="large-stat-value">{{ overallData.totalStats.avgLeavesPerEmployee }}</div>
                <div class="large-stat-label">Avg per Employee</div>
              </div>
            </div>
            <div class="large-stat-card">
              <div class="large-stat-icon">🏆</div>
              <div class="large-stat-content">
                <div class="large-stat-value">{{ overallData.totalStats.mostUsedLeaveType }}</div>
                <div class="large-stat-label">Most Used Type</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Analysis -->
      <div class="analysis-section" *ngIf="activeAnalysis === 'employee'">
        <div class="section-header">
          <h3>👤 Employee Leave Analysis</h3>
          <p class="section-description">Individual employee leave patterns and comparisons</p>
        </div>
        
        <div class="employee-selector">
          <select [(ngModel)]="selectedEmployee" (change)="updateEmployeeAnalysis()" class="employee-select">
            <option value="">Select Employee for Detailed View</option>
            <option *ngFor="let emp of employeeList" [value]="emp">{{ emp }}</option>
          </select>
        </div>

        <div class="chart-grid">
          <div class="chart-card">
            <h4>Employee Leave Comparison</h4>
            <div #employeeComparisonChart class="chart-container"></div>
          </div>
          
          <div class="chart-card" *ngIf="selectedEmployee">
            <h4>{{ selectedEmployee }} - Leave Types</h4>
            <div #employeeDetailChart class="chart-container"></div>
          </div>
        </div>

        <div class="employee-stats" *ngIf="selectedEmployeeData">
          <div class="employee-card">
            <h4>{{ selectedEmployeeData.employeeName }} - Statistics</h4>
            <div class="employee-metrics">
              <div class="metric">
                <span class="metric-label">Total Leaves:</span>
                <span class="metric-value">{{ selectedEmployeeData.totalLeaves }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Active:</span>
                <span class="metric-value active">{{ selectedEmployeeData.activeLeaves }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Cancelled:</span>
                <span class="metric-value cancelled">{{ selectedEmployeeData.cancelledLeaves }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Most Used Type:</span>
                <span class="metric-value">{{ getMostUsedLeaveType(selectedEmployeeData) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 30px;
      box-shadow: var(--shadow-lg);
      margin: 20px 0;
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .analytics-header h2 {
      color: var(--text-primary);
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }

    .analysis-selector {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .analysis-btn {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .analysis-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }

    .analysis-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .analysis-section {
      animation: fadeIn 0.5s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .section-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .section-header h3 {
      color: var(--text-primary);
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .section-description {
      color: var(--text-secondary);
      margin: 0;
      font-size: 14px;
      font-style: italic;
    }

    .chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 25px;
      margin-bottom: 30px;
    }

    .chart-card {
      background: var(--bg-primary);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }

    .chart-card h4 {
      color: var(--text-primary);
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
    }

    .chart-container {
      width: 100%;
      height: 300px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
    }

    .stat-icon {
      font-size: 24px;
      opacity: 0.9;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .overall-stats {
      margin-top: 30px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }

    .large-stat-card {
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      padding: 25px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s ease;
    }

    .large-stat-card:hover {
      border-color: #667eea;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
      transform: translateY(-2px);
    }

    .large-stat-icon {
      font-size: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .large-stat-content {
      flex: 1;
    }

    .large-stat-value {
      font-size: 28px;
      font-weight: bold;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .large-stat-label {
      font-size: 14px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .employee-selector {
      margin-bottom: 30px;
      display: flex;
      justify-content: center;
    }

    .employee-select {
      background: var(--bg-primary);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
      min-width: 250px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .employee-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }

    .employee-stats {
      margin-top: 30px;
    }

    .employee-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      padding: 25px;
      border-radius: 12px;
    }

    .employee-card h4 {
      color: var(--text-primary);
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
    }

    .employee-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .metric-label {
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
    }

    .metric-value {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .metric-value.active {
      color: #38a169;
    }

    .metric-value.cancelled {
      color: #e53e3e;
    }

    /* D3 Chart Styles */
    :host ::ng-deep .tooltip {
      position: absolute;
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 1000;
      max-width: 200px;
    }

    :host ::ng-deep .axis {
      font-size: 11px;
    }

    :host ::ng-deep .axis text {
      fill: var(--text-secondary);
    }

    :host ::ng-deep .axis path,
    :host ::ng-deep .axis line {
      stroke: var(--border-color);
    }

    :host ::ng-deep .grid line {
      stroke: var(--border-light);
      stroke-dasharray: 2,2;
    }

    :host ::ng-deep .grid path {
      stroke-width: 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .analytics-container {
        padding: 20px;
      }

      .analytics-header {
        flex-direction: column;
        align-items: stretch;
      }

      .analysis-selector {
        justify-content: center;
      }

      .chart-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .chart-container {
        height: 250px;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
      }

      .stats-row {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .employee-metrics {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LeaveAnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('monthlyTrendChart', { static: false }) monthlyTrendChartRef!: ElementRef;
  @ViewChild('monthlyTypeChart', { static: false }) monthlyTypeChartRef!: ElementRef;
  @ViewChild('overallTypeChart', { static: false }) overallTypeChartRef!: ElementRef;
  @ViewChild('overallStatusChart', { static: false }) overallStatusChartRef!: ElementRef;
  @ViewChild('employeeComparisonChart', { static: false }) employeeComparisonChartRef!: ElementRef;
  @ViewChild('employeeDetailChart', { static: false }) employeeDetailChartRef!: ElementRef;

  leaveRecords: LeaveRecord[] = [];
  monthlyData: MonthlyData[] = [];
  overallData: OverallData = {
    leaveTypes: [],
    statusDistribution: [],
    totalStats: {
      totalLeaves: 0,
      activeLeaves: 0,
      cancelledLeaves: 0,
      uniqueEmployees: 0,
      avgLeavesPerEmployee: 0,
      mostUsedLeaveType: '-'
    }
  };
  employeeData: EmployeeData[] = [];
  
  activeAnalysis: string = 'monthly';
  analysisTypes = [
    { type: 'monthly', name: 'Monthly Analysis', icon: '📅' },
    { type: 'overall', name: 'Overall Analysis', icon: '📈' },
    { type: 'employee', name: 'Employee Analysis', icon: '👤' }
  ];

  selectedEmployee: string = '';
  selectedEmployeeData: EmployeeData | null = null;
  
  private subscription: Subscription = new Subscription();

  // Monthly stats for display
  monthlyStats: Array<{icon: string, value: string, label: string}> = [];

  get employeeList(): string[] {
    return this.employeeData.map(emp => emp.employeeName).sort();
  }

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.leaveService.getLeaveRecords().subscribe(records => {
        this.leaveRecords = records;
        this.processAllData();
        this.updateAnalysis();
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateAnalysis();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    // Clean up any D3 tooltips
    d3.selectAll('.tooltip').remove();
  }

  private processAllData(): void {
    this.processMonthlyData();
    this.processOverallData();
    this.processEmployeeData();
    this.updateMonthlyStats();
  }

  private processMonthlyData(): void {
    const monthlyMap = new Map<string, MonthlyData>();

    this.leaveRecords.forEach(record => {
      const date = new Date(record.leaveDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthDisplay = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      const leaveType = record.leaveType || 'Annual Leave';

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthDisplay,
          monthDate: new Date(date.getFullYear(), date.getMonth(), 1),
          totalLeaves: 0,
          leaveTypes: {},
          employees: []
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.totalLeaves++;
      monthData.leaveTypes[leaveType] = (monthData.leaveTypes[leaveType] || 0) + 1;
      
      if (!monthData.employees.includes(record.employeeName)) {
        monthData.employees.push(record.employeeName);
      }
    });

    this.monthlyData = Array.from(monthlyMap.values())
      .sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
  }

  private processOverallData(): void {
    // Process leave types
    const leaveTypeMap = new Map<string, number>();
    const statusMap = new Map<string, number>();

    this.leaveRecords.forEach(record => {
      const leaveType = record.leaveType || 'Annual Leave';
      const status = record.status;

      leaveTypeMap.set(leaveType, (leaveTypeMap.get(leaveType) || 0) + 1);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    this.overallData.leaveTypes = Array.from(leaveTypeMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / this.leaveRecords.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    this.overallData.statusDistribution = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: (count / this.leaveRecords.length) * 100
      }));

    // Calculate overall stats
    const uniqueEmployees = new Set(this.leaveRecords.map(r => r.employeeName)).size;
    const activeLeaves = this.leaveRecords.filter(r => r.status === 'Active').length;
    const cancelledLeaves = this.leaveRecords.filter(r => r.status === 'Cancelled').length;
    const mostUsedType = this.overallData.leaveTypes.length > 0 ? this.overallData.leaveTypes[0].type : '-';

    this.overallData.totalStats = {
      totalLeaves: this.leaveRecords.length,
      activeLeaves,
      cancelledLeaves,
      uniqueEmployees,
      avgLeavesPerEmployee: uniqueEmployees > 0 ? parseFloat((this.leaveRecords.length / uniqueEmployees).toFixed(1)) : 0,
      mostUsedLeaveType: mostUsedType
    };
  }

  private processEmployeeData(): void {
    const employeeMap = new Map<string, EmployeeData>();

    this.leaveRecords.forEach(record => {
      const name = record.employeeName;
      const leaveType = record.leaveType || 'Annual Leave';
      const month = new Date(record.leaveDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });

      if (!employeeMap.has(name)) {
        employeeMap.set(name, {
          employeeName: name,
          totalLeaves: 0,
          activeLeaves: 0,
          cancelledLeaves: 0,
          leaveTypes: {},
          monthlyTrend: []
        });
      }

      const empData = employeeMap.get(name)!;
      empData.totalLeaves++;
      
      if (record.status === 'Active') empData.activeLeaves++;
      else empData.cancelledLeaves++;
      
      empData.leaveTypes[leaveType] = (empData.leaveTypes[leaveType] || 0) + 1;
    });

    this.employeeData = Array.from(employeeMap.values())
      .sort((a, b) => b.totalLeaves - a.totalLeaves);
  }

  private updateMonthlyStats(): void {
    if (this.monthlyData.length === 0) {
      this.monthlyStats = [];
      return;
    }

    const totalMonths = this.monthlyData.length;
    const avgLeavesPerMonth = this.leaveRecords.length / totalMonths;
    const peakMonth = this.monthlyData.reduce((prev, current) => 
      prev.totalLeaves > current.totalLeaves ? prev : current
    );
    const latestMonth = this.monthlyData[this.monthlyData.length - 1];

    this.monthlyStats = [
      { icon: '📅', value: totalMonths.toString(), label: 'Months Tracked' },
      { icon: '📊', value: avgLeavesPerMonth.toFixed(1), label: 'Avg per Month' },
      { icon: '🏆', value: peakMonth.month, label: 'Peak Month' },
      { icon: '📈', value: latestMonth.totalLeaves.toString(), label: 'Latest Month' }
    ];
  }

  switchAnalysis(analysisType: string): void {
    this.activeAnalysis = analysisType;
    setTimeout(() => {
      this.updateAnalysis();
    }, 100);
  }

  updateEmployeeAnalysis(): void {
    if (this.selectedEmployee) {
      this.selectedEmployeeData = this.employeeData.find(emp => emp.employeeName === this.selectedEmployee) || null;
      setTimeout(() => {
        this.createEmployeeDetailChart();
      }, 100);
    } else {
      this.selectedEmployeeData = null;
    }
  }

  getMostUsedLeaveType(employeeData: EmployeeData): string {
    const types = Object.entries(employeeData.leaveTypes);
    if (types.length === 0) return '-';
    
    const mostUsed = types.reduce((prev, current) => 
      prev[1] > current[1] ? prev : current
    );
    return mostUsed[0];
  }

  private updateAnalysis(): void {
    if (this.leaveRecords.length === 0) return;

    switch (this.activeAnalysis) {
      case 'monthly':
        this.createMonthlyTrendChart();
        this.createMonthlyTypeChart();
        break;
      case 'overall':
        this.createOverallTypeChart();
        this.createOverallStatusChart();
        break;
      case 'employee':
        this.createEmployeeComparisonChart();
        if (this.selectedEmployee) {
          this.createEmployeeDetailChart();
        }
        break;
    }
  }

  private createMonthlyTrendChart(): void {
    if (!this.monthlyTrendChartRef?.nativeElement) return;

    const element = this.monthlyTrendChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(this.monthlyData, d => d.monthDate) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.monthlyData, d => d.totalLeaves) || 0])
      .nice()
      .range([height, 0]);

    // Line generator
    const line = d3.line<MonthlyData>()
      .x(d => x(d.monthDate))
      .y(d => y(d.totalLeaves))
      .curve(d3.curveMonotoneX);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Add grid
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => ''));

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''));

    // Add line
    g.append('path')
      .datum(this.monthlyData)
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(this.monthlyData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.monthDate))
      .attr('cy', d => y(d.totalLeaves))
      .attr('r', 6)
      .attr('fill', '#667eea')
      .style('stroke', 'var(--bg-secondary)')
      .style('stroke-width', '3px')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.month}</strong><br/>
          Total Leaves: ${d.totalLeaves}<br/>
          Employees: ${d.employees.length}<br/>
          Top Type: ${Object.entries(d.leaveTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b %Y') as any));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));
  }

  private createMonthlyTypeChart(): void {
    if (!this.monthlyTypeChartRef?.nativeElement || this.monthlyData.length === 0) return;

    const element = this.monthlyTypeChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 50, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Get all unique leave types
    const allLeaveTypes = Array.from(new Set(
      this.monthlyData.flatMap(d => Object.keys(d.leaveTypes))
    ));

    // Transform data for stacked bar chart
    const stackData = this.monthlyData.map(d => {
      const item: any = { month: d.month, monthDate: d.monthDate };
      allLeaveTypes.forEach(type => {
        item[type] = d.leaveTypes[type] || 0;
      });
      return item;
    });

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .domain(this.monthlyData.map(d => d.month))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.monthlyData, d => d.totalLeaves) || 0])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(allLeaveTypes);

    // Stack generator
    const stack = d3.stack<any>()
      .keys(allLeaveTypes);

    const stackedData = stack(stackData);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Add stacked bars
    g.selectAll('.stack')
      .data(stackedData)
      .enter().append('g')
      .attr('class', 'stack')
      .attr('fill', d => color(d.key))
      .selectAll('rect')
      .data(d => d)
      .enter().append('rect')
      .attr('x', d => x(d.data.month)!)
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .on('mouseover', (event, d: any) => {
        const leaveType = d3.select(event.target.parentNode).datum() as any;
        const count = d[1] - d[0];
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.data.month}</strong><br/>
          ${leaveType.key}: ${count}<br/>
          Total: ${d.data[Object.keys(d.data).find(k => k !== 'month' && k !== 'monthDate')!] || 0}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Legend
    const legend = g.selectAll('.legend')
      .data(allLeaveTypes)
      .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${width + 10}, ${i * 20})`);

    legend.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => color(d));

    legend.append('text')
      .attr('x', 16)
      .attr('y', 6)
      .attr('dy', '0.35em')
      .style('fill', 'var(--text-primary)')
      .style('font-size', '11px')
      .text(d => d);
  }

  private createOverallTypeChart(): void {
    if (!this.overallTypeChartRef?.nativeElement || this.overallData.leaveTypes.length === 0) return;

    const element = this.overallTypeChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.offsetWidth;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeSet3);

    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    const labelArc = d3.arc<any>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    const arcs = g.selectAll('.arc')
      .data(pie(this.overallData.leaveTypes))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i.toString()))
      .style('stroke', 'var(--bg-secondary)')
      .style('stroke-width', '2px')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.data.type}</strong><br/>
          Count: ${d.data.count}<br/>
          Percentage: ${d.data.percentage.toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    arcs.append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('fill', 'var(--text-primary)')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(d => d.data.percentage > 5 ? `${d.data.percentage.toFixed(0)}%` : '');
  }

  private createOverallStatusChart(): void {
    if (!this.overallStatusChartRef?.nativeElement || this.overallData.statusDistribution.length === 0) return;

    const element = this.overallStatusChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(this.overallData.statusDistribution.map(d => d.status))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.overallData.statusDistribution, d => d.count) || 0])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(['Active', 'Cancelled'])
      .range(['#38a169', '#e53e3e']);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    g.selectAll('.bar')
      .data(this.overallData.statusDistribution)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.status)!)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.count))
      .attr('height', d => height - y(d.count))
      .attr('fill', d => color(d.status) as string)
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.status}</strong><br/>
          Count: ${d.count}<br/>
          Percentage: ${d.percentage.toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));
  }

  private createEmployeeComparisonChart(): void {
    if (!this.employeeComparisonChartRef?.nativeElement || this.employeeData.length === 0) return;

    const element = this.employeeComparisonChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 80, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(this.employeeData.map(d => d.employeeName))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.employeeData, d => d.totalLeaves) || 0])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    g.selectAll('.bar')
      .data(this.employeeData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.employeeName)!)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.totalLeaves))
      .attr('height', d => height - y(d.totalLeaves))
      .attr('fill', (d, i) => color(i.toString()))
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.employeeName}</strong><br/>
          Total: ${d.totalLeaves}<br/>
          Active: ${d.activeLeaves}<br/>
          Cancelled: ${d.cancelledLeaves}<br/>
          Types: ${Object.keys(d.leaveTypes).length}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      })
      .on('click', (event, d) => {
        this.selectedEmployee = d.employeeName;
        this.updateEmployeeAnalysis();
      });

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));
  }

  private createEmployeeDetailChart(): void {
    if (!this.employeeDetailChartRef?.nativeElement || !this.selectedEmployeeData) return;

    const element = this.employeeDetailChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.offsetWidth;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const leaveTypeData = Object.entries(this.selectedEmployeeData.leaveTypes)
      .map(([type, count]) => ({ type, count }));

    const color = d3.scaleOrdinal(d3.schemeSet3);

    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    const labelArc = d3.arc<any>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    const arcs = g.selectAll('.arc')
      .data(pie(leaveTypeData))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i.toString()))
      .style('stroke', 'var(--bg-secondary)')
      .style('stroke-width', '2px')
      .on('mouseover', (event, d) => {
        const percentage = (d.data.count / this.selectedEmployeeData!.totalLeaves) * 100;
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.data.type}</strong><br/>
          Count: ${d.data.count}<br/>
          Percentage: ${percentage.toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    arcs.append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('fill', 'var(--text-primary)')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(d => {
        const percentage = (d.data.count / this.selectedEmployeeData!.totalLeaves) * 100;
        return percentage > 10 ? `${percentage.toFixed(0)}%` : '';
      });
  }
}