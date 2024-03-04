import { Component, Input } from '@angular/core';
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
export class CustomInputComponent {
  @Input() leadingIcon: string = '';
  @Input() placeholder: string = '';
  @Input() inlineIcon: string | null = null;
  @Input() altInlineIcon: string | null = null;
  @Input() showError: boolean = false;
  @Input() errorMessage: string | null = null;

  hide = true;

  constructor() {}

  validateInput() {
    // if (error?.trim() === '') {
    //   this.inputEventMsg = 'Input cannot be empty.';
    // } else if (error?.trim() !== 'irconde') {
    //   // FIXME: This is a hardcoded value
    //   this.inputEventMsg = 'The user does not exist';
    // } else if (error?.trim() !== 'password') {
    //   // FIXME: This is a hardcoded value
    //   this.inputEventMsg = 'The password is incorrect';
    // } else {
    //   this.inputEventMsg = '';
    // }
  }
}
