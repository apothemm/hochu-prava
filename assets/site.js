/* #ХОЧУПРАВА — общий скрипт сайта.
   Разделы: шапка и меню · появление блоков · вкладки · самотесты · фильтр автопарка · навигация каталога ·
   формы заявок · виджеты «ИИ-помощник» и «Чат с менеджером» (два отдельных окна). */
(function () {
  "use strict";

  var PHONE = "+7 (951) 340-30-44", TEL = "tel:+79513403044";
  var VK = "https://vk.com/write-73797484";
  var MAX = "https://max.ru/u/f9LHodD0cOIG4pU1s3rPUgZPighyXr8QHROfEb8xWLaPMw4CHSRqBWhaagw";
  var PRICES = window.HP_PRICES || {};
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function track(name, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, detail || {}));
  }
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (/^tel:/.test(href)) track("phone_click");
    else if (/vk\.com|^https:\/\/max\.ru/.test(href)) track("messenger_click", { channel: href.indexOf("vk.com") >= 0 ? "vk" : "max" });
    else if (href.indexOf("tariff=") >= 0) track("tariff_select", { tariff: new URL(link.href).searchParams.get("tariff") });
    else if (link.closest(".hero-card") && href === "#tariffs") track("tariff_picker_click");
    else if (/^(team|reviews|svedeniya)\.html/.test(href)) track(({ "team.html": "instructors_click", "reviews.html": "reviews_click", "svedeniya.html": "documents_click" })[href.split("#")[0]]);
    else if (link.closest("#directions")) track("direction_click", { destination: href.split("?")[0] });
  });
  if ("IntersectionObserver" in window) {
    var watched = $$("#tariffs, #people, #reviews");
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { track("section_view", { section: entry.target.id }); sectionObserver.unobserve(entry.target); } });
    }, { threshold: 0.3 });
    watched.forEach(function (section) { sectionObserver.observe(section); });
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return node;
  }
  var store = {
    get: function (area, key, def) { try { var v = window[area].getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set: function (area, key, val) { try { window[area].setItem(key, JSON.stringify(val)); } catch (e) { /* хранилище недоступно */ } }
  };

  /* ---------- Версия для слабовидящих и озвучивание ---------- */
  var a11yDefaults = { font: "100", contrast: "normal", color: "normal" };
  var a11y = store.get("localStorage", "hp_a11y", a11yDefaults);
  function applyA11y() {
    var root = document.documentElement;
    root.setAttribute("data-font-size", a11y.font || "100");
    root.setAttribute("data-contrast", a11y.contrast || "normal");
    root.setAttribute("data-color-mode", a11y.color || "normal");
    $$('[data-a11y-font]').forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-a11y-font") === a11y.font)); });
    $$('[data-a11y-contrast]').forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-a11y-contrast") === a11y.contrast)); });
    var color = $("[data-a11y-color]"); if (color) color.value = a11y.color || "normal";
  }
  applyA11y();
  var a11yPanel = $("#a11yPanel"), a11yOpen = $("[data-a11y-open]"), a11yStatus = $("[data-a11y-status]");
  function setA11yPanel(open) {
    if (!a11yPanel || !a11yOpen) return;
    a11yPanel.hidden = !open;
    a11yOpen.setAttribute("aria-expanded", String(open));
    if (open) { var first = $("button", a11yPanel); if (first) first.focus(); }
    else a11yOpen.focus();
  }
  if (a11yOpen) a11yOpen.addEventListener("click", function () { setA11yPanel(a11yPanel.hidden); });
  var a11yClose = $("[data-a11y-close]"); if (a11yClose) a11yClose.addEventListener("click", function () { setA11yPanel(false); });
  $$('[data-a11y-font]').forEach(function (b) { b.addEventListener("click", function () { a11y.font = b.getAttribute("data-a11y-font"); store.set("localStorage", "hp_a11y", a11y); applyA11y(); }); });
  $$('[data-a11y-contrast]').forEach(function (b) { b.addEventListener("click", function () { a11y.contrast = b.getAttribute("data-a11y-contrast"); store.set("localStorage", "hp_a11y", a11y); applyA11y(); }); });
  var colorMode = $("[data-a11y-color]"); if (colorMode) colorMode.addEventListener("change", function () { a11y.color = colorMode.value; store.set("localStorage", "hp_a11y", a11y); applyA11y(); });
  var a11yReset = $("[data-a11y-reset]"); if (a11yReset) a11yReset.addEventListener("click", function () { a11y = { font: "100", contrast: "normal", color: "normal" }; store.set("localStorage", "hp_a11y", a11y); applyA11y(); if (a11yStatus) a11yStatus.textContent = "Настройки сброшены."; });

  var speechToggle = $("[data-speech-toggle]"), speechStop = $("[data-speech-stop]"), speaking = false;
  function stopSpeech(message) {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speaking = false;
    if (speechToggle) { speechToggle.textContent = "Читать страницу"; speechToggle.setAttribute("aria-pressed", "false"); }
    if (speechStop) speechStop.disabled = true;
    if (a11yStatus && message) a11yStatus.textContent = message;
  }
  function speakPage() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { if (a11yStatus) a11yStatus.textContent = "Озвучивание не поддерживается этим браузером."; return; }
    if (speaking) { stopSpeech("Озвучивание поставлено на паузу."); return; }
    var selection = String(window.getSelection ? window.getSelection() : "").trim();
    var main = $("#main"), text = selection || (main ? main.innerText : document.body.innerText);
    var chunks = text.replace(/\s+/g, " ").match(/.{1,220}(?:[.!?](?:\s|$)|$)/g) || [];
    if (!chunks.length) return;
    window.speechSynthesis.cancel(); speaking = true;
    speechToggle.textContent = "Пауза"; speechToggle.setAttribute("aria-pressed", "true"); speechStop.disabled = false;
    if (a11yStatus) a11yStatus.textContent = selection ? "Читаю выделенный текст." : "Читаю содержимое страницы.";
    chunks.forEach(function (chunk, index) {
      var utterance = new SpeechSynthesisUtterance(chunk.trim());
      utterance.lang = "ru-RU"; utterance.rate = .95;
      if (index === chunks.length - 1) utterance.onend = function () { stopSpeech("Озвучивание завершено."); };
      utterance.onerror = function () { stopSpeech("Озвучивание остановлено."); };
      window.speechSynthesis.speak(utterance);
    });
  }
  if (speechToggle) speechToggle.addEventListener("click", speakPage);
  if (speechStop) speechStop.addEventListener("click", function () { stopSpeech("Озвучивание остановлено."); });
  if (!("speechSynthesis" in window) && speechToggle) { speechToggle.disabled = true; speechStop.disabled = true; }

  /* ---------- Возврат к выбранной карточке каталога ---------- */
  var pageParams = new URLSearchParams(location.search), catalogReturn = $("#catalogReturn");
  if (catalogReturn && pageParams.get("from") === "home-catalog") {
    var sourceCard = pageParams.get("card") || "b";
    catalogReturn.hidden = false;
    catalogReturn.href = "index.html?return=" + encodeURIComponent(sourceCard) + "#directions";
  }
  if (document.body.getAttribute("data-page") === "index" && pageParams.get("return")) {
    var returnedCard = $('[data-catalog-card="' + pageParams.get("return").replace(/[^a-z-]/g, "") + '"]');
    if (returnedCard) setTimeout(function () { returnedCard.classList.add("is-returned"); returnedCard.focus({ preventScroll: true }); returnedCard.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }); }, 180);
  }

  /* ---------- Шапка и мобильное меню ---------- */
  var hdr = $(".hdr");
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  var burger = $(".burger"), mnav = $("#mnav");
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    mnav.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  }
  if (burger) burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  if (mnav) mnav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1100) setMenu(false); });

  $$(".nav__dd > button").forEach(function (btn) {
    var dd = btn.parentNode;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !dd.classList.contains("is-open");
      $$(".nav__dd.is-open").forEach(function (x) { x.classList.remove("is-open"); });
      dd.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav__dd")) $$(".nav__dd.is-open").forEach(function (x) {
      x.classList.remove("is-open");
      var b = $("button", x); if (b) b.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Появление блоков при прокрутке ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var targets = $$(".head, .card, .step, .tariff, .price, .post, .photo, .cta, .diag, .review, .person, .row, .faq, .compare, .product__intro, .product__badge, .scroll-x");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) {
      if (t.closest(".wp, .hero, .phero, .dd, .mnav") || t.getBoundingClientRect().top < window.innerHeight) return;
      var idx = Array.prototype.indexOf.call(t.parentNode.children, t);
      t.style.transitionDelay = Math.min(idx, 5) * 60 + "ms";
      t.classList.add("reveal");
      io.observe(t);
    });
  }

  /* ---------- Вкладки ---------- */
  $$("[data-tabs]").forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* ---------- Самотесты и выбор ситуации ---------- */
  $$("[data-diag]").forEach(function (box) {
    var out = $("[data-diag-result]", box), chips = $$("[data-result]", box);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        out.textContent = chip.getAttribute("data-result");
        var href = chip.getAttribute("data-href");
        if (href) { out.appendChild(document.createTextNode(" ")); out.appendChild(el("a", { href: href, text: chip.getAttribute("data-link") || "Подробнее →" })); }
      });
    });
  });

  /* ---------- Раскрывающиеся карточки инструкторов ---------- */
  var hoverCards = window.matchMedia("(hover: hover) and (pointer: fine)");
  $$("[data-instructor]").forEach(function (card) {
    var summary = $("summary", card), pinned = false, hovering = false, dismissed = false;
    card.addEventListener("pointerenter", function (event) {
      if (!hoverCards.matches || event.pointerType === "touch") return;
      hovering = true;
      if (!dismissed) card.open = true;
    });
    card.addEventListener("pointerleave", function () {
      hovering = false; dismissed = false;
      if (!pinned && !card.contains(document.activeElement)) card.open = false;
    });
    summary.addEventListener("click", function (event) {
      event.preventDefault();
      if (hovering && card.open && !pinned) pinned = true;
      else { pinned = !card.open; card.open = pinned; dismissed = !pinned; }
    });
    card.addEventListener("focusout", function (event) {
      if (!card.contains(event.relatedTarget) && !pinned && !hovering) card.open = false;
    });
    card.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !card.open) return;
      event.preventDefault(); event.stopPropagation();
      pinned = false; dismissed = true; card.open = false; summary.focus();
    });
    card.addEventListener("instructor-reset", function () { pinned = false; hovering = false; dismissed = false; card.open = false; });
  });

  /* ---------- Фильтр автопарка ---------- */
  $$("[data-filter-group]").forEach(function (group) {
    var target = document.getElementById(group.getAttribute("data-filter-group"));
    var btns = $$("[data-filter]", group), count = $("[data-filter-count]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter"), shown = 0;
        btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        $$("[data-cat]", target).forEach(function (row) {
          var on = f === "all" || row.getAttribute("data-cat").split(" ").indexOf(f) > -1;
          row.hidden = !on; if (!on) row.dispatchEvent(new Event("instructor-reset")); if (on) shown++;
        });
        if (count) count.textContent = shown;
      });
    });
  });

  /* ---------- Навигация по блокам каталога ---------- */
  var subnav = $(".subnav__in");
  if (subnav && "IntersectionObserver" in window) {
    var links = $$('a[href^="#"]', subnav);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + en.target.id;
          a.classList.toggle("is-active", on);
          if (on) subnav.scrollTo({ left: a.offsetLeft - 24, behavior: reduceMotion ? "auto" : "smooth" });
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute("href").slice(1)); if (s) spy.observe(s); });
  }

  /* ---------- Отправка заявок ---------- */
  var leadCooldownKey = "hp_lead_cooldown_until";
  function cooldownLeft() {
    return Math.max(0, Math.ceil((Number(store.get("localStorage", leadCooldownKey, 0)) - Date.now()) / 1000));
  }
  function rememberCooldown(seconds) {
    store.set("localStorage", leadCooldownKey, Date.now() + Math.max(1, Number(seconds) || 60) * 1000);
  }
  function sendLead(data) { return Promise.reject(new Error("static_host")); }
  function phoneOk(v) {
    var digits = String(v || "").replace(/\D/g, "");
    if (digits.length === 10) digits = "7" + digits;
    if (digits.length === 11 && digits.charAt(0) === "8") digits = "7" + digits.slice(1);
    if (!/^7[3489]\d{9}$/.test(digits)) return false;
    var national = digits.slice(1), subscriber = digits.slice(4);
    return ["1234567890", "9876543210", "0000000000", "1111111111", "9999999999"].indexOf(national) < 0 && !/^(\d)\1{9}$/.test(national) && !/^(\d)\1{6}$/.test(subscriber);
  }
  function leadErrorText(error) {
    if (error && error.code === "invalid_phone") return "Проверьте номер: нужен действительный российский номер в формате +7 (___) ___-__-__.";
    if (error && error.code === "invalid_name") return "Укажите имя — минимум два символа.";
    if (error && (error.code === "cooldown" || error.code === "too_many_requests")) {
      return "Повторную заявку можно отправить через " + Math.max(1, Number(error.retryAfter) || 60) + " сек.";
    }
    return "Не удалось отправить заявку. Позвоните " + PHONE + " — мы поможем.";
  }

  $$("form[data-lead]").forEach(function (form) {
    var params = new URLSearchParams(location.search);
    ["need", "tariff", "timing", "message"].forEach(function (name) {
      var field = form.elements[name], val = params.get(name);
      if (!field || !val) return;
      if (field.tagName === "SELECT") { if ($$("option", field).some(function (o) { return o.value === val; })) field.value = val; }
      else field.value = val;
    });
    var tariffNote = $("[data-tariff-note]", form);
    if (tariffNote && params.get("tariff")) { tariffNote.hidden = false; tariffNote.querySelector("b").textContent = params.get("tariff"); }

    var notice = $("[data-notice]", form.parentNode) || $("[data-notice]", form);
    var sending = false;
    var started = false;
    form.addEventListener("focusin", function (event) {
      if (!started && event.target.matches("input:not([type=hidden]), textarea, select")) { started = true; track("form_start", { form: "lead" }); }
    });
    $$("input:not([type=hidden]), textarea, select", form).forEach(function (field) {
      field.addEventListener("input", function () { field.removeAttribute("aria-invalid"); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      var btn = $('button[type="submit"]', form), data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page = location.pathname.replace(/^\//, "") || "index.html";
      if (!data.name || data.name.trim().length < 2) { form.elements.name.setAttribute("aria-invalid", "true"); form.elements.name.focus(); show("Укажите имя — минимум два символа.", true); return; }
      if (!phoneOk(data.phone)) { form.elements.phone.setAttribute("aria-invalid", "true"); form.elements.phone.focus(); show("Проверьте номер: нужен действительный российский номер в формате +7 (___) ___-__-__.", true); return; }
      var label = btn ? btn.innerHTML : "";
      sending = true;
      if (btn) { btn.disabled = true; btn.textContent = "Отправляем…"; }
      sendLead(data).then(function () {
        track("form_success", { form: "lead" });
        form.reset();
        show("Заявка отправлена. Спасибо! Менеджер свяжется с вами по указанному телефону в рабочее время.", false);
      }).catch(function (error) {
        show(leadErrorText(error), true);
      }).then(function () { sending = false; if (btn) { btn.disabled = false; btn.innerHTML = label; } });
    });
    function show(text, isError) {
      if (!notice) return;
      notice.textContent = text;
      notice.classList.toggle("notice--error", !!isError);
      notice.hidden = false;
    }
  });

  /* ================================================================
     Виджеты. «ИИ-помощник» — автоматические ответы по информации сайта.
     «Чат с менеджером» — сообщение уходит живому человеку (/api/lead, channel=chat).
     ================================================================ */
  var ICO = {
    spark: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c.4 3.9 2.1 6.3 5.2 7.4L20 10l-2.8.6C14.1 11.7 12.4 14.1 12 18c-.4-3.9-2.1-6.3-5.2-7.4L4 10l2.8-.6C9.9 8.3 11.6 5.9 12 2Zm6.5 11c.2 1.9 1 3 2.5 3.5-1.5.5-2.3 1.6-2.5 3.5-.2-1.9-1-3-2.5-3.5 1.5-.5 2.3-1.6 2.5-3.5Z"/></svg>',
    chat: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 6.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm5 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm5 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    vk: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.8 18.1C6.6 18.1 3 13.9 2.9 6.9h3.1c.1 5.1 2.4 7.3 4.1 7.7V6.9h2.9v4.4c1.8-.2 3.6-2.2 4.2-4.4h2.9c-.5 2.7-2.5 4.7-3.9 5.5 1.4.7 3.7 2.4 4.6 5.7h-3.2c-.7-2.2-2.4-3.9-4.6-4.1v4.1h-.2Z"/></svg>',
    max: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5c-5.3 0-9.5 4-9.5 9.3 0 2.3.7 4.6 1.6 6.2.3.5.2 1.6-.2 2.6-.2.5.3 1 .8.8 1.3-.5 2.4-.9 3-.5 1.3.8 2.7 1.2 4.3 1.2 5.3 0 9.5-4 9.5-9.4S17.3 2.5 12 2.5Zm.1 14.6c-1 0-1.9-.3-2.6-.8-.4.4-1.5.9-1.9.6-.2-.9.2-1.7.1-2.6-.3-1.4-.5-2.4-.5-3.4 0-2.9 2.2-5 5-5 2.7 0 4.8 2.1 4.8 5.6 0 3-2.2 5.6-4.9 5.6Z"/></svg>'
  };

  // База знаний помощника — формулировки и цифры из материалов сайта.
  var KB = [
    { id: "human", keys: ["менеджер", "живой человек", "оператор", "перезвон", "связаться", "позвонит"], open: "chat",
      text: "Передам вас живому человеку: в окне контактов выберите ВКонтакте, MAX или телефон — ответят в рабочее время, 09:00–21:00." },
    { id: "price", keys: ["сколько стоит", "стоимост", "цена", "цены", "тариф", "прайс", "по деньгам", "руб", "₽"],
      text: "В проекте указаны 3 тарифа категории B: " + PRICES["b.basic"] + " ₽, " + PRICES["b.popular"] + " ₽ (8 занятий на авто) и " + PRICES["b.comfort"] + " ₽ (15 занятий). Поможем сравнить варианты практики.",
      links: [["prices.html#b", "Сравнить тарифы"], ["prices.html", "Все цены"]] },
    { id: "installment", keys: ["рассроч", "кредит", "долями", "сплит", "split", "частями"], handoff: true,
      text: "Предусмотрены несколько вариантов финансирования: рассрочка автошколы до 2 месяцев, банковские варианты и сервисы split/«Долями». Точные условия подтвердит менеджер.",
      links: [["prices.html#payment", "Оплата и рассрочка"]] },
    { id: "fear", keys: ["боюсь", "страх", "страшно", "тревог", "паник", "нервнича", "волнуюсь"],
      text: "Это нормально. Мы не будем сразу отправлять тебя в сложный город. Начнём с того, что именно пугает: скорость, парковка, перекрёстки, перестроения или сам факт, что рядом инструктор. В разделе «Боюсь водить» — отдельный путь.",
      links: [["catalog.html#fear", "Боюсь водить"]] },
    { id: "transfer", keys: ["другой школ", "другая школ", "другой автошкол", "другая автошкол", "перейти", "переход", "аванс", "учусь в", "заплатил"], handoff: true,
      text: "Можно разобрать твою ситуацию отдельно: что уже пройдено, какие документы есть и что можно сохранить. Внесён аванс 2 000 ₽ — возможна скидка 2 000 ₽ при переходе. Другая школа оплачена полностью — возможна скидка до 50% на теорию при полном переходе. Точные условия подтвердит менеджер.",
      links: [["transfer.html", "Переход из другой школы"]] },
    { id: "additional", keys: ["доп", "дополнительн", "практик", "покататься", "занятия", "урок", "парковк"],
      text: "Дополнительное вождение лучше брать под конкретную задачу: парковка, город, перестроения, экзамен или возвращение после перерыва. Одно занятие — ровно 60 минут. Ученикам #ХОЧУПРАВА: 1 400 ₽, в пакете 5 — 1 300 ₽, в пакете 10 — 1 200 ₽ за занятие. С правами или из другой школы: 1 700 / 1 500 / 1 300 ₽.",
      links: [["catalog.html#additional", "Доп. вождение"], ["prices.html#additional", "Цены"]] },
    { id: "return", keys: ["вернуться", "перерыв", "давно не", "не езжу", "забыл", "права есть", "есть права"],
      text: "Если права уже есть, но давно не ездил, тебе не нужен полный курс. Начнём с диагностики и постепенно вернём уверенность: спокойный старт, город, твой маршрут.",
      links: [["catalog.html#return", "Вернуться за руль"]] },
    { id: "a", keys: ["мото", "категория a", "категорию a", "категории a", "категория а", "категорию а", "категории а"], handoff: true,
      text: "Категория A — отдельный продукт: практика (баланс, манёвры, торможение, поведение в городе), теория и подготовка к экзамену. Актуальную стоимость, расписание и формат практики подтвердит менеджер. В автопарке есть мотоциклы категорий A и A1.",
      links: [["catalog.html#a", "Категория A"], ["autopark.html", "Автопарк"]] },
    { id: "b", keys: ["получить права", "получ", "с нуля", "категория b", "категорию b", "категории b", "категория в", "категорию в", "права", "легков"],
      text: "Если начинаешь с нуля, основной маршрут — категория B: теория онлайн или очно, практика в одном из 4 районов и подготовка к экзамену. Ориентир по сроку — 2 месяца. Есть 3 тарифа с разным объёмом практики — могу помочь выбрать.",
      links: [["catalog.html#b", "Категория B"], ["prices.html#b", "Тарифы"]] },
    { id: "online", keys: ["онлайн", "дистанц", "теори", "видео", "с телефона"],
      text: "Да, онлайн-теория предусмотрена: видео, конспекты, тесты и возможность задать вопрос преподавателю. Конкретный формат и состав курса подтверждаются при оформлении.",
      links: [["article-online.html", "Онлайн-теория: кому подходит"]] },
    { id: "instructor", keys: ["инструктор", "сменить", "поменять", "не сошлись"],
      text: "Да, инструктора можно сменить: если не сошлись — это не повод терпеть весь курс. Скажи об этом менеджеру, поможем найти подходящий вариант.",
      links: [["team.html", "Инструкторы"]] },
    { id: "where", keys: ["где", "где проход", "где занят", "район", "адрес", "светотехстрой", "химмаш", "юго-запад", "офис", "находитесь", "добраться"],
      text: "Практика стартует в 4 районах: Светотехстрой, Химмаш, Центр, Юго-Запад — конкретную точку согласует менеджер. Офис — ТРК «Огарёв Плаза», 09:00–21:00 ежедневно.",
      links: [["contacts.html", "Контакты"]] },
    { id: "hours", keys: ["время работы", "часы работы", "график", "во сколько", "работаете", "выходн", "телефон"],
      text: "Офис работает с 09:00 до 21:00 каждый день. Телефон: " + PHONE + ".",
      links: [[TEL, "Позвонить"], ["contacts.html", "Контакты"]] },
    { id: "guarantee", keys: ["гарант", "с первого раза", "точно сдам"],
      text: "Нет, мы не гарантируем сдачу экзамена с первого раза и не используем гарантии результата, которые нельзя честно подтвердить. Готовим к реальным задачам и объясняем, где нужна практика.",
      links: [["article-exam-mistakes.html", "Ошибки на экзамене"]] },
    { id: "fail", keys: ["не сдал", "завалил", "провалил", "пересда", "неудач"],
      text: "Не сдал — не значит, что обучение провалено. Разбираем ошибки, определяем, чего не хватило, и планируем следующую попытку. Иногда быстрее всего помогает одно дополнительное занятие на конкретную ошибку.",
      links: [["catalog.html#additional", "Доп. вождение"]] },
    { id: "fleet", keys: ["машин", "автопарк", "акпп", "автомат", "механик", "мкпп", "кпп", "автомобил"],
      text: "В автопарке 12 учебных автомобилей категории B (на АКПП — Mazda 3 и Skoda Octavia, остальные на МКПП) и 4 мотоцикла категорий A и A1. У каждой машины — свой инструктор.",
      links: [["autopark.html", "Смотреть автопарк"]] },
    { id: "duration", keys: ["срок", "сколько учиться", "как долго", "месяц", "длится"],
      text: "Ориентир для категории B — 2 месяца. Одно дополнительное занятие длится ровно 60 минут.",
      links: [["catalog.html#path", "Как получить права"]] },
    { id: "docs", keys: ["документ", "договор", "лиценз", "сведения об организации", "что взять", "что нужно"],
      text: "Для перехода из другой школы пригодятся договор (копия или фото), чек или другой документ об оплате и понимание, что хочешь сохранить. Перед первым вождением — документы и телефон под рукой, удобная одежда и обувь, понятное место встречи.",
      links: [["svedeniya.html", "Документы организации"], ["transfer.html", "Переход"], ["article-checklist.html", "Чек-лист"]] },
    { id: "parents", keys: ["родител", "ребен", "ребён", "сын", "дочь"], handoff: true,
      text: "Для родителей важно: прозрачная стоимость, понятный процесс, кто отвечает за обучение и что происходит после заявки. Всё это покажем до записи.",
      links: [["catalog.html#b", "Категория B"], ["prices.html", "Цены"]] },
    { id: "hello", keys: ["привет", "здравств", "добрый", "hello"],
      text: "Привет! 👋 Расскажи, что сейчас ближе: права с нуля, больше практики, страх вождения, переход из другой школы или вернуться за руль?" }
  ];
  var FALLBACK = "Могу помочь. Расскажи, что для тебя сейчас самое сложное — цена, страх, практика, экзамен или выбор формата. Если вопрос нестандартный, лучше сразу спросить менеджера.";

  function norm(s) { return " " + String(s).toLowerCase().replace(/ё/g, "е").replace(/[^\wа-я₽\- ]+/gi, " ").replace(/\s+/g, " ") + " "; }
  function match(q) {
    var text = norm(q);
    var scored = KB.map(function (item, i) {
      var score = item.keys.reduce(function (s, k) { return s + (text.indexOf(norm(k).trim()) > -1 ? 1 + k.length / 20 : 0); }, 0);
      return { item: item, score: score, i: i };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score || a.i - b.i; });
    return scored;
  }

  var dock = el("div", { class: "dock", role: "group", "aria-label": "Помощь и связь" }, [
    el("button", { class: "dock__btn dock__btn--ai", type: "button", "data-open": "ai", html: '<span class="dock__ico">' + ICO.spark + "</span>ИИ-помощник" }),
    el("button", { class: "dock__btn dock__btn--chat", type: "button", "data-open": "chat", html: '<span class="dock__ico">' + ICO.chat + "</span>Чат с менеджером" })
  ]);
  var mbar = el("nav", { class: "mbar", "aria-label": "Быстрая связь" }, [
    el("a", { href: TEL, html: ICO.phone + "Позвонить" }),
    el("button", { type: "button", class: "is-chat", "data-open": "chat", html: ICO.chat + "Чат" }),
    el("button", { type: "button", class: "is-ai", "data-open": "ai", html: ICO.spark + "ИИ-помощник" })
  ]);

  /* --- окно ИИ-помощника --- */
  var ai = el("section", { class: "wp wp--ai", id: "aiPanel", role: "dialog", "aria-modal": "false", "aria-labelledby": "aiTitle", "aria-hidden": "true" });
  ai.innerHTML =
    '<div class="wp__head"><span class="wp__ava">' + ICO.spark + '</span><div><div class="wp__title" id="aiTitle">ИИ-помощник<span class="wp__badge">бот</span></div>' +
    '<div class="wp__sub">Подберу обучение и отвечу на частые вопросы</div></div><button class="wp__close" type="button" data-close aria-label="Закрыть">×</button></div>' +
    '<div class="wp__switch">Нужен живой человек?<button type="button" data-open="chat">Чат с менеджером →</button></div>' +
    '<div class="wp__log" aria-live="polite"></div>' +
    '<div class="wp__quick" aria-label="Быстрые вопросы"></div>' +
    '<form class="wp__form"><label class="sr" for="aiInput">Вопрос помощнику</label><textarea id="aiInput" rows="1" maxlength="400" placeholder="Например: «Мне 17, хочу права, но боюсь города»"></textarea><button class="wp__send" type="submit" aria-label="Отправить">' + ICO.send + "</button></form>" +
    '<div class="wp__note">Автоматические ответы по информации с сайта. Точные условия подтвердит менеджер.</div>';

  /* --- окно чата с менеджером --- */
  var chat = el("section", { class: "wp wp--chat", id: "chatPanel", role: "dialog", "aria-modal": "false", "aria-labelledby": "chatTitle", "aria-hidden": "true" });
  chat.innerHTML =
    '<div class="wp__head"><span class="wp__ava">' + ICO.chat + '</span><div><div class="wp__title" id="chatTitle">Чат с менеджером</div>' +
    '<div class="wp__sub"><span class="wp__dot" data-dot></span><span data-status></span></div></div><button class="wp__close" type="button" data-close aria-label="Закрыть">×</button></div>' +
    '<div class="wp__switch">Быстрый ответ без ожидания?<button type="button" data-open="ai">ИИ-помощник →</button></div>' +
    '<div class="wp__log" aria-live="polite"></div>' +
    '<div class="wp__who" hidden><span data-who></span><button type="button" data-edit>изменить</button></div>' +
    '<div class="wp__contact"><label class="sr" for="chatName">Имя</label><input id="chatName" name="name" autocomplete="name" placeholder="Имя" maxlength="80"><label class="sr" for="chatPhone">Телефон</label><input id="chatPhone" name="phone" type="tel" autocomplete="tel" placeholder="Телефон" maxlength="40"></div>' +
    '<form class="wp__form"><label class="sr" for="chatInput">Сообщение менеджеру</label><textarea id="chatInput" rows="1" maxlength="1000" placeholder="Сообщение менеджеру…"></textarea><button class="wp__send" type="submit" aria-label="Отправить">' + ICO.send + "</button></form>" +
    '<div class="wp__note">Отправляя сообщение, вы соглашаетесь с <a href="privacy.html">политикой обработки данных</a>.</div>';

  document.body.appendChild(dock);
  document.body.appendChild(mbar);
  document.body.appendChild(ai);
  document.body.appendChild(chat);

  var panels = { ai: ai, chat: chat }, lastOpener = null;
  function openPanel(name, opener) {
    Object.keys(panels).forEach(function (k) { if (k !== name) closePanel(k, true); });
    var p = panels[name];
    lastOpener = opener || lastOpener;
    p.classList.add("is-open");
    p.setAttribute("aria-hidden", "false");
    dock.classList.add("is-hidden");
    setMenu(false);
    setTimeout(function () {
      var focusEl = name === "chat" ? $(".channels a", p) : $("textarea", p);
      if (focusEl && window.innerWidth > 640) focusEl.focus();
    }, 60);
  }
  function closePanel(name, silent) {
    var p = panels[name];
    if (!p.classList.contains("is-open")) return;
    p.classList.remove("is-open");
    p.setAttribute("aria-hidden", "true");
    if (!silent) { dock.classList.remove("is-hidden"); if (lastOpener && document.contains(lastOpener)) lastOpener.focus(); }
  }
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open]");
    if (opener) {
      e.preventDefault();
      var name = opener.getAttribute("data-open");
      openPanel(name, opener.closest(".wp") ? null : opener);
      if (name === "ai" && opener.hasAttribute("data-ask")) askAI(opener.getAttribute("data-ask"));
      if (name === "chat" && opener.hasAttribute("data-msg")) { var t = $("#chatInput"); t.value = opener.getAttribute("data-msg"); autoGrow(t); }
      return;
    }
    var closer = e.target.closest("[data-close]");
    if (closer) closePanel(closer.closest(".wp") === ai ? "ai" : "chat");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (ai.classList.contains("is-open")) closePanel("ai");
    else if (chat.classList.contains("is-open")) closePanel("chat");
    else if (a11yPanel && !a11yPanel.hidden) setA11yPanel(false);
    else setMenu(false);
  });
  function autoGrow(t) { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }
  $$(".wp__form textarea").forEach(function (t) {
    t.addEventListener("input", function () { autoGrow(t); });
    t.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); t.form.requestSubmit ? t.form.requestSubmit() : t.form.dispatchEvent(new Event("submit", { cancelable: true })); } });
  });

  /* --- логика ИИ-помощника --- */
  var aiLog = $(".wp__log", ai), aiHistory = store.get("sessionStorage", "hp_ai", []);
  function renderMsg(log, m) {
    var node = el("div", { class: "msg" + (m.me ? " msg--me" : m.sys ? " msg--sys" : "") });
    if (m.from) node.appendChild(el("span", { class: "msg__from", text: m.from }));
    node.appendChild(document.createTextNode(m.text));
    if (m.links && m.links.length) {
      var box = el("div", { class: "msg__links" });
      m.links.forEach(function (l) {
        if (l[0] === "@chat") box.appendChild(el("button", { type: "button", "data-open": "chat", "data-msg": l[2] || "", text: l[1] }));
        else box.appendChild(el("a", { href: l[0], text: l[1] + " →" }));
      });
      node.appendChild(box);
    }
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }
  function pushAI(m) { aiHistory.push(m); aiHistory = aiHistory.slice(-40); store.set("sessionStorage", "hp_ai", aiHistory); renderMsg(aiLog, m); }
  if (!aiHistory.length) aiHistory = [{ text: "Привет! 👋 Я помогу разобраться без давления. Что сейчас ближе всего?" }];
  aiHistory.forEach(function (m) { renderMsg(aiLog, m); });

  var quick = $(".wp__quick", ai);
  [["Получить права", "Хочу получить права с нуля"], ["Боюсь водить", "Боюсь водить"], ["Доп. занятия", "Хочу дополнительные занятия"],
   ["Другая автошкола", "Учусь в другой автошколе"], ["Вернуться за руль", "Права есть, хочу вернуться за руль"], ["Сколько стоит?", "Сколько стоит обучение"],
   ["Категория A", "Хочу категорию A на мотоцикл"], ["Рассрочка", "Есть ли рассрочка?"], ["Где занятия?", "Где проходят занятия?"]].forEach(function (q) {
    quick.appendChild(el("button", { type: "button", text: q[0], "data-q": q[1] }));
  });
  quick.addEventListener("click", function (e) { var b = e.target.closest("[data-q]"); if (b) askAI(b.getAttribute("data-q")); });

  var busy = false;
  function askAI(q) {
    q = String(q || "").trim();
    if (!q || busy) return;
    busy = true;
    pushAI({ me: true, text: q });
    var typing = el("div", { class: "msg typing", "aria-label": "Помощник печатает" }, [el("i"), el("i"), el("i")]);
    aiLog.appendChild(typing); aiLog.scrollTop = aiLog.scrollHeight;
    setTimeout(function () {
      typing.remove();
      var found = match(q), top = found[0] && found[0].item, answer;
      if (!top) {
        answer = { text: FALLBACK, links: [["@chat", "Спросить менеджера", q], ["faq.html", "Вопросы и ответы"]] };
      } else {
        var links = (top.links || []).slice();
        if (found[1] && found[1].item.links) found[1].item.links.forEach(function (l) { if (links.length < 3 && !links.some(function (x) { return x[0] === l[0]; })) links.push(l); });
        if (top.handoff || top.open === "chat") links.push(["@chat", "Уточнить у менеджера", q]);
        answer = { text: top.text, links: links };
      }
      pushAI(answer);
      busy = false;
    }, reduceMotion ? 50 : 650);
  }
  $(".wp__form", ai).addEventListener("submit", function (e) {
    e.preventDefault();
    var t = $("#aiInput"); askAI(t.value); t.value = ""; autoGrow(t);
  });

  /* --- логика чата с менеджером --- */
  var chatLog = $(".wp__log", chat), chatHistory = store.get("sessionStorage", "hp_chat", []);
  function contact() { return store.get("localStorage", "hp_contact", {}); }
  function pushChat(m) { chatHistory.push(m); chatHistory = chatHistory.slice(-40); store.set("sessionStorage", "hp_chat", chatHistory); return renderMsg(chatLog, m); }
  function status() {
    var h = (new Date().getUTCHours() + 3) % 24, on = h >= 9 && h < 21;
    $("[data-dot]", chat).classList.toggle("is-on", on);
    $("[data-status]", chat).textContent = on ? "Контакты менеджера · 09:00–21:00" : "Рабочее время: 09:00–21:00";
  }
  status(); setInterval(status, 60000);

  var greet = el("div", { class: "msg" });
  greet.appendChild(el("span", { class: "msg__from", text: "Менеджер #ХОЧУПРАВА" }));
  greet.appendChild(document.createTextNode("Здравствуйте! Выберите мессенджер или позвоните, чтобы связаться с менеджером:"));
  greet.appendChild(el("div", { class: "channels" }, [
    el("a", { href: VK, target: "_blank", rel: "noopener", html: ICO.vk + "ВКонтакте" }),
    el("a", { href: MAX, target: "_blank", rel: "noopener", html: ICO.max + "MAX" }),
    el("a", { href: TEL, html: ICO.phone + "Позвонить" })
  ]));
  chatLog.appendChild(el("div", { class: "msg msg--sys", text: "Для обращения откройте мессенджер или позвоните. Отправка сообщений из этого окна недоступна." }));
  chatLog.appendChild(greet);
  chatHistory.forEach(function (m) { renderMsg(chatLog, m); });

  var who = $(".wp__who", chat), contactBox = $(".wp__contact", chat);
  function syncContact() {
    var c = contact(), has = !!(c.name && phoneOk(c.phone));
    who.hidden = !has; contactBox.hidden = has;
    if (has) $("[data-who]", chat).textContent = "Ответим: " + c.name + ", " + c.phone;
    else { $("#chatName").value = c.name || ""; $("#chatPhone").value = c.phone || ""; }
  }
  syncContact();
  $("[data-edit]", chat).addEventListener("click", function () { who.hidden = true; contactBox.hidden = false; var c = contact(); $("#chatName").value = c.name || ""; $("#chatPhone").value = c.phone || ""; $("#chatName").focus(); });

  $(".wp__form", chat).addEventListener("submit", function (e) {
    e.preventDefault();
    var t = $("#chatInput"), text = t.value.trim(), c = contact();
    if (!contactBox.hidden) c = { name: $("#chatName").value.trim(), phone: $("#chatPhone").value.trim() };
    if (!text) { t.focus(); return; }
    if (!c.name) { renderMsg(chatLog, { sys: true, text: "Укажите имя — так менеджер поймёт, как к вам обращаться." }); $("#chatName").focus(); return; }
    if (!phoneOk(c.phone)) { renderMsg(chatLog, { sys: true, text: "Проверьте номер: нужен действительный российский номер в формате +7 (___) ___-__-__." }); $("#chatPhone").focus(); return; }
    store.set("localStorage", "hp_contact", c);
    syncContact();
    var first = !chatHistory.some(function (m) { return m.me; });
    pushChat({ me: true, text: text });
    t.value = ""; autoGrow(t);
    var btn = $(".wp__send", chat); btn.disabled = true;
    sendLead({ channel: "chat", name: c.name, phone: c.phone, need: "Чат с менеджером", message: text, page: location.pathname.replace(/^\//, "") || "index.html" })
      .then(function () {
        pushChat({ sys: true, text: "✓ Доставлено менеджеру" });
        if (first) pushChat({ from: "Менеджер #ХОЧУПРАВА", text: "Спасибо! Менеджер ответит по номеру " + c.phone + " в рабочее время (09:00–21:00). Если вопрос срочный — позвоните " + PHONE + "." });
      })
      .catch(function (error) {
        pushChat({ from: "#ХОЧУПРАВА", text: leadErrorText(error), links: [[TEL, "Позвонить"], [VK, "ВКонтакте"]] });
      })
      .then(function () { btn.disabled = false; });
  });
  // Visual demonstration only: preserve the form layout without submission.
  $(".wp__send", chat).disabled = true;
  $(".wp__send", chat).title = "Демонстрационная версия: отправка отключена";
  $(".wp__note", chat).textContent = "Демонстрационная версия: сообщения из этого окна не отправляются.";
})();
