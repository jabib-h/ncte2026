/* ============================================================
   NCTE 2026 — Detail modal & card-expand interactivity
   ============================================================ */
(function () {
  const SCROLL_LOCK_CLASS = "is-detail-open";
  let _lastFocus = null;

  function ensureModal() {
    let m = document.querySelector("[data-detail-modal]");
    if (m) return m;
    m = document.createElement("div");
    m.className = "ndetail";
    m.setAttribute("data-detail-modal", "");
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.setAttribute("aria-labelledby", "ndetail-title");
    m.innerHTML = `
      <div class="ndetail__card" data-detail-card>
        <button class="ndetail__close" type="button" data-detail-close aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <div class="ndetail__band" data-detail-band></div>
        <div class="ndetail__body" data-detail-body></div>
      </div>
    `;
    document.body.appendChild(m);
    return m;
  }

  function openDetail(opts) {
    const { html, strand } = opts || {};
    if (!html) return;
    const m = ensureModal();
    const body = m.querySelector("[data-detail-body]");
    const band = m.querySelector("[data-detail-band]");
    body.innerHTML = html;
    band.className = "ndetail__band";
    if (strand) band.classList.add("is-strand-" + strand);
    _lastFocus = document.activeElement;
    m.classList.add("is-open");
    document.body.classList.add(SCROLL_LOCK_CLASS);
    // Focus first interactive element
    setTimeout(() => {
      const focusable = m.querySelector(".ndetail__body a, .ndetail__body button, [tabindex]") || m.querySelector("[data-detail-close]");
      focusable && focusable.focus();
      m.querySelector("[data-detail-card]").scrollTop = 0;
    }, 60);
  }

  function closeDetail() {
    const m = document.querySelector("[data-detail-modal]");
    if (!m || !m.classList.contains("is-open")) return;
    m.classList.remove("is-open");
    document.body.classList.remove(SCROLL_LOCK_CLASS);
    if (_lastFocus && _lastFocus.focus) _lastFocus.focus();
  }

  function getDetailFromTrigger(trigger) {
    // Strategy 1: trigger has its own <template class="ndetail-tpl">
    let tpl = trigger.querySelector(":scope > template.ndetail-tpl") ||
              trigger.querySelector(":scope template.ndetail-tpl");
    // Strategy 2: trigger references another id via data-detail-from
    if (!tpl && trigger.dataset.detailFrom) {
      tpl = document.getElementById(trigger.dataset.detailFrom);
    }
    if (!tpl) return null;
    let html = tpl.innerHTML;
    // Substitute {{key}} placeholders from data-sub-* attributes
    // e.g. data-sub-name="Cambridge" replaces {{name}}
    Object.keys(trigger.dataset).forEach(k => {
      if (k.startsWith("sub")) {
        const placeholder = k.slice(3).toLowerCase();
        const value = trigger.dataset[k] || "";
        html = html.split("{{" + placeholder + "}}").join(value);
      }
    });
    return html;
  }

  document.addEventListener("click", (e) => {
    // Cards: any element with [data-detail-trigger]
    const trig = e.target.closest("[data-detail-trigger]");
    if (trig) {
      // Allow inner links/buttons to still work
      const innerLink = e.target.closest("a, button");
      if (innerLink && innerLink !== trig && !innerLink.matches("[data-detail-trigger]")) return;
      e.preventDefault();
      const html = getDetailFromTrigger(trig);
      if (html) openDetail({ html, strand: trig.dataset.strand || null });
      return;
    }
    if (e.target.closest("[data-detail-close]")) { closeDetail(); return; }
    if (e.target.matches("[data-detail-modal]")) { closeDetail(); return; }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetail();
  });

  // Enter / Space on cards
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const trig = e.target.closest("[data-detail-trigger]");
    if (!trig || e.target.tagName === "A" || e.target.tagName === "BUTTON") return;
    e.preventDefault();
    const html = getDetailFromTrigger(trig);
    if (html) openDetail({ html, strand: trig.dataset.strand || null });
  });

  // ============ ACTIVITY FILTERS ============
  function wireFilters() {
    const filters = document.querySelectorAll("[data-act-filter]");
    if (!filters.length) return;
    filters.forEach(btn => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.actFilter;
        filters.forEach(b => b.classList.toggle("is-active", b === btn));
        document.querySelectorAll("[data-act-card]").forEach(card => {
          const day = card.dataset.day;
          const fmt = card.dataset.format;
          let show = true;
          if (f === "day1") show = day === "1";
          else if (f === "day2") show = day === "2";
          else if (f === "presencial") show = fmt === "presencial";
          else if (f === "virtual") show = fmt === "virtual";
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireFilters();
    // Pre-create modal so it's ready
    ensureModal();
    // Make trigger cards keyboard-focusable
    document.querySelectorAll("[data-detail-trigger]").forEach(t => {
      if (!t.hasAttribute("tabindex") && t.tagName !== "BUTTON" && t.tagName !== "A") {
        t.setAttribute("tabindex", "0");
        t.setAttribute("role", "button");
      }
    });
  });

  window.NCTEDetail = { open: openDetail, close: closeDetail };
})();
