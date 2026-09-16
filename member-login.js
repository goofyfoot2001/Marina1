/* Member login: password is never stored or compared as plain text —
   only its SHA-256 digest is kept here and checked against the digest
   of whatever the visitor types in. */
(function () {
  var MEMBER_PASSWORD_HASH = '96f49eeffe9323b2c9cbd535d6c9224c5bc189af6697d2e94334bbe8bed7e51e';
  var SESSION_KEY = 'ngbm_member_authenticated';
  var PORTAL_PAGE = 'member-portal.html';
  var overlay = null;
  var wired = false;

  function sha256Hex(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', data).then(function (digest) {
      var bytes = Array.from(new Uint8Array(digest));
      return bytes.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function isAuthenticated() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'member-login-overlay';
    overlay.id = 'memberLoginOverlay';
    overlay.innerHTML =
      '<div class="member-login-modal" role="dialog" aria-modal="true" aria-labelledby="memberLoginTitle">' +
        '<button type="button" class="member-login-close" aria-label="Close">&times;</button>' +
        '<h3 id="memberLoginTitle">Member Login</h3>' +
        '<p>Enter the member password to continue.</p>' +
        '<form id="memberLoginForm">' +
          '<input type="password" id="memberLoginPassword" placeholder="Password" autocomplete="current-password" required>' +
          '<div class="member-login-error" id="memberLoginError" hidden>Incorrect password. Please try again.</div>' +
          '<button type="submit" class="btn btn-gold">Log In</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);
    wireModal();
    return overlay;
  }

  function wireModal() {
    if (wired) return;
    wired = true;

    overlay.querySelector('.member-login-close').addEventListener('click', function () {
      closeModal(true);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(true);
    });

    overlay.querySelector('#memberLoginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('memberLoginPassword');
      var errorEl = document.getElementById('memberLoginError');
      sha256Hex(input.value).then(function (hash) {
        if (hash === MEMBER_PASSWORD_HASH) {
          errorEl.hidden = true;
          try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (err) {}
          closeModal(false);
          if (document.body.hasAttribute('data-member-portal')) {
            window.location.reload();
          } else {
            window.location.href = PORTAL_PAGE;
          }
        } else {
          errorEl.hidden = false;
          input.value = '';
          input.focus();
        }
      });
    });
  }

  function openModal() {
    if (!overlay) buildModal();
    overlay.classList.add('open');
    document.getElementById('memberLoginPassword').focus();
  }

  function closeModal(returnHome) {
    if (overlay) overlay.classList.remove('open');
    if (returnHome && document.body.hasAttribute('data-member-portal') && !isAuthenticated()) {
      window.location.href = 'index.html';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var trigger = document.getElementById('memberLoginTrigger');
    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    }
    if (document.body.hasAttribute('data-member-portal') && !isAuthenticated()) {
      openModal();
    }
  });
})();
