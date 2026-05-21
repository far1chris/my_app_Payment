import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, notificationsOutline, personOutline, medkitOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class HeaderComponent  implements OnInit {

  constructor() {
    addIcons({ chevronDownOutline, notificationsOutline, personOutline, medkitOutline });
  }

  ngOnInit() {}

  openLocation() {
    alert('ระบบจำลอง: เลือกหน่วยบริการ');
  }

  openNotifications() {
    alert('ระบบจำลอง: เปิดรายการแจ้งเตือน (Notifications)');
  }

  openProfile() {
    alert('ระบบจำลอง: เปิดเมนูโปรไฟล์ผู้ใช้งาน');
  }
}
