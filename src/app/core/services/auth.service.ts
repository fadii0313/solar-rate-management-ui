import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserShop {
  shopId: number;
  shopName: string;
  roleName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  shops: UserShop[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser$: Observable<AuthResponse | null>;

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('solar_auth_user');
    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return this.currentUserValue?.token || null;
  }

  public get refreshTokenValue(): string | null {
    return this.currentUserValue?.refreshToken || null;
  }

  public get permissions(): string[] {
    return this.currentUserValue?.permissions || [];
  }

  public get shops(): UserShop[] {
    return this.currentUserValue?.shops || [];
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      map(user => {
        // Store user details and jwt token in local storage to keep user logged in between page refreshes
        localStorage.setItem('solar_auth_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(err => {
        return throwError(() => err.error?.message || err.message || 'Login failed');
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const currentToken = this.token;
    const currentRefresh = this.refreshTokenValue;

    if (!currentToken || !currentRefresh) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {
      token: currentToken,
      refreshToken: currentRefresh
    }).pipe(
      map(user => {
        localStorage.setItem('solar_auth_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): Observable<any> {
    const currentRefresh = this.refreshTokenValue;
    
    // Clear all storage cache completely
    localStorage.clear();
    sessionStorage.clear();
    this.currentUserSubject.next(null);

    if (currentRefresh) {
      return this.http.post(`${this.apiUrl}/logout`, JSON.stringify(currentRefresh), {
        headers: { 'Content-Type': 'application/json' }
      }).pipe(
        catchError(() => [])
      );
    }
    return new Observable(sub => {
      sub.next(true);
      sub.complete();
    });
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  hasPermission(permission: string): boolean {
    // If super admin, they have all access
    if (this.currentUserValue?.roles.includes('SuperAdmin')) {
      return true;
    }
    return this.permissions.includes(permission);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.currentUserValue?.roles || [];
    return roles.some(role => userRoles.includes(role));
  }
}
