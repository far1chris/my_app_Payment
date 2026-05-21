import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/angular/standalone';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import * as ExcelJS from 'exceljs';
import { addIcons } from 'ionicons';
import { searchOutline, optionsOutline, chevronBackOutline, chevronForwardOutline, eyeOutline, cloudUploadOutline, filterOutline, pushOutline, informationCircleOutline, eye, documentTextOutline, closeOutline, person, scanOutline, alertCircleOutline, calendarOutline, printOutline, medkit, imagesOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-xray-list',
  templateUrl: './xray-list.page.html',
  styleUrls: ['./xray-list.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, SidebarComponent, HeaderComponent, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton]
})
export class XrayListPage implements OnInit {
  private apiService = inject(ApiService);
  public layout = inject(LayoutService);
  
  public allXrayData: any[] = [];
  public filteredData: any[] = [];
  public paginatedData: any[] = [];
  public isLoading = true;

  // Filters & State
  public searchTerm: string = '';
  public selectedPriority: string = 'All';
  public activeTab: string = 'all';

  // Pagination
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public totalPagesArray: number[] = [];

  // Modal State
  public isModalOpen: boolean = false;
  public selectedXray: any = null;
  public isExportDropdownOpen: boolean = false;

  constructor() {
    addIcons({ searchOutline, optionsOutline, chevronBackOutline, chevronForwardOutline, eyeOutline, cloudUploadOutline, filterOutline, pushOutline, informationCircleOutline, eye, documentTextOutline, closeOutline, person, scanOutline, alertCircleOutline, calendarOutline, printOutline, medkit, imagesOutline });
  }

  ngOnInit() {
    this.apiService.getXrays().subscribe({
      next: (data) => {
        this.allXrayData = data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load xrays', err);
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.applyFilters();
  }

  getTabCount(tab: string): number {
    return this.allXrayData.filter(item => {
      const examName = (item.examName || '').toLowerCase();
      if (tab === 'brain') return examName.includes('brain') || examName.includes('head');
      if (tab === 'chest') return examName.includes('chest');
      if (tab === 'eye') return examName.includes('eye') || examName.includes('orbit');
      return true;
    }).length;
  }

  applyFilters() {
    let temp = [...this.allXrayData];

    // Apply Tab Filter
    if (this.activeTab !== 'all') {
      temp = temp.filter(item => {
        const examName = (item.examName || '').toLowerCase();
        if (this.activeTab === 'brain') return examName.includes('brain') || examName.includes('head');
        if (this.activeTab === 'chest') return examName.includes('chest');
        if (this.activeTab === 'eye') return examName.includes('eye') || examName.includes('orbit');
        return true;
      });
    }

    // Apply Priority Filter
    if (this.selectedPriority !== 'All') {
      temp = temp.filter(item => item.priority === this.selectedPriority);
    }

    // Apply Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      temp = temp.filter(item => 
        (item.patientName || '').toLowerCase().includes(term) ||
        (item.hn || '').toLowerCase().includes(term) ||
        (item.orderNo || '').toLowerCase().includes(term)
      );
    }

    this.filteredData = temp;
    this.currentPage = 1; // reset to first page on filter change
    this.updatePagination();
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
    this.totalPagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPagesArray.length) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  viewDetails(item: any) {
    this.selectedXray = item;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedXray = null;
  }

  public isUploadModalOpen: boolean = false;
  public isFilterModalOpen: boolean = false;

  uploadFile() {
    this.isUploadModalOpen = true;
  }
  
  closeUploadModal() {
    this.isUploadModalOpen = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      alert(`จำลองการอัปโหลดไฟล์: ${file.name}\nขนาด: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      this.closeUploadModal();
    }
  }

  advancedFilter() {
    this.isFilterModalOpen = true;
  }

  closeFilterModal() {
    this.isFilterModalOpen = false;
    this.isExportDropdownOpen = false;
  }

  toggleExportDropdown() {
    this.isExportDropdownOpen = !this.isExportDropdownOpen;
  }

  closeExportDropdown() {
    this.isExportDropdownOpen = false;
  }

  async exportToXlsx() {
    this.closeExportDropdown();
    if (!this.filteredData || this.filteredData.length === 0) {
      alert('ไม่มีข้อมูลสำหรับ Export');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Xray List');

    // Title
    sheet.mergeCells('A1:H2');
    const title = sheet.getCell('A1');
    title.value = 'รายงานรายการ X-ray ที่นำเข้า (1LIFE System)';
    title.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Sarabun' };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    title.alignment = { vertical: 'middle', horizontal: 'center' };

    // Spacer
    sheet.getRow(3).height = 10;

    // Columns
    sheet.columns = [
      { width: 18 }, { width: 30 }, { width: 15 }, { width: 15 },
      { width: 25 }, { width: 15 }, { width: 15 }, { width: 22 }
    ];

    // Headers
    const headers = ['เลขที่รายการ', 'ชื่อผู้ป่วย', 'H/N', 'ประเภท X-ray', 'ชื่อการตรวจ', 'ความเร่งด่วน', 'สถานะ', 'วันที่ X-ray'];
    const headerRow = sheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 25;
    headerRow.font = { bold: true, color: { argb: 'FF000000' }, name: 'Sarabun', size: 12 };
    headerRow.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      c.border = { top: { style: 'thin', color: { argb: 'FF9CA3AF' } }, bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } }, left: { style: 'thin', color: { argb: 'FF9CA3AF' } }, right: { style: 'thin', color: { argb: 'FF9CA3AF' } } };
    });

    // Data
    let currentRow = 5;
    this.filteredData.forEach((row, index) => {
      const r = sheet.getRow(currentRow++);
      r.height = 22;
      r.values = [
        row.orderNo,
        row.patientName,
        row.hn,
        row.modality,
        row.examName,
        row.priority,
        row.status,
        row.orderDate
      ];
      r.font = { name: 'Sarabun', size: 11 };
      r.eachCell((c, colNumber) => {
        c.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 5) ? 'left' : 'center' };
        c.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        // Alternating rows
        if (index % 2 === 1) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }
      });
      
      // Status Color
      const statusCell = r.getCell(7);
      if (row.status === 'รอรับผล') {
        statusCell.font = { color: { argb: 'FFD97706' }, bold: true, name: 'Sarabun' };
      } else if (row.status === 'ยืนยันผลแล้ว') {
        statusCell.font = { color: { argb: 'FF059669' }, bold: true, name: 'Sarabun' };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'xray_list_premium_export.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToCsv() {
    this.closeExportDropdown();
    if (!this.filteredData || this.filteredData.length === 0) {
      alert('ไม่มีข้อมูลสำหรับ Export');
      return;
    }

    const headers = ['Order No', 'Patient Name', 'H/N', 'Modality', 'Exam Name', 'Priority', 'Status', 'Order Date'];
    const csvRows = [headers.join(',')];

    for (const row of this.filteredData) {
      const values = [
        row.orderNo,
        `"${row.patientName}"`,
        row.hn,
        row.modality,
        `"${row.examName}"`,
        row.priority,
        row.status,
        row.orderDate
      ];
      csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'xray_list_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
