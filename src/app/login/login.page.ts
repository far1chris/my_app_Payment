import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { medkitOutline, gitNetworkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon]
})
export class LoginPage implements OnInit {
  private router = inject(Router);

  constructor() {
    addIcons({ medkitOutline, gitNetworkOutline });
  }

  ngOnInit() {
  }

  login() {
    this.router.navigate(['/xray-list']);
  }
}
