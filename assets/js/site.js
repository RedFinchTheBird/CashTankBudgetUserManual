// Opens and closes the sidebar menu on small screens.
(function () {
  var button = document.querySelector('.menu-toggle');
  if (!button) return;

  function setOpen(open) {
    document.body.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  button.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('nav-open'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });

  document.querySelectorAll('.sidebar a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
})();
