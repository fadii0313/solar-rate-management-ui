import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopContextService } from '../../core/services/shop-context.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl = '/dashboard';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private shopContextService: ShopContextService
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login({
      username: this.f['username'].value,
      password: this.f['password'].value
    }).subscribe({
      next: (user) => {
        if (user.shops && user.shops.length > 0) {
          const activeShop = user.shops[0];
          this.shopContextService.setShop(activeShop.shopId, activeShop.shopName);
        } else {
          this.shopContextService.clear();
        }
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      }
    });
  }
}
