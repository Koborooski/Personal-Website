// One-at-a-time image carousel.
// The track is a horizontally scrolling strip that snaps to each slide, so swiping
// works on phones for free; the arrows, dots and arrow keys just scroll it.
document.querySelectorAll('.carousel').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const slides = [...track.children];
  const dotsBox = carousel.querySelector('.carousel-dots');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;

  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    const caption = slide.querySelector('figcaption')?.textContent ?? `Piece ${i + 1}`;
    dot.setAttribute('aria-label', `${caption} (${i + 1} of ${slides.length})`);
    dot.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(dot);
    return dot;
  });

  // Wraps around: next from the last slide goes back to the first
  function goTo(i) {
    const index = (i + slides.length) % slides.length;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: reduceMotion.matches ? 'auto' : 'smooth'
    });
  }

  function markCurrent(index) {
    current = index;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-selected', i === index);
    });
  }

  // Keep the dots in sync however the track was scrolled (arrows, dots, swipe, keys)
  track.addEventListener('scroll', () => {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== current) markCurrent(index);
  }, { passive: true });

  carousel.querySelector('.carousel-arrow.prev').addEventListener('click', () => goTo(current - 1));
  carousel.querySelector('.carousel-arrow.next').addEventListener('click', () => goTo(current + 1));

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });

  // Stay on the same slide when the window is resized
  window.addEventListener('resize', () => {
    track.scrollTo({ left: current * track.clientWidth, behavior: 'auto' });
  });

  markCurrent(0);
});
