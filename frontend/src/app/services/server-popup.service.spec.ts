import { TestBed } from '@angular/core/testing';

import { ServerPopupService } from './server-popup.service';

describe('ServerPopupService', () => {
  let service: ServerPopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerPopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
