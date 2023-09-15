import { TestBed } from '@angular/core/testing';

import { DetectionsService } from './detections.service';

describe('DetectionsService', () => {
  let service: DetectionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetectionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
