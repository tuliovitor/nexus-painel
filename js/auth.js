/* ==========================================
   NEXUS PAINEL — Auth Pages (Validation & Interaction)
   ==========================================
   Backend Integration Roadmap:
   - Login:    POST /api/auth/login   { email, password } → { token, user }
   - Register: POST /api/auth/register { name, username, email, password } → { token, user }
   - Forgot:   POST /api/auth/forgot-password { email } → { message }
   - Auth:     Store JWT in localStorage, attach via Authorization header
   - Me:       GET /api/auth/me  (Authorization: Bearer <token>) → { user }
   - Middleware: Validate token on every protected route
   -------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- PASSWORD TOGGLE ---------- */
  var toggles = document.querySelectorAll('.auth-password-toggle');

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      if (!input) return;
      var icon = btn.querySelector('i');

      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'bi bi-eye';
      } else {
        input.type = 'password';
        if (icon) icon.className = 'bi bi-eye-slash';
      }
    });
  });

  /* ---------- LOGIN FORM ---------- */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      var email = document.getElementById('loginEmail');
      var password = document.getElementById('loginPassword');
      var emailError = document.getElementById('loginEmailError');
      var passwordError = document.getElementById('loginPasswordError');

      // Email
      if (!email.value || !isValidEmail(email.value)) {
        email.classList.add('error');
        emailError.classList.add('visible');
        valid = false;
      } else {
        email.classList.remove('error');
        emailError.classList.remove('visible');
      }

      // Password
      if (!password.value || password.value.length < 8) {
        password.classList.add('error');
        passwordError.classList.add('visible');
        valid = false;
      } else {
        password.classList.remove('error');
        passwordError.classList.remove('visible');
      }

      if (valid) {
        // Simulate loading
        var btn = loginForm.querySelector('button[type="submit"]');
        btn.classList.add('btn-loading');

        // Save user data to localStorage (placeholder until backend is ready)
        var userData = {
          name: 'Lucas Silva',
          handle: '@lucassilva',
          email: email.value,
          avatar: null
        };
        localStorage.setItem('nexus_user', JSON.stringify(userData));

        setTimeout(function () {
          btn.classList.remove('btn-loading');
          window.location.href = 'dashboard.html';
        }, 1200);
      }
    });

    // Remove error on input
    loginForm.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('input', function () {
        this.classList.remove('error');
        var errorEl = this.parentElement.querySelector('.form-error');
        if (errorEl) errorEl.classList.remove('visible');
      });
    });
  }

  /* ---------- REGISTER FORM ---------- */
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      var name = document.getElementById('regName');
      var username = document.getElementById('regUsername');
      var email = document.getElementById('regEmail');
      var password = document.getElementById('regPassword');
      var confirm = document.getElementById('regConfirm');

      var fields = [
        { el: name, error: 'regNameError', test: function (v) { return v.trim().length > 0; } },
        { el: username, error: 'regUsernameError', test: function (v) { return v.trim().length > 0; } },
        { el: email, error: 'regEmailError', test: function (v) { return isValidEmail(v); } },
        { el: password, error: 'regPasswordError', test: function (v) { return v.length >= 8; } },
        { el: confirm, error: 'regConfirmError', test: function (v) { return v === password.value; } }
      ];

      fields.forEach(function (f) {
        var errorEl = document.getElementById(f.error);
        if (!f.test(f.el.value)) {
          f.el.classList.add('error');
          if (errorEl) errorEl.classList.add('visible');
          valid = false;
        } else {
          f.el.classList.remove('error');
          if (errorEl) errorEl.classList.remove('visible');
        }
      });

      if (valid) {
        var btn = registerForm.querySelector('button[type="submit"]');
        btn.classList.add('btn-loading');

        // Save user data to localStorage
        var userData = {
          name: name.value.trim(),
          handle: '@' + username.value.trim(),
          email: email.value,
          avatar: null
        };
        localStorage.setItem('nexus_user', JSON.stringify(userData));

        setTimeout(function () {
          btn.classList.remove('btn-loading');
          window.location.href = 'dashboard.html';
        }, 1200);
      }
    });

    registerForm.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('input', function () {
        this.classList.remove('error');
        var parent = this.parentElement;
        var errorEl = parent.querySelector('.form-error') ||
                       this.closest('.form-group').querySelector('.form-error');
        if (errorEl) errorEl.classList.remove('visible');
      });
    });
  }

  /* ---------- FORGOT PASSWORD FORM ---------- */
  var forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      var email = document.getElementById('forgotEmail');
      var emailError = document.getElementById('forgotEmailError');

      if (!email.value || !isValidEmail(email.value)) {
        email.classList.add('error');
        emailError.classList.add('visible');
        valid = false;
      } else {
        email.classList.remove('error');
        emailError.classList.remove('visible');
      }

      if (valid) {
        var btn = forgotForm.querySelector('button[type="submit"]');
        var successMsg = document.getElementById('forgotSuccess');

        btn.classList.add('btn-loading');
        setTimeout(function () {
          btn.classList.remove('btn-loading');
          btn.style.display = 'none';
          // Hide form fields, show success
          forgotForm.querySelectorAll('.form-group, .auth-divider, .auth-footer-link').forEach(function (el) {
            el.style.display = 'none';
          });
          if (successMsg) successMsg.classList.add('visible');
        }, 1500);
      }
    });

    forgotForm.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('input', function () {
        this.classList.remove('error');
        var errorEl = this.parentElement.querySelector('.form-error');
        if (errorEl) errorEl.classList.remove('visible');
      });
    });
  }

  /* ---------- HELPER: Email validation ---------- */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

});
