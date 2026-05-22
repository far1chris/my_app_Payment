import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Set background color via JavaScript BEFORE Angular bootstraps.
// Bypasses CSS cascade, Shadow DOM inheritance, and browser CSS cache.
const BG = '#EEF2F8'; // Soft blueish-grey — professional dashboard look
document.documentElement.style.setProperty('--ion-background-color', BG);
document.documentElement.style.setProperty('--background', BG);
document.documentElement.style.backgroundColor = BG;
document.body.style.backgroundColor = BG;

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient()
  ],
});
