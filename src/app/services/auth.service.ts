import { AssetsService } from './assets.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  accountsAction = new Subject();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService,
    private assets: AssetsService
  ) {}

  isLoggedIn() {
    const person: any = this.storage.get('person');
    const token = this.storage.get('token');

    return person && person.address && person.secret && token;
  }

  getToken() {
    const params = {
      validUntil: 1600000000
    };

    const hermes: any = this.storage.get('hermes') || {};
    const url = `${hermes.url}/token`;

    return this.http.post(url, params);
  }

  getAccountByAddress(address) {
    return new Observable(observer => {
      const url = `/api/person/accounts/${address}`;

      this.http.get(url).subscribe(
        resp => {
          return observer.next(resp);
        },
        err => {
          return observer.error(err);
        }
      );
    });
  }

  addAccount(person) {
    let accounts: any = this.storage.get('accounts');
    accounts = accounts ? accounts : [];

    if (!accounts.some((account) => account.address === person.address || account.email === person.email)) {
      accounts.unshift(person);
      this.accountsAction.next(true);
      this.storage.set('accounts', accounts);
    }
  }

  switchAccount(address) {
    let accounts: any = this.storage.get('accounts');
    accounts = accounts ? accounts : [];

    accounts.map((account, index) => {
      if (account.address === address) {
        accounts.splice(index, 1);
        accounts.unshift(account);
        this.storage.set('person', account);
        this.storage.set('accounts', accounts);
        this.assets.initSDK();
        this.accountsAction.next(true);
        this.router.navigate(['/assets']);
      }
    });
  }

  login(address: string, secret: string) {
    const person: any = this.storage.get('person') || {};
    person['address'] = address;
    person['secret'] = secret;
    this.storage.set('person', person);

    return new Observable(observer => {

      // Hermes token request
      this.getToken().subscribe(
        (resp: any) => {
          this.storage.set('token', resp.token);
          const hermes: any = this.storage.get('hermes') || {};

          // Hermes address request
          const url = `${hermes.url}/accounts/${address}`;
          this.http.get(url).subscribe(
            _resp => {
              this.storage.set('isLoggedin', true);
              this.assets.initSDK();

              this.getAccountByAddress(address).subscribe(
                (r: any) => {
                  this.storage.set('person', r);
                  this.storage.set('has_account', true);
                  this.addAccount(r);
                },
                err => {
                  this.storage.set('has_account', false);
                  this.addAccount({ address, secret });
                }
              );

              observer.next('success');
            },
            err => {
              observer.error(err);
            }
          );
        },
        err => {
          observer.error(err);
        }
      );
    });
  }

  logout() {
    let accounts: any = this.storage.get('accounts');
    accounts = accounts ? accounts : [];
    accounts.shift();
    this.storage.set('accounts', accounts);

    if (accounts.length === 0) {
      this.logoutAll();
    } else {
      this.storage.set('person', accounts[0]);
      this.accountsAction.next(true);
      this.router.navigate(['/assets']);
    }
  }

  logoutAll() {
    this.storage.clear();
    this.router.navigate(['/login']);
    this.accountsAction.next(true);
  }
}
