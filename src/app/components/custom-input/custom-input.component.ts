import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
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
  @Output() inputValueEvent = new EventEmitter<string>();
  inputType: string = '';
  @ViewChild('inputElement') inputElement!: ElementRef;

  hide = true;

  constructor() {}

  ngOnInit() {
    this.inputType = this.type;
  }

  validateInput(inputValue: string) {
    switch (this.inputType) {
      case 'text':
        if (!/^[a-zA-Z]+$/.test(inputValue.trim())) {
          this.errorMessage = 'Not valid. A-Z and a-z only.';
        } else {
          this.errorMessage = '';
        }
        break;
      case 'password':
        if (!/^[A-Za-z0-9!@#$^&()_-]+$/.test(inputValue.trim())) {
          this.errorMessage =
            'Not valid. A-Z and a-z, 0-9, and ! @ # $ ^ & ( ) _ - only.';
        } else {
          this.errorMessage = '';
        }
        break;
      case 'email':
        if (!/@\w+\.\w+/.test(inputValue.trim())) {
          this.errorMessage = 'Not valid. Include "@" and a domain name.';
        } else {
          this.errorMessage = '';
        }
        break;
    }

    this.inputValueEvent.emit(inputValue.trim());
  }

  shouldShowError() {
    let tempType = this.inputType;
    if (tempType === 'text') {
      tempType = 'user';
    }

    return !!(
      (this.errorMessage && this.errorMessage.includes(tempType)) ||
      (this.errorMessage && this.errorMessage.includes('valid'))
    );
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
