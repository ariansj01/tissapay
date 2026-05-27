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
    toggle.textContent = tabs[index]?.textContent?.trim() || `محصول ${index + 1}`;
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
      const activeIndex = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      activateAccordion(activeIndex >= 0 ? activeIndex : 0);
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

window.addEventListener('load', () => {
  document.querySelectorAll('[data-supporters-slider]').forEach(initSupportersSlider);
});
