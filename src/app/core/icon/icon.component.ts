import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '../icons/icons.generated';

/**
 * An inline SVG icon, drawn in the current text colour at the current font size.
 * `name` is a devicon (`devicon-docker-plain`) or Font Awesome (`fa-solid-bars`) name; the build
 * generates only the icons named in src/ (tools/icons.mjs), so an unknown name renders nothing.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: '',
  host: { '[innerHTML]': 'svg', class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  svg: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) { }

  /** An icon name; extra words, such as the icon fonts' old `colored` class, are ignored. */
  @Input() set name(name: string) {
    const known = name.split(/\s+/).find((word) => word in ICONS);
    // The markup is a build-time constant generated from the icon packages, never user input.
    this.svg = this.sanitizer.bypassSecurityTrustHtml(known ? ICONS[known] : '');
  }
}
