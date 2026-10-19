(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const root = document.documentElement;
  const stage = document.getElementById('stage');
  const deck = document.getElementById('deck');
  const wrap = document.getElementById('canvas-wrap');
  const dialog = document.getElementById('lightbox');
  const preview = document.getElementById('lightbox-image');
  const motion = document.getElementById('motion');
  const menu = document.getElementById('menu');
  let current = 0;
  let lastImage = null;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const compactQuery = matchMedia('(max-width: 1100px)');
  let quiet = motionQuery.matches;

  function fit() {
    if (matchMedia('(max-width: 759px)').matches) {
      deck.style.transform = '';
      wrap.style.width = '';
      wrap.style.height = '';
      return;
    }
    const scale = Math.min((stage.clientWidth - 40) / 1600, (stage.clientHeight - 30) / 900, 1.25);
    deck.style.transform = `scale(${Math.max(scale, .1)})`;
    wrap.style.width = `${1600 * scale}px`;
    wrap.style.height = `${900 * scale}px`;
  }

  function show(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
    });
    document.getElementById('chapter-label').textContent = slides[current].dataset.title;
    document.getElementById('page-counter').innerHTML = `${String(current + 1).padStart(2, '0')} <i>/ ${slides.length}</i>`;
    document.getElementById('progress-bar').style.width = `${(current + 1) / slides.length * 100}%`;
    document.getElementById('previous').disabled = current === 0;
    document.getElementById('next').disabled = current === slides.length - 1;
    document.querySelectorAll('#toc a').forEach(link => {
      const active = link.dataset.range.split(',').map(Number).includes(current + 1);
      link.classList.toggle('selected', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    stage.scrollTop = 0;
    fit();
  }

  function fromHash() {
    const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
    show(index < 0 ? 0 : index);
  }
  function move(delta) {
    const index = Math.max(0, Math.min(slides.length - 1, current + delta));
    if (index !== current) location.hash = slides[index].id;
  }

  document.getElementById('previous').addEventListener('click', () => move(-1));
  document.getElementById('next').addEventListener('click', () => move(1));
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('resize', fit);
  new ResizeObserver(fit).observe(stage);
  document.addEventListener('keydown', event => {
    if (dialog.open || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'Home') { event.preventDefault(); location.hash = slides[0].id; }
    if (event.key === 'End') { event.preventDefault(); location.hash = slides[slides.length - 1].id; }
  });

  function closeImage() {
    dialog.close();
    if (lastImage) lastImage.focus();
  }
  document.querySelectorAll('img[data-zoom]').forEach(img => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `放大图片：${img.alt}`);
    function open() {
      lastImage = img;
      preview.src = img.src;
      preview.alt = img.alt;
      document.getElementById('lightbox-caption').textContent = img.alt;
      dialog.showModal();
    }
    img.addEventListener('click', open);
    img.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
  document.getElementById('close-lightbox').addEventListener('click', closeImage);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeImage(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeImage(); });

  function setMotion() {
    root.classList.toggle('reduce-motion', quiet);
    motion.setAttribute('aria-pressed', String(quiet));
    motion.textContent = quiet ? '动态已减少' : '减少动态';
  }
  motion.addEventListener('click', () => { quiet = !quiet; setMotion(); });
  motionQuery.addEventListener('change', event => { quiet = event.matches; setMotion(); });
  compactQuery.addEventListener('change', event => {
    root.classList.toggle('sidebar-hidden', event.matches);
    menu.setAttribute('aria-expanded', String(!event.matches));
    fit();
  });
  menu.addEventListener('click', () => {
    const hidden = root.classList.toggle('sidebar-hidden');
    menu.setAttribute('aria-expanded', String(!hidden));
    fit();
  });
  document.querySelectorAll('#toc a').forEach(link => link.addEventListener('click', () => {
    if (matchMedia('(max-width: 1100px)').matches) {
      root.classList.add('sidebar-hidden');
      menu.setAttribute('aria-expanded', 'false');
    }
  }));
  document.getElementById('print').addEventListener('click', () => { if (dialog.open) dialog.close(); window.print(); });
  window.addEventListener('beforeprint', () => slides.forEach(slide => { slide.inert = false; slide.removeAttribute('aria-hidden'); }));
  window.addEventListener('afterprint', () => show(current));
  if (innerWidth <= 1100) { root.classList.add('sidebar-hidden'); menu.setAttribute('aria-expanded', 'false'); }
  root.classList.add('js-ready');
  setMotion();
  fromHash();
})();
