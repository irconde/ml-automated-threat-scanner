import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { assertUnreachable } from './general.utilities';

export enum ControlErrorCode {
  Required = 'required',
  Username = 'username',
  ErrorMsg = 'errorMsg',
  Email = 'email',
  Password = 'password',
}

export class CustomValidators {
  static username(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) return null;

      return /^[a-zA-Z]+$/.test(value)
        ? null
        : { [ControlErrorCode.Username]: true };
    };
  }

  static password(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) return null;

      return /^[A-Za-z0-9!@#$^&()_-]+$/.test(value)
        ? null
        : { [ControlErrorCode.Password]: true };
    };
  }

  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) return null;

      return /@\w+\.\w+/.test(value)
        ? null
        : { [ControlErrorCode.Email]: true };
    };
  }

  static getInputError(formControl: FormControl): string {
    const errorCode = formControl.errors
      ? (Object.keys(formControl.errors)[0] as ControlErrorCode)
      : null;
    switch (errorCode) {
      case null:
        return '';
      case ControlErrorCode.ErrorMsg:
        return formControl.errors?.['errorMsg'];
      case ControlErrorCode.Required:
        return 'Field is required';
      case ControlErrorCode.Email:
        return 'Email is invalid';
      case ControlErrorCode.Username:
        return 'Can only use letters';
      case ControlErrorCode.Password:
        return 'Not valid. A-Z and a-z, 0-9, and ! @ # $ ^ & ( ) _ - only';
    }

    // ensures all error codes are handled
    return assertUnreachable(errorCode);
  }
}
