import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-label-list',
  templateUrl: './label-list.component.html',
  styleUrls: ['./label-list.component.scss'],
  standalone: true,
  imports: [NgForOf],
})
export class LabelListComponent {
  @Input() labels: string[] = [];
  @Output() labelSelect: EventEmitter<string> = new EventEmitter<string>();

  handleClick(index: number): void {
    this.labelSelect.emit(this.labels[index]);
  }
}
