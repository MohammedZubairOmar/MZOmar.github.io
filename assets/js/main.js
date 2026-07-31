/*
	Mohammed Zubair Omar — Portfolio
	Vanilla JS: nav overlay, scroll-reveal, chapter indicator, particle background
*/

(function(){
	'use strict';

	document.documentElement.classList.add('js');

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* Nav overlay toggle */
	var body = document.body;
	var menuToggle = document.querySelector('.menu-toggle');
	var navClose = document.querySelector('.nav-close');
	var navOverlay = document.getElementById('nav-overlay');

	function openNav(){ body.classList.add('nav-open'); }
	function closeNav(){ body.classList.remove('nav-open'); }

	if (menuToggle) menuToggle.addEventListener('click', openNav);
	if (navClose) navClose.addEventListener('click', closeNav);
	if (navOverlay){
		navOverlay.querySelectorAll('a').forEach(function(a){
			a.addEventListener('click', closeNav);
		});
	}
	document.addEventListener('keydown', function(e){
		if (e.key === 'Escape') closeNav();
	});

	/* Scroll reveal */
	var revealEls = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window && revealEls.length){
		var revealObserver = new IntersectionObserver(function(entries){
			entries.forEach(function(entry){
				if (entry.isIntersecting){
					entry.target.classList.add('is-visible');
					revealObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
		revealEls.forEach(function(el){ revealObserver.observe(el); });
	} else {
		revealEls.forEach(function(el){ el.classList.add('is-visible'); });
	}

	/* Chapter indicator */
	var chapters = document.querySelectorAll('.chapter[data-chapter]');
	var indexLabel = document.querySelector('#chapter-index .label');
	if ('IntersectionObserver' in window && chapters.length && indexLabel){
		var chapterObserver = new IntersectionObserver(function(entries){
			entries.forEach(function(entry){
				if (entry.isIntersecting){
					indexLabel.textContent = entry.target.getAttribute('data-chapter');
				}
			});
		}, { threshold: 0.5 });
		chapters.forEach(function(ch){ chapterObserver.observe(ch); });
	}

	/* Particle network background */
	var canvas = document.getElementById('bg-canvas');
	if (!canvas || reduceMotion) return;

	var ctx = canvas.getContext('2d');
	var particles = [];
	var width, height, dpr;

	function resize(){
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width * dpr;
		canvas.height = height * dpr;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		initParticles();
	}

	function initParticles(){
		var count = Math.round((width * height) / 24000);
		count = Math.max(24, Math.min(count, 90));
		particles = [];
		for (var i = 0; i < count; i++){
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * 0.18,
				vy: (Math.random() - 0.5) * 0.18,
				r: Math.random() * 1.4 + 0.6
			});
		}
	}

	var linkDist = 150;

	function step(){
		ctx.clearRect(0, 0, width, height);

		for (var i = 0; i < particles.length; i++){
			var p = particles[i];
			p.x += p.vx;
			p.y += p.vy;
			if (p.x < 0 || p.x > width) p.vx *= -1;
			if (p.y < 0 || p.y > height) p.vy *= -1;
		}

		for (var a = 0; a < particles.length; a++){
			for (var b = a + 1; b < particles.length; b++){
				var dx = particles[a].x - particles[b].x;
				var dy = particles[a].y - particles[b].y;
				var dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < linkDist){
					ctx.strokeStyle = 'rgba(244,242,234,' + (0.08 * (1 - dist / linkDist)) + ')';
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(particles[a].x, particles[a].y);
					ctx.lineTo(particles[b].x, particles[b].y);
					ctx.stroke();
				}
			}
		}

		for (var j = 0; j < particles.length; j++){
			var pt = particles[j];
			ctx.beginPath();
			ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(244,242,234,0.35)';
			ctx.fill();
		}

		requestAnimationFrame(step);
	}

	window.addEventListener('resize', resize);
	resize();
	requestAnimationFrame(step);

	document.addEventListener('visibilitychange', function(){
		/* particles keep light-weight state; no pause needed but avoid work while hidden */
	});
})();
