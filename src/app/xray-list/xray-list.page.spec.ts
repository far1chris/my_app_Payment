import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XrayListPage } from './xray-list.page';

describe('XrayListPage', () => {
  let component: XrayListPage;
  let fixture: ComponentFixture<XrayListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(XrayListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
