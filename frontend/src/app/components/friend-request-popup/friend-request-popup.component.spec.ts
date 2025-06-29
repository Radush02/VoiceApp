import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendRequestPopupComponent } from './friend-request-popup.component';

describe('FriendRequestPopupComponent', () => {
  let component: FriendRequestPopupComponent;
  let fixture: ComponentFixture<FriendRequestPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendRequestPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendRequestPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
