import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-input',
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatInputModule, MatButtonModule, NgIf],
})
export class CustomInputComponent implements OnInit {
  @Input() leadingIcon: string = '';
  @Input() placeholder: string = '';
  @Input() inputType: string = 'text';
  @Input() inlineIcon: string | null = null;
  @Input() altInlineIcon: string | null = null;
  hide = true;

  constructor() {}

  ngOnInit() {}
}
