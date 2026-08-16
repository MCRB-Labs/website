/* Homepage-only: a fixed Three.js scene behind the scrolling copy, with a
 * GSAP ScrollTrigger timeline driving the camera/group through it. Text
 * fade-ins and the 3D scene are independent of each other on purpose — if
 * the Three.js CDN import fails for any reason, the page still reads fine
 * (dark background, fully visible copy, no console-breaking crash).
 */
(async function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsapReady = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (gsapReady) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.utils.toArray('.panel-copy').forEach(function (el) {
      window.gsap.fromTo(
        el,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: reduceMotion ? 0.01 : 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 45%', toggleActions: 'play none none reverse' }
        }
      );
    });
  }

  var canvas = document.getElementById('webgl-bg');
  if (!canvas) return;

  var THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (err) {
    return; // No 3D background — the rest of the page still works.
  }

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0b08, 6, 19);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0b0b08, 1);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(4, 6, 5);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xb9f23d, 0.3);
  fill.position.set(-5, -3, -2);
  scene.add(fill);

  // the brand mark, extruded into a small 3D constellation instead of a flat grid
  var group = new THREE.Group();
  var blocks = [
    { pos: [-1.5, 1.1, -0.6], size: 0.8, color: 0xe7ffa8 },
    { pos: [1.6, 1.0, -0.9], size: 0.8, color: 0xb9f23d },
    { pos: [-1.5, -1.1, -1], size: 0.8, color: 0x7fa31c },
    { pos: [1.5, -1.0, -0.7], size: 0.8, color: 0x3c4d0c },
    { pos: [0, 0.1, 0.4], size: 0.4, color: 0xb9f23d },
    { pos: [-2.7, 0, -1.8], size: 0.5, color: 0x7fa31c },
    { pos: [2.7, 0.2, -2], size: 0.5, color: 0x3c4d0c }
  ];
  blocks.forEach(function (b, i) {
    var geo = new THREE.BoxGeometry(b.size, b.size, b.size);
    var mat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.55, metalness: 0.12 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
    mesh.userData.spin = 0.0016 + i * 0.00018;
    group.add(mesh);
  });
  scene.add(group);

  // ambient particle field
  var particleCount = 380;
  var positions = new Float32Array(particleCount * 3);
  for (var i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 22;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
  }
  var particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var particleMat = new THREE.PointsMaterial({ color: 0xb9f23d, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false });
  var particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  function render() {
    requestAnimationFrame(render);
    if (!reduceMotion) {
      group.children.forEach(function (mesh) {
        mesh.rotation.x += mesh.userData.spin;
        mesh.rotation.y += mesh.userData.spin * 1.4;
      });
      particles.rotation.y += 0.0003;
    }
    renderer.render(scene, camera);
  }
  render();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  if (gsapReady && !reduceMotion) {
    var scrollRoot = document.getElementById('scroll-content');
    if (scrollRoot) {
      var tl = window.gsap.timeline({
        scrollTrigger: { trigger: scrollRoot, start: 'top top', end: 'bottom bottom', scrub: 1 }
      });
      tl.to(camera.position, { x: -1.4, y: 0.3, z: 9.5, duration: 1 }, 0)
        .to(group.rotation, { y: Math.PI * 0.55, duration: 1 }, 0)
        .to(camera.position, { x: 1.6, y: -0.2, z: 10, duration: 1 }, 1)
        .to(group.rotation, { y: Math.PI * 1.1, duration: 1 }, 1)
        .to(group.position, { x: -0.6, duration: 1 }, 1)
        .to(camera.position, { x: 0, y: 0.5, z: 8, duration: 1 }, 2)
        .to(group.rotation, { y: Math.PI * 1.7, duration: 1 }, 2)
        .to(group.position, { x: 0, duration: 1 }, 2)
        .to(camera.position, { x: 0, y: 0, z: 14, duration: 1 }, 3)
        .to(group.rotation, { y: Math.PI * 2.3, duration: 1 }, 3)
        .to(group.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 1 }, 3);
    }
  }
})();
