import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ShopContextService } from '../services/shop-context.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private shopContextService: ShopContextService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. Add JWT access token to request headers
    const token = this.authService.token;
    if (token) {
      request = this.addTokenHeader(request, token);
    }

    // 2. Add X-Shop-Id to request headers if a shop context is active
    const shopId = this.shopContextService.currentShopId;
    if (shopId !== null) {
      request = request.clone({
        headers: request.headers.set('X-Shop-Id', shopId.toString())
      });
    }

    // 3. Send the request and intercept potential 401 Unauthorized errors
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // If the login request itself failed, do not try to refresh
          if (request.url.includes('/auth/login') || request.url.includes('/auth/refresh')) {
            return throwError(() => error);
          }
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((user) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(user.token);
          return next.handle(this.addTokenHeader(request, user.token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout().subscribe();
          return throwError(() => err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token!)))
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }
}
