// raio landing page — vanilla JS, no dependencies.

(function () {
  "use strict";

  // Mobile nav — off-canvas panel sliding in from the right.
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  var backdrop = document.querySelector("[data-nav-backdrop]");

  function setNav(open) {
    if (!toggle || !links) return;
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (backdrop) {
      backdrop.classList.toggle("open", open);
      if (open) {
        backdrop.removeAttribute("hidden");
      } else {
        backdrop.setAttribute("hidden", "");
      }
    }
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      setNav(!links.classList.contains("open"));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setNav(false);
      });
    });
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setNav(false);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        setNav(false);
      }
    });
    // Reset if the viewport grows back past the mobile breakpoint.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640 && links.classList.contains("open")) {
        setNav(false);
      }
    });
  }

  // Copy-to-clipboard on the quickstart code block
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.querySelector(btn.getAttribute("data-copy"));
      if (!target) return;
      var text = target.innerText.replace(/\$\s?/g, "").trim();
      navigator.clipboard.writeText(text).then(function () {
        var original = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.textContent = original;
        }, 1600);
      });
    });
  });

  // Reveal-on-scroll
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }
})();
