import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, scanOutline, calendarOutline, peopleOutline, documentTextOutline, logOutOutline, menuOutline, chevronUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonIcon]
})
export class SidebarComponent  implements OnInit {

  constructor() {
    addIcons({ gridOutline, scanOutline, calendarOutline, peopleOutline, documentTextOutline, logOutOutline, menuOutline, chevronUpOutline });
  }

  ngOnInit() {}

}
