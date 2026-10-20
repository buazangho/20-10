(() => {
  const details = document.querySelector('.letter-details');
  const trigger = details?.querySelector(':scope > summary');
  const originalPaper = details?.querySelector(':scope > .letter-paper');
  if (!details || !trigger || !originalPaper || !HTMLDialogElement) return;

  let modal = null;
  let busy = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  trigger.addEventListener('click', (event) => {
    event.preventDefault(); // Khong mo thu xuong phia duoi nhu cu
    if (busy || modal) return;

    busy = true;
    details.classList.add('letter-opening');
    const envelope = trigger.querySelector('.envelope-visual') || trigger;
    const r = envelope.getBoundingClientRect();
    const fromX = r.left + r.width / 2 - window.innerWidth / 2;
    const fromY = r.top + r.height / 2 - window.innerHeight / 2;

    window.setTimeout(() => {
      modal = document.createElement('dialog');
      modal.className = 'letter-fullscreen';
      modal.setAttribute('aria-label', 'Bức thư dành cho em');
      modal.style.setProperty('--from-x', `${fromX}px`);
      modal.style.setProperty('--from-y', `${fromY}px`);

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'letter-fullscreen-close';
      closeButton.setAttribute('aria-label', 'Đóng bức thư');
      closeButton.textContent = '×';
      modal.append(closeButton, originalPaper.cloneNode(true));
      document.body.append(modal);
      document.body.classList.add('letter-is-open');
      modal.showModal();
      closeButton.focus({ preventScroll: true });
      busy = false;

      const closeLetter = () => {
        if (busy || !modal) return;
        busy = true;
        modal.classList.add('is-closing');
        window.setTimeout(() => {
          modal?.close();
        }, reducedMotion.matches ? 0 : 295);
      };

      closeButton.addEventListener('click', closeLetter);
      modal.addEventListener('click', (e) => {
        // Click vao khoang toi ben ngoai la thu cung dong duoc
        if (e.target === modal) closeLetter();
      });
      modal.addEventListener('cancel', (e) => {
        e.preventDefault();
        closeLetter();
      });
      modal.addEventListener('close', () => {
        modal?.remove();
        modal = null;
        busy = false;
        document.body.classList.remove('letter-is-open');
        details.classList.remove('letter-opening');
        trigger.focus({ preventScroll: true });
      }, { once: true });
    }, reducedMotion.matches ? 0 : 380);
  });
})();
(() => {
  function setupMusic() {
    const audio = new Audio('music.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = 'none';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'music-toggle';
    button.setAttribute('aria-label', 'Bật nhạc');
    button.setAttribute('aria-pressed', 'false');
    button.title = 'Bật nhạc';
    button.textContent = '♫';
    document.body.appendChild(button);

    const setState = (playing) => {
      button.classList.toggle('is-playing', playing);
      button.textContent = playing ? 'Ⅱ' : '♫';
      button.setAttribute('aria-label', playing ? 'Tạm dừng nhạc' : 'Bật nhạc');
      button.setAttribute('aria-pressed', String(playing));
      button.title = playing ? 'Tạm dừng nhạc' : 'Bật nhạc';
    };

    async function playMusic() {
      try {
        await audio.play();
        setState(true);
      } catch (error) {
        console.warn('Chưa phát được nhạc: kiểm tra music.mp3 và thao tác bật nhạc.', error);
        setState(false);
      }
    }

    button.addEventListener('click', () => {
      if (audio.paused) playMusic();
      else {
        audio.pause();
        setState(false);
      }
    });

    // Click mo phong thu la tuong tac truc tiep, nen Chrome/Safari cho phep bat nhac.
    const envelope = document.querySelector('.letter-details > summary');
    let firstLetterOpen = false;
    envelope?.addEventListener('click', () => {
      if (!firstLetterOpen) {
        firstLetterOpen = true;
        if (audio.paused) playMusic();
      }
    });

    audio.addEventListener('ended', () => setState(false));
    audio.addEventListener('pause', () => setState(false));
    audio.addEventListener('playing', () => setState(true));
    audio.addEventListener('error', () => {
      setState(false);
      console.warn('Không tìm thấy/không đọc được music.mp3. Hãy đặt file ở cùng thư mục index.html.');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMusic);
  else setupMusic();
})();

(() => {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(() => {
    setupMusic();
    const photos = setupGalleryZoom();
    setupPhotoRain(photos);
  });

  function setupMusic() {
    // Tranh tao them nut neu da nap 2 lan.
    if (document.querySelector('.music-toggle')) return;

    const audio = document.createElement('audio');
    audio.src = 'music.mp3';
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute('aria-hidden', 'true');
    document.body.appendChild(audio);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'music-toggle';
    button.innerHTML = '<span class="music-symbol" aria-hidden="true">♫</span>';
    document.body.appendChild(button);

    function updateButton() {
      const playing = !audio.paused;
      button.classList.toggle('is-playing', playing);
      button.setAttribute('aria-label', playing ? 'Tạm dừng nhạc' : 'Bật nhạc');
      button.setAttribute('aria-pressed', String(playing));
      button.title = playing ? 'Tạm dừng nhạc' : 'Bật nhạc';
      button.querySelector('span').textContent = playing ? 'Ⅱ' : '♫';
    }

    let manuallyPaused = false;
    let playingRequest = false;
    async function playIfPossible() {
      if (manuallyPaused || !audio.paused || playingRequest) return;
      playingRequest = true;
      try {
        await audio.play();
        removeUnlockListeners();
      } catch (_) {

      } finally {
        playingRequest = false;
        updateButton();
      }
    }

    function unlock(event) {
      if (event.target?.closest?.('.music-toggle')) return;
      playIfPossible();
    }
    function removeUnlockListeners() {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    }

    // Phat ngay neu trinh duyet cho phep; neu khong, bat khi tuong tac lan dau.
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    playIfPossible();

    button.addEventListener('click', async () => {
      if (!audio.paused) {
        manuallyPaused = true;
        audio.pause();
        removeUnlockListeners();
      } else {
        manuallyPaused = false;
        await playIfPossible();
      }
      updateButton();
    });
    audio.addEventListener('playing', updateButton);
    audio.addEventListener('pause', updateButton);
    audio.addEventListener('error', () => {
      button.title = 'Không tìm thấy music.mp3';
      console.warn('[20/10] Khong doc duoc music.mp3. Dat file cung thu muc voi index.html.');
    });
    updateButton();
  }

  function setupGalleryZoom() {
    const frames = Array.from(document.querySelectorAll('#memories .memory-art')).filter(
      (el) => el.querySelector('img, svg')
    );
    if (!frames.length) return [];

    const items = frames.map((frame) => ({
      frame,
      image: frame.querySelector('img, svg'),
      caption: frame.closest('.memory-card')?.querySelector('.memory-tag')?.textContent?.trim() || 'Ảnh kỷ niệm'
    }));

    const dialog = document.createElement('dialog');
    dialog.className = 'photo-lightbox';
    dialog.setAttribute('aria-label', 'Xem ảnh kỷ niệm');
    dialog.innerHTML = `
      <div class="photo-lightbox-inner">
        <button type="button" class="photo-lightbox-close" aria-label="Đóng ảnh">×</button>
        <button type="button" class="photo-lightbox-prev" aria-label="Ảnh trước">‹</button>
        <div class="photo-lightbox-image"></div>
        <button type="button" class="photo-lightbox-next" aria-label="Ảnh tiếp theo">›</button>
        <p class="photo-lightbox-caption"></p>
        <span class="photo-lightbox-count"></span>
      </div>`;
    document.body.appendChild(dialog);

    const display = dialog.querySelector('.photo-lightbox-image');
    const caption = dialog.querySelector('.photo-lightbox-caption');
    const counter = dialog.querySelector('.photo-lightbox-count');
    const prev = dialog.querySelector('.photo-lightbox-prev');
    const next = dialog.querySelector('.photo-lightbox-next');
    let active = 0;
    let lastFocused = null;

    function render(index) {
      active = (index + items.length) % items.length;
      const item = items[active];
      const clone = item.image.cloneNode(true);
      if (clone.tagName.toLowerCase() === 'img') {
        clone.removeAttribute('loading');
        clone.alt = item.image.alt || item.caption;
      }
      display.replaceChildren(clone);
      caption.textContent = item.caption;
      counter.textContent = `${active + 1} / ${items.length}`;
      prev.hidden = next.hidden = items.length < 2;
    }

    function open(index) {
      if (!dialog.showModal) return;
      lastFocused = document.activeElement;
      render(index);
      dialog.showModal();
      dialog.querySelector('.photo-lightbox-close').focus({ preventScroll: true });
    }

    items.forEach((item, index) => {
      item.frame.classList.add('photo-can-zoom');
      item.frame.setAttribute('role', 'button');
      item.frame.setAttribute('tabindex', '0');
      item.frame.setAttribute('aria-label', `Xem lớn: ${item.caption}`);
      item.frame.addEventListener('click', () => open(index));
      item.frame.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(index);
        }
      });
    });

    prev.addEventListener('click', () => render(active - 1));
    next.addEventListener('click', () => render(active + 1));
    dialog.querySelector('.photo-lightbox-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); render(active - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); render(active + 1); }
    });
    dialog.addEventListener('close', () => lastFocused?.focus?.({ preventScroll: true }));
    return items;
  }

  function setupPhotoRain(items) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || !items.length) return;
    const sections = Array.from(document.querySelectorAll('main section'));
    const layers = [];
    for (const section of sections) {
      section.classList.add('photo-rain-section');
      const layer = document.createElement('div');
      layer.className = 'photo-rain-layer';
      layer.setAttribute('aria-hidden', 'true');
      section.appendChild(layer);
      layers.push({ section, layer });

      const isMobile = window.innerWidth < 650;
      const count = isMobile ? 10 : 15;
      for (let i = 0; i < count; i++) {
        const wrap = document.createElement('span');
        wrap.className = 'falling-photo';
        const source = items[i % items.length].image.cloneNode(true);
        if (source.tagName.toLowerCase() === 'img') {
          source.alt = '';
          source.draggable = false;
          source.loading = 'lazy';
        }
        wrap.appendChild(source);
        // Dang photo polaroid. Uu tien hai mep nen de khong de len chu.
        const left = i % 2 === 0 ? (Math.random() * 16 - 3) : (86 + Math.random() * 15);
        const size = isMobile ? 30 + Math.random() * 13 : 47 + Math.random() * 25;
        const r0 = Math.round((Math.random() - 0.5) * 30);
        const r1 = Math.round((Math.random() - 0.5) * 105);
        const drift = Math.round((Math.random() - 0.5) * 90);
        wrap.style.setProperty('--x', `${left}%`);
        wrap.style.setProperty('--size', `${Math.round(size)}px`);
        wrap.style.setProperty('--spin-start', `${r0}deg`);
        wrap.style.setProperty('--spin-end', `${r1}deg`);
        wrap.style.setProperty('--drift', `${drift}px`);
        wrap.style.setProperty('--duration', `${(12 + Math.random() * 13).toFixed(1)}s`);
        wrap.style.setProperty('--delay', `${(-Math.random() * 28).toFixed(1)}s`);
        layer.appendChild(wrap);
      }
    }

    const resize = () => {
      for (const {section, layer} of layers) {
        layer.style.setProperty('--fall-distance', `${section.offsetHeight + 220}px`);
      }
    };
    resize();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(resize);
      layers.forEach(({ section }) => observer.observe(section));
    } else window.addEventListener('resize', resize, { passive: true });
  }
})();
/**
 * BO HOA 20/10 (drop-in). Khong can sua HTML boc hoa cu.
 * Can cac file: bouquet-real.jpg, rose-1.png, rose-2.png, rose-3.png
 * Dat 5 file canh index.html, them CSS + JS vao index.html.
 */
(() => {
  'use strict';
  function start() {
    // Exact layout in the 20/10 website, NOT the earlier separate demo markup.
    const card = document.querySelector('.hero-art .postcard');
    const canvas = card?.querySelector('.postcard-art');
    if (!card || !canvas || card.dataset.bouquetReady === 'true') {
      if (!card || !canvas) console.warn('[Bouquet] Khong tim thay .hero-art .postcard .postcard-art');
      return;
    }

    card.dataset.bouquetReady = 'true';
    const base = new URL('.', document.currentScript?.src || location.href);
    const photoURL = new URL('bouquet-real.jpg', base).href;
    const roses = [1, 2, 3].map((n) => new URL(`rose-${n}.png`, base).href);

    const img = document.createElement('img');
    img.src = photoURL;
    img.alt = 'Bó hoa hồng thật dành tặng em ngày 20/10';
    img.className = 'bouquet-real-photo';
    img.draggable = false;
    // Replace only the illustration within the existing postcard.
    canvas.replaceChildren(img);

    card.classList.add('bouquet-interactive');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Bấm vào bó hoa để những bông hoa bay ra');
    const caption = card.querySelector('.postcard-caption');
    if (caption && !caption.querySelector('.bouquet-click-text')) {
      const hint = document.createElement('span');
      hint.className = 'bouquet-click-text';
      hint.textContent = '✧ Bấm vào bó hoa nhé ✧';
      caption.appendChild(hint);
    }

    const overlay = document.createElement('div');
    overlay.className = 'bouquet-burst-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cooldown = false;

    function burst() {
      if (cooldown) return;
      cooldown = true;
      setTimeout(() => { cooldown = false; }, 500);
      card.classList.remove('is-bursting');
      void card.offsetWidth;
      card.classList.add('is-bursting');
      setTimeout(() => card.classList.remove('is-bursting'), 700);

      const rect = card.getBoundingClientRect();
      const startX = rect.left + rect.width * 0.50;
      const startY = rect.top + rect.height * 0.46;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 680;
      const count = reduced.matches ? 12 : (mobile ? 34 : 58);
      const spread = mobile ? Math.min(230, vw*.55) : Math.min(640, vw*.63);

      for (let i = 0; i < count; i++) {
        const isFlower = i % 3 === 0 || i % 7 === 0;
        let el;
        if (isFlower) {
          el = document.createElement('img');
          el.src = roses[Math.floor(Math.random() * roses.length)];
          el.alt = '';
          el.className = 'bouquet-flying-flower';
        } else {
          el = document.createElement('span');
          el.className = 'bouquet-flying-petal';
        }
        const size = isFlower ? 27 + Math.random()*37 : 10 + Math.random()*16;
        el.style.width = `${size}px`;
        el.style.height = `${isFlower ? size : size*.67}px`;
        overlay.appendChild(el);

        // Fan out in all directions; float upward, then slowly fall down.
        const sx = startX + (Math.random()-.5)*75 - size/2;
        const sy = startY + (Math.random()-.5)*65 - size/2;
        const angle = Math.random()*Math.PI*2;
        const dx = Math.cos(angle) * (70 + Math.random()*spread);
        const dy = -80 - Math.random()*(mobile ? 260 : 390);
        const drift = (Math.random()-.5)*210;
        const endX = Math.max(-100, Math.min(vw+60, sx+dx+drift));
        const endY = vh + size + Math.random()*110;
        const spin = (Math.random()<.5?-1:1)*(270+Math.random()*790);
        const delay = reduced.matches ? 0 : Math.random()*320;
        const duration = reduced.matches ? 900 : 3000+Math.random()*2100;
        const frames = [
          { transform:`translate3d(${sx}px,${sy}px,0) scale(.18) rotate(0deg)`, opacity:0, offset:0 },
          { transform:`translate3d(${sx+dx*.22}px,${sy+dy*.30}px,0) scale(.9) rotate(${spin*.18}deg)`, opacity:1, offset:.15 },
          { transform:`translate3d(${sx+dx}px,${sy+dy}px,0) scale(1) rotate(${spin*.65}deg)`, opacity:1, offset:.45 },
          { transform:`translate3d(${endX}px,${endY}px,0) scale(.78) rotate(${spin}deg)`, opacity:0, offset:1 }
        ];
        const animation = el.animate(frames, { duration, delay, easing:'linear', fill:'forwards' });
        animation.finished.then(() => el.remove()).catch(() => el.remove());
      }
    }

    card.addEventListener('click', burst);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        burst();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
