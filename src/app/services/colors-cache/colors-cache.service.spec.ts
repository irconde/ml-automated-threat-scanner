import { TestBed } from '@angular/core/testing';

import { ColorsCacheService } from './colors-cache.service';

describe('ColorsCacheService', () => {
  let service: ColorsCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColorsCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
