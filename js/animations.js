"use strict";

/*
 * Glam motion layer (progressive enhancement).
 *
 * - GSAP + ScrollTrigger + SplitText are vendored in js/vendor/ and load with
 *   `defer`. If any of them fail, every init below is skipped and the page is
 *   left fully visible — brand.css already forces .reveal/.wow visible.
 * - Only transform + opacity are animated (60fps; no layout thrash).
 * - prefers-reduced-motion: nothing initializes; CSS keeps tickers static and
 *   scrollable instead.
 */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger, SplitText);

  var EASE = "power2.out";

  /* Splits a heading into masked lines. The mask (overflow + padding
     compensation so descenders don't clip) is applied inline — independent of
     any SplitText class API. Returns the split or null. Callers must call
     this inside fonts.ready so measurement uses the real font. */
  function prepareLines(el) {
    var split;
    try {
      split = new SplitText(el, { type: "lines" });
    } catch (err) {
      return null;
    }
    if (!split || !split.lines || !split.lines.length) return null;
    el.style.visibility = "hidden";
    gsap.set(split.lines, {
      overflow: "hidden",
      paddingBlock: "0.09em",
      marginBlock: "-0.09em",
      yPercent: 110,
    });
    el.style.visibility = "visible";
    return split;
  }

  function fontsReady() {
    return document.fonts ? document.fonts.ready : Promise.resolve();
  }

  /* Shared scroll-in fade-up. Honours the original data-wow-delay rhythm,
     capped so nothing waits too long. Elements inside .hero are skipped —
     the hero timeline owns them. */
  function fadeUp(targets, vars) {
    var options = vars || {};
    gsap.utils.toArray(targets).forEach(function (el) {
      if (el.closest(".hero")) return;
      var delay = options.delay;
      if (delay === undefined) {
        // Blocks holding a form are conversion-critical: no stagger delay.
        delay = el.querySelector("form, input, textarea")
          ? 0
          : Math.min(parseFloat(el.getAttribute("data-wow-delay")) || 0, 0.6);
      }
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: EASE, delay: delay });
        },
      });
      // Hidden state is applied immediately so elements below the fold are
      // never visible-then-flashing; onEnter only ever animates to visible.
      gsap.set(el, { opacity: 0, y: options.y || 28 });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2. Masked line reveal for every .text-anime heading on the page.    */
  /*    SplitText wraps each rendered line in a clipped shell, so lines  */
  /*    slide up out of their own mask. Font loading is awaited so       */
  /*    SplitText never measures the fallback font. The heading is kept  */
  /*    invisible between hide and split so nothing flashes.             */
  /* ------------------------------------------------------------------ */
  function initHeadings() {
    var headings = gsap.utils.toArray(".text-anime").filter(function (h) {
      return !h.closest(".hero");
    });
    if (!headings.length) return;

    fontsReady().then(function () {
      headings.forEach(function (heading) {
        var split = prepareLines(heading);
        if (!split) return;
        ScrollTrigger.create({
          trigger: heading,
          start: "top 88%",
          once: true,
          onEnter: function () {
            gsap.to(split.lines, {
              yPercent: 0,
              duration: 1.0,
              ease: "power3.out",
              stagger: 0.1,
            });
          },
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 1. Hero: masked line reveal on the H1, staggered entrance, and a    */
  /*    clip-path curtain on the image, then a subtle continuous float.  */
  /* ------------------------------------------------------------------ */
  function initHero() {
    var hero = document.querySelector(".hero");
    if (!hero || hero.dataset.animBound) return;
    hero.dataset.animBound = "1";

    fontsReady().then(function () {
      var h1 = hero.querySelector(".section-title h1");
      var split = h1 ? prepareLines(h1) : null;

      var timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .from(".hero-content .section-title h3", { opacity: 0, y: 24, duration: 0.7 });

      if (split) {
        timeline.to(
          split.lines,
          { yPercent: 0, duration: 1.0, stagger: 0.1 },
          0.15
        );
      } else if (h1) {
        timeline.from(h1, { opacity: 0, y: 40, duration: 1.0 }, 0.15);
      }

      timeline
        .from(".hero-content-body", { opacity: 0, y: 24, duration: 0.8 }, 0.4)
        .from(".hero-content-footer", { opacity: 0, y: 24, duration: 0.8 }, 0.55)
        .fromTo(
          ".hero-image",
          { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" },
          { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.9 },
          0.45
        )
        .from(
          ".hero-image img",
          { scale: 1.12, duration: 1.3, ease: "power2.out" },
          0.45
        );

      // Subtle continuous float once the curtain lands.
      gsap.to(".hero-image", {
        y: -10,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1.6,
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. About images: gentle parallax at two speeds + badge scale pop.   */
  /* ------------------------------------------------------------------ */
  function initAbout() {
    var section = document.querySelector(".about-us-section");
    if (!section) return;

    var img1 = section.querySelector(".about-img.right-shape img");
    var img2 = section.querySelector(".about-img.left-shape img");
    if (img1) {
      gsap.fromTo(
        img1,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }
    if (img2) {
      gsap.fromTo(
        img2,
        { yPercent: -11 },
        {
          yPercent: 11,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }

    var badge = section.querySelector(".about-year");
    if (badge) {
      ScrollTrigger.create({
        trigger: badge,
        start: "top 90%",
        once: true,
        onEnter: function () {
          gsap.to(badge, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" });
        },
      });
      gsap.set(badge, { opacity: 0, scale: 0.6 });
    }
  }

  /* ------------------------------------------------------------------ */
  /* 4. Service cards: staggered fade-up, then image zoom inside frame.  */
  /* ------------------------------------------------------------------ */
  function initCards() {
    ["home-treatment", "salon-service"].forEach(function (cls) {
      var cards = gsap.utils.toArray("." + cls);
      if (!cards.length) return;

      // Row-by-row stagger: cards sharing a top position animate together.
      var rows = [];
      var map = new Map();
      cards.forEach(function (card) {
        var top = Math.round(card.getBoundingClientRect().top);
        if (!map.has(top)) {
          map.set(top, []);
          rows.push(map.get(top));
        }
        rows[rows.length - 1].push(card);
      });
      // Cards in the same row follow each other by a fixed 0.1s.
      rows.forEach(function (row) {
        row.forEach(function (card, i) {
          ScrollTrigger.create({
            trigger: card,
            start: "top 88%",
            once: true,
            onEnter: function () {
              gsap.to(card, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: EASE,
                delay: i * 0.1,
              });
            },
          });
          gsap.set(card, { opacity: 0, y: 36 });
        });
      });
    });

    // Photo zoom while the card scrolls through the viewport.
    gsap.utils
      .toArray(".home-treatment-photo img, .service-photo img")
      .forEach(function (img) {
        if (img.closest(".service-card-feature")) return; // tall feature card
        gsap.fromTo(
          img,
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: img,
              start: "top bottom",
              end: "top 35%",
              scrub: true,
            },
          }
        );
      });
  }

  /* ------------------------------------------------------------------ */
  /* 5. Counters: real count-up when scrolled into view.                 */
  /* ------------------------------------------------------------------ */
  function initCounters() {
    gsap.utils.toArray(".counter").forEach(function (counter) {
      var target = parseInt(counter.textContent.replace(/[^\d]/g, ""), 10);
      if (!isFinite(target) || target === 0) return;
      var state = { value: 0 };
      ScrollTrigger.create({
        trigger: counter,
        start: "top 90%",
        once: true,
        onEnter: function () {
          gsap.to(state, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: function () {
              counter.textContent = String(Math.round(state.value));
            },
          });
        },
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 6. Marquees: GSAP-driven tickers that react to scroll velocity.     */
  /*    CSS animations are disabled via .gsap-ticker; hover/focus pause  */
  /*    is honoured exactly as the aria-labels promise. The loop shifts  */
  /*    one track width plus the flex gap, so it never jumps.            */
  /* ------------------------------------------------------------------ */
  function initMarquees() {
    gsap.utils
      .toArray(".feature-ticker-box, .photo-gallery-ticker")
      .forEach(function (box) {
        var tracks = box.querySelectorAll(
          ".feature-ticker-content, .photo-gallery-content"
        );
        if (!tracks.length) return;
        box.classList.add("gsap-ticker");

        var gap = parseFloat(getComputedStyle(box).columnGap) || 0;
        var duration = box.classList.contains("photo-gallery-ticker")
          ? 40
          : 24;
        var tween = gsap.to(tracks, {
          xPercent: -100,
          x: -gap,
          ease: "none",
          duration: duration,
          repeat: -1,
        });

        // Direction follows scroll; magnitude follows scroll speed.
        var direction = 1;
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: function (self) {
            if (self.direction !== 0) direction = self.direction;
            var speed = Math.min(Math.abs(self.getVelocity()) / 2400, 2.4);
            gsap.to(tween, {
              timeScale: (1 + speed) * direction,
              duration: 0.4,
              overwrite: true,
            });
          },
        });

        var pause = function () {
          gsap.to(tween, { timeScale: 0, duration: 0.4, overwrite: true });
        };
        var resume = function () {
          gsap.to(tween, {
            timeScale: direction,
            duration: 0.4,
            overwrite: true,
          });
        };
        box.addEventListener("mouseenter", pause);
        box.addEventListener("mouseleave", resume);
        box.addEventListener("focusin", pause);
        box.addEventListener("focusout", resume);
        document.addEventListener("visibilitychange", function () {
          if (document.hidden) pause();
          else resume();
        });
      });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Header: hide on scroll down, slide back on scroll up.            */
  /*    The sticky element keeps its layout height; only transform moves. */
  /* ------------------------------------------------------------------ */
  function initHeader() {
    var header = document.querySelector("header.main-header");
    if (!header || header.dataset.animBound) return;
    header.dataset.animBound = "1";
    header.classList.add("header-anim-ready");

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        var y = self.scroll();
        if (y <= window.innerHeight || self.direction === -1) {
          header.classList.remove("header-hidden");
        } else if (self.direction === 1) {
          header.classList.add("header-hidden");
        }
      },
    });
  }

  /* ------------------------------------------------------------------ */
  /* 8. Buttons: magnetic hover (translate toward the cursor).           */
  /*    CSS owns the hover styling; JS only adds the transform.          */
  /* ------------------------------------------------------------------ */
  function initMagnetic() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.querySelectorAll(".btn-default, .salon-button").forEach(function (btn) {
      if (btn.dataset.animBound) return;
      btn.dataset.animBound = "1";

      btn.addEventListener("mousemove", function (event) {
        var rect = btn.getBoundingClientRect();
        var x = (event.clientX - rect.left - rect.width / 2) * 0.16;
        var y = (event.clientY - rect.top - rect.height / 2) * 0.16;
        gsap.to(btn, { x: x, y: y, duration: 0.3, ease: EASE });
      });
      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.55)" });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  function init() {
    initHero();
    initHeadings();
    initAbout();
    initCards();
    initCounters();
    initMarquees();
    initHeader();
    initMagnetic();

    // Generic fade-ups for the .wow markers and the remaining page blocks.
    // Blocks that CONTAIN a .text-anime heading are excluded — the heading's
    // own masked reveal already animates them, and nested motion compounds.
    fadeUp(
      ".wow, .goal-item, .team-item, .brand-logo, .contact-info-item, .contact-box, .facts-item, .treatment-section, .salon-invitation-image, .page-header-icon-box"
    );

    ScrollTrigger.refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
