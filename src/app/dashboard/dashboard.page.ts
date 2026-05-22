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

  customHBarData: { label: string, value: number, icon: string, color: string, bgClass: string, widthPercent: number }[] = [];
  public isExportDropdownOpen = false;

  // Real data xray stats
  public allXrayData: any[] = [];
  public monthlyTotalCases: number = 0;
  public monthlyUrgentCases: number = 0;
  public monthlyNormalCases: number = 0;
  public currentMonthLabel: string = '';
  public dailyStats: { dateStr: string, urgent: number, normal: number, isToday?: boolean }[] = [];

  // Real data consult stats
  public allConsultData: any[] = [];
  public consultsTotalCount: number = 0;
  public referCount: number = 0;
  public teleCount: number = 0;
  public referPercentage: number = 0;
  public telePercentage: number = 0;
  public consultCardsData = {
    brain: { success: 0, miss: 0 },
    chest: { success: 0, miss: 0 },
    eye: { success: 0, miss: 0 }
  };
  
  public badge1Position: any = { top: '-10px', right: '-10px', transform: 'none' };
  public badge2Position: any = { bottom: '-10px', left: '-10px', transform: 'none' };

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
    // 1. Get Consult Dashboard Stats
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.dashboardData = data;
        // Initialize custom HBar data for HTML rendering (with mockup values as robust fallback)
        const consultCats = this.dashboardData.consultCategories || {
          labels: ['สมอง', 'ทรวงอก', 'ดวงตา'],
          values: [110, 80, 50]
        };
        const colors = ['#f89b71', '#2dd4bf', '#3b82f6']; // Orange, Teal, Blue from mockup
        const bgClasses = ['bg-pink', 'bg-teal', 'bg-blue'];
        const icons = ['fluent-emoji-flat:brain', 'fluent-emoji-flat:x-ray', 'fluent-emoji-flat:eye'];
        this.customHBarData = consultCats.labels.map((label: string, index: number) => ({
          label,
          value: consultCats.values[index],
          icon: icons[index] || 'fluent-emoji-flat:clipboard',
          color: colors[index] || '#cbd5e1',
          bgClass: bgClasses[index] || 'bg-blue',
          widthPercent: Math.round((consultCats.values[index] / 110) * 80)
        }));
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
      }
    });

    // 2. Get Real Xrays to calculate stats dynamically
    this.apiService.getXrays().subscribe({
      next: (xrays) => {
        this.allXrayData = xrays;
        this.calculateXrayStats(xrays);
      },
      error: (err) => {
        console.error('Failed to load xray data', err);
      }
    });

    // 3. Get Real Consults to calculate stats dynamically
    this.apiService.getConsults().subscribe({
      next: (consults) => {
        this.allConsultData = consults;
        this.calculateConsultStats(consults);
      },
      error: (err) => {
        console.error('Failed to load consult data', err);
      }
    });
  }

  calculateXrayStats(xrays: any[]) {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentThaiYear = currentYear > 2500 ? currentYear : currentYear + 543;
    
    this.currentMonthLabel = `${thaiMonths[today.getMonth()]} ${currentThaiYear}`;

    // Filter current month cases
    const monthCases = xrays.filter(item => {
      if (!item.orderDate) return false;
      const dateParts = item.orderDate.split(' ')[0].split(/[\/\-]/);
      if (dateParts.length < 3) return false;

      let d = parseInt(dateParts[0], 10);
      let m = parseInt(dateParts[1], 10);
      let y = parseInt(dateParts[2], 10);

      if (dateParts[0].length === 4) {
        y = parseInt(dateParts[0], 10);
        m = parseInt(dateParts[1], 10);
        d = parseInt(dateParts[2], 10);
      }

      // Convert year to CE for comparison if it's in BE
      let compareYear = y > 2500 ? y - 543 : y;
      let compareCurrentYear = currentYear > 2500 ? currentYear - 543 : currentYear;

      return m === currentMonth && compareYear === compareCurrentYear;
    });

    this.monthlyTotalCases = monthCases.length;
    this.monthlyUrgentCases = monthCases.filter(item => item.priority === 'Urgent').length;
    this.monthlyNormalCases = monthCases.filter(item => item.priority === 'Normal').length;

    // Daily Stats Carousel dates (Today + next 3 days)
    const targetDates = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const thaiYearStr = d.getFullYear() > 2500 ? d.getFullYear() : d.getFullYear() + 543;
      targetDates.push({
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: `${d.getDate()} ${thaiMonths[d.getMonth()]} ${thaiYearStr}`,
        isToday: i === 0
      });
    }

    this.dailyStats = targetDates.map(target => {
      const dailyCases = xrays.filter(item => {
        if (!item.orderDate) return false;
        const dateParts = item.orderDate.split(' ')[0].split(/[\/\-]/);
        if (dateParts.length < 3) return false;

        let d = parseInt(dateParts[0], 10);
        let m = parseInt(dateParts[1], 10);
        let y = parseInt(dateParts[2], 10);

        if (dateParts[0].length === 4) {
          y = parseInt(dateParts[0], 10);
          m = parseInt(dateParts[1], 10);
          d = parseInt(dateParts[2], 10);
        }

        let itemCompareYear = y > 2500 ? y - 543 : y;
        let targetCompareYear = target.year > 2500 ? target.year - 543 : target.year;

        return d === target.day && m === target.month && itemCompareYear === targetCompareYear;
      });

      return {
        dateStr: target.label,
        isToday: target.isToday || false,
        urgent: dailyCases.filter(item => item.priority === 'Urgent').length,
        normal: dailyCases.filter(item => item.priority === 'Normal').length
      };
    });
  }

  calculateConsultStats(consults: any[]) {
    this.consultsTotalCount = consults.length;

    // Method breakdown (ส่งต่อเคส, Tele Consult)
    const referList = consults.filter(item => item.method === 'ส่งต่อเคส');
    const teleList = consults.filter(item => item.method === 'Tele Consult');

    this.referCount = referList.length;
    this.teleCount = teleList.length;

    if (this.consultsTotalCount > 0) {
      this.referPercentage = Math.round((this.referCount / this.consultsTotalCount) * 100);
      this.telePercentage = Math.round((this.teleCount / this.consultsTotalCount) * 100);
    } else {
      this.referPercentage = 0;
      this.telePercentage = 0;
    }

    // Update Donut Chart Data
    this.doughnutChartData = {
      labels: [`ส่งต่อเคส\t\t${this.referCount} เคส`, `Tele Consult\t${this.teleCount} เคส`],
      datasets: [
        {
          data: [this.referCount, this.teleCount],
          backgroundColor: ['#fb7185', '#fbbf24'],
          borderWidth: 0
        }
      ]
    };

    // Calculate badge positions dynamically based on angles
    if (this.consultsTotalCount > 0) {
      const radius = 105; // Distance from center
      const centerX = 100;
      const centerY = 100;

      const angle1 = (this.referCount / this.consultsTotalCount) * 360;
      const midAngle1 = -90 + (angle1 / 2);
      const rad1 = midAngle1 * (Math.PI / 180);
      const x1 = centerX + radius * Math.cos(rad1);
      const y1 = centerY + radius * Math.sin(rad1);
      
      this.badge1Position = {
        left: `${x1}px`,
        top: `${y1}px`,
        transform: 'translate(-50%, -50%)'
      };

      const angle2 = (this.teleCount / this.consultsTotalCount) * 360;
      const midAngle2 = -90 + angle1 + (angle2 / 2);
      const rad2 = midAngle2 * (Math.PI / 180);
      const x2 = centerX + radius * Math.cos(rad2);
      const y2 = centerY + radius * Math.sin(rad2);
      
      this.badge2Position = {
        left: `${x2}px`,
        top: `${y2}px`,
        transform: 'translate(-50%, -50%)'
      };
    }

    // Category breakdown for HBar (สมอง, ทรวงอก, ดวงตา)
    const categories = ['สมอง', 'ทรวงอก', 'ดวงตา'];
    const colors = ['#f89b71', '#2dd4bf', '#3b82f6']; // Orange, Teal, Blue from mockup
    const bgClasses = ['bg-pink', 'bg-teal', 'bg-blue'];
    const icons = ['ic_cat_brain.png', 'ic_cat_chest.png', 'ic_cat_eye.png'];

    // Find the max value to scale the bars correctly and avoid overflow
    const categoryValues = categories.map(cat => consults.filter(item => item.category === cat).length);
    const maxVal = Math.max(...categoryValues, 1);

    this.customHBarData = categories.map((label, index) => {
      const value = categoryValues[index];
      const widthPercent = Math.round((value / maxVal) * 80); // max 80% width to prevent text overflow
      return {
        label,
        value,
        icon: icons[index] || 'fluent-emoji-flat:clipboard',
        color: colors[index] || '#cbd5e1',
        bgClass: bgClasses[index] || 'bg-blue',
        widthPercent
      };
    });

    // Update Horizontal Bar Chart Data (for Excel export)
    this.horizontalBarData = {
      labels: categories,
      datasets: [
        {
          data: categories.map(cat => consults.filter(item => item.category === cat).length),
          backgroundColor: ['#f97316', '#14b8a6', '#3b82f6'],
          borderRadius: 4,
          barThickness: 15
        }
      ]
    };

    // Clustered Bar Chart Data (รอตอบรับ, การนัดสำเร็จ, ปฏิเสธการนัด) per category
    const waitData = categories.map(cat => consults.filter(item => item.category === cat && item.status === 'รอตอบรับ').length);
    const successData = categories.map(cat => consults.filter(item => item.category === cat && item.status === 'การนัดสำเร็จ').length);
    const rejectData = categories.map(cat => consults.filter(item => item.category === cat && item.status === 'ปฏิเสธการนัด').length);

    this.clusteredBarData = {
      labels: categories,
      datasets: [
        {
          label: 'รอตอบรับ',
          data: waitData,
          backgroundColor: '#ffb356',
          borderRadius: { topLeft: 12, topRight: 12 },
          borderSkipped: 'bottom'
        },
        {
          label: 'การนัดสำเร็จ',
          data: successData,
          backgroundColor: '#5cd1be',
          borderRadius: { topLeft: 12, topRight: 12 },
          borderSkipped: 'bottom'
        },
        {
          label: 'ปฏิเสธการนัด',
          data: rejectData,
          backgroundColor: '#ff7888',
          borderRadius: { topLeft: 12, topRight: 12 },
          borderSkipped: 'bottom'
        }
      ]
    };

    // Bottom Consult Cards Data (Consult สำเร็จ, ขาดการติดต่อ)
    this.consultCardsData = {
      brain: {
        success: consults.filter(item => item.category === 'สมอง' && item.status === 'การนัดสำเร็จ').length,
        miss: consults.filter(item => item.category === 'สมอง' && item.status === 'ขาดการติดต่อ').length
      },
      chest: {
        success: consults.filter(item => item.category === 'ทรวงอก' && item.status === 'การนัดสำเร็จ').length,
        miss: consults.filter(item => item.category === 'ทรวงอก' && item.status === 'ขาดการติดต่อ').length
      },
      eye: {
        success: consults.filter(item => item.category === 'ดวงตา' && item.status === 'การนัดสำเร็จ').length,
        miss: consults.filter(item => item.category === 'ดวงตา' && item.status === 'ขาดการติดต่อ').length
      }
    };
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
    cutout: '80%',
    plugins: {
      legend: { display: false }
    }
  };
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['ส่งต่อเคส\t\t800 เคส', 'Tele Consult\t200 เคส'],
    datasets: [
      {
        data: [800, 200],
        backgroundColor: ['#fb7185', '#fbbf24'],
        borderWidth: 0
      }
    ]
  };

  // Clustered Bar Chart
  public clusteredBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        grace: '5%',
        ticks: {
          stepSize: 50,
          font: { family: 'Prompt', size: 11 }
        },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { family: 'Prompt', size: 12, weight: 'bold' }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { usePointStyle: true, boxWidth: 8, padding: 20, font: { family: 'Prompt', size: 12 } }
      },
      tooltip: {
        enabled: false, // We disable native rendering to draw our custom figma one
        external: (context: any) => {
          let tooltipEl = document.getElementById('chartjs-tooltip');

          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.style.background = '#474554';
            tooltipEl.style.borderRadius = '12px';
            tooltipEl.style.color = 'white';
            tooltipEl.style.opacity = '0';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.transition = 'all .1s ease';
            tooltipEl.style.fontFamily = 'Prompt, sans-serif';
            tooltipEl.style.padding = '12px 16px';
            tooltipEl.style.minWidth = '165px';
            tooltipEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            tooltipEl.style.zIndex = '1000';
            document.body.appendChild(tooltipEl);
          }

          const tooltipModel = context.tooltip;
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }

          if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];
            const bodyLines = tooltipModel.body.map((b: any) => b.lines);

            let innerHtml = '<div style="text-align: center; margin-bottom: 8px; font-weight: bold; font-size: 14px; color: #ffffff; font-family: Prompt;">';
            titleLines.forEach((title: string) => {
              innerHtml += title;
            });
            innerHtml += '</div>';

            innerHtml += '<div style="background: white; border-radius: 20px; padding: 6px 14px; color: #1e293b; font-size: 12px; font-weight: 700; text-align: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); font-family: Prompt; white-space: nowrap;">';
            bodyLines.forEach((body: string) => {
              innerHtml += body;
            });
            innerHtml += '</div>';

            // Caret (arrow pointing down)
            innerHtml += '<div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #474554;"></div>';

            tooltipEl.innerHTML = innerHtml;
          }

          const position = context.chart.canvas.getBoundingClientRect();

          tooltipEl.style.opacity = '1';
          tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX - (tooltipEl.offsetWidth / 2) + 'px';
          tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - tooltipEl.offsetHeight - 12 + 'px';
        },
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ' ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' เคส';
            }
            return label;
          }
        }
      }
    }
  };
  public clusteredBarData: ChartData<'bar'> = {
    labels: ['สมอง', 'ทรวงอก', 'ดวงตา'],
    datasets: [
      {
        label: 'รอตอบรับ',
        data: [50, 70, 20],
        backgroundColor: '#ffb356',
        borderRadius: { topLeft: 12, topRight: 12 },
        borderSkipped: 'bottom'
      },
      {
        label: 'การนัดสำเร็จ',
        data: [120, 180, 60],
        backgroundColor: '#5cd1be',
        borderRadius: { topLeft: 12, topRight: 12 },
        borderSkipped: 'bottom'
      },
      {
        label: 'ปฏิเสธการนัด',
        data: [30, 100, 10],
        backgroundColor: '#ff7888',
        borderRadius: { topLeft: 12, topRight: 12 },
        borderSkipped: 'bottom'
      }
    ]
  };
}
