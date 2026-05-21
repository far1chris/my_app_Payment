import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import { addIcons } from 'ionicons';
import { searchOutline, optionsOutline, chevronBackOutline, chevronForwardOutline, eyeOutline, cloudUploadOutline, filterOutline, pushOutline, informationCircleOutline, eye } from 'ionicons/icons';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-xray-list',
  templateUrl: './xray-list.page.html',
  styleUrls: ['./xray-list.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, SidebarComponent, HeaderComponent, IonIcon]
})
export class XrayListPage implements OnInit {
  private apiService = inject(ApiService);
  public xrayDataList: any[] = [];
  public isLoading = true;

  constructor() {
    addIcons({ searchOutline, optionsOutline, chevronBackOutline, chevronForwardOutline, eyeOutline, cloudUploadOutline, filterOutline, pushOutline, informationCircleOutline, eye });
  }

  ngOnInit() {
    this.apiService.getXrays().subscribe({
      next: (data) => {
        this.xrayDataList = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load xrays', err);
        this.isLoading = false;
      }
    });
  }

  public activeTab: string = 'brain';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  uploadFile() {
    alert('ระบบจำลอง: กำลังเปิดหน้าต่างอัปโหลดไฟล์ X-ray...');
  }

  advancedFilter() {
    alert('ระบบจำลอง: กำลังเปิดหน้าต่างตัวกรองขั้นสูง...');
  }

  exportData() {
    alert('ระบบจำลอง: กำลังเตรียมไฟล์เพื่อส่งออก (Export)...');
  }

  viewDetails(orderNo: string) {
    alert('ระบบจำลอง: กำลังเปิดหน้ารายละเอียดของรายการ ' + orderNo);
  }

  changePage(page: number) {
    alert('ระบบจำลอง: กำลังเปลี่ยนไปยังหน้าที่ ' + page);
  }
}
