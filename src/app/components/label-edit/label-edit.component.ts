import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss'],
  standalone: true,
})
export class LabelEditComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    console.log('LabelEditComponent initialized');
  }
}
