/* ==========================================
   NEXUS PAINEL — Auth (login / cadastro)
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ---------- TOGGLE SENHA ----------
  document.querySelectorAll('.auth-password-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = this.parentElement.querySelector('.form-input');
      if (!input) return;
      var icon = this.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'bi bi-eye';
      } else {
        input.type = 'password';
        if (icon) icon.className = 'bi bi-eye-slash';
      }
    });
  });

  // ---------- HELPERS ----------
  function isValidEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  function mostrarErro(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'flex' : 'none';
  }

  function limparErro(inputId, errId) {
    var inp = document.getElementById(inputId);
    if (inp) inp.classList.remove('error');
    mostrarErro(errId, '');
  }

  // ---------- LOGIN ----------
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var email = document.getElementById('loginEmail');
      var senha = document.getElementById('loginPassword');
      var btn = loginForm.querySelector('button[type="submit"]');
      var btnText = btn ? btn.querySelector('.btn-text') : null;

      limparErro('loginEmail', 'loginEmailError');
      limparErro('loginPassword', 'loginPasswordError');

      var valido = true;
      if (!email || !isValidEmail(email.value)) {
        mostrarErro('loginEmailError', 'E-mail inválido');
        if (email) email.classList.add('error');
        valido = false;
      }
      if (!senha || senha.value.length < 8) {
        mostrarErro('loginPasswordError', 'Senha deve ter no mínimo 8 caracteres');
        if (senha) senha.classList.add('error');
        valido = false;
      }
      if (!valido) return;

      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = 'Entrando...';

      apiPost('/auth/login', {
        email: email.value.trim(),
        senha: senha.value
      }).then(function (res) {
        localStorage.setItem('nexus_user', JSON.stringify(res.usuario));
        window.location.href = 'dashboard.html';
      }).catch(function (err) {
        mostrarErro('loginEmailError', err.message);
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Entrar';
      });
    });

    // Limpar erros ao digitar
    document.getElementById('loginEmail') && document.getElementById('loginEmail').addEventListener('input', function () {
      limparErro('loginEmail', 'loginEmailError');
    });
    document.getElementById('loginPassword') && document.getElementById('loginPassword').addEventListener('input', function () {
      limparErro('loginPassword', 'loginPasswordError');
    });
  }

  // ---------- CADASTRO ----------
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var nome     = document.getElementById('regName');
      var username = document.getElementById('regUsername');
      var email    = document.getElementById('regEmail');
      var senha    = document.getElementById('regPassword');
      var confirm  = document.getElementById('regConfirm');
      var btn = registerForm.querySelector('button[type="submit"]');
      var btnText = btn ? btn.querySelector('.btn-text') : null;

      ['regName','regUsername','regEmail','regPassword','regConfirm'].forEach(function (id) {
        limparErro(id, id + 'Error');
      });

      var valido = true;

      if (!nome || !nome.value.trim()) {
        mostrarErro('regNameError', 'Nome obrigatório');
        if (nome) nome.classList.add('error');
        valido = false;
      }
      if (!username || !username.value.trim()) {
        mostrarErro('regUsernameError', 'Usuário obrigatório');
        if (username) username.classList.add('error');
        valido = false;
      }
      if (!email || !isValidEmail(email.value)) {
        mostrarErro('regEmailError', 'E-mail inválido');
        if (email) email.classList.add('error');
        valido = false;
      }
      if (!senha || senha.value.length < 8) {
        mostrarErro('regPasswordError', 'Senha deve ter no mínimo 8 caracteres');
        if (senha) senha.classList.add('error');
        valido = false;
      }
      if (!confirm || confirm.value !== senha.value) {
        mostrarErro('regConfirmError', 'Senhas não conferem');
        if (confirm) confirm.classList.add('error');
        valido = false;
      }
      if (!valido) return;

      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = 'Criando...';

      apiPost('/auth/register', {
        nome: nome.value.trim(),
        username: username.value.trim(),
        email: email.value.trim(),
        senha: senha.value
      }).then(function (res) {
        localStorage.setItem('nexus_user', JSON.stringify(res.usuario));
        window.location.href = 'dashboard.html';
      }).catch(function (err) {
        mostrarErro('regEmailError', err.message);
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Criar conta';
      });
    });

    ['regName','regUsername','regEmail','regPassword','regConfirm'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function () {
          limparErro(id, id + 'Error');
        });
      }
    });
  }

  // ---------- ESQUECI SENHA ----------
  var forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var email = document.getElementById('forgotEmail');
      var btn = forgotForm.querySelector('button[type="submit"]');
      var btnText = btn ? btn.querySelector('.btn-text') : null;

      limparErro('forgotEmail', 'forgotEmailError');

      if (!email || !isValidEmail(email.value)) {
        mostrarErro('forgotEmailError', 'E-mail inválido');
        if (email) email.classList.add('error');
        return;
      }

      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = 'Enviando...';

      apiPost('/auth/forgot-password', { email: email.value.trim() })
        .then(function () {
          var successMsg = document.getElementById('forgotSuccess');
          if (successMsg) successMsg.classList.add('visible');
          forgotForm.querySelector('button[type="submit"]').style.display = 'none';
        })
        .catch(function (err) {
          mostrarErro('forgotEmailError', err.message);
          if (btn) btn.disabled = false;
          if (btnText) btnText.textContent = 'Enviar link';
        });
    });

    var forgotEmail = document.getElementById('forgotEmail');
    if (forgotEmail) {
      forgotEmail.addEventListener('input', function () {
        limparErro('forgotEmail', 'forgotEmailError');
      });
    }
  }

});
