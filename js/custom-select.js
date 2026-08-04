/* Material AI — lightweight custom <select> replacement.
   A native <select>'s dropdown popup can't be styled or reliably positioned
   and ends up overlapping surrounding content, so this renders options as a
   positioned dropdown menu instead (same approach as the order-status picker
   in seller-dashboard.html). */
(function () {
  function t(key) { return (window.I18N && window.I18N.t) ? window.I18N.t(key) : key; }

  var instances = [];
  var menuEl = null;
  var activeRoot = null;

  function ensureMenu() {
    if (menuEl) return menuEl;
    menuEl = document.createElement('div');
    menuEl.id = 'customSelectMenu';
    menuEl.className = 'hidden fixed z-[80] bg-white rounded-2xl shadow-soft border border-secondary-50 py-2 text-sm max-h-64 overflow-y-auto';
    document.body.appendChild(menuEl);
    document.addEventListener('click', function (e) {
      if (!menuEl.classList.contains('hidden') && !menuEl.contains(e.target) && !(activeRoot && activeRoot.contains(e.target))) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    return menuEl;
  }

  // Every trigger button's chevron should point down while closed and flip to point
  // up while its menu is open — resetArrows() clears the flipped state on all of them
  // so switching directly from one open select to another doesn't leave a stale arrow.
  function resetArrows() {
    instances.forEach(function (inst) {
      var svg = inst.root.querySelector('.custom-select-btn svg');
      if (svg) svg.classList.remove('rotate-180');
    });
  }

  function closeMenu() {
    if (menuEl) menuEl.classList.add('hidden');
    resetArrows();
    activeRoot = null;
  }

  function openMenu(root, options, currentValue, onPick) {
    var menu = ensureMenu();
    var btn = root.querySelector('.custom-select-btn');
    menu.innerHTML = options.map(function (o) {
      return '<button type="button" class="custom-select-option w-full text-left px-4 py-2 hover:bg-secondary-50/60' +
        (o.value === currentValue ? ' font-semibold' : '') + '" data-value="' + o.value + '"></button>';
    }).join('');
    menu.querySelectorAll('.custom-select-option').forEach(function (el, i) {
      el.textContent = t(options[i].labelKey);
      el.addEventListener('click', function () { closeMenu(); onPick(options[i].value); });
    });
    resetArrows();
    activeRoot = root;
    var rect = btn.getBoundingClientRect();
    var menuWidth = Math.max(rect.width, 160);
    menu.style.width = menuWidth + 'px';
    var left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
    left = Math.max(8, left);
    menu.style.left = left + 'px';
    // Render below first (so we can measure its real height), then flip above the
    // button instead whenever there isn't enough room below but there is above —
    // e.g. a select near the bottom of the viewport.
    menu.style.top = (rect.bottom + 6) + 'px';
    menu.classList.remove('hidden');
    var menuHeight = menu.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom - 6;
    var spaceAbove = rect.top - 6;
    if (menuHeight > spaceBelow && spaceAbove > spaceBelow) {
      menu.style.top = Math.max(8, rect.top - menuHeight - 6) + 'px';
    }
    // Arrow signals open/closed state (standard disclosure-arrow convention), regardless
    // of which direction the menu actually rendered.
    var svg = btn.querySelector('svg');
    if (svg) svg.classList.add('rotate-180');
  }

  function init(root, options, initialValue, onChange) {
    var btn = root.querySelector('.custom-select-btn');
    var labelEl = root.querySelector('.custom-select-label');

    function setValue(value) {
      root.dataset.value = value;
      var matches = options.filter(function (o) { return o.value === value; });
      var opt = matches[0] || options[0];
      labelEl.textContent = t(opt.labelKey);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      // Clicking the trigger again while its own menu is open should close it
      // (toggle) instead of just re-opening the same menu in place.
      if (activeRoot === root && menuEl && !menuEl.classList.contains('hidden')) {
        closeMenu();
        return;
      }
      openMenu(root, options, root.dataset.value, function (value) {
        setValue(value);
        if (onChange) onChange(value);
      });
    });

    setValue(initialValue || root.dataset.value || options[0].value);
    var instance = {
      root: root, options: options,
      getValue: function () { return root.dataset.value; },
      setValue: setValue,
      // Replace the option list in place (e.g. once seller materials finish loading), keeping the same
      // DOM/listeners — re-calling init() on the same root would stack duplicate click handlers.
      setOptions: function (newOptions, newValue) {
        options.length = 0;
        newOptions.forEach(function (o) { options.push(o); });
        setValue(newValue !== undefined ? newValue : (options[0] ? options[0].value : ''));
      }
    };
    instances.push(instance);
    return instance;
  }

  document.addEventListener('i18n:change', function () {
    instances.forEach(function (inst) { inst.setValue(inst.getValue()); });
  });

  window.CustomSelect = { init: init };
})();
