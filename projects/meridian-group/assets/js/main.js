/*
	Meridian Group — main.js
	Vanilla JS + Three.js (self-hosted, no external CDN dependency)
*/

(function () {
	'use strict';

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var hasThree = typeof THREE !== 'undefined';

	/* ---------- Text scramble ---------- */
	function TextScramble(el) {
		this.el = el;
		this.chars = '!<>-_\\/[]{}—=+*^?#';
		this.frame = 0;
		this.queue = [];
		this.frameRequest = null;
		this.resolve = function () {};
	}
	TextScramble.prototype.setText = function (newText) {
		var oldText = this.el.textContent;
		var length = Math.max(oldText.length, newText.length);
		var self = this;
		var promise = new Promise(function (resolve) { self.resolve = resolve; });
		this.queue = [];
		for (var i = 0; i < length; i++) {
			var from = oldText[i] || '';
			var to = newText[i] || '';
			var start = Math.floor(Math.random() * 20);
			var end = start + Math.floor(Math.random() * 20);
			this.queue.push({ from: from, to: to, start: start, end: end });
		}
		cancelAnimationFrame(this.frameRequest);
		this.frame = 0;
		this.update();
		return promise;
	};
	TextScramble.prototype.update = function () {
		var output = '';
		var complete = 0;
		for (var i = 0, n = this.queue.length; i < n; i++) {
			var q = this.queue[i];
			if (this.frame >= q.end) {
				complete++;
				output += q.to;
			} else if (this.frame >= q.start) {
				if (!q.charVal || Math.random() < 0.3) {
					q.charVal = this.chars[Math.floor(Math.random() * this.chars.length)];
				}
				output += '<span class="scramble-char">' + q.charVal + '</span>';
			} else {
				output += q.from;
			}
		}
		this.el.innerHTML = output;
		if (complete === this.queue.length) {
			this.resolve();
		} else {
			this.frameRequest = requestAnimationFrame(this.update.bind(this));
			this.frame++;
		}
	};

	function scrambleInto(el, text) {
		if (reduceMotion) { el.textContent = text; return; }
		if (!el._scrambler) el._scrambler = new TextScramble(el);
		el._scrambler.setText(text);
	}

	/* ---------- Mission headline: scramble in once, on view ---------- */
	var missionHeadline = document.getElementById('mission-headline');
	if (missionHeadline) {
		var missionText = missionHeadline.getAttribute('data-text');
		if ('IntersectionObserver' in window) {
			var missionObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						scrambleInto(missionHeadline, missionText);
						missionObserver.unobserve(entry.target);
					}
				});
			}, { threshold: 0.5 });
			missionObserver.observe(missionHeadline);
		} else {
			missionHeadline.textContent = missionText;
		}
	}

	/* ---------- Scroll progress ---------- */
	var progressFill = document.querySelector('#scroll-progress .fill');
	function updateProgress() {
		var doc = document.documentElement;
		var scrollable = doc.scrollHeight - doc.clientHeight;
		var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
		if (progressFill) progressFill.style.height = pct + '%';
	}
	document.addEventListener('scroll', updateProgress, { passive: true });
	updateProgress();

	/* ---------- Nav overlay (mobile) ---------- */
	var body = document.body;
	var menuToggle = document.querySelector('.menu-toggle');
	var navClose = document.querySelector('.nav-close');
	var navOverlay = document.getElementById('nav-overlay');
	if (menuToggle) menuToggle.addEventListener('click', function () { body.classList.add('nav-open'); });
	if (navClose) navClose.addEventListener('click', function () { body.classList.remove('nav-open'); });
	if (navOverlay) {
		navOverlay.querySelectorAll('a').forEach(function (a) {
			a.addEventListener('click', function () { body.classList.remove('nav-open'); });
		});
	}

	/* ---------- Tab nav scroll spy (Group tab only — division tabs track the active division instead) ---------- */
	var groupTab = document.querySelectorAll('a[href="#hero"]');
	var heroEl = document.getElementById('hero');
	if ('IntersectionObserver' in window && heroEl && groupTab.length) {
		var spyObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) groupTab.forEach(function (l) { l.classList.add('is-active'); });
				else groupTab.forEach(function (l) { l.classList.remove('is-active'); });
			});
		}, { threshold: 0.5 });
		spyObserver.observe(heroEl);
	}

	/* Division tabs in the header: reflect + drive the active division */
	var divisionTabLinks = document.querySelectorAll('#tab-nav a[data-division], #nav-overlay a[data-division]');
	function setActiveDivisionTab(i) {
		divisionTabLinks.forEach(function (l) {
			l.classList.toggle('is-active', parseInt(l.getAttribute('data-division'), 10) === i);
		});
	}
	divisionTabLinks.forEach(function (l) {
		l.addEventListener('click', function () {
			setActiveDivision(parseInt(l.getAttribute('data-division'), 10));
		});
	});

	/* ---------- To top ---------- */
	var toTop = document.getElementById('to-top');
	if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

	/* ---------- Divisions data ---------- */
	var divisions = [
		{
			name: 'Trading',
			tag: 'Global Markets',
			desc: 'Commodities trading built on global reach, deep liquidity and real-time execution.',
			scene: 'wave'
		},
		{
			name: 'Capital',
			tag: 'Strategic Finance',
			desc: 'Strategic capital deployment across emerging and established markets.',
			scene: 'network'
		},
		{
			name: 'Maritime',
			tag: 'Marine Logistics',
			desc: 'Marine fuel bunkering and logistics engineered for reliability at scale.',
			scene: 'pipeline'
		},
		{
			name: 'Energy',
			tag: 'Power & Utilities',
			desc: 'Diversified, future-ready energy solutions powering industry worldwide.',
			scene: 'rings'
		}
	];

	var divisionListEl = document.getElementById('division-list');
	var divisionTagEl = document.getElementById('division-tag');
	var divisionTitleEl = document.getElementById('division-title');
	var divisionDescEl = document.getElementById('division-desc');
	var activeDivision = 0;

	if (divisionListEl) {
		divisions.forEach(function (d, i) {
			var li = document.createElement('li');
			var btn = document.createElement('button');
			btn.className = i === 0 ? 'is-active' : '';
			btn.innerHTML = '<span class="idx">0' + (i + 1) + '</span><span>' + d.name + '</span>';
			btn.addEventListener('click', function () { setActiveDivision(i); });
			li.appendChild(btn);
			divisionListEl.appendChild(li);
		});
	}

	function setActiveDivision(i) {
		if (i === activeDivision) return;
		activeDivision = i;
		var d = divisions[i];
		if (divisionListEl) {
			divisionListEl.querySelectorAll('button').forEach(function (b, idx) {
				b.classList.toggle('is-active', idx === i);
			});
		}
		if (divisionTagEl) divisionTagEl.textContent = d.tag;
		if (divisionTitleEl) scrambleInto(divisionTitleEl, d.name);
		if (divisionDescEl) divisionDescEl.textContent = d.desc;
		if (hasThree && window.__setDivisionScene) window.__setDivisionScene(d.scene);
		setActiveDivisionTab(i);
	}

	if (divisionTagEl) divisionTagEl.textContent = divisions[0].tag;
	if (divisionTitleEl) divisionTitleEl.textContent = divisions[0].name;
	if (divisionDescEl) divisionDescEl.textContent = divisions[0].desc;
	setActiveDivisionTab(0);

	var autoAdvanceTimer = null;
	function startAutoAdvance() {
		stopAutoAdvance();
		if (reduceMotion) return;
		autoAdvanceTimer = setInterval(function () {
			setActiveDivision((activeDivision + 1) % divisions.length);
		}, 5000);
	}
	function stopAutoAdvance() { if (autoAdvanceTimer) clearInterval(autoAdvanceTimer); }

	var divisionsSection = document.getElementById('divisions');
	if (divisionsSection && 'IntersectionObserver' in window) {
		var autoObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) startAutoAdvance(); else stopAutoAdvance();
			});
		}, { threshold: 0.4 });
		autoObserver.observe(divisionsSection);
	}
	if (divisionListEl) {
		divisionListEl.addEventListener('mouseenter', stopAutoAdvance);
		divisionListEl.addEventListener('mouseleave', startAutoAdvance);
	}

	/* ---------- Three.js scenes ---------- */
	if (!hasThree || reduceMotion) return;

	function makeRenderer(canvas) {
		var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		return renderer;
	}

	/* Hero: ambient drifting wireframe icosahedron field */
	(function heroScene() {
		var canvas = document.getElementById('hero-canvas');
		if (!canvas) return;
		var hero = document.getElementById('hero');
		var renderer = makeRenderer(canvas);
		var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
		camera.position.z = 18;

		var group = new THREE.Group();
		scene.add(group);
		var geo = new THREE.IcosahedronGeometry(1, 0);
		var mat = new THREE.MeshBasicMaterial({ color: 0x49b8ff, wireframe: true, transparent: true, opacity: 0.35 });
		for (var i = 0; i < 22; i++) {
			var mesh = new THREE.Mesh(geo, mat);
			var scale = 0.4 + Math.random() * 1.6;
			mesh.scale.setScalar(scale);
			mesh.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 18);
			mesh.userData.speed = 0.05 + Math.random() * 0.15;
			group.add(mesh);
		}

		var particleCount = 400;
		var positions = new Float32Array(particleCount * 3);
		for (var p = 0; p < particleCount; p++) {
			positions[p * 3] = (Math.random() - 0.5) * 40;
			positions[p * 3 + 1] = (Math.random() - 0.5) * 24;
			positions[p * 3 + 2] = (Math.random() - 0.5) * 24;
		}
		var pGeo = new THREE.BufferGeometry();
		pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		var pMat = new THREE.PointsMaterial({ color: 0xf2f4f7, size: 0.05, transparent: true, opacity: 0.5 });
		var points = new THREE.Points(pGeo, pMat);
		scene.add(points);

		function resize() {
			var w = hero.clientWidth, h = hero.clientHeight;
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
		}
		resize();
		window.addEventListener('resize', resize);

		var clock = new THREE.Clock();
		var visible = true;
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
			}).observe(hero);
		}

		function animate() {
			requestAnimationFrame(animate);
			if (!visible || document.hidden) return;
			var t = clock.getElapsedTime();
			group.children.forEach(function (m) {
				m.rotation.x += m.userData.speed * 0.01;
				m.rotation.y += m.userData.speed * 0.015;
			});
			points.rotation.y = t * 0.015;
			camera.position.x = Math.sin(t * 0.05) * 2;
			renderer.render(scene, camera);
		}
		animate();
	})();

	/* Divisions: swappable scene presets */
	(function divisionScene() {
		var canvas = document.getElementById('division-canvas');
		if (!canvas) return;
		var stage = document.querySelector('.division-stage');
		var renderer = makeRenderer(canvas);
		var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
		camera.position.z = 9;

		var presets = {};
		var currentGroup = null;

		function buildWave() {
			var g = new THREE.Group();
			var count = 40 * 24;
			var geo = new THREE.BufferGeometry();
			var pos = new Float32Array(count * 3);
			var idx = 0;
			for (var x = 0; x < 40; x++) {
				for (var y = 0; y < 24; y++) {
					pos[idx++] = (x - 20) * 0.4;
					pos[idx++] = (y - 12) * 0.4;
					pos[idx++] = 0;
				}
			}
			geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
			var mat = new THREE.PointsMaterial({ color: 0x49b8ff, size: 0.045 });
			var mesh = new THREE.Points(geo, mat);
			g.add(mesh);
			g.userData.animate = function (t) {
				var arr = geo.attributes.position.array;
				var i3 = 0;
				for (var x2 = 0; x2 < 40; x2++) {
					for (var y2 = 0; y2 < 24; y2++) {
						var wave = Math.sin(x2 * 0.3 + t) * 0.4 + Math.cos(y2 * 0.3 + t * 0.8) * 0.4;
						arr[i3 + 2] = wave;
						i3 += 3;
					}
				}
				geo.attributes.position.needsUpdate = true;
				g.rotation.y = Math.sin(t * 0.15) * 0.25;
			};
			return g;
		}

		function buildNetwork() {
			var g = new THREE.Group();
			var geo = new THREE.IcosahedronGeometry(2.6, 1);
			var mat = new THREE.MeshBasicMaterial({ color: 0x49b8ff, wireframe: true });
			var mesh = new THREE.Mesh(geo, mat);
			g.add(mesh);
			var dotGeo = new THREE.SphereGeometry(0.045, 6, 6);
			var dotMat = new THREE.MeshBasicMaterial({ color: 0xf2f4f7 });
			var posAttr = geo.attributes.position;
			for (var i = 0; i < posAttr.count; i += 3) {
				var dot = new THREE.Mesh(dotGeo, dotMat);
				dot.position.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
				g.add(dot);
			}
			g.userData.animate = function (t) {
				g.rotation.y = t * 0.15;
				g.rotation.x = Math.sin(t * 0.1) * 0.2;
			};
			return g;
		}

		function buildPipeline() {
			var g = new THREE.Group();
			var points = [
				new THREE.Vector3(-4, 1.5, 0),
				new THREE.Vector3(-1.5, -1, 1),
				new THREE.Vector3(1, 1.2, -1),
				new THREE.Vector3(4, -1.2, 0)
			];
			var curve = new THREE.CatmullRomCurve3(points);
			var geo = new THREE.TubeGeometry(curve, 64, 0.5, 12, false);
			var mat = new THREE.MeshBasicMaterial({ color: 0x49b8ff, wireframe: true });
			var mesh = new THREE.Mesh(geo, mat);
			g.add(mesh);
			g.userData.animate = function (t) {
				g.rotation.y = Math.sin(t * 0.2) * 0.3;
				g.rotation.x = Math.cos(t * 0.15) * 0.15;
			};
			return g;
		}

		function buildRings() {
			var g = new THREE.Group();
			for (var i = 0; i < 4; i++) {
				var geo = new THREE.TorusGeometry(1.4 + i * 0.55, 0.02, 8, 64);
				var mat = new THREE.MeshBasicMaterial({ color: 0x49b8ff, transparent: true, opacity: 0.9 - i * 0.15 });
				var mesh = new THREE.Mesh(geo, mat);
				mesh.userData.offset = i;
				g.add(mesh);
			}
			g.userData.animate = function (t) {
				g.children.forEach(function (mesh, i) {
					mesh.rotation.x = t * (0.2 + i * 0.05);
					mesh.rotation.y = t * (0.15 + i * 0.04);
				});
			};
			return g;
		}

		presets.wave = buildWave;
		presets.network = buildNetwork;
		presets.pipeline = buildPipeline;
		presets.rings = buildRings;

		function setScene(name) {
			if (currentGroup) scene.remove(currentGroup);
			currentGroup = presets[name]();
			scene.add(currentGroup);
		}
		window.__setDivisionScene = setScene;
		setScene(divisions[0].scene);

		function resize() {
			var w = stage.clientWidth, h = stage.clientHeight;
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
		}
		resize();
		window.addEventListener('resize', resize);

		var clock = new THREE.Clock();
		var visible = true;
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
			}).observe(stage);
		}

		function animate() {
			requestAnimationFrame(animate);
			if (!visible || document.hidden) return;
			var t = clock.getElapsedTime();
			if (currentGroup && currentGroup.userData.animate) currentGroup.userData.animate(t);
			renderer.render(scene, camera);
		}
		animate();
	})();
})();
