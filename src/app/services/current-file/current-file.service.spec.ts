import { TestBed } from '@angular/core/testing';

import { CurrentFileService } from './current-file.service';

describe('CurrentFileService', () => {
  let service: CurrentFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
