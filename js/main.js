/* ============================================
   ARON B. WATERS — Main JavaScript
   Language toggle, scroll animations, nav, FAQ
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Language Toggle ---
  // NL temporarily disabled — site is EN-only. To re-enable, remove the next line.
  const EN_ONLY = true;
  const LANGS = ['en', 'nl'];
  let currentLang = EN_ONLY ? 'en' : (localStorage.getItem('abw-lang') || 'en');

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

  // --- Testimonial carousel (seamless infinite loop with clones) ---
  const carouselTrack = document.getElementById('testimonial-track');
  if (carouselTrack) {
    const originals = [...carouselTrack.querySelectorAll('.carousel-quote')];
    if (originals.length > 1) {
      // Clone first slide to end, last slide to start
      const firstClone = originals[0].cloneNode(true);
      const lastClone = originals[originals.length - 1].cloneNode(true);
      firstClone.classList.add('is-clone');
      lastClone.classList.add('is-clone');
      carouselTrack.appendChild(firstClone);
      carouselTrack.insertBefore(lastClone, originals[0]);

      const slides = [...carouselTrack.querySelectorAll('.carousel-quote')];
      let index = 1; // start at first real slide (after the prepended last-clone)
      let locked = false;

      // Set initial position without animation
      const setPos = () => { carouselTrack.scrollLeft = slides[index].offsetLeft; };
      setPos();
      window.addEventListener('resize', setPos);

      function waitForScrollTo(target) {
        return new Promise(resolve => {
          let last = carouselTrack.scrollLeft;
          let stable = 0;
          const tick = () => {
            const cur = carouselTrack.scrollLeft;
            if (Math.abs(cur - target) < 2) return resolve();
            if (Math.abs(cur - last) < 0.5) {
              stable++;
              if (stable > 3) return resolve();
            } else {
              stable = 0;
            }
            last = cur;
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }

      async function goTo(dir) {
        if (locked) return;
        locked = true;
        index += dir;
        const targetLeft = slides[index].offsetLeft;
        carouselTrack.scrollTo({ left: targetLeft, behavior: 'smooth' });
        await waitForScrollTo(targetLeft);
        if (index === 0) {
          index = originals.length;
          carouselTrack.scrollLeft = slides[index].offsetLeft;
        } else if (index === slides.length - 1) {
          index = 1;
          carouselTrack.scrollLeft = slides[index].offsetLeft;
        }
        locked = false;
      }

      document.querySelectorAll('.carousel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          goTo(parseInt(btn.dataset.dir, 10));
        });
      });
    }
  }

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
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      link.classList.add('active');
    }
  });

  // --- Form success feedback (after redirect back with ?sent=true) ---
  if (window.location.search.includes('sent=true')) {
    const form = document.querySelector('#contact-form, #speaking-form');
    if (form) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = currentLang === 'nl' ? 'Verstuurd!' : 'Sent!';
        btn.style.background = '#2e7d32';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
        }, 4000);
      }
    }
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
