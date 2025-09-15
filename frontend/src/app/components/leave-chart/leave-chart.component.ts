import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';
import { LeaveService } from '../../services/leave.service';
import { LeaveRecord } from '../../models/leave-record.model';

interface ChartData {
  employeeName: string;
  totalDays: number;
  leaveTypes: { [key: string]: number };
  monthlyData: { month: string; count: number }[];
}

interface LeaveTypeData {
  leaveType: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-leave-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h2>📊 Leave Analytics Dashboard</h2>
        <div class="chart-controls">
          <button 
            *ngFor="let chart of chartTypes" 
            class="chart-btn"
            [class.active]="activeChart === chart.type"
            (click)="switchChart(chart.type)">
            {{ chart.icon }} {{ chart.name }}
          </button>
        </div>
      </div>

      <div class="charts-wrapper">
        <!-- Employee Bar Chart -->
        <div class="chart-section" *ngIf="activeChart === 'employee'">
          <h3>📈 Leaves by Employee</h3>
          <div #employeeChart class="chart-svg"></div>
        </div>

        <!-- Leave Type Pie Chart -->
        <div class="chart-section" *ngIf="activeChart === 'leaveType'">
          <h3>🥧 Leave Types Distribution</h3>
          <div #leaveTypeChart class="chart-svg"></div>
          <div class="chart-legend" #leaveTypeLegend></div>
        </div>

        <!-- Monthly Trend Line Chart -->
        <div class="chart-section" *ngIf="activeChart === 'monthly'">
          <h3>📅 Monthly Leave Trends</h3>
          <div #monthlyChart class="chart-svg"></div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards" *ngIf="leaveRecords.length > 0">
          <div class="summary-card">
            <div class="card-icon">📋</div>
            <div class="card-content">
              <div class="card-value">{{ totalLeaves }}</div>
              <div class="card-label">Total Leaves</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">👥</div>
            <div class="card-content">
              <div class="card-value">{{ uniqueEmployees }}</div>
              <div class="card-label">Employees</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <div class="card-value">{{ averageLeaves }}</div>
              <div class="card-label">Avg per Employee</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">🏆</div>
            <div class="card-content">
              <div class="card-value">{{ topEmployee }}</div>
              <div class="card-label">Most Leaves</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 25px;
      box-shadow: var(--shadow-md);
      margin: 20px 0;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .chart-header h2 {
      color: var(--text-primary);
      margin: 0;
      font-size: 24px;
    }

    .chart-controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .chart-btn {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .chart-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .chart-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: transparent;
    }

    .charts-wrapper {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .chart-section {
      background: var(--bg-primary);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .chart-section h3 {
      color: var(--text-primary);
      margin: 0 0 20px 0;
      font-size: 18px;
      text-align: center;
    }

    .chart-svg {
      width: 100%;
      height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 20px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border-radius: 15px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-text {
      font-size: 12px;
      color: var(--text-primary);
      font-weight: 500;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .card-icon {
      font-size: 24px;
      opacity: 0.9;
    }

    .card-content {
      flex: 1;
    }

    .card-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .card-label {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* D3 Chart Styles */
    :host ::ng-deep .bar {
      transition: all 0.3s ease;
    }

    :host ::ng-deep .bar:hover {
      opacity: 0.8;
    }

    :host ::ng-deep .axis {
      font-size: 11px;
      color: var(--text-secondary);
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
      stroke-dasharray: 3,3;
    }

    :host ::ng-deep .grid path {
      stroke-width: 0;
    }

    :host ::ng-deep .tooltip {
      position: absolute;
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 1000;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .chart-header {
        flex-direction: column;
        align-items: stretch;
      }

      .chart-controls {
        justify-content: center;
      }

      .chart-svg {
        height: 300px;
      }

      .summary-cards {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .card-value {
        font-size: 20px;
      }
    }
  `]
})
export class LeaveChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('employeeChart', { static: false }) employeeChartRef!: ElementRef;
  @ViewChild('leaveTypeChart', { static: false }) leaveTypeChartRef!: ElementRef;
  @ViewChild('monthlyChart', { static: false }) monthlyChartRef!: ElementRef;
  @ViewChild('leaveTypeLegend', { static: false }) leaveTypeLegendRef!: ElementRef;

  leaveRecords: LeaveRecord[] = [];
  chartData: ChartData[] = [];
  leaveTypeData: LeaveTypeData[] = [];
  monthlyData: { month: string; count: number }[] = [];
  
  activeChart: string = 'employee';
  chartTypes = [
    { type: 'employee', name: 'By Employee', icon: '📈' },
    { type: 'leaveType', name: 'By Type', icon: '🥧' },
    { type: 'monthly', name: 'Monthly Trend', icon: '📅' }
  ];

  private subscription: Subscription = new Subscription();

  // Summary stats
  get totalLeaves(): number {
    return this.leaveRecords.length;
  }

  get uniqueEmployees(): number {
    return new Set(this.leaveRecords.map(r => r.employeeName)).size;
  }

  get averageLeaves(): string {
    if (this.uniqueEmployees === 0) return '0';
    return (this.totalLeaves / this.uniqueEmployees).toFixed(1);
  }

  get topEmployee(): string {
    if (this.chartData.length === 0) return '-';
    const top = this.chartData.reduce((prev, current) => 
      prev.totalDays > current.totalDays ? prev : current
    );
    return top.employeeName;
  }

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.leaveService.getLeaveRecords().subscribe(records => {
        this.leaveRecords = records;
        this.processData();
        this.updateChart();
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateChart();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private processData(): void {
    // Process employee data
    const employeeMap = new Map<string, ChartData>();
    
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
          totalDays: 0,
          leaveTypes: {},
          monthlyData: []
        });
      }

      const employeeData = employeeMap.get(name)!;
      employeeData.totalDays++;
      employeeData.leaveTypes[leaveType] = (employeeData.leaveTypes[leaveType] || 0) + 1;
    });

    this.chartData = Array.from(employeeMap.values())
      .sort((a, b) => b.totalDays - a.totalDays);

    // Process leave type data
    const leaveTypeMap = new Map<string, number>();
    this.leaveRecords.forEach(record => {
      const type = record.leaveType || 'Annual Leave';
      leaveTypeMap.set(type, (leaveTypeMap.get(type) || 0) + 1);
    });

    this.leaveTypeData = Array.from(leaveTypeMap.entries())
      .map(([leaveType, count]) => ({
        leaveType,
        count,
        percentage: (count / this.totalLeaves) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Process monthly data
    const monthlyMap = new Map<string, number>();
    this.leaveRecords.forEach(record => {
      const month = new Date(record.leaveDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    });

    this.monthlyData = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  switchChart(chartType: string): void {
    this.activeChart = chartType;
    setTimeout(() => {
      this.updateChart();
    }, 100);
  }

  private updateChart(): void {
    if (this.leaveRecords.length === 0) return;

    switch (this.activeChart) {
      case 'employee':
        this.createEmployeeBarChart();
        break;
      case 'leaveType':
        this.createLeaveTypePieChart();
        break;
      case 'monthly':
        this.createMonthlyLineChart();
        break;
    }
  }

  private createEmployeeBarChart(): void {
    if (!this.employeeChartRef?.nativeElement) return;

    const element = this.employeeChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .domain(this.chartData.map(d => d.employeeName))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.chartData, (d: { totalDays: any; }) => d.totalDays) || 0])
      .nice()
      .range([height, 0]);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Bars
    g.selectAll('.bar')
      .data(this.chartData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', (d: { employeeName: any; }) => x(d.employeeName)!)
      .attr('width', x.bandwidth())
      .attr('y', (d: { totalDays: any; }) => y(d.totalDays))
      .attr('height', (d: { totalDays: any; }) => height - y(d.totalDays))
      .attr('fill', (d: any, i: { toString: () => any; }) => color(i.toString()))
      .on('mouseover', (event: { pageX: number; pageY: number; }, d: { employeeName: any; totalDays: any; leaveTypes: {}; }) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.employeeName}</strong><br/>
          Total Leaves: ${d.totalDays}<br/>
          Types: ${Object.keys(d.leaveTypes).join(', ')}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // X Axis
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Y Axis
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Y Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'var(--text-secondary)')
      .text('Number of Leaves');
  }

  private createLeaveTypePieChart(): void {
    if (!this.leaveTypeChartRef?.nativeElement) return;

    const element = this.leaveTypeChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.offsetWidth;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeSet3);

    // Pie layout
    const pie = d3.pie<LeaveTypeData>()
      .value((d: { count: any; }) => d.count)
      .sort(null);

    // Arc generator
    const arc = d3.arc<d3.PieArcDatum<LeaveTypeData>>()
      .innerRadius(0)
      .outerRadius(radius);

    const labelArc = d3.arc<d3.PieArcDatum<LeaveTypeData>>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Create pie slices
    const arcs = g.selectAll('.arc')
      .data(pie(this.leaveTypeData))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d: any, i: { toString: () => any; }) => color(i.toString()))
      .style('stroke', 'var(--bg-secondary)')
      .style('stroke-width', '2px')
      .on('mouseover', (event: { pageX: number; pageY: number; }, d: { data: { leaveType: any; count: any; percentage: number; }; }) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.data.leaveType}</strong><br/>
          Count: ${d.data.count}<br/>
          Percentage: ${d.data.percentage.toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Add labels
    arcs.append('text')
      .attr('transform', (d: any) => `translate(${labelArc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('fill', 'var(--text-primary)')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text((d: { data: { percentage: number; }; }) => d.data.percentage > 5 ? `${d.data.percentage.toFixed(0)}%` : '');

    // Create legend
    if (this.leaveTypeLegendRef?.nativeElement) {
      const legendElement = this.leaveTypeLegendRef.nativeElement;
      d3.select(legendElement).selectAll('*').remove();

      const legend = d3.select(legendElement);

      this.leaveTypeData.forEach((d, i) => {
        const legendItem = legend.append('div')
          .attr('class', 'legend-item');

        legendItem.append('div')
          .attr('class', 'legend-color')
          .style('background-color', color(i.toString()));

        legendItem.append('span')
          .attr('class', 'legend-text')
          .text(`${d.leaveType} (${d.count})`);
      });
    }
  }

  private createMonthlyLineChart(): void {
    if (!this.monthlyChartRef?.nativeElement) return;

    const element = this.monthlyChartRef.nativeElement;
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse time
    const parseTime = d3.timeParse('%b %Y');
    const formatTime = d3.timeFormat('%b %Y');

    const data = this.monthlyData.map(d => ({
      month: parseTime(d.month)!,
      count: d.count,
      monthStr: d.month
    })).sort((a, b) => a.month.getTime() - b.month.getTime());

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, (d: { month: any; }) => d.month) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: { count: any; }) => d.count) || 0])
      .nice()
      .range([height, 0]);

    // Line generator
    const line = d3.line<any>()
      .x((d: { month: any; }) => x(d.month))
      .y((d: { count: any; }) => y(d.count))
      .curve(d3.curveMonotoneX);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(() => '')
      );

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
      );

    // Add line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', (d: { month: any; }) => x(d.month))
      .attr('cy', (d: { count: any; }) => y(d.count))
      .attr('r', 5)
      .attr('fill', '#667eea')
      .style('stroke', 'var(--bg-secondary)')
      .style('stroke-width', '2px')
      .on('mouseover', (event: { pageX: number; pageY: number; }, d: { monthStr: any; count: any; }) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.monthStr}</strong><br/>
          Leaves: ${d.count}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // X Axis
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(formatTime as any));

    // Y Axis
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Y Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'var(--text-secondary)')
      .text('Number of Leaves');
  }
}