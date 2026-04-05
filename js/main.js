/* ============================================
   ARON B. WATERS — Main JavaScript
   Language toggle, scroll animations, nav, FAQ
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Language Toggle ---
  const LANGS = ['en', 'nl'];
  let currentLang = localStorage.getItem('abw-lang') || 'en';

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('abw-lang', lang);

    // Toggle visibility of lang elements
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.style.display = el.dataset.lang === lang ? '' : 'none';
    });

    // Update toggle buttons
    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.setLang === lang);
    });

    // Fix <select> dropdowns: ensure the selected option is a visible one
    document.querySelectorAll('select').forEach(sel => {
      const current = sel.options[sel.selectedIndex];
      if (current && current.style.display === 'none') {
        // Find the first visible option and select it
        for (let i = 0; i < sel.options.length; i++) {
          if (sel.options[i].style.display !== 'none') {
            sel.selectedIndex = i;
            break;
          }
        }
      }
    });
  }

  // Init language toggle buttons
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.setLang));
  });

  // Set initial language
  setLanguage(currentLang);

  // --- Logo glow mouse-follow ---
  document.querySelectorAll('.nav-logo').forEach(logo => {
    logo.addEventListener('mousemove', (e) => {
      const rect = logo.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      logo.style.setProperty('--glow-x', x + '%');
      logo.style.setProperty('--glow-y', y + '%');
    });
  });

  // --- Navbar scroll effect ---
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // --- Mobile menu ---
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Scroll Animations (Intersection Observer) ---
  const animatedEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .stagger, .gold-line');

  if (animatedEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedEls.forEach(el => observer.observe(el));
  }

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

      // Toggle current
      if (!isOpen) item.classList.add('open');
    });
  });

  // --- Accordion (speaking page) ---
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.accordion-trigger').forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        t.nextElementSibling.classList.remove('open');
      });
      if (!expanded) {
        trigger.setAttribute('aria-expanded', 'true');
        trigger.nextElementSibling.classList.add('open');
      }
    });
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Active nav link based on page ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --- Simple form handling (contact page) ---
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // In production, replace with actual form handler (Formspree, Netlify Forms, etc.)
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = currentLang === 'nl' ? 'Verstuurd!' : 'Sent!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        contactForm.reset();
      }, 3000);
    });
  }

  // --- Speaking form handling ---
  const speakingForm = document.querySelector('#speaking-form');
  if (speakingForm) {
    speakingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = speakingForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = currentLang === 'nl' ? 'Verstuurd!' : 'Sent!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        speakingForm.reset();
      }, 3000);
    });
  }

  // --- Confetti on button click ---
  function createConfetti(x, y) {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = ['#e0a010', '#f5d060', '#b8830d', '#ffffff', '#333333'];
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1) * 12 - 4,
        size: Math.random() * 8 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.3,
        opacity: 1
      });
    }
    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.012;
        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * Math.PI / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });
      frame++;
      if (alive && frame < 120) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(animate);
  }

  document.querySelectorAll('.btn-gold').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  });

});
