import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAboutMePopupComponent } from './edit-about-me-popup.component';

describe('EditAboutMePopupComponent', () => {
  let component: EditAboutMePopupComponent;
  let fixture: ComponentFixture<EditAboutMePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAboutMePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAboutMePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
