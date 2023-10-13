import { Component, Input, OnInit } from '@angular/core';
import { SvgService } from '../../services/svg/svg.service';
import { MatIconModule } from '@angular/material/icon';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-dynamic-svg',
  standalone: true,
  template: `
    <mat-icon [svgIcon]="this.iconName" [ngStyle]="svgStyle"></mat-icon>
  `,
  styles: [
    `
      mat-icon {
        width: 24px;
        height: 24px;
      }
    `,
  ],
  imports: [MatIconModule, NgStyle],
})
export class DynamicSvgComponent implements OnInit {
  @Input({ required: true }) svgPath!: string;
  @Input({ required: true }) svgStyle: object | undefined;
  @Input({ required: true }) iconName!: string;

  constructor(private svgService: SvgService) {}

  ngOnInit() {
    this.loadAndRegisterSvg();
  }

  loadAndRegisterSvg() {
    this.svgService
      .loadAndRegisterSvg(this.svgPath, this.iconName)
      .subscribe((iconName: string) => {
        this.iconName = iconName;
      });

    console.log(this.iconName);
  }
}
