import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMain } from './app-main.component';

describe('Tab1Page', () => {
  let component: AppMain;
  let fixture: ComponentFixture<AppMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppMain],
    }).compileComponents();

    fixture = TestBed.createComponent(AppMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
