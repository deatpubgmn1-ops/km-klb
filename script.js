
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// Mobil menyu
const hamburger = $('#hamburger');
const nav = $('#nav');

hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
  hamburger.textContent = nav.classList.contains('open') ? '✕' : '☰';
});

$$('#nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.textContent = '☰';
  });
});

// Modal oynalar
const bookingModal = $('#bookingModal');
const registerModal = $('#registerModal');
const bookingZone = $('#bookingZone');

function openModal(modal) {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

$$('[data-book]').forEach(button => {
  button.addEventListener('click', () => {
    const zone = button.dataset.book;
    if (zone) bookingZone.value = zone;
    openModal(bookingModal);
  });
});

$$('[data-register]').forEach(button => {
  button.addEventListener('click', () => {
    $('#registerGame').value = button.dataset.register;
    openModal(registerModal);
  });
});

$$('[data-close]').forEach(button => {
  button.addEventListener('click', () => {
    closeModal(button.closest('.modal'));
  });
});

$$('.modal').forEach(modal => {
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal(modal);
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    $$('.modal.open').forEach(closeModal);
  }
});

// Sana tanlash
const dateInput = $('#bookingDate');
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString().split('T')[0];

dateInput.min = localDate;
dateInput.value = localDate;

// Xabar chiqarish
let toastTimer;

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// Bron qilish
$('#bookingForm').addEventListener('submit', event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(event.currentTarget));

  if (data.date < localDate) {
    notify('Iltimos, bugungi yoki kelajakdagi sanani tanlang.');
    return;
  }

  const phone = data.phone.replace(/[\s()-]/g, '');
  if (!/^\+?\d{9,15}$/.test(phone)) {
    notify('Telefon raqamini to‘g‘ri kiriting.');
    return;
  }

  const reservation = {
    ...data,
    createdAt: new Date().toISOString()
  };

  // Demo rejimida bron brauzer xotirasida saqlanadi.
  try {
    const saved = JSON.parse(localStorage.getItem('cyberBookings') || '[]');
    saved.push(reservation);
    localStorage.setItem('cyberBookings', JSON.stringify(saved));
  } catch (error) {
    console.warn('Bronni saqlash imkoni bo‘lmadi.', error);
  }

  closeModal(bookingModal);
  event.currentTarget.reset();
  dateInput.value = localDate;

  notify(`Rahmat, ${data.name}! Bron so‘rovingiz qabul qilindi.`);
});

// Turnirga yozilish
$('#registerForm').addEventListener('submit', event => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(event.currentTarget));
  const phone = data.phone.replace(/[\s()-]/g, '');

  if (!/^\+?\d{9,15}$/.test(phone)) {
    notify('Telefon raqamini to‘g‘ri kiriting.');
    return;
  }

  try {
    const saved = JSON.parse(localStorage.getItem('cyberTournamentEntries') || '[]');
    saved.push({...data, createdAt: new Date().toISOString()});
    localStorage.setItem('cyberTournamentEntries', JSON.stringify(saved));
  } catch (error) {
    console.warn('Ma’lumotni saqlash imkoni bo‘lmadi.', error);
  }

  closeModal(registerModal);
  event.currentTarget.reset();
  notify('Turnirga yozilish so‘rovingiz qabul qilindi!');
});

// Tariflarni filtrlash
$$('.filter-btn').forEach(button => {
  button.addEventListener('click', () => {
    $$('.filter-btn').forEach(item => item.classList.remove('active'));
    button.classList.add('active');

    const filter = button.dataset.filter;

    $$('.price-card').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.type !== filter;
    });
  });
});

// Zonalarning karuseli
const track = $('#zoneTrack');
const cards = $$('.zone-card');
const dotsContainer = $('#zoneDots');
let currentSlide = 0;

function visibleCards() {
  if (window.innerWidth <= 760) return 1;
  if (window.innerWidth <= 1000) return 2;
  return 3;
}

function maxSlide() {
  return Math.max(0, cards.length - visibleCards());
}

function buildDots() {
  dotsContainer.innerHTML = '';
  for (let i = 0; i <= maxSlide(); i++) {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `${i + 1}-sahifa`);
    dot.addEventListener('click', () => {
      currentSlide = i;
      updateSlider();
    });
    dotsContainer.appendChild(dot);
  }
}

function updateSlider() {
  currentSlide = Math.min(currentSlide, maxSlide());

  const cardWidth = cards[0].getBoundingClientRect().width;
  const gap = parseFloat(getComputedStyle(track).gap) || 0;

  track.style.transform = `translateX(-${currentSlide * (cardWidth + gap)}px)`;

  $$('.dot', dotsContainer).forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });

  $('#zonePrev').disabled = currentSlide === 0;
  $('#zoneNext').disabled = currentSlide === maxSlide();
}

$('#zonePrev').addEventListener('click', () => {
  currentSlide = Math.max(0, currentSlide - 1);
  updateSlider();
});

$('#zoneNext').addEventListener('click', () => {
  currentSlide = Math.min(maxSlide(), currentSlide + 1);
  updateSlider();
});

buildDots();
updateSlider();

window.addEventListener('resize', () => {
  buildDots();
  updateSlider();
});

// Sensorli ekranlarda surish
let touchStart = 0;

track.addEventListener('touchstart', event => {
  touchStart = event.touches[0].clientX;
}, {passive:true});

track.addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) < 40) return;

  if (distance < 0) {
    currentSlide = Math.min(maxSlide(), currentSlide + 1);
  } else {
    currentSlide = Math.max(0, currentSlide - 1);
  }
  updateSlider();
}, {passive:true});

// 3D tilt effekti
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  $$('.tilt, .spec-card').forEach(card => {
    card.addEventListener('mousemove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      const rotateX = (0.5 - y) * 10;
      const rotateY = (x - 0.5) * 10;

      card.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {threshold:0.12});

$$('.reveal').forEach(element => observer.observe(element));
