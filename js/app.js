/**
 * Product tabs — ARIA tab pattern
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
function initProductTabs(root) {
  const tablist = root.querySelector('[role="tablist"]');
  if (!tablist) return;

  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const mobileQuery = window.matchMedia('(max-width: 992px)');
  let isMobileAccordion = mobileQuery.matches;

  panels.forEach((panel, index) => {
    if (panel.querySelector('.accordion-toggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'accordion-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.dataset.panelIndex = String(index);
    const label = document.createElement('span');
    label.className = 'accordion-toggle-label';
    label.textContent = tabs[index]?.textContent?.trim() || `محصول ${index + 1}`;
    toggle.append(label);
    panel.prepend(toggle);
  });

  function activateTab(tab) {
    const index = Number(tab.dataset.tabIndex);

    tabs.forEach((t) => {
      const isActive = t === tab;
      t.setAttribute('aria-selected', String(isActive));
      t.tabIndex = isActive ? 0 : -1;
      t.classList.toggle('is-active', isActive);
    });

    panels.forEach((panel, i) => {
      const isActive = i === index;
      panel.classList.toggle('is-active', isActive);
      if (!isMobileAccordion) {
        panel.hidden = !isActive;
      }
      const toggle = panel.querySelector('.accordion-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(isActive));
      }
    });
  }

  function activateAccordion(index) {
    panels.forEach((panel, i) => {
      const isActive = i === index;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = false;
      const toggle = panel.querySelector('.accordion-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(isActive));
      }
    });
  }

  function syncMode(matchesMobile) {
    isMobileAccordion = matchesMobile;
    root.classList.toggle('is-accordion', isMobileAccordion);

    if (isMobileAccordion) {
      activateAccordion(0);
    } else {
      const activeTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
      activateTab(activeTab);
    }
  }

  tablist.addEventListener('click', (e) => {
    if (isMobileAccordion) return;
    const tab = e.target.closest('[role="tab"]');
    if (!tab || !tablist.contains(tab)) return;
    activateTab(tab);
  });

  const isRtl = getComputedStyle(root).direction === 'rtl';

  tablist.addEventListener('keydown', (e) => {
    if (isMobileAccordion) return;
    const current = document.activeElement;
    if (!current || current.getAttribute('role') !== 'tab') return;

    const i = tabs.indexOf(current);
    let next = i;
    const stepForward = isRtl ? -1 : 1;
    const stepBack = isRtl ? 1 : -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (i + stepForward + tabs.length) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (i + stepBack + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    tabs[next].focus();
    activateTab(tabs[next]);
  });

  root.addEventListener('click', (e) => {
    if (!isMobileAccordion) return;
    const toggle = e.target.closest('.accordion-toggle');
    if (!toggle) return;
    const index = Number(toggle.dataset.panelIndex);
    activateAccordion(index);
  });

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', (e) => syncMode(e.matches));
  } else {
    mobileQuery.addListener((e) => syncMode(e.matches));
  }

  syncMode(mobileQuery.matches);
}

document.querySelectorAll('[data-product-tabs]').forEach(initProductTabs);

function initSupportersSlider(slider) {
  const track = slider.querySelector('.supporters-track');
  if (!track) return;

  if (slider.dataset.ready === 'true') return;

  const originalCards = [...track.children];
  originalCards.forEach((card) => {
    track.appendChild(card.cloneNode(true));
  });

  const originalWidth = originalCards.reduce((sum, card) => {
    return sum + card.getBoundingClientRect().width;
  }, 0) + ((originalCards.length - 1) * 16);

  const pxPerSecond = 20;
  const duration = Math.max(originalWidth / pxPerSecond, 25);

  track.style.setProperty('--scroll-distance', `${originalWidth}px`);
  track.style.setProperty('--supporters-duration', `${duration}s`);
  slider.dataset.ready = 'true';
}

function initFeatureCardsSlider(slider) {
  const cards = [...slider.querySelectorAll('.feature-cards-track .cart')];
  if (!cards.length) return;

  const desktopQuery = window.matchMedia('(min-width: 1001px)');

  const getScrollStep = () => {
    const first = cards[0];
    const second = cards[1];
    if (!second) return first.offsetWidth + 16;
    return Math.abs(second.offsetLeft - first.offsetLeft);
  };

  const getActiveIndex = () => {
    const step = getScrollStep();
    if (!step) return 0;
    return Math.min(cards.length - 1, Math.round(slider.scrollLeft / step));
  };

  const activateCard = (index, { scroll = true } = {}) => {
    const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
    slider.dataset.activeIndex = String(safeIndex);
    cards.forEach((card, i) => {
      card.classList.toggle('is-active', i === safeIndex);
    });

    if (scroll) {
      const step = getScrollStep();
      if (step) {
        slider.scrollTo({ left: safeIndex * step, behavior: 'smooth' });
      }
    }
  };

  const updateActiveState = () => {
    activateCard(getActiveIndex(), { scroll: false });
  };

  const snapToNearest = () => {
    const step = getScrollStep();
    if (!step) return;
    activateCard(getActiveIndex());
  };

  if (desktopQuery.matches) {
    activateCard(0, { scroll: false });
  } else {
    cards.forEach((card) => card.classList.add('is-active'));
  }
  slider.scrollLeft = 0;

  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (!desktopQuery.matches) return;
      activateCard(index);
    });
  });

  slider.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    const step = getScrollStep();
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    const next = slider.scrollLeft + (event.deltaY > 0 ? step : -step);
    slider.scrollTo({
      left: Math.max(0, Math.min(maxScroll, next)),
      behavior: 'smooth',
    });
  }, { passive: false });

  let scrollEndTimer;
  slider.addEventListener('scroll', () => {
    updateActiveState();
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(snapToNearest, 90);
  }, { passive: true });

  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', () => {
      if (desktopQuery.matches) {
        activateCard(Number(slider.dataset.activeIndex || 0), { scroll: false });
      } else {
        cards.forEach((card) => card.classList.add('is-active'));
      }
    });
  }
}

function initSupportersOrbit(brandsRoot) {
  const orbit = brandsRoot.querySelector('.brands-orbit');
  const slots = [...brandsRoot.querySelectorAll('.brand-slot')];
  if (!orbit || !slots.length) return;

  const count = slots.length;
  const baseAngles = slots.map((_, index) => (360 / count) * index);
  let orbitRadius = 0;
  let rotation = 0;
  let rafId = null;

  const applyPositions = () => {
    slots.forEach((slot, index) => {
      const angle = baseAngles[index] + rotation;
      slot.style.setProperty('--angle', `${angle}deg`);
    });
  };

  const measureOrbit = () => {
    const size = orbit.getBoundingClientRect().width;
    if (!size) return;

    orbitRadius = size / 2;
    brandsRoot.style.setProperty('--orbit-radius', `${orbitRadius}px`);
    applyPositions();
  };

  const tick = () => {
    rotation += 0.0008;
    if (rotation >= 360) rotation -= 360;
    applyPositions();
    rafId = requestAnimationFrame(tick);
  };

  measureOrbit();
  window.addEventListener('resize', measureOrbit);

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(measureOrbit);
    observer.observe(orbit);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!prefersReducedMotion.matches) {
    rafId = requestAnimationFrame(tick);
  }

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', (event) => {
      if (event.matches) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    });
  }
}

window.addEventListener('load', () => {
  document.querySelectorAll('[data-supporters-slider]').forEach(initSupportersSlider);
  document.querySelectorAll('[data-feature-slider]').forEach(initFeatureCardsSlider);
  document.querySelectorAll('[data-supporters-orbit]').forEach(initSupportersOrbit);
});
