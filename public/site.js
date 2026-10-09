(() => {
  // Hero: one image, four panels.
  const split = document.querySelector('[data-split]');
  const toggle = document.querySelector('[data-split-toggle]');
  if (split && toggle) {
    const set = (open) => {
      split.classList.toggle('open', open);
      toggle.textContent = open ? toggle.dataset.openLabel : toggle.dataset.closedLabel;
      toggle.setAttribute('aria-pressed', String(open));
    };
    toggle.setAttribute('aria-pressed', 'false');
    split.addEventListener('mouseenter', () => set(true));
    split.addEventListener('mouseleave', () => set(false));
    split.addEventListener('click', () => set(!split.classList.contains('open')));
    toggle.addEventListener('click', () => set(!split.classList.contains('open')));
  }

  // Accessible tab groups (scenes and how-it-works steps).
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (next) { e.preventDefault(); select(tabs[(i + next + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  });

  // Color-count demo: palettes measured from the sample artwork.
  const PAL = {
    4: ['#DCA857', '#E9D2AB', '#EAE4DC', '#434560'],
    8: ['#E7D4B6', '#123267', '#F8BB54', '#ECE9E5', '#E8DFD3', '#C0955A', '#725758', '#EBCF9B'],
    12: ['#EBD5B2', '#123267', '#FBC034', '#E9E6E1', '#A8552A', '#F5B574', '#E8DFD3', '#3C5886', '#EDEBE8', '#C0955A', '#E1D2BC', '#EBCF9B'],
    16: ['#EBD5B2', '#E7D0AD', '#E9E6E1', '#142343', '#FBC034', '#A8552A', '#F5B574', '#E3DFDB', '#EDEBE8', '#3C5886', '#E19C39', '#0F418A', '#ECDFCC', '#A08F7B', '#E1D2BC', '#F0CE8C']
  };
  const strip = document.querySelector('[data-swatches]');
  const pills = [...document.querySelectorAll('[data-colors]')];
  const paint = (n) => {
    if (!strip) return;
    strip.replaceChildren(...PAL[n].map((hex) => {
      const s = document.createElement('span');
      s.style.background = hex;
      s.title = hex;
      return s;
    }));
    pills.forEach((p) => p.setAttribute('aria-pressed', String(Number(p.dataset.colors) === n)));
  };
  pills.forEach((p) => p.addEventListener('click', () => paint(Number(p.dataset.colors))));
  paint(8);

  // Panel size demo: 120-240 mm.
  const range = document.getElementById('panel-size');
  const box = document.querySelector('[data-sizebox]');
  const labels = document.querySelectorAll('[data-size]');
  const size = () => {
    const v = Number(range.value);
    labels.forEach((l) => { l.textContent = v; });
    if (box) box.style.width = `${(v / 240) * 88}%`;
  };
  if (range) { range.addEventListener('input', size); size(); }
})();
