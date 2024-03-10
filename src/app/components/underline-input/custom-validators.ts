import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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

      // TODO: determine if we should allow '/' chars
      return /^[A-Za-z0-9!@#$^&/()_-]+$/.test(value)
        ? null
        : { [ControlErrorCode.Password]: true };
    };
  }
}
