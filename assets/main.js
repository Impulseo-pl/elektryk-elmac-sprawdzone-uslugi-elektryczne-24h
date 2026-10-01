/* ElMac - ruch strony. Każdy blok w try/catch: awaria jednego nie zatrzymuje reszty. */
(function () {
  var d = document.documentElement;
  var RM = false;
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  var NAV = function () { return parseInt(getComputedStyle(d).getPropertyValue('--nav-h'), 10) || 76; };

  /* 1. Płynne przewijanie (Lenis) - tylko mysz/gładzik, telefon przewija natywnie */
  var lenis = null;
  try {
    if (!RM && window.Lenis && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (d.classList.contains('intro-on')) {
        lenis.stop();
        document.addEventListener('wejscie:koniec', function () { lenis.start(); });
      }
    }
  } catch (e) { lenis = null; }
  window.__lenis = lenis;

  var scrollY = function () { return window.pageYOffset || d.scrollTop || 0; };
  var naScroll = [];
  var tik = false;
  var przelicz = function () { tik = false; for (var i = 0; i < naScroll.length; i++) { try { naScroll[i](); } catch (e) { } } };
  var zglos = function () { if (!tik) { tik = true; requestAnimationFrame(przelicz); } };
  window.addEventListener('scroll', zglos, { passive: true });
  window.addEventListener('resize', zglos, { passive: true });

  /* 2. Pasek: tło po zjechaniu, chowanie przy przewijaniu w dół */
  try {
    var head = document.querySelector('.site-head');
    var sc = document.querySelector('.sticky-call');
    var hero = document.querySelector('.hero, .pagehead');
    var ostatni = 0;
    naScroll.push(function () {
      var y = scrollY();
      if (head) {
        head.classList.toggle('is-scrolled', y > 24);
        var wDol = y > ostatni + 4, wGore = y < ostatni - 4;
        if (!d.classList.contains('menu-open')) {
          if (wDol && y > 520) head.classList.add('is-hidden');
          else if (wGore || y < 520) head.classList.remove('is-hidden');
        }
      }
      if (sc) sc.classList.toggle('is-on', y > (hero ? hero.offsetHeight * 0.6 : 300));
      ostatni = y;
    });
  } catch (e) { }

  /* 3. Odsłanianie sekcji: obserwator + zapas przy przewijaniu + twardy bezpiecznik */
  try {
    var rv = [].slice.call(document.querySelectorAll('.rv'));
    var odslon = function (el) {
      if (el.classList.contains('is-in')) return;
      el.classList.add('is-in');
      var dl = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
      setTimeout(function () { el.classList.add('rv-done'); }, 1150 + dl);
    };
    if (!d.classList.contains('anim')) {
      rv.forEach(odslon);
    } else {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (wpisy) {
          wpisy.forEach(function (w) { if (w.isIntersecting) { odslon(w.target); io.unobserve(w.target); } });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        rv.forEach(function (el) { io.observe(el); });
      }
      /* przeskok (np. kotwica) omija obserwatora - odsłaniamy wszystko, co już minęło */
      var zapas = function () {
        var h = window.innerHeight;
        for (var i = 0; i < rv.length; i++) {
          if (!rv[i].classList.contains('is-in') && rv[i].getBoundingClientRect().top < h * 0.94) odslon(rv[i]);
        }
      };
      naScroll.push(zapas);
      setTimeout(zapas, 400);
      setTimeout(zapas, 3200);
    }
  } catch (e) { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('is-in'); }); }

  /* 4. Tekst w nagłówku wchodzi kaskadą (na głównej po ekranie wejścia) */
  try {
    if (!d.classList.contains('intro-on')) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('hero-go'); }); });
    }
    setTimeout(function () { d.classList.add('hero-go'); }, 4800);
  } catch (e) { d.classList.add('hero-go'); }

  /* 5. Liczniki */
  try {
    var liczby = [].slice.call(document.querySelectorAll('.num[data-to]'));
    var licz = function (el) {
      if (el.__liczy) return; el.__liczy = true;
      var cel = parseFloat(el.getAttribute('data-to').replace(',', '.'));
      var miejsca = (el.getAttribute('data-to').split(',')[1] || '').length;
      if (RM) { return; }
      var t0 = null, DUR = 1700;
      var krok = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / DUR), e = 1 - Math.pow(2, -10 * p);
        var v = (cel * (p === 1 ? 1 : e)).toFixed(miejsca).replace('.', ',');
        el.textContent = v;
        if (p < 1) requestAnimationFrame(krok);
      };
      el.textContent = (0).toFixed(miejsca).replace('.', ',');
      requestAnimationFrame(krok);
    };
    if ('IntersectionObserver' in window && !RM) {
      var io2 = new IntersectionObserver(function (wp) {
        wp.forEach(function (w) { if (w.isIntersecting) { licz(w.target); io2.unobserve(w.target); } });
      }, { threshold: 0.6 });
      liczby.forEach(function (el) { io2.observe(el); });
    }
  } catch (e) { }

  /* 6. Proces: przewód zapala kolejne etapy */
  try {
    var kroki = document.querySelector('.proc-steps');
    if (kroki) {
      var wire = kroki.querySelector('.wire');
      var steps = [].slice.call(kroki.querySelectorAll('.step'));
      var licznik = document.querySelector('.proc-count b');
      var teraz = document.querySelector('.proc-now');
      naScroll.push(function () {
        var r = kroki.getBoundingClientRect(), h = window.innerHeight, linia = h * 0.58;
        var p = Math.max(0, Math.min(1, (linia - r.top - 16) / (r.height - 72)));
        if (wire) wire.style.setProperty('--p', p.toFixed(4));
        var akt = 0;
        steps.forEach(function (s, i) {
          var on = s.getBoundingClientRect().top + 14 < linia;
          s.classList.toggle('is-live', on);
          if (on) akt = i;
        });
        if (licznik) licznik.textContent = ('0' + (akt + 1)).slice(-2);
        if (teraz && steps[akt]) teraz.textContent = steps[akt].getAttribute('data-nazwa') || '';
      });
    }
  } catch (e) { }

  /* 7. Paralaksa zdjęć wewnątrz ramek (tylko duży ekran) */
  try {
    if (!RM && window.matchMedia('(min-width: 900px)').matches) {
      var plx = [].slice.call(document.querySelectorAll('[data-plx]'));
      naScroll.push(function () {
        var h = window.innerHeight;
        plx.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > h + 100) return;
          var k = parseFloat(el.getAttribute('data-plx')) || 40;
          var p = (r.top + r.height / 2 - h / 2) / (h / 2 + r.height / 2);
          el.style.translate = '0 ' + (p * -k).toFixed(1) + 'px';
        });
      });
    }
  } catch (e) { }

  /* 8. Menu na telefonie */
  try {
    var burger = document.querySelector('.burger');
    if (burger) {
      var zamknij = function () {
        d.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Otwórz menu'); if (lenis) lenis.start();
      };
      burger.addEventListener('click', function () {
        var otw = !d.classList.contains('menu-open');
        if (!otw) { zamknij(); return; }
        d.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Zamknij menu'); if (lenis) lenis.stop();
      });
      document.querySelectorAll('.mnav a').forEach(function (a) { a.addEventListener('click', zamknij); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });
    }
  } catch (e) { }

  /* 9. Pytania: płynne rozwijanie */
  try {
    document.querySelectorAll('.faq-item').forEach(function (det) {
      var sum = det.querySelector('summary');
      if (!sum || !det.animate || RM) return;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (det.__anim) det.__anim.cancel();
        var start = det.offsetHeight, koniec;
        det.style.overflow = 'hidden';
        if (!det.open) {
          det.open = true;
          koniec = det.offsetHeight;
        } else {
          var b = parseFloat(getComputedStyle(det).borderTopWidth) * 2 || 2;
          koniec = sum.offsetHeight + b;
          det.classList.add('zamyka');
        }
        det.__anim = det.animate({ height: [start + 'px', koniec + 'px'] }, { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' });
        det.__anim.onfinish = function () {
          if (det.classList.contains('zamyka')) { det.open = false; det.classList.remove('zamyka'); }
          det.style.overflow = ''; det.__anim = null;
        };
        det.__anim.oncancel = function () { det.classList.remove('zamyka'); };
      });
    });
  } catch (e) { }

  /* 10. Podgląd zdjęć w realizacjach */
  try {
    var kafle = [].slice.call(document.querySelectorAll('[data-lb]'));
    if (kafle.length) {
      var lb = document.createElement('div');
      lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Podgląd zdjęcia');
      lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
        '<button class="lb-btn lb-x" type="button" aria-label="Zamknij podgląd"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        '<button class="lb-btn lb-prev" type="button" aria-label="Poprzednie zdjęcie"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<button class="lb-btn lb-next" type="button" aria-label="Następne zdjęcie"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 5l7 7-7 7"/></svg></button>';
      document.body.appendChild(lb);
      var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), idx = 0;
      var pokaz = function (i) {
        idx = (i + kafle.length) % kafle.length;
        var k = kafle[idx], im = k.querySelector('img');
        lbImg.src = k.getAttribute('href'); lbImg.alt = im ? im.alt : '';
        lbCap.textContent = k.getAttribute('data-lb') || '';
      };
      var otworz = function (i) { pokaz(i); lb.classList.add('is-open'); if (lenis) lenis.stop(); lb.querySelector('.lb-x').focus({ preventScroll: true }); };
      var zamknijLb = function () { lb.classList.remove('is-open'); if (lenis) lenis.start(); };
      kafle.forEach(function (k, i) { k.addEventListener('click', function (e) { e.preventDefault(); otworz(i); }); });
      lb.querySelector('.lb-x').addEventListener('click', zamknijLb);
      lb.querySelector('.lb-prev').addEventListener('click', function () { pokaz(idx - 1); });
      lb.querySelector('.lb-next').addEventListener('click', function () { pokaz(idx + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) zamknijLb(); });
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') zamknijLb();
        if (e.key === 'ArrowLeft') pokaz(idx - 1);
        if (e.key === 'ArrowRight') pokaz(idx + 1);
      });
    }
  } catch (e) { }

  /* 11. Kotwice na tej samej stronie - płynnie, z miejscem na pasek */
  try {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var cel = document.querySelector(id);
        if (!cel) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(cel, { offset: -NAV() + 1, duration: 1.4 });
        else cel.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', id);
      });
    });
  } catch (e) { }

  /* 12. Wyjście ze strony: przeglądarki bez przejść widoku dostają krótkie wygaszenie */
  try {
    if (!RM && !('CSSViewTransitionRule' in window)) {
      document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a') : null;
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var href = a.getAttribute('href') || '';
        if (a.target || a.hasAttribute('download') || /^(#|tel:|mailto:|https?:|\/\/)/i.test(href)) return;
        if (a.pathname === location.pathname && a.hash) return;
        e.preventDefault();
        d.classList.add('pt-leave');
        setTimeout(function () { location.href = a.href; }, 300);
      });
      window.addEventListener('pageshow', function (ev) { if (ev.persisted) d.classList.remove('pt-leave'); });
    }
  } catch (e) { }

  przelicz();
  d.classList.add('anim-ok');
})();

(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
