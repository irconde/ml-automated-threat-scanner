import { Component, forwardRef, Input, OnInit } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-underline-input',
  templateUrl: './underline-input.component.html',
  styleUrls: ['./underline-input.component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UnderlineInputComponent),
      multi: true,
    },
  ],
  imports: [
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
  ],
})
export class UnderlineInputComponent implements ControlValueAccessor, OnInit {
  @Input() leadingIcon: string = '';
  @Input() inlineIcon: string | null = null;
  @Input() placeholder: string = '';
  @Input() altInlineIcon: string | null = null;
  @Input() errorMessage: string | null = null;
  @Input() type!: 'email' | 'password' | 'text';
  hide = true;
  formControl: FormControl = new FormControl<string>('');
  disabled = false;
  onChange: (value: string) => void = () => {};
  onTouched: (value: boolean) => void = () => {};

  constructor() {}

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: (value: boolean) => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.formControl.disable() : this.formControl.enable();
  }

  writeValue(value: string): void {
    this.formControl.setValue(value, { emitEvent: true });
  }

  ngOnInit(): void {
    this.formControl.valueChanges.subscribe((value: string) => {
      this.onChange(value);
    });
  }
}
