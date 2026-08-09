(function () {
  'use strict';
  var sb = window.MW.supabase;

  function showError(msg) {
    var el = document.getElementById('loginError');
    el.textContent = msg;
    el.classList.remove('d-none');
  }

  document.addEventListener('DOMContentLoaded', function () {
    sb.auth.getSession().then(function (res) {
      if (res.data.session) window.location.href = 'index.html';
    });

    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('loginSubmitBtn');
      var email = document.getElementById('loginEmail').value.trim();
      var password = document.getElementById('loginPassword').value;

      btn.disabled = true;
      btn.textContent = 'Signing in...';
      document.getElementById('loginError').classList.add('d-none');

      sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
        if (res.error) {
          showError('Incorrect email or password.');
          btn.disabled = false;
          btn.textContent = 'Sign In';
          return;
        }
        window.location.href = 'index.html';
      });
    });
  });
})();
