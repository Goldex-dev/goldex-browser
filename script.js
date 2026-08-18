document.addEventListener('DOMContentLoaded', () => {

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Nav background on scroll
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.background = 'rgba(10,10,26,0.95)';
      nav.style.borderBottomColor = 'rgba(255,255,255,0.08)';
    } else {
      nav.style.background = 'rgba(10,10,26,0.85)';
      nav.style.borderBottomColor = 'rgba(255,255,255,0.05)';
    }
  });

  // Fade in on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .screenshot-card, .download-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });

  // Animated counter for version
  const versionEl = document.querySelector('.hero-version');
  if (versionEl) {
    const text = versionEl.textContent;
    versionEl.style.opacity = '0';
    setTimeout(() => {
      versionEl.style.transition = 'opacity 0.8s';
      versionEl.style.opacity = '1';
    }, 800);
  }

  // Parallax orbs
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    document.querySelectorAll('.hero-orb').forEach((orb, i) => {
      const speed = (i + 1) * 0.5;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });

});
