(function () {
  var dialog = document.getElementById('contact');
  var openBtn = document.getElementById('contact-open');
  var closeBtn = document.getElementById('contact-close');
  var form = document.getElementById('contact-form');
  var done = document.getElementById('done');
  var submit = document.getElementById('submit');
  var status = document.getElementById('form-status');
  var openedAt = 0;

  function open() {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    openedAt = Date.now();
    setTimeout(function () { document.getElementById('f-name').focus(); }, 50);
  }
  function close() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    openBtn.focus();
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  // click outside the panel closes it
  dialog.addEventListener('click', function (e) {
    var r = dialog.getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) close();
  });
  dialog.addEventListener('close', function () {
    // reset to a fresh form after a successful send
    if (!done.hidden) {
      form.reset();
      form.hidden = false;
      done.hidden = true;
    }
  });

  var rules = {
    name: function (v) { return v.trim() ? '' : 'Please enter your name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please enter your email.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email.';
    },
    message: function (v) { return v.trim().length >= 2 ? '' : 'Please enter a message.'; }
  };

  function check(name) {
    var input = form.elements[name];
    var msg = rules[name](input.value);
    document.getElementById('e-' + name).textContent = msg;
    input.closest('.field').classList.toggle('invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    form.elements[name].addEventListener('blur', function () { if (this.value) check(name); });
    form.elements[name].addEventListener('input', function () {
      if (this.closest('.field').classList.contains('invalid')) check(name);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    status.classList.remove('error');

    var ok = ['name', 'email', 'message'].map(check).every(Boolean);
    if (!ok) {
      var first = form.querySelector('.invalid input, .invalid textarea');
      if (first) first.focus();
      return;
    }

    // Spam: honeypot filled, or submitted faster than a person could type -> quietly ignore
    if (form.elements._gotcha.value || Date.now() - openedAt < 2500) {
      form.hidden = true; done.hidden = false;
      return;
    }

    if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
      status.textContent = 'The form is not connected yet.';
      status.classList.add('error');
      return;
    }

    submit.disabled = true;
    status.textContent = 'Sending…';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.hidden = true;
        done.hidden = false;
        status.textContent = '';
        return;
      }
      return res.json().catch(function () { return {}; }).then(function (data) {
        throw new Error(data && data.errors && data.errors.length ? data.errors.map(function (x) { return x.message; }).join(' ') : 'Request failed');
      });
    }).catch(function () {
      status.textContent = 'Sorry, your message could not be sent. Please try again.';
      status.classList.add('error');
    }).finally(function () {
      submit.disabled = false;
    });
  });
})();
