import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { addIcons } from 'ionicons';
import { ellipsisHorizontalOutline, timeOutline, pushOutline, calendarOutline, chevronForwardOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, SidebarComponent, HeaderComponent, BaseChartDirective, IonIcon]
})
export class DashboardPage implements OnInit {
  private apiService = inject(ApiService);
  public dashboardData: any = null;

  constructor() {
    addIcons({ ellipsisHorizontalOutline, timeOutline, pushOutline, calendarOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.dashboardData = data;
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
      }
    });
  }

  // Horizontal Bar Chart
  public horizontalBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // This makes it horizontal
    scales: {
      x: { display: false },
      y: { border: { display: false }, grid: { display: false } }
    },
    plugins: { legend: { display: false } }
  };
  
  public horizontalBarData: ChartData<'bar'> = {
    labels: ['สมอง', 'ทรวงอก', 'ดวงตา'],
    datasets: [
      { 
        data: [110, 80, 50], 
        backgroundColor: ['#f97316', '#14b8a6', '#3b82f6'], 
        borderRadius: 4,
        barThickness: 15
      }
    ]
  };

  // Donut Chart
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { position: 'right' } }
  };
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['ส่งต่อเคส', 'Tele Consult'],
    datasets: [
      { data: [800, 200], backgroundColor: ['#fb7185', '#fbbf24'], borderWidth: 0 }
    ]
  };

  // Clustered Bar Chart
  public clusteredBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { border: { display: false } },
      x: { grid: { display: false }, border: { display: false } }
    },
    plugins: { legend: { position: 'top', align: 'end' } }
  };
  public clusteredBarData: ChartData<'bar'> = {
    labels: ['สมอง', 'ทรวงอก', 'ดวงตา'],
    datasets: [
      { label: 'รอรับรับ', data: [50, 70, 20], backgroundColor: '#fbbf24', borderRadius: 4 },
      { label: 'การนัดสำเร็จ', data: [120, 180, 60], backgroundColor: '#2dd4bf', borderRadius: 4 },
      { label: 'ปฏิเสธการนัด', data: [30, 100, 10], backgroundColor: '#fb7185', borderRadius: 4 }
    ]
  };
}
