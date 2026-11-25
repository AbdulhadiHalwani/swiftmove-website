'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initQuoteEstimator();
  updateCopyrightYear();
});

function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const primaryNav = document.getElementById('primary-nav');

  if (!menuToggle || !primaryNav) return;

  const navLinks = primaryNav.querySelectorAll('a');

  const closeMenu = () => {
    primaryNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    primaryNav.classList.toggle('is-open', !isExpanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && primaryNav.classList.contains('is-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

function initQuoteEstimator() {
  const form = document.getElementById('quote-form');
  if (!form) return;

  const moveTypeEl = document.getElementById('move-type');
  const moveDateEl = document.getElementById('move-date');
  const pickupAreaEl = document.getElementById('pickup-area');
  const dropoffAreaEl = document.getElementById('dropoff-area');
  const customerNameEl = document.getElementById('customer-name');
  const customerContactEl = document.getElementById('customer-contact');
  const packingAddonEl = document.getElementById('packing-addon');
  const estimatePriceEl = document.getElementById('estimate-price');
  const estimateNoteEl = document.getElementById('estimate-note');
  const confirmationEl = document.getElementById('form-confirmation');

  const todayISO = getTodayLocalISO();
  moveDateEl.setAttribute('min', todayISO);

  const BASE_PRICING = {
    single: { min: 75, max: 120, label: 'Single Furniture Delivery' },
    apartment: { min: 280, max: 430, label: 'Apartment Relocation' },
    villa: { min: 650, max: 950, label: 'Villa Relocation' }
  };

  const AREA_ZONES = {
    downtown: 1,
    midtown: 2,
    marina: 3,
    'suburbs-north': 4,
    'suburbs-south': 5
  };

  const calculateEstimate = () => {
    const moveType = moveTypeEl.value;
    if (!moveType || !BASE_PRICING[moveType]) {
      estimatePriceEl.textContent = 'Select move details';
      estimateNoteEl.textContent = 'Includes vehicle, fuel, crew, and standard transit protection.';
      return null;
    }

    let { min, max } = BASE_PRICING[moveType];

    const pickup = pickupAreaEl.value;
    const dropoff = dropoffAreaEl.value;

    if (pickup && dropoff) {
      const zoneDistance = Math.abs(AREA_ZONES[pickup] - AREA_ZONES[dropoff]);
      const distanceFeeMin = zoneDistance * 20;
      const distanceFeeMax = zoneDistance * 30;
      min += distanceFeeMin;
      max += distanceFeeMax;
    }

    if (packingAddonEl.checked) {
      const packingFee = moveType === 'single' ? 35 : moveType === 'apartment' ? 110 : 220;
      min += packingFee;
      max += packingFee + 40;
    }

    estimatePriceEl.textContent = `$${min} – $${max}`;
    estimateNoteEl.textContent = packingAddonEl.checked
      ? 'Includes full packing materials, vehicle, fuel, crew, and transit protection.'
      : 'Includes vehicle, fuel, crew, and standard transit protection.';

    return { min, max };
  };

  [moveTypeEl, pickupAreaEl, dropoffAreaEl, packingAddonEl].forEach((control) => {
    control.addEventListener('change', () => {
      calculateEstimate();
      clearFieldError(control);
    });
  });

  [moveDateEl, customerNameEl, customerContactEl].forEach((control) => {
    control.addEventListener('input', () => clearFieldError(control));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    confirmationEl.hidden = true;

    const isValid = validateForm();
    if (!isValid) return;

    const estimate = calculateEstimate();
    const moveLabel = BASE_PRICING[moveTypeEl.value].label;
    const pickupText = pickupAreaEl.options[pickupAreaEl.selectedIndex].text;
    const dropoffText = dropoffAreaEl.options[dropoffAreaEl.selectedIndex].text;
    const formattedDate = formatReadableDate(moveDateEl.value);
    const referenceCode = `SM-${Math.floor(100000 + Math.random() * 900000)}`;

    confirmationEl.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = `Booking Request Confirmed (${referenceCode})`;
    const message = document.createElement('p');
    message.textContent = `Thank you, ${customerNameEl.value.trim()}. Your ${moveLabel} from ${pickupText} to ${dropoffText} on ${formattedDate} is scheduled for review (Estimated range: $${estimate.min} – $${estimate.max}). Our dispatch team will contact you at ${customerContactEl.value.trim()}.`;

    confirmationEl.appendChild(title);
    confirmationEl.appendChild(message);
    confirmationEl.hidden = false;

    form.reset();
    moveDateEl.setAttribute('min', todayISO);
    calculateEstimate();
  });

  function validateForm() {
    let valid = true;

    if (!moveTypeEl.value) {
      setFieldError(moveTypeEl, 'Please choose a move type.');
      valid = false;
    }

    if (!moveDateEl.value) {
      setFieldError(moveDateEl, 'Please select a preferred move date.');
      valid = false;
    } else if (moveDateEl.value < todayISO) {
      setFieldError(moveDateEl, 'Please choose today or a future date.');
      valid = false;
    }

    if (!pickupAreaEl.value) {
      setFieldError(pickupAreaEl, 'Please select a pickup area.');
      valid = false;
    }

    if (!dropoffAreaEl.value) {
      setFieldError(dropoffAreaEl, 'Please select a drop-off area.');
      valid = false;
    }

    if (customerNameEl.value.trim().length < 2) {
      setFieldError(customerNameEl, 'Please enter your full name.');
      valid = false;
    }

    const contactVal = customerContactEl.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+\d][\d\s\-()]{6,}$/;

    if (!contactVal) {
      setFieldError(customerContactEl, 'Please enter a valid phone number or email.');
      valid = false;
    } else if (!emailPattern.test(contactVal) && !phonePattern.test(contactVal)) {
      setFieldError(customerContactEl, 'Enter a valid email address or phone number.');
      valid = false;
    }

    return valid;
  }

  function setFieldError(field, message) {
    const errorEl = document.getElementById(`${field.id}-error`);
    field.classList.add('is-invalid');
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearFieldError(field) {
    const errorEl = document.getElementById(`${field.id}-error`);
    field.classList.remove('is-invalid');
    if (errorEl) {
      errorEl.textContent = '';
    }
  }
}

function getTodayLocalISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatReadableDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function updateCopyrightYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}