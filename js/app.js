/* ============================================================
   AXSOLVEX — Scroll-Driven Animation Engine
   Lenis + GSAP + ScrollTrigger + Video Scroll Renderer
   ============================================================ */

(function () {
  "use strict";

  // ---- Config ----
  const VIDEO_SPEED = 2.0; // How fast video plays through relative to scroll

  // ---- DOM refs ----
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  const heroSection = document.getElementById("hero");
  const canvasWrap = document.getElementById("canvas-wrap");
  const scrollVideo = document.getElementById("scroll-video");
  const scrollContainer = document.getElementById("scroll-container");
  const darkOverlay = document.getElementById("dark-overlay");

  // ---- State ----
  let videoDuration = 0;
  let isLoaded = false;

  // ---- Video preloader ----
  function preloadVideo() {
    // Show loading progress
    loaderBar.style.width = "30%";
    loaderPercent.textContent = "30%";

    scrollVideo.addEventListener("loadedmetadata", () => {
      videoDuration = scrollVideo.duration;
      loaderBar.style.width = "60%";
      loaderPercent.textContent = "60%";
    });

    scrollVideo.addEventListener("canplaythrough", function onReady() {
      scrollVideo.removeEventListener("canplaythrough", onReady);
      videoDuration = scrollVideo.duration;
      loaderBar.style.width = "100%";
      loaderPercent.textContent = "100%";
      isLoaded = true;
      // Set video to first frame
      scrollVideo.currentTime = 0;
      hideLoader();
    });

    // Fallback if canplaythrough doesn't fire (some mobile browsers)
    setTimeout(() => {
      if (!isLoaded) {
        videoDuration = scrollVideo.duration || 8;
        loaderBar.style.width = "100%";
        loaderPercent.textContent = "100%";
        isLoaded = true;
        scrollVideo.currentTime = 0;
        hideLoader();
      }
    }, 5000);
  }

  function hideLoader() {
    loader.classList.add("hidden");
    setTimeout(() => {
      initAnimations();
    }, 300);
  }

  // ---- Mobile detection ----
  const isMobile = window.innerWidth <= 768;

  // ---- Hamburger Menu ----
  const hamburger = document.querySelector(".nav-hamburger");
  const siteHeader = document.querySelector(".site-header");
  const navLinksAll = document.querySelectorAll(".nav-links a");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      siteHeader.classList.toggle("nav-open");
      document.body.style.overflow = siteHeader.classList.contains("nav-open") ? "hidden" : "";
    });

    navLinksAll.forEach((link) => {
      link.addEventListener("click", () => {
        siteHeader.classList.remove("nav-open");
        document.body.style.overflow = "";
      });
    });
  }

  // ---- Nav anchor smooth scroll ----
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href === "#") return;
      const target = document.querySelector(href);
      if (target && target.dataset.enter) {
        e.preventDefault();
        const enterVal = isMobile && target.dataset.enterM
          ? parseFloat(target.dataset.enterM)
          : parseFloat(target.dataset.enter);
        const scrollPos = (enterVal / 100) * scrollContainer.offsetHeight + scrollContainer.offsetTop;
        window.scrollTo({ top: scrollPos, behavior: "smooth" });
      }
    });
  });

  // ---- Lenis Smooth Scroll ----
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // ---- Init all animations ----
  function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    initHeroEntrance();
    initHeroTransition();
    initVideoScroll();
    initSections();
    initCounters();
    initMarquee();
    initDarkOverlay(isMobile ? 0.57 : 0.58, 1.01);
    initActiveNav();
  }

  // ---- Hero entrance animation ----
  function initHeroEntrance() {
    const tl = gsap.timeline({ delay: 0.2 });
    const label = heroSection.querySelector(".section-label");
    const words = heroSection.querySelectorAll(".word");
    const tagline = heroSection.querySelector(".hero-tagline");
    const scrollInd = heroSection.querySelector(".scroll-indicator");

    tl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
      .to(words, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.3")
      .to(tagline, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
      .to(scrollInd, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.3");
  }

  // ---- Circle-wipe hero → video transition ----
  function initHeroTransition() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Hero fades out quickly
        heroSection.style.opacity = Math.max(0, 1 - p * 15);
        heroSection.style.pointerEvents = p > 0.02 ? "none" : "auto";

        // Video reveals via expanding circle
        const wipeProgress = Math.min(1, Math.max(0, (p - 0.005) / 0.06));
        const radius = wipeProgress * 78;
        canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
      },
    });
  }

  // ---- Video-to-scroll binding ----
  function initVideoScroll() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        if (!videoDuration) return;
        const accelerated = Math.min(self.progress * VIDEO_SPEED, 1);
        const targetTime = accelerated * videoDuration;
        // Only update if difference is noticeable
        if (Math.abs(scrollVideo.currentTime - targetTime) > 0.03) {
          scrollVideo.currentTime = targetTime;
        }
      },
    });
  }

  // ---- Section positioning & animation ----
  function initSections() {
    const sections = document.querySelectorAll(".scroll-section");
    const containerHeight = scrollContainer.offsetHeight;

    sections.forEach((section) => {
      const enter = isMobile && section.dataset.enterM
        ? parseFloat(section.dataset.enterM) / 100
        : parseFloat(section.dataset.enter) / 100;
      const leave = isMobile && section.dataset.leaveM
        ? parseFloat(section.dataset.leaveM) / 100
        : parseFloat(section.dataset.leave) / 100;
      const midpoint = (enter + leave) / 2;

      // Position section at midpoint
      section.style.top = midpoint * containerHeight + "px";
      section.style.transform = "translateY(-50%)";

      setupSectionAnimation(section, enter, leave, containerHeight);
    });
  }

  function setupSectionAnimation(section, enter, leave) {
    const type = section.dataset.animation;
    const persist = section.dataset.persist === "true";
    const children = section.querySelectorAll(
      ".section-label, .section-heading, .section-body, .about-body, .section-note, .cta-button, .stat, .stats-grid, .product-item"
    );

    const tl = gsap.timeline({ paused: true });

    // Set initial hidden states
    switch (type) {
      case "fade-up":
        gsap.set(children, { y: 50, opacity: 0 });
        tl.to(children, { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: "power3.out" });
        break;
      case "slide-left":
        gsap.set(children, { x: -80, opacity: 0 });
        tl.to(children, { x: 0, opacity: 1, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "slide-right":
        gsap.set(children, { x: 80, opacity: 0 });
        tl.to(children, { x: 0, opacity: 1, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "scale-up":
        gsap.set(children, { scale: 0.85, opacity: 0 });
        tl.to(children, { scale: 1, opacity: 1, stagger: 0.12, duration: 1.0, ease: "power2.out" });
        break;
      case "rotate-in":
        gsap.set(children, { y: 40, rotation: 3, opacity: 0 });
        tl.to(children, { y: 0, rotation: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease: "power3.out" });
        break;
      case "stagger-up":
        gsap.set(children, { y: 60, opacity: 0 });
        tl.to(children, { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out" });
        break;
      case "clip-reveal":
        gsap.set(children, { clipPath: "inset(100% 0 0 0)", opacity: 0 });
        tl.to(children, { clipPath: "inset(0% 0 0 0)", opacity: 1, stagger: 0.15, duration: 1.2, ease: "power4.inOut" });
        break;
      default:
        gsap.set(children, { y: 40, opacity: 0 });
        tl.to(children, { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: "power3.out" });
    }

    let hasPlayed = false;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;
        const fadeIn = enter - 0.02;
        const fadeOut = leave + 0.02;

        if (p >= fadeIn && p <= leave) {
          // Show section
          section.style.opacity = "1";
          if (!hasPlayed) {
            tl.play();
            hasPlayed = true;
          }
        } else if (p > leave && persist) {
          // Keep visible if persistent
          section.style.opacity = "1";
        } else if (p > fadeOut || p < fadeIn) {
          // Hide section
          if (!persist || p < fadeIn) {
            section.style.opacity = "0";
            if (hasPlayed && !persist) {
              tl.reverse();
              hasPlayed = false;
            }
          }
        }
      },
    });
  }

  // ---- Counter Animations ----
  function initCounters() {
    document.querySelectorAll(".stat-number").forEach((el) => {
      const target = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals || "0");

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const statsSection = el.closest(".scroll-section");
          const enter = parseFloat(statsSection.dataset.enter) / 100;
          const leave = parseFloat(statsSection.dataset.leave) / 100;
          const p = self.progress;

          if (p >= enter && p <= leave && !el._counted) {
            el._counted = true;
            gsap.fromTo(
              el,
              { textContent: 0 },
              {
                textContent: target,
                duration: 2,
                ease: "power1.out",
                snap: { textContent: decimals === 0 ? 1 : 0.1 },
                onUpdate: function () {
                  el.textContent = parseFloat(el.textContent).toFixed(decimals);
                },
              }
            );
          } else if (p < enter - 0.02 && el._counted) {
            el._counted = false;
            el.textContent = "0";
          }
        },
      });
    });
  }

  // ---- Horizontal Text Marquee ----
  function initMarquee() {
    document.querySelectorAll(".marquee-wrap").forEach((el) => {
      const speed = parseFloat(el.dataset.scrollSpeed) || -25;
      const text = el.querySelector(".marquee-text");

      gsap.to(text, {
        xPercent: speed,
        ease: "none",
        scrollTrigger: {
          trigger: scrollContainer,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      // Fade marquee in/out
      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: false,
        onUpdate: (self) => {
          const p = self.progress;
          // Show marquee between 10% and 48% scroll
          const mStart = isMobile ? 0.08 : 0.12;
          const mEnd = isMobile ? 0.48 : 0.50;
          if (p > mStart && p < mEnd) {
            const fadeIn = Math.min(1, (p - mStart) / 0.05);
            const fadeOut = Math.min(1, (mEnd - p) / 0.05);
            el.style.opacity = Math.min(fadeIn, fadeOut);
          } else {
            el.style.opacity = "0";
          }
        },
      });
    });
  }

  // ---- Dark Overlay ----
  function initDarkOverlay(enter, leave) {
    const fadeRange = 0.04;
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;
        if (p >= enter - fadeRange && p <= enter) {
          opacity = ((p - (enter - fadeRange)) / fadeRange) * 0.92;
        } else if (p > enter && p < leave) {
          opacity = 0.92;
        } else if (p >= leave && p <= leave + fadeRange) {
          opacity = 0.92 * (1 - (p - leave) / fadeRange);
        }
        darkOverlay.style.opacity = opacity;
      },
    });
  }

  // ---- Active Nav Highlighting ----
  function initActiveNav() {
    const navLinks = document.querySelectorAll(".nav-links a:not(.nav-cta)");
    const ctaLink = document.querySelector(".nav-links .nav-cta");

    // Map nav hrefs to scroll progress ranges
    const navMap = isMobile ? [
      { href: "#services", enter: 0.04, leave: 0.35 },
      { href: "#products", enter: 0.35, leave: 0.49 },
      { href: "#technology", enter: 0.49, leave: 0.59 },
      { href: "#about", enter: 0.59, leave: 0.75 },
    ] : [
      { href: "#services", enter: 0.05, leave: 0.38 },
      { href: "#products", enter: 0.38, leave: 0.50 },
      { href: "#technology", enter: 0.50, leave: 0.60 },
      { href: "#about", enter: 0.60, leave: 0.76 },
    ];

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;

        // Remove active from all
        navLinks.forEach((link) => link.classList.remove("nav-active"));
        if (ctaLink) ctaLink.classList.remove("nav-active");

        // CTA range
        if (p >= 0.76) {
          if (ctaLink) ctaLink.classList.add("nav-active");
          return;
        }

        // Check other sections
        for (const item of navMap) {
          if (p >= item.enter && p <= item.leave) {
            const link = document.querySelector(
              '.nav-links a[href="' + item.href + '"]'
            );
            if (link) link.classList.add("nav-active");
            break;
          }
        }
      },
    });
  }

  // ---- Kick off ----
  preloadVideo();
})();
