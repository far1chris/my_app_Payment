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

}
