/* =============================================================================
   JINIX Solutions
   Vanilla, no dependencies. Everything degrades without JS.
   ========================================================================== */

(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------------------
       Rail navigation (folds to a top bar on small screens)
       ------------------------------------------------------------------ */
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    if (toggle && links) {
        const setOpen = (open) => {
            toggle.setAttribute('aria-expanded', String(open));
            links.classList.toggle('is-open', open);
        };

        toggle.addEventListener('click', () =>
            setOpen(toggle.getAttribute('aria-expanded') !== 'true')
        );

        links.querySelectorAll('a').forEach((a) =>
            a.addEventListener('click', () => setOpen(false))
        );

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                setOpen(false);
                toggle.focus();
            }
        });

        window.matchMedia('(min-width: 921px)').addEventListener('change', (e) => {
            if (e.matches) setOpen(false);
        });
    }

    /* ---------------------------------------------------------------------
       Scroll reveal — fires once, then unobserves
       ------------------------------------------------------------------ */
    const revealables = document.querySelectorAll('[data-reveal]');
    if (revealables.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            revealables.forEach((el) => el.setAttribute('data-reveal', 'in'));
        } else {
            const io = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        entry.target.setAttribute('data-reveal', 'in');
                        obs.unobserve(entry.target);
                    });
                },
                { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
            );
            revealables.forEach((el) => io.observe(el));
        }
    }

    /* ---------------------------------------------------------------------
       The current.

       Ink descends the page the way a deal descends the pipeline. Two canvases:
       the body of the current is drawn BEHIND the type, the ink that escapes
       falls IN FRONT of it. That split is where the depth comes from.

       Nothing here emits light — everything composites with 'multiply', so the
       pigment stains the paper instead of glowing on it.
       ------------------------------------------------------------------ */
    const back = document.getElementById('heroBack');
    const front = document.getElementById('heroFront');
    const meter = document.getElementById('heroMeter');

    if (back && front && back.getContext) {
        const bx = back.getContext('2d');
        const fx = front.getContext('2d');

        const BLUE = '23,64,143';
        const TEAL = '14,140,134';
        const SEAMS = [0.30, 0.52, 0.72];   // fractions of height — Quote, Order, Bill

        let W = 0, H = 0, t = 0, drops = [], lost = 0;
        let mx = 0.5, targetMx = 0.5;
        let raf = null, running = false, lastSpawn = 0;

        const size = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = back.getBoundingClientRect();
            W = rect.width;
            H = rect.height;
            [back, front].forEach((c) => {
                c.width = Math.round(W * dpr);
                c.height = Math.round(H * dpr);
            });
            bx.setTransform(dpr, 0, 0, dpr, 0, 0);
            fx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        // x of the current at a given y — it meanders down the right-hand side
        const flowX = (y, i) => {
            const p = y / H;
            return W * 0.72
                + Math.sin(p * 2.6 + t * 0.5 + i * 0.13) * (44 + i * 1.5)
                + Math.sin(p * 5.4 - t * 0.3 + i * 0.27) * (15 + i * 0.5)
                + (mx - 0.5) * 38;
        };

        const current = () => {
            bx.clearRect(0, 0, W, H);
            bx.globalCompositeOperation = 'multiply';

            const g = bx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, 'rgb(' + BLUE + ')');
            g.addColorStop(0.6, 'rgb(' + TEAL + ')');
            g.addColorStop(1, 'rgb(' + TEAL + ')');

            for (let i = 0; i < 26; i++) {
                bx.beginPath();
                for (let y = -20; y <= H + 20; y += 9) {
                    const x = flowX(y, i);
                    y === -20 ? bx.moveTo(x, y) : bx.lineTo(x, y);
                }
                bx.strokeStyle = g;
                bx.globalAlpha = 0.05 + (1 - i / 26) * 0.06;
                bx.lineWidth = 1 + i * 0.16;
                bx.stroke();
            }

            // the spine of the current
            bx.beginPath();
            for (let y = -20; y <= H + 20; y += 6) {
                const x = flowX(y, 0);
                y === -20 ? bx.moveTo(x, y) : bx.lineTo(x, y);
            }
            bx.strokeStyle = g;
            bx.globalAlpha = 0.85;
            bx.lineWidth = 1.8;
            bx.stroke();

            bx.globalCompositeOperation = 'source-over';
            bx.globalAlpha = 1;
        };

        const spawn = () => {
            const seam = SEAMS[(Math.random() * SEAMS.length) | 0];
            const y = seam * H + (Math.random() - 0.5) * 24;
            drops.push({
                x: flowX(y, 0),
                y,
                born: y,
                vx: -(0.16 + Math.random() * 0.3),
                vy: 0.1 + Math.random() * 0.16,
                r: 1.7 + Math.random() * 2.8,
                a: 0,
                val: 300 + Math.random() * 1800,
                counted: false,
            });
        };

        const escaping = () => {
            fx.clearRect(0, 0, W, H);
            fx.globalCompositeOperation = 'multiply';

            drops.forEach((d) => {
                d.vy += 0.012;
                d.x += d.vx;
                d.y += d.vy;
                if (d.a < 1) d.a += 0.045;
                if (d.y > H * 0.82) d.a -= 0.013;

                if (!d.counted && d.y > d.born + 46) {
                    lost += d.val;
                    d.counted = true;
                    if (meter) {
                        meter.textContent = '$' + Math.round(lost).toLocaleString('en-US');
                    }
                }

                const a = Math.max(0, Math.min(1, d.a));
                // Ink soaks outward as it falls. That spreading is what makes it
                // read as pigment rather than as a particle.
                const spread = d.r * (2.6 + Math.max(0, d.y - d.born) * 0.015);
                const grd = fx.createRadialGradient(d.x, d.y, 0, d.x, d.y, spread);
                grd.addColorStop(0, 'rgba(' + BLUE + ',' + a * 0.5 + ')');
                grd.addColorStop(0.45, 'rgba(' + TEAL + ',' + a * 0.26 + ')');
                grd.addColorStop(1, 'rgba(' + TEAL + ',0)');
                fx.fillStyle = grd;
                fx.beginPath();
                fx.arc(d.x, d.y, spread, 0, Math.PI * 2);
                fx.fill();
            });

            fx.globalCompositeOperation = 'source-over';
            drops = drops.filter((d) => d.a > 0 && d.y < H + 40 && d.x > -40);
        };

        const step = (now) => {
            if (!running) return;
            t += 0.006;
            mx += (targetMx - mx) * 0.045;
            current();
            if (now - lastSpawn > 250) {
                lastSpawn = now;
                spawn();
            }
            escaping();
            raf = requestAnimationFrame(step);
        };

        // A single still frame for reduced-motion readers
        const still = () => {
            current();
            for (let i = 0; i < 7; i++) spawn();
            drops.forEach((d, i) => {
                d.y = d.born + 30 + i * 26;
                d.x -= i * 3;
                d.a = 1 - i * 0.11;
            });
            escaping();
            if (meter) meter.textContent = '$34,800';
        };

        size();

        window.addEventListener('mousemove', (e) => {
            targetMx = e.clientX / window.innerWidth;
        }, { passive: true });

        if (reduceMotion) {
            still();
        } else {
            for (let i = 0; i < 7; i++) spawn();
            // Only burn frames while the hero is actually on screen
            const vis = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !running) {
                            running = true;
                            lastSpawn = performance.now();
                            raf = requestAnimationFrame(step);
                        } else if (!entry.isIntersecting && running) {
                            running = false;
                            cancelAnimationFrame(raf);
                        }
                    });
                },
                { threshold: 0.02 }
            );
            vis.observe(back);
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                size();
                drops = [];
                if (reduceMotion) still();
            }, 150);
        });
    }

    /* ---------------------------------------------------------------------
       The Q2C rail. The two pigments run as a gradient across the six stages
       as the band moves through the viewport — the one place on the site the
       gradient is a diagram rather than decoration.
       ------------------------------------------------------------------ */
    const flow = document.getElementById('flow');
    const rail = document.getElementById('flowRail');

    if (flow && rail && !reduceMotion) {
        let ticking = false;

        const update = () => {
            ticking = false;
            const rect = flow.getBoundingClientRect();
            const vh = window.innerHeight;

            // 0 when the band's top reaches 85% of the viewport,
            // 1 by the time its bottom passes 55%.
            const start = vh * 0.85;
            const end = vh * 0.55;
            const total = rect.height + (start - end);
            const progress = Math.min(1, Math.max(0, (start - rect.top) / total));

            rail.style.width = (progress * 100).toFixed(2) + '%';
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
    } else if (rail) {
        rail.style.width = '100%';
    }

    /* ---------------------------------------------------------------------
       Contact form (Web3Forms — no backend needed on a static host)
       ------------------------------------------------------------------ */
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');

    if (form && status) {
        const ACCESS_KEY = 'da35283a-91fc-4b36-9b24-c288e6a57d12';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!form.checkValidity()) {
                status.dataset.state = 'err';
                status.textContent = 'Please add your name and a valid work email.';
                form.reportValidity();
                return;
            }

            const button = form.querySelector('button[type="submit"]');
            const original = button.innerHTML;
            button.disabled = true;
            button.textContent = 'Sending…';
            status.dataset.state = '';
            status.textContent = '';

            try {
                const data = new FormData(form);
                data.append('access_key', ACCESS_KEY);
                data.append('subject', 'New systems-review request — jinix.co.in');
                data.append('from_name', 'JINIX Solutions website');

                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: data,
                });
                const json = await res.json();
                if (!json.success) throw new Error(json.message || 'Submission failed');

                form.reset();
                status.dataset.state = 'ok';
                status.textContent = 'Received. We reply within one business day.';
            } catch (err) {
                status.dataset.state = 'err';
                status.textContent =
                    'Something went wrong. Please email solutions@jinix.co.in directly.';
            } finally {
                button.disabled = false;
                button.innerHTML = original;
            }
        });
    }
})();
