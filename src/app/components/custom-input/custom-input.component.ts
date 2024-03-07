import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
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
  @ViewChild('inputElement') inputElement!: ElementRef;

  hide = true;

  constructor() {}

  ngOnInit() {
    this.inputType = this.type;
  }

  validateInput() {
    console.log(this.inputElement.nativeElement.value);

    const inputValue = this.inputElement.nativeElement.value;

    switch (this.inputType) {
      case 'text':
        if (!/^[a-zA-Z]+$/.test(inputValue)) {
          this.errorMessage = 'Please enter upper and lower case letters only.';
          return;
        }
        break;
      // case 'password':
      //   this.errorMessage = 'Please enter a valid password';
      //   break;
      // case 'email':
      //   this.errorMessage = 'Please enter a valid email';
      //   break;
      default:
        break;
    }
  }

  shouldShowError() {
    let tempType = this.inputType;
    if (tempType === 'text') {
      tempType = 'user';
    }

    return !!(
      (this.errorMessage && this.errorMessage.includes(tempType)) ||
      (this.errorMessage && this.errorMessage.includes('Please enter'))
    );

    // return !!(this.errorMessage && this.errorMessage.includes(tempType));
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
