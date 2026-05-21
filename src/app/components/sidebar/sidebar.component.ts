import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, scanOutline, calendarOutline, peopleOutline, documentTextOutline, logOutOutline, menuOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonIcon]
})
export class SidebarComponent  implements OnInit {
  public layout = inject(LayoutService);

  constructor() {
    addIcons({ gridOutline, scanOutline, calendarOutline, peopleOutline, documentTextOutline, logOutOutline, menuOutline, chevronUpOutline, chevronDownOutline });
  }

  ngOnInit() {}

  isXrayMenuExpanded = true;

  toggleXrayMenu() {
    if (this.layout.isSidebarCollapsed()) {
      this.layout.toggleSidebar();
      this.isXrayMenuExpanded = true;
    } else {
      this.isXrayMenuExpanded = !this.isXrayMenuExpanded;
    }
  }

  toggleSidebar() {
    this.layout.toggleSidebar();
  }

  alertMockup() {
    alert('ระบบจำลอง: กำลังเปิดหน้ารายการรอ X-ray...');
  }
}
