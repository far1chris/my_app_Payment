import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonPopover, IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, notificationsOutline, personOutline, medkitOutline, logOutOutline, settingsOutline, alertCircleOutline, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonPopover, IonContent]
})
export class HeaderComponent  implements OnInit {
  public componentId: string;

  constructor() {
    this.componentId = Math.random().toString(36).substring(2, 9);
    addIcons({ chevronDownOutline, notificationsOutline, personOutline, medkitOutline, logOutOutline, settingsOutline, alertCircleOutline, checkmarkCircle });
  }

  ngOnInit() {}
}
