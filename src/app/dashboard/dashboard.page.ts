import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, ActionSheetController } from '@ionic/angular/standalone';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { addIcons } from 'ionicons';
import { ellipsisHorizontalOutline, timeOutline, pushOutline, calendarOutline, chevronForwardOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { LayoutService } from '../services/layout.service';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, SidebarComponent, HeaderComponent, BaseChartDirective, IonIcon]
})
export class DashboardPage implements OnInit {
  activeTab: 'xray' | 'consult' = 'xray';
  public layout = inject(LayoutService);
  private apiService = inject(ApiService);
  public dashboardData: any = null;
  public isExportDropdownOpen = false;

  constructor() {
    addIcons({ ellipsisHorizontalOutline, timeOutline, pushOutline, calendarOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  setActiveTab(tab: 'xray' | 'consult') {
    this.activeTab = tab;
  }

  async loadData() {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.dashboardData = data;
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
      }
    });
  }

  toggleExportDropdown() {
    this.isExportDropdownOpen = !this.isExportDropdownOpen;
  }

  closeExportDropdown() {
    this.isExportDropdownOpen = false;
  }

  async exportToXlsx() {
    this.closeExportDropdown();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Dashboard Stats');

    // 1. Column Widths
    sheet.columns = [
      { width: 25 }, { width: 20 }, { width: 20 }, { width: 20 }
    ];

    // 2. Main Title
    sheet.mergeCells('A1:D2');
    const title = sheet.getCell('A1');
    title.value = 'รายงานสรุปสถิติ 1LIFE System';
    title.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102A6B' } };
    title.alignment = { vertical: 'middle', horizontal: 'center' };

    let currentRow = 4;

    const addSection = (title: string, headers: string[], dataRows: any[]) => {
      // Section Title
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const secTitle = sheet.getCell(`A${currentRow}`);
      secTitle.value = title;
      secTitle.font = { size: 12, bold: true, name: 'Prompt' };
      secTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      secTitle.alignment = { vertical: 'middle', horizontal: 'left' };
      currentRow++;

      // Headers
      const headerRow = sheet.getRow(currentRow);
      headerRow.values = headers;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
      headerRow.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      currentRow++;

      // Data
      dataRows.forEach(rowValues => {
        const row = sheet.getRow(currentRow);
        row.values = rowValues;
        row.font = { name: 'Prompt' };
        row.eachCell((c, colNumber) => {
          c.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
          c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        });
        currentRow++;
      });
      
      currentRow += 2; // spacing
    };

    // Data for sections
    const hBarLabels = this.horizontalBarData.labels as string[];
    const hBarData = this.horizontalBarData.datasets[0].data as number[];
    addSection('สถิติประเภทของการขอ Consult', ['ประเภท', 'จำนวน (เคส)'], hBarLabels.map((lbl, i) => [lbl, hBarData[i]]));

    const donutLabels = this.doughnutChartData.labels as string[];
    const donutData = this.doughnutChartData.datasets[0].data as number[];
    addSection('สถิติรูปแบบการ Consult', ['รูปแบบ', 'จำนวน (เคส)'], donutLabels.map((lbl, i) => [lbl, donutData[i]]));

    const clusterLabels = this.clusteredBarData.labels as string[];
    const clusterDatasets = this.clusteredBarData.datasets;
    addSection('สถิติแยกตามสถานะ', ['ประเภท', 'รอรับ', 'การนัดสำเร็จ', 'ปฏิเสธการนัด'], 
      clusterLabels.map((lbl, i) => [lbl, clusterDatasets[0].data[i], clusterDatasets[1].data[i], clusterDatasets[2].data[i]])
    );

    // Embed chart images with correct aspect ratios
    const canvases = document.querySelectorAll('canvas');
    if (canvases.length >= 3) {
      const c1 = canvases[0] as HTMLCanvasElement;
      const c2 = canvases[1] as HTMLCanvasElement;
      const c3 = canvases[2] as HTMLCanvasElement;

      // Fill transparent backgrounds with white before capturing (optional, but good for excel)
      // We will just grab toDataURL for now, ChartJS background is transparent by default but excel handles it ok
      const img1 = workbook.addImage({ base64: c1.toDataURL('image/png'), extension: 'png' });
      const img2 = workbook.addImage({ base64: c2.toDataURL('image/png'), extension: 'png' });
      const img3 = workbook.addImage({ base64: c3.toDataURL('image/png'), extension: 'png' });

      // Calculate width/height to avoid stretching. Let's scale down by 1.5
      sheet.addImage(img1, { tl: { col: 5, row: 3 }, ext: { width: Math.round(c1.width * 0.7), height: Math.round(c1.height * 0.7) } });
      sheet.addImage(img2, { tl: { col: 5, row: 13 }, ext: { width: Math.round(c2.width * 0.7), height: Math.round(c2.height * 0.7) } });
      sheet.addImage(img3, { tl: { col: 5, row: 28 }, ext: { width: Math.round(c3.width * 0.7), height: Math.round(c3.height * 0.7) } });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dashboard_stats.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToCsv() {
    this.closeExportDropdown();
    const csvRows: string[] = [];

    // 1. สถิติประเภทของการขอ Consult
    csvRows.push('สถิติประเภทของการขอ Consult');
    csvRows.push('ประเภท,จำนวน (เคส)');
    const hBarLabels = this.horizontalBarData.labels as string[];
    const hBarData = this.horizontalBarData.datasets[0].data as number[];
    hBarLabels.forEach((label, index) => {
      csvRows.push(`${label},${hBarData[index]}`);
    });
    csvRows.push('');

    // 2. สถิติรูปแบบการ Consult
    csvRows.push('สถิติรูปแบบการ Consult');
    csvRows.push('รูปแบบ,จำนวน (เคส)');
    const donutLabels = this.doughnutChartData.labels as string[];
    const donutData = this.doughnutChartData.datasets[0].data as number[];
    donutLabels.forEach((label, index) => {
      csvRows.push(`${label},${donutData[index]}`);
    });
    csvRows.push('');

    // 3. สถิติแยกตามสถานะ
    csvRows.push('สถิติแยกตามสถานะ');
    const clusterLabels = this.clusteredBarData.labels as string[];
    const clusterDatasets = this.clusteredBarData.datasets;
    const clusterHeader = ['ประเภท', ...clusterDatasets.map(ds => ds.label)];
    csvRows.push(clusterHeader.join(','));
    
    clusterLabels.forEach((label, i) => {
      const row = [label];
      clusterDatasets.forEach(ds => {
        row.push(ds.data[i]?.toString() || '0');
      });
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'dashboard_stats.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
