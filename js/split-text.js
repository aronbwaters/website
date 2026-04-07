/* ============================================
   SPLIT TEXT EFFECT — Aron B. Waters
   Reusable staggered word/letter animation
   Usage: add class="split-text" to any element
   Options via data attributes:
     data-split="words" (default) or "letters"
     data-stagger="60" (ms between each, default 60)
     data-duration="600" (ms, default 600)
     data-delay="0" (initial delay in ms)
   ============================================ */

(function () {
  'use strict';

  const DEFAULTS = {
    split: 'words',
    stagger: 60,
    duration: 600,
    delay: 0,
  };

  function initSplitText() {
    const elements = document.querySelectorAll('.split-text');
    if (!elements.length) return;

    elements.forEach((el) => {
      // Read options
      const splitMode = el.dataset.split || DEFAULTS.split;
      const stagger = parseInt(el.dataset.stagger, 10) || DEFAULTS.stagger;
      const duration = parseInt(el.dataset.duration, 10) || DEFAULTS.duration;
      const initialDelay = parseInt(el.dataset.delay, 10) || DEFAULTS.delay;

      // Preserve original HTML for inner spans (like .text-gold)
      // We need to handle child elements carefully
      const fragments = [];
      el.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (splitMode === 'letters') {
            text.split('').forEach((char) => {
              fragments.push({ char: char === ' ' ? '\u00A0' : char, wrapper: null });
            });
          } else {
            text.split(/(\s+)/).forEach((word) => {
              if (word.trim()) {
                fragments.push({ char: word, wrapper: null });
              } else if (word) {
                fragments.push({ char: word, isSpace: true });
              }
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Handle <br> elements
          if (node.tagName === 'BR') {
            fragments.push({ isBr: true });
            return;
          }

          // Handle wrapped elements like <span class="text-gold">
          const innerText = node.textContent;
          const clone = node.cloneNode(false);
          if (splitMode === 'letters') {
            innerText.split('').forEach((char) => {
              fragments.push({
                char: char === ' ' ? '\u00A0' : char,
                wrapper: clone,
              });
            });
          } else {
            innerText.split(/(\s+)/).forEach((word) => {
              if (word.trim()) {
                fragments.push({ char: word, wrapper: clone });
              } else if (word) {
                fragments.push({ char: word, isSpace: true });
              }
            });
          }
        }
      });

      // Clear and rebuild
      el.innerHTML = '';
      el.classList.add('split-text-ready');

      let animIndex = 0;
      fragments.forEach((frag) => {
        if (frag.isBr) {
          el.appendChild(document.createElement('br'));
          return;
        }
        if (frag.isSpace) {
          el.appendChild(document.createTextNode(' '));
          return;
        }

        const span = document.createElement('span');
        span.className = 'split-text-unit';
        span.style.animationDelay = (initialDelay + animIndex * stagger) + 'ms';
        span.style.animationDuration = duration + 'ms';

        if (frag.wrapper) {
          const w = frag.wrapper.cloneNode(false);
          w.textContent = frag.char;
          span.appendChild(w);
        } else {
          span.textContent = frag.char;
        }

        el.appendChild(span);

        // Add space after word if in word mode
        if (splitMode === 'words') {
          el.appendChild(document.createTextNode(' '));
        }

        animIndex++;
      });

      // Use IntersectionObserver to trigger animation when in view
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.classList.add('split-text-animate');
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
    });
  }

  /* ============================================
     SPLIT REVEAL HOVER EFFECT
     Usage:
     <div class="split-reveal" data-reveal="NOW IS THE TIME">
       <span class="split-reveal-text">GET STARTED</span>
     </div>
     ============================================ */
  function initSplitReveal() {
    document.querySelectorAll('.split-reveal').forEach(function (el) {
      var textEl = el.querySelector('.split-reveal-text');
      if (!textEl) return;

      // Set data-main for the ::before/::after pseudo-elements
      el.setAttribute('data-main', textEl.textContent);

      // Create reveal bar if data-reveal is set
      var revealText = el.dataset.reveal;
      if (revealText && !el.querySelector('.split-reveal-bar')) {
        var bar = document.createElement('span');
        bar.className = 'split-reveal-bar';
        bar.textContent = revealText;
        el.appendChild(bar);
      }

      // Mobile: toggle .active on tap
      el.addEventListener('click', function () {
        el.classList.toggle('active');
      });
    });
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSplitText();
      initSplitReveal();
    });
  } else {
    initSplitText();
    initSplitReveal();
  }
})();
