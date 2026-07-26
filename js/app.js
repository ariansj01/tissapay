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

  const gap = 16;
  const measureWidth = () => {
    if (!originalCards.length) return 0;
    return originalCards.reduce((sum, card) => {
      return sum + card.getBoundingClientRect().width;
    }, 0) + ((originalCards.length - 1) * gap);
  };

  const pxPerSecond = 20;
  let originalWidth = 0;
  let paused = false;
  let resumeTimer = null;
  let autoScrollUntil = 0;
  let userInteracting = false;

  const mobileQuery = window.matchMedia('(max-width: 1000px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const updateMetrics = () => {
    const nextWidth = measureWidth();
    if (nextWidth > 0) {
      originalWidth = nextWidth;
    }
    const duration = Math.max(originalWidth / pxPerSecond, 25);
    track.style.setProperty('--scroll-distance', `${originalWidth}px`);
    track.style.setProperty('--supporters-duration', `${duration}s`);
  };

  const pauseAutoScroll = () => {
    paused = true;
    clearTimeout(resumeTimer);
  };

  const scheduleResume = () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      paused = false;
      userInteracting = false;
    }, 2500);
  };

  const wrapScrollPosition = () => {
    if (originalWidth <= 0) return;
    if (slider.scrollLeft >= originalWidth) {
      slider.scrollLeft -= originalWidth;
    } else if (slider.scrollLeft < 0) {
      slider.scrollLeft += originalWidth;
    }
  };

  const tickAutoScroll = () => {
    if (
      mobileQuery.matches
      && !paused
      && !reducedMotion.matches
      && originalWidth > 0
      && slider.scrollWidth > slider.clientWidth + 1
    ) {
      autoScrollUntil = performance.now() + 48;
      slider.scrollLeft += 0.7;
      if (slider.scrollLeft >= originalWidth) {
        slider.scrollLeft -= originalWidth;
      }
    }
    requestAnimationFrame(tickAutoScroll);
  };

  const bindMobileScroll = () => {
    if (!mobileQuery.matches) {
      slider.classList.remove('is-manual-scroll');
      paused = false;
      userInteracting = false;
      clearTimeout(resumeTimer);
      return;
    }

    slider.classList.add('is-manual-scroll');
    updateMetrics();
    wrapScrollPosition();
  };

  const onUserInteractionStart = (event) => {
    if (!mobileQuery.matches) return;
    if (event.type === 'pointerdown') {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      try {
        slider.setPointerCapture(event.pointerId);
      } catch {}
    }
    userInteracting = true;
    pauseAutoScroll();
  };

  const onUserInteractionEnd = () => {
    if (!mobileQuery.matches || !userInteracting) return;
    scheduleResume();
  };

  slider.addEventListener('touchstart', onUserInteractionStart, { passive: true });
  slider.addEventListener('pointerdown', onUserInteractionStart);
  slider.addEventListener('lostpointercapture', onUserInteractionEnd);
  slider.addEventListener('wheel', (event) => {
    if (!mobileQuery.matches) return;
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
    userInteracting = true;
    pauseAutoScroll();
    scheduleResume();
  }, { passive: true });
  slider.addEventListener('scroll', () => {
    if (!mobileQuery.matches || performance.now() < autoScrollUntil) return;
    wrapScrollPosition();
    if (userInteracting) {
      scheduleResume();
    }
  }, { passive: true });
  slider.addEventListener('touchend', onUserInteractionEnd);
  slider.addEventListener('pointerup', onUserInteractionEnd);
  slider.addEventListener('pointercancel', onUserInteractionEnd);

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', bindMobileScroll);
  } else {
    mobileQuery.addListener(bindMobileScroll);
  }

  window.addEventListener('resize', updateMetrics);
  slider.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', updateMetrics, { once: true });
  });

  bindMobileScroll();
  requestAnimationFrame(() => {
    updateMetrics();
    requestAnimationFrame(tickAutoScroll);
  });
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

function initSupportersOrbitParallax(section) {
  const uprights = [...section.querySelectorAll('.brand-upright')];
  if (!uprights.length) return;

  const desktopQuery = window.matchMedia('(min-width: 1001px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const maxOffset = 14;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const resetParallax = () => {
    uprights.forEach((el) => {
      el.style.setProperty('--parallax-x', '0px');
      el.style.setProperty('--parallax-y', '0px');
    });
  };

  const onMouseMove = (event) => {
    if (!desktopQuery.matches || reducedMotion.matches) return;

    const rect = section.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    if (!halfW || !halfH) return;

    const nx = Math.max(-1, Math.min(1, (event.clientX - rect.left - halfW) / halfW));
    const ny = Math.max(-1, Math.min(1, (event.clientY - rect.top - halfH) / halfH));
    targetX = nx;
    targetY = ny;
  };

  const onMouseLeave = () => {
    targetX = 0;
    targetY = 0;
  };

  const tick = () => {
    if (desktopQuery.matches && !reducedMotion.matches) {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      uprights.forEach((el, index) => {
        const slot = el.closest('.brand-slot');
        const depth = slot?.dataset.ring === 'outer' ? 1 : 0.62;
        const vary = 0.88 + 0.12 * Math.sin((index / uprights.length) * Math.PI * 2);
        const ox = currentX * maxOffset * depth * vary;
        const oy = currentY * maxOffset * depth * vary;
        el.style.setProperty('--parallax-x', `${ox.toFixed(2)}px`);
        el.style.setProperty('--parallax-y', `${oy.toFixed(2)}px`);
      });
    } else {
      currentX = 0;
      currentY = 0;
      targetX = 0;
      targetY = 0;
      resetParallax();
    }

    requestAnimationFrame(tick);
  };

  section.addEventListener('mousemove', onMouseMove);
  section.addEventListener('mouseleave', onMouseLeave);

  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', () => {
      if (!desktopQuery.matches) {
        onMouseLeave();
        resetParallax();
      }
    });
  }

  requestAnimationFrame(tick);
}

function initSupportersOrbit(brandsRoot) {
  const orbit = brandsRoot.querySelector('.brands-orbit');
  const slots = [...brandsRoot.querySelectorAll('.brand-slot')];
  if (!orbit || !slots.length) return;

  const section = brandsRoot.closest('.tissaSupporters');
  if (section) {
    initSupportersOrbitParallax(section);
  }

  const outerSlots = slots.filter((_, index) => index % 2 === 0);
  const innerSlots = slots.filter((_, index) => index % 2 === 1);
  const startAngle = -90;
  const innerRadiusRatio = 0.74;
  const outerStagger = outerSlots.length ? 360 / outerSlots.length / 2 : 0;

  const applyPositions = (outerRadius, innerRadius) => {
    outerSlots.forEach((slot, index) => {
      const angle = startAngle + (360 / outerSlots.length) * index;
      slot.style.setProperty('--angle', `${angle}deg`);
      slot.style.setProperty('--orbit-radius', `${outerRadius}px`);
      slot.dataset.ring = 'outer';
    });

    innerSlots.forEach((slot, index) => {
      const angle = startAngle + outerStagger + (360 / innerSlots.length) * index;
      slot.style.setProperty('--angle', `${angle}deg`);
      slot.style.setProperty('--orbit-radius', `${innerRadius}px`);
      slot.dataset.ring = 'inner';
    });
  };

  const measureOrbit = () => {
    const size = orbit.getBoundingClientRect().width;
    if (!size) return;

    const outerRadius = size / 2;
    const innerRadius = outerRadius * innerRadiusRatio;
    applyPositions(outerRadius, innerRadius);
  };

  measureOrbit();
  window.addEventListener('resize', measureOrbit);

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(measureOrbit);
    observer.observe(orbit);
  }
}

window.addEventListener('load', () => {
  document.querySelectorAll('[data-supporters-slider]').forEach(initSupportersSlider);
  document.querySelectorAll('[data-feature-slider]').forEach(initFeatureCardsSlider);
  document.querySelectorAll('[data-supporters-orbit]').forEach(initSupportersOrbit);
  initHeroImageAnimations();
});

function initHeroImageAnimations() {
  const badge = document.querySelector('.hero .left .badge');
  const heroImage = document.querySelector('.hero .left .image');

  if (!badge || !heroImage) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  badge.addEventListener('click', (e) => {
    e.preventDefault();
    badge.classList.remove('badge-click-animation');
    void badge.offsetWidth;
    badge.classList.add('badge-click-animation');
    setTimeout(() => {
      badge.classList.remove('badge-click-animation');
    }, 500);
  });

  let rotateX = 0;
  let rotateY = 0;
  let translateZ = 0;
  let scale = 1;
  let targetRotateX = 0;
  let targetRotateY = 0;
  let targetTranslateZ = 0;
  let targetScale = 1;

  const getPointerPosition = (event) => {
    if (event.touches && event.touches.length) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    if (event.changedTouches && event.changedTouches.length) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event) => {
    if (reducedMotion.matches) return;
    const pos = getPointerPosition(event);
    if (!pos) return;

    const rect = heroImage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = pos.x - centerX;
    const deltaY = pos.y - centerY;
    const maxDistance = Math.max(rect.width, rect.height) / 2;
    const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
    const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
    const magnitude = Math.hypot(normalizedX, normalizedY);

    targetRotateX = -normalizedY * 18;
    targetRotateY = normalizedX * 18;
    targetTranslateZ = 10 + magnitude * 18;
    targetScale = 1 + Math.min(0.08, magnitude * 0.06);

    heroImage.classList.add('mouse-move-animation');
  };

  const onPointerEnd = () => {
    targetRotateX = 0;
    targetRotateY = 0;
    targetTranslateZ = 0;
    targetScale = 1;
  };

  const tick = () => {
    if (!reducedMotion.matches) {
      rotateX += (targetRotateX - rotateX) * 0.12;
      rotateY += (targetRotateY - rotateY) * 0.12;
      translateZ += (targetTranslateZ - translateZ) * 0.12;
      scale += (targetScale - scale) * 0.12;

      heroImage.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
      heroImage.style.setProperty('--rotate-y', `${rotateY.toFixed(2)}deg`);
      heroImage.style.setProperty('--translate-z', `${translateZ.toFixed(2)}px`);
      heroImage.style.setProperty('--hover-scale', `${scale.toFixed(3)}`);
    }

    requestAnimationFrame(tick);
  };

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('touchmove', onPointerMove, { passive: true });
  document.addEventListener('pointerup', onPointerEnd);
  document.addEventListener('pointerleave', onPointerEnd);
  document.addEventListener('pointercancel', onPointerEnd);
  document.addEventListener('touchend', onPointerEnd, { passive: true });
  document.addEventListener('touchcancel', onPointerEnd, { passive: true });
  window.addEventListener('blur', onPointerEnd);

  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        targetRotateX = 0;
        targetRotateY = 0;
        targetTranslateZ = 0;
        targetScale = 1;
      }
    });
  }

  requestAnimationFrame(tick);
}

function initMerchantRegistrationForm() {
  const form = document.querySelector('[data-merchant-registration-form]');
  if (!form) return;

  const endpoint = 'https://store.tisapay.com/api/merchant-registration-requests';
  const successCard = document.querySelector('[data-merchant-registration-success]');
  const submitButton = form.querySelector('.merchantRegistration__submit');
  const submitError = form.querySelector('[data-submit-error]');
  const fields = {
    full_name: form.querySelector('[data-field="full_name"]'),
    mobile: form.querySelector('[data-field="mobile"]'),
    company_name: form.querySelector('[data-field="company_name"]'),
  };
  const errors = {
    full_name: 'نام و نام خانوادگی الزامی است.',
    mobile: 'شماره تماس وارد شده صحیح نیست.',
    company_name: 'نام مجموعه الزامی است.',
  };

  const normalizeDigits = (value) => String(value || '')
    .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit));

  const normalizeMobile = (value) => {
    let mobile = normalizeDigits(value).replace(/[\s-]/g, '').trim();
    if (mobile.startsWith('+98')) mobile = `0${mobile.slice(3)}`;
    if (mobile.startsWith('98') && mobile.length === 12) mobile = `0${mobile.slice(2)}`;
    return mobile;
  };

  const validate = ({ showErrors = false } = {}) => {
    const values = {
      full_name: fields.full_name.value.trim(),
      mobile: normalizeMobile(fields.mobile.value),
      company_name: fields.company_name.value.trim(),
    };
    const invalid = {
      full_name: values.full_name.length < 2,
      mobile: !/^09\d{9}$/.test(values.mobile),
      company_name: values.company_name.length < 2,
    };

    Object.entries(invalid).forEach(([name, hasError]) => {
      const fieldWrap = fields[name].closest('.merchantRegistration__field');
      const errorEl = form.querySelector(`[data-error-for="${name}"]`);
      fieldWrap.classList.toggle('is-invalid', showErrors && hasError);
      errorEl.textContent = showErrors && hasError ? errors[name] : '';
    });

    const isValid = !Object.values(invalid).some(Boolean);
    submitButton.disabled = !isValid;
    return { isValid, values, invalid };
  };

  Object.values(fields).forEach((field) => {
    field.addEventListener('input', () => {
      submitError.textContent = '';
      validate({ showErrors: true });
    });
    field.addEventListener('blur', () => validate({ showErrors: true }));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = validate({ showErrors: true });
    if (!result.isValid) {
      const firstInvalid = Object.entries(result.invalid).find(([, invalid]) => invalid)?.[0];
      if (firstInvalid) fields[firstInvalid].focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'در حال ثبت...';
    submitError.textContent = '';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: result.values.full_name,
          mobile: result.values.mobile,
          company_name: result.values.company_name,
          website: form.elements.website?.value || '',
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        const apiErrors = data?.errors || {};
        Object.entries(apiErrors).forEach(([name, message]) => {
          if (!fields[name]) return;
          fields[name].closest('.merchantRegistration__field').classList.add('is-invalid');
          form.querySelector(`[data-error-for="${name}"]`).textContent = message;
        });
        const firstApiError = Object.keys(apiErrors).find((name) => fields[name]);
        if (firstApiError) fields[firstApiError].focus();
        submitError.textContent = firstApiError ? '' : 'ثبت درخواست ناموفق بود. لطفاً دوباره تلاش کنید.';
        return;
      }

      form.reset();
      form.hidden = true;
      if (successCard) successCard.hidden = false;
    } catch {
      submitError.textContent = 'ارتباط با سرور برقرار نشد. لطفاً چند لحظه دیگر دوباره تلاش کنید.';
    } finally {
      submitButton.textContent = 'ثبت درخواست همکاری';
      validate({ showErrors: false });
    }
  });

  validate({ showErrors: false });
}

initMerchantRegistrationForm();
