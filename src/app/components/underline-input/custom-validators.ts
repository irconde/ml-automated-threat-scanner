import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export enum ControlErrorCode {
  Required = 'required',
  Username = 'username',
  ErrorMsg = 'errorMsg',
  Email = 'email',
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
}
