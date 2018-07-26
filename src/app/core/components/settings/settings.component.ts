import { StorageService } from 'app/services/storage.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PasswordService } from 'app/services/password.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [PasswordService]
})
export class SettingsComponent implements OnInit {
  private value: string;
  public width = 1;
  public colors: any = [
    '#D9534F', '#DF6A4F', '#E5804F', '#EA974E', '#F0AD4E', '#D2AF51',
    '#B5B154', '#97B456', '#7AB659', '#5CB85C', '#5CB85C'];
  public color = '#D9534F';
  public passwordExists: Boolean = false;
  weakPassword = false;
  spinner = false;
  error = false;
  resetForm: FormGroup;
  passwordsNotMatch = false;
  serverMessage = false;
  resetSuccess: Boolean = false;
  showWeakPasswordError: Boolean = false;
  blankField: Boolean = false;
  strengthObj: any;
  flags = [];
  has_account = false;

  ngOnInit() {
    this.has_account = JSON.parse(this.storage.get('has_account'));
  }

  constructor(
    private http: HttpClient,
    private passwordService: PasswordService,
    private storage: StorageService
  ) {
    this.resetForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      oldPassword: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required]),
      passwordConfirm: new FormControl(null, [Validators.required]),
    });
  }

  resetErrors() {
    this.error = false;
    this.resetSuccess = false;
    this.passwordsNotMatch = false;
    this.serverMessage = false;
    this.showWeakPasswordError = false;
    this.blankField = false;
    this.weakPassword = false;
  }

  resetPassword() {
    this.resetErrors();
    const email = this.resetForm.get('email').value;
    const password = this.resetForm.get('password').value;
    const oldPassword = this.resetForm.get('oldPassword').value;
    const passwordConfirm = this.resetForm.get('passwordConfirm').value;

    if (!email || !password || !oldPassword || !passwordConfirm) {
      this.blankField = true;
      return;
    }

    let flagCounter = 0;
    this.flags.forEach(v => v ? flagCounter++ : v);

    if (flagCounter <= 3) {
      this.weakPassword = true;
      this.showWeakPasswordError = true;
      this.error = true;
      this.spinner = false;
      return;
    }

    if (password !== passwordConfirm) {
      this.passwordsNotMatch = true;
      this.error = true;
      this.spinner = false;
      return;
    }

    this.spinner = true;

    const body = {
      email,
      oldPassword,
      password
    };

    this.http.post('/api/auth/resetpassword', body).subscribe(
      resp => {
        this.spinner = false;
        this.resetSuccess = true;
      },
      err => {
        this.spinner = false;
        this.serverMessage = err.error.message;
        console.log('Signup failed: ', err);
      }
    );
  }

  checkPassword(event: any) {
    this.value = event.target.value;
    if (this.value.length >= 1) {
      this.passwordExists = true;
    } else {
      this.passwordExists = false;
    }
    this.strengthObj = this.passwordService.strengthCalculator(this.value);
    this.width = this.strengthObj.width;
    this.flags = this.strengthObj.flags;
    this.updateBar();
  }

  updateBar() {
    const i = Math.round(this.width / 10);
    this.color = this.colors[i];
  }

}