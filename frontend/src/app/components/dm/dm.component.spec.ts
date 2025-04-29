import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmComponent } from './dm.component';

describe('DmComponent', () => {
  let component: DmComponent;
  let fixture: ComponentFixture<DmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
