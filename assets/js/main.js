(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Navigation ---------- */
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  const navLinks = $$('.nav__links a');

  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    navLinks.forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Highlight the section in view ---------- */
  const linkById = new Map(
    navLinks
      .filter((a) => a.hash.length > 1)
      .map((a) => [a.hash.slice(1), a])
  );
  const tracked = [...linkById.keys()].map((id) => document.getElementById(id)).filter(Boolean);

  if ('IntersectionObserver' in window && tracked.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => a.classList.remove('is-current'));
          linkById.get(entry.target.id).classList.add('is-current');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    tracked.forEach((el) => spy.observe(el));
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }
  // Printing must never hide content that has not been scrolled to yet.
  window.addEventListener('beforeprint', () => reveals.forEach((el) => el.classList.add('is-in')));

  /* ---------- Time-of-day viewer ---------- */
  const tod = $('[data-tod]');
  if (tod) {
    const HOURS = ['07', '13', '17', '18', '19', '23'];
    const SCENES = {
      living: { label: 'Apartment 5C · Living room', alt: 'the apartment living room' },
      street: { label: 'Brooklyn · View from the roof', alt: 'the street outside the apartment' },
    };

    const stage = $('.tod__stage', tod);
    const hud = $('.tod__hud', tod);
    const clock = $('.tod__clock', tod);
    const label = $('.tod__label', tod);
    const range = $('.tod__range', tod);
    const ticks = $$('.tod__ticks button', tod);
    const sceneButtons = $$('.seg__btn', tod);
    const play = $('.tod__play', tod);

    const frames = {};
    let scene = 'living';
    let index = Number(range.value);
    let shown = $('.tod__img', stage);
    let wanted = shown;
    let timer = null;

    const build = (key) => {
      if (frames[key]) return frames[key];
      frames[key] = HOURS.map((hour, i) => {
        if (key === 'living' && i === index && shown && !shown.dataset.claimed) {
          shown.dataset.claimed = '1';
          return shown;
        }
        const img = new Image();
        img.className = 'tod__img';
        img.decoding = 'async';
        img.width = 1600;
        img.height = 900;
        img.alt = `Springdale: ${SCENES[key].alt} at ${hour}:00, captured in-engine`;
        img.src = `assets/img/springdale/tod-${key}-${hour}.webp`;
        stage.insertBefore(img, hud);
        return img;
      });
      return frames[key];
    };

    const swapTo = (next) => {
      if (wanted !== next || shown === next) return;
      $$('.tod__img.is-prev', stage).forEach((el) => el.classList.remove('is-prev'));
      const old = shown;
      if (old) {
        old.classList.remove('is-active');
        old.classList.add('is-prev');
        window.setTimeout(() => {
          if (shown !== old) old.classList.remove('is-prev');
        }, 800);
      }
      next.classList.add('is-active');
      shown = next;
    };

    const render = () => {
      const next = build(scene)[index];
      wanted = next;
      if (next.complete && next.naturalWidth > 0) swapTo(next);
      else next.addEventListener('load', () => swapTo(next), { once: true });

      const time = `${HOURS[index]}:00`;
      clock.textContent = time;
      label.textContent = SCENES[scene].label;
      range.value = String(index);
      range.setAttribute('aria-valuetext', time);
      range.style.setProperty('--fill', `${(index / (HOURS.length - 1)) * 100}%`);
      ticks.forEach((t, i) => t.classList.toggle('is-current', i === index));
      sceneButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scene === scene)));
    };

    const stop = () => {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
      play.setAttribute('aria-pressed', 'false');
      play.setAttribute('aria-label', 'Play through the day');
    };
    const start = () => {
      play.setAttribute('aria-pressed', 'true');
      play.setAttribute('aria-label', 'Pause');
      timer = window.setInterval(() => {
        index = (index + 1) % HOURS.length;
        render();
      }, 1700);
    };

    range.addEventListener('input', () => {
      stop();
      index = Number(range.value);
      render();
    });
    ticks.forEach((t) =>
      t.addEventListener('click', () => {
        stop();
        index = Number(t.dataset.i);
        render();
      })
    );
    sceneButtons.forEach((b) =>
      b.addEventListener('click', () => {
        scene = b.dataset.scene;
        render();
      })
    );
    play.addEventListener('click', () => (timer === null ? start() : stop()));

    // Load the remaining frames just before the viewer scrolls into view.
    const warm = () => {
      build('living');
      render();
    };
    if ('IntersectionObserver' in window) {
      const pre = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            warm();
            pre.disconnect();
          }
        },
        { rootMargin: '600px 0px' }
      );
      pre.observe(tod);
    } else {
      warm();
    }
    // Pause playback when the viewer is off screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        if (entries.every((e) => !e.isIntersecting)) stop();
      }).observe(tod);
    }
  }

  /* ---------- Screenshot lightbox ---------- */
  const shots = $$('.shot');
  const box = $('.lightbox');
  if (shots.length && box && typeof box.showModal === 'function') {
    const img = $('.lightbox__img', box);
    const caption = $('.lightbox__caption', box);
    const count = $('.lightbox__count', box);
    let at = 0;

    const show = () => {
      const shot = shots[at];
      img.src = shot.href;
      img.alt = $('img', shot).alt;
      caption.textContent = shot.dataset.caption || '';
      count.textContent = `${at + 1} / ${shots.length}`;
    };
    const step = (delta) => {
      at = (at + delta + shots.length) % shots.length;
      show();
    };

    shots.forEach((shot, i) =>
      shot.addEventListener('click', (e) => {
        e.preventDefault();
        at = i;
        show();
        box.showModal();
      })
    );
    $('.lightbox__prev', box).addEventListener('click', () => step(-1));
    $('.lightbox__next', box).addEventListener('click', () => step(1));
    $('.lightbox__close', box).addEventListener('click', () => box.close());
    box.addEventListener('click', (e) => {
      const hit = e.target;
      if (hit === box || hit.classList.contains('lightbox__inner') || hit.classList.contains('lightbox__figure')) {
        box.close();
      }
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    box.addEventListener('close', () => {
      img.removeAttribute('src');
      shots[at].focus();
    });

    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- Small things ---------- */
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
