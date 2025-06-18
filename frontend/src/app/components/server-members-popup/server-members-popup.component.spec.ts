import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerMembersPopupComponent } from './server-members-popup.component';

describe('ServerMembersPopupComponent', () => {
  let component: ServerMembersPopupComponent;
  let fixture: ComponentFixture<ServerMembersPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerMembersPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerMembersPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
