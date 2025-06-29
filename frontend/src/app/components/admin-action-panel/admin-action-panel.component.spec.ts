import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminActionPanelComponent } from './admin-action-panel.component';

describe('AdminActionPanelComponent', () => {
  let component: AdminActionPanelComponent;
  let fixture: ComponentFixture<AdminActionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminActionPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminActionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
