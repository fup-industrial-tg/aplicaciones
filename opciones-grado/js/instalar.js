/* Aviso «Instalar la aplicación» al abrir la PWA.
   - Android y computador (Chrome/Edge): botón «Instalar» que abre el diálogo de instalación del navegador.
   - iPhone y iPad: instrucciones (Compartir → Añadir a pantalla de inicio), porque iOS no permite instalar con un botón.
   No aparece si la aplicación ya está instalada, ni en los instaladores de Windows/Android. «Ahora no» lo oculta 7 días. */
(function () {
  'use strict';
  var CLAVE = 'fup_instalar_oculto_hasta';
  var diferido = null;

  function instalada() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true || !/^https?:$/.test(location.protocol);
  }
  function oculto() { try { return Number(localStorage.getItem(CLAVE) || 0) > Date.now(); } catch (e) { return false; } }
  function ocultarDias(d) { try { localStorage.setItem(CLAVE, String(Date.now() + d * 86400000)); } catch (e) { /* sin almacenamiento */ } }
  function esIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function quitar() { var a = document.getElementById('fup-instalar'); if (a) a.remove(); }

  function estilo() {
    if (document.getElementById('fup-instalar-css')) return;
    var s = document.createElement('style'); s.id = 'fup-instalar-css';
    s.textContent = '#fup-instalar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99999;width:calc(100% - 24px);max-width:440px;background:#fff;color:#1f2d3d;border:1px solid #c9d5e0;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.28);padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4}' +
      '#fup-instalar b{color:#005790}#fup-instalar .fi-acc{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}' +
      '#fup-instalar button{font:inherit;font-weight:700;border-radius:9px;padding:9px 14px;cursor:pointer;border:1px solid #005790}' +
      '#fup-instalar .fi-si{background:#005790;color:#fff}#fup-instalar .fi-no{background:#fff;color:#005790}' +
      '@media (prefers-color-scheme: dark){#fup-instalar{background:#12283a;color:#e8eef4;border-color:#24425a}#fup-instalar b{color:#C9A45C}#fup-instalar .fi-no{background:transparent;color:#e8eef4;border-color:#5b7a93}}';
    document.head.appendChild(s);
  }

  function mostrar(modo) {
    if (instalada() || oculto() || document.getElementById('fup-instalar')) return;
    estilo();
    var nombre = (document.title || 'esta aplicación').split('·').pop().trim();
    var d = document.createElement('div'); d.id = 'fup-instalar'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Instalar la aplicación');
    var t = document.createElement('div');
    if (modo === 'ios') {
      t.innerHTML = '<b>Instala esta aplicación</b> en tu iPhone o iPad: toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba) y elige <b>Añadir a pantalla de inicio</b>.';
    } else {
      t.innerHTML = '<b>Instala ' + nombre + '</b> en este dispositivo para abrirla como una aplicación y usarla también sin internet.';
    }
    d.appendChild(t);
    var acc = document.createElement('div'); acc.className = 'fi-acc';
    var no = document.createElement('button'); no.type = 'button'; no.className = 'fi-no'; no.textContent = modo === 'ios' ? 'Entendido' : 'Ahora no';
    no.onclick = function () { ocultarDias(7); quitar(); };
    acc.appendChild(no);
    if (modo !== 'ios') {
      var si = document.createElement('button'); si.type = 'button'; si.className = 'fi-si'; si.textContent = 'Instalar';
      si.onclick = function () {
        if (!diferido) { quitar(); return; }
        var ev = diferido; diferido = null;
        try { ev.prompt(); (ev.userChoice || Promise.resolve()).then(function () { quitar(); }); } catch (e) { quitar(); }
      };
      acc.appendChild(si);
    }
    d.appendChild(acc);
    document.body.appendChild(d);
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); diferido = e; mostrar('boton'); });
  window.addEventListener('appinstalled', quitar);
  if (esIOS()) {
    var arrancar = function () { setTimeout(function () { mostrar('ios'); }, 1500); };
    if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar);
  }
})();
