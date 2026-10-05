import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogLandingComponent } from './blog-landing.component';

describe('BlogLandingComponent', () => {
  let component: BlogLandingComponent;
  let fixture: ComponentFixture<BlogLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [BlogLandingComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(BlogLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
