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
  @Input() inlineIcon: string | null = null;
  @Input() altInlineIcon: string | null = null;
  @Input() errorMessage: string | null = null;
  @Input() type: string = 'text';
  inputType: string = '';

  hide = true;

  constructor() {}

  ngOnInit() {
    this.inputType = this.type;
  }

  shouldShowError() {
    let tempType = this.inputType;
    if (tempType === 'text') {
      tempType = 'user';
    }

    return !!(this.errorMessage && this.errorMessage.includes(tempType));
  }

  toggleType() {
    this.hide = !this.hide;
    if (this.type === 'password') {
      if (!this.hide) {
        this.type = 'text';
      } else if (this.hide) {
        this.type = 'password';
      }
    } else if (this.type === 'text') {
      if (!this.hide) {
        this.type = 'text';
      } else if (this.hide) {
        this.type = 'password';
      }
    } else {
      return;
    }
  }
}
