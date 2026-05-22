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
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, SidebarComponent, HeaderComponent, BaseChartDirective, IonIcon, RouterLink]
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
          backgroundColor: ['#f58a93', '#eab263'],
          borderWidth: 0,
          spacing: 4,
          borderRadius: 20
        }
      ]
    };

    // Calculate badge positions dynamically based on angles
    if (this.consultsTotalCount > 0) {
      const centerX = 100;
      const centerY = 100;
      const radius = 95; // Position badges so they slightly overlap the chart perfectly

      // Calculate angles based on the data
      // ChartJS starts at -90 degrees (top center) and draws clockwise.
      // Wait, we need to ensure the order matches the datasets.
      // The dataset is: referCount (pink), teleCount (yellow)
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

    if (this.activeTab === 'xray') {
      // 1. Column Layout: clean 4-column dedicated X-ray statistics layout
      sheet.columns = [
        { width: 30 }, // Column A: รายการ/วันที่
        { width: 18 }, // Column B: เคสปกติ (เคส)
        { width: 18 }, // Column C: เคสด่วน (เคส)
        { width: 18 }  // Column D: รวม (เคส)
      ];

      // 2. Main Title merged A1:D2 (Dark blue banner)
      sheet.mergeCells('A1:D2');
      const title = sheet.getCell('A1');
      title.value = `รายงานสรุปสถิติ X-ray (ประจำเดือน ${this.currentMonthLabel})`;
      title.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102A6B' } };
      title.alignment = { vertical: 'middle', horizontal: 'center' };

      // 3. Section 1: สถิติการนัดหมาย X-ray ประจำเดือน
      sheet.mergeCells('A4:D4');
      const secTitle1 = sheet.getCell('A4');
      secTitle1.value = 'สถิติการนัดหมาย X-ray ประจำเดือน';
      secTitle1.font = { size: 12, bold: true, name: 'Prompt' };
      secTitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      secTitle1.alignment = { vertical: 'middle', horizontal: 'left' };

      // Headers for Section 1 (Row 5)
      const row5 = sheet.getRow(5);
      row5.getCell(1).value = 'ประเภทเคส';
      row5.getCell(2).value = 'จำนวน (เคส)';
      
      [row5.getCell(1), row5.getCell(2)].forEach(c => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });

      // Data for Section 1 (Rows 6-8)
      const row6 = sheet.getRow(6);
      row6.getCell(1).value = 'เคสปกติ';
      row6.getCell(2).value = this.monthlyNormalCases;

      const row7 = sheet.getRow(7);
      row7.getCell(1).value = 'เคสด่วน';
      row7.getCell(2).value = this.monthlyUrgentCases;

      const row8 = sheet.getRow(8);
      row8.getCell(1).value = 'เคสทั้งหมด (รวม)';
      row8.getCell(2).value = this.monthlyTotalCases;

      [row6, row7, row8].forEach((row, i) => {
        row.getCell(1).font = { name: 'Prompt', bold: i === 2 };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

        row.getCell(2).font = { name: 'Prompt', bold: i === 2 };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

        if (i === 2) {
          row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        }
      });

      // 4. Section 2: สถิติการนัดหมาย X-ray รายวัน (Daily Stats)
      sheet.mergeCells('A10:D10');
      const secTitle2 = sheet.getCell('A10');
      secTitle2.value = 'สถิติการนัดหมาย X-ray รายวัน (Daily Stats)';
      secTitle2.font = { size: 12, bold: true, name: 'Prompt' };
      secTitle2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      secTitle2.alignment = { vertical: 'middle', horizontal: 'left' };

      // Headers for Section 2 (Row 11)
      const row11 = sheet.getRow(11);
      row11.values = ['วันที่', 'เคสปกติ (เคส)', 'เคสด่วน (เคส)', 'รวม (เคส)'];
      row11.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
      row11.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });

      // Data for Section 2 (Rows 12+)
      let rIndex = 12;
      this.dailyStats.forEach(stat => {
        const row = sheet.getRow(rIndex);
        const total = stat.normal + stat.urgent;
        row.values = [stat.dateStr, stat.normal, stat.urgent, total];
        row.font = { name: 'Prompt' };

        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

        for (let col = 1; col <= 4; col++) {
          row.getCell(col).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
          if (stat.isToday) {
            row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }; // Light blue highlight for today
            row.getCell(col).font = { name: 'Prompt', bold: true };
          }
        }
        rIndex++;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'xray_dashboard_stats.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } else {
      // EXISTING APPROVED PREMIUM CONSULT EXPORT
      // Helper to generate premium high-resolution white card for charts
      const generatePremiumChartCard = (canvas: HTMLCanvasElement, title: string, cardHeight: number = 450): string => {
        const cardWidth = 800;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cardWidth;
        tempCanvas.height = cardHeight;
        const ctx = tempCanvas.getContext('2d');
        
        if (!ctx) return canvas.toDataURL('image/png');

        // 1. Draw smooth white card background with rounded corners
        ctx.fillStyle = '#FFFFFF';
        const r = 24; // smooth rounded corners
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.arcTo(cardWidth, 0, cardWidth, cardHeight, r);
        ctx.arcTo(cardWidth, cardHeight, 0, cardHeight, r);
        ctx.arcTo(0, cardHeight, 0, 0, r);
        ctx.arcTo(0, 0, cardWidth, 0, r);
        ctx.closePath();
        ctx.fill();

        // 2. Card outline border (slate-200)
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 3. Card Title (Slate-900)
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px Prompt, sans-serif';
        ctx.fillText(title, 32, 45);

        // 4. Subtle card header divider
        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(32, 65);
        ctx.lineTo(cardWidth - 32, 65);
        ctx.stroke();

        // 5. Draw and scale original chart canvas inside card body
        const paddingX = 40;
        const paddingY = 90;
        const availWidth = cardWidth - paddingX * 2;
        const availHeight = cardHeight - paddingY - 30;

        const chartAspect = canvas.width / canvas.height;
        const targetAspect = availWidth / availHeight;
        
        let drawWidth = availWidth;
        let drawHeight = availHeight;
        
        if (chartAspect > targetAspect) {
          drawHeight = availWidth / chartAspect;
        } else {
          drawWidth = availHeight * chartAspect;
        }

        const drawX = paddingX + (availWidth - drawWidth) / 2;
        const drawY = paddingY + (availHeight - drawHeight) / 2;

        ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);

        // 6. Draw center text & floating percentage badges specifically for Donut chart to match visual excellence
        if (title === 'สถิติรูปแบบการ Consult') {
          const centerX = drawX + drawWidth / 2;
          const centerY = drawY + drawHeight / 2;

          // Draw center total count (e.g. 1,000)
          ctx.fillStyle = '#1E3A8A';
          ctx.font = 'bold 28px Prompt, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.consultsTotalCount.toLocaleString(), centerX, centerY - 12);

          // Draw center label
          ctx.fillStyle = '#64748B';
          ctx.font = '500 12px Prompt, sans-serif';
          ctx.fillText('เคสทั้งหมด', centerX, centerY + 14);

          // Draw floating badges
          const drawBadge = (bx: number, by: number, percentStr: string, labelStr: string) => {
            const w = 100;
            const h = 46;
            const rx = bx - w / 2;
            const ry = by - h / 2;
            const br = 10; // border radius

            // Shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            // Background
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(rx + br, ry);
            ctx.arcTo(rx + w, ry, rx + w, ry + h, br);
            ctx.arcTo(rx + w, ry + h, rx, ry + h, br);
            ctx.arcTo(rx, ry + h, rx, ry, br);
            ctx.arcTo(rx, ry, rx + w, ry, br);
            ctx.closePath();
            ctx.fill();

            // Reset shadow to avoid affecting text/border
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Border (slate-200)
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Percentage Text
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 14px Prompt, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(percentStr, bx, ry + 6);

            // Label Text
            ctx.fillStyle = '#64748B';
            ctx.font = '500 10px Prompt, sans-serif';
            ctx.fillText(labelStr, bx, ry + 24);
          };

          // Positions (Radius of 105px places them elegantly over donut slices)
          const radius = 105;
          
          // Badge 1 (Refer: 80% at 54 degrees)
          const rad1 = 54 * (Math.PI / 180);
          const b1X = centerX + radius * Math.cos(rad1);
          const b1Y = centerY + radius * Math.sin(rad1);
          drawBadge(b1X, b1Y, `${this.referPercentage} %`, 'ส่งต่อเคส');

          // Badge 2 (Tele: 20% at 234 degrees)
          const rad2 = 234 * (Math.PI / 180);
          const b2X = centerX + radius * Math.cos(rad2);
          const b2Y = centerY + radius * Math.sin(rad2);
          drawBadge(b2X, b2Y, `${this.telePercentage} %`, 'Tele Consult');
        }

        return tempCanvas.toDataURL('image/png');
      };

      // 1. Column Layout: Left side for data, spacer column, and wide right pane for chart cards
      sheet.columns = [
        { width: 25 }, { width: 20 }, { width: 20 }, { width: 20 }, // columns A to D
        { width: 5 },  // column E (spacer column separating grid and chart card panel)
        { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, // columns F to I
        { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }  // columns J to M
      ];

      // 2. Main Title spanning the entire dashboard sheet (Columns A to M)
      sheet.mergeCells('A1:M2');
      const title = sheet.getCell('A1');
      title.value = 'รายงานสรุปสถิติ 1LIFE System';
      title.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102A6B' } };
      title.alignment = { vertical: 'middle', horizontal: 'center' };

      // 3. Fill the right side pane (Columns E to M) with light grayish-blue background (#F0F4F8)
      // This turns off visual gridlines and acts as a beautiful canvas container for the white card panels.
      for (let r = 3; r <= 50; r++) {
        const row = sheet.getRow(r);
        for (let c = 5; c <= 13; c++) {
          const cell = row.getCell(c);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F4F8' }
          };
        }
      }

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

      // Embed premium card chart images
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length >= 3) {
        try {
          const c1 = canvases[0] as HTMLCanvasElement;
          const c2 = canvases[1] as HTMLCanvasElement;
          const c3 = canvases[2] as HTMLCanvasElement;

          // Generate high-resolution, solid white cards with rounded corners and titles for Excel embedding
          const card1Data = generatePremiumChartCard(c1, 'สถิติประเภทของการขอ Consult', 450);
          const card2Data = generatePremiumChartCard(c2, 'สถิติรูปแบบการ Consult', 450);
          const card3Data = generatePremiumChartCard(c3, 'สถิติแยกตามสถานะ', 520); // slightly taller for detailed clustered chart

          const img1 = workbook.addImage({ base64: card1Data, extension: 'png' });
          const img2 = workbook.addImage({ base64: card2Data, extension: 'png' });
          const img3 = workbook.addImage({ base64: card3Data, extension: 'png' });

          // Add premium chart cards with clean retina display sizing (scaled perfectly inside the light-blue panel)
          sheet.addImage(img1, { tl: { col: 5, row: 3 }, ext: { width: 500, height: 280 } });
          sheet.addImage(img2, { tl: { col: 5, row: 18 }, ext: { width: 500, height: 280 } });
          sheet.addImage(img3, { tl: { col: 5, row: 33 }, ext: { width: 500, height: 325 } });
        } catch (err) {
          console.error('Failed to embed chart images in Excel:', err);
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'consult_dashboard_stats.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  exportToCsv() {
    this.closeExportDropdown();
    const csvRows: string[] = [];

    if (this.activeTab === 'xray') {
      csvRows.push(`รายงานสรุปสถิติ X-ray (ประจำเดือน ${this.currentMonthLabel})`);
      csvRows.push('');
      csvRows.push('สถิติการนัดหมาย X-ray ประจำเดือน');
      csvRows.push('ประเภทเคส,จำนวน (เคส)');
      csvRows.push(`เคสปกติ,${this.monthlyNormalCases}`);
      csvRows.push(`เคสด่วน,${this.monthlyUrgentCases}`);
      csvRows.push(`เคสทั้งหมด (รวม),${this.monthlyTotalCases}`);
      csvRows.push('');
      csvRows.push('สถิติการนัดหมาย X-ray รายวัน (Daily Stats)');
      csvRows.push('วันที่,เคสปกติ (เคส),เคสด่วน (เคส),รวม (เคส)');
      this.dailyStats.forEach(stat => {
        const total = stat.normal + stat.urgent;
        csvRows.push(`${stat.dateStr},${stat.normal},${stat.urgent},${total}`);
      });

      const csvData = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'xray_dashboard_stats.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // EXISTING APPROVED CSV EXPORT FOR CONSULT
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
        link.setAttribute('download', 'consult_dashboard_stats.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
    cutout: '72%',
    plugins: {
      legend: { display: false }
    },
    layout: { padding: 0 }
  };
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['ส่งต่อเคส\t\t800 เคส', 'Tele Consult\t200 เคส'],
    datasets: [
      {
        data: [800, 200],
        backgroundColor: ['#f58a93', '#eab263'],
        borderWidth: 0,
        spacing: 4,
        borderRadius: 20
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
