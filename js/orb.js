/* ============================================
   3D Crystalline Star — Hero Background
   Gold-only palette, mouse-follow rotation,
   speed-sensitive interaction
   ============================================ */

(function() {
  const canvas = document.getElementById('orb');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Size to fill hero section
  function sizeCanvas() {
    const hero = canvas.parentElement;
    const size = Math.max(600, Math.min(hero.offsetWidth, hero.offsetHeight) * 0.95);
    canvas.width = size;
    canvas.height = size;
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  // Stellated icosahedron geometry
  function makeStarGeometry() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const r = 0.55;
    const iv = [
      [-1, phi, 0], [1, phi, 0], [-1,-phi,0], [1,-phi,0],
      [0,-1,phi], [0,1,phi], [0,-1,-phi],[0,1,-phi],
      [phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]
    ].map(v => {
      const len = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
      return [v[0]/len*r, v[1]/len*r, v[2]/len*r];
    });

    const R = 1.0;
    const tips = iv.map(v => {
      const len = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
      return [v[0]/len*R, v[1]/len*R, v[2]/len*R];
    });

    const icoFaces = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];

    return { iv, tips, icoFaces };
  }

  const { iv, tips, icoFaces } = makeStarGeometry();

  let rotX = 0.28, rotY = 0.0;
  let targetRotX = 0.28, targetRotY = 0.0;
  let autoRotY = 0;
  let mouseOver = false;
  let mouseSpeed = 0;
  let lastMouseX = 0, lastMouseY = 0, lastMouseTime = 0;
  let pulse = 0;
  let frame = 0;

  function rotatePoint(p, rx, ry) {
    let [x, y, z] = p;
    let nx = x * Math.cos(ry) + z * Math.sin(ry);
    let nz = -x * Math.sin(ry) + z * Math.cos(ry);
    x = nx; z = nz;
    let ny = y * Math.cos(rx) - z * Math.sin(rx);
    nz = y * Math.sin(rx) + z * Math.cos(rx);
    return [x, ny, nz];
  }

  function project(p, fov) {
    const W = canvas.width, H = canvas.height;
    const CX = W / 2, CY = H / 2;
    const [x, y, z] = p;
    const d = fov / (fov + z + 1.5);
    const scale = W * 0.42;
    return [CX + x * scale * d, CY + y * scale * d, z, d];
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    const CX = W / 2, CY = H / 2;
    ctx.clearRect(0, 0, W, H);
    frame++;
    pulse = Math.sin(frame * 0.02) * 0.5 + 0.5;

    // Smooth rotation follow
    if (mouseOver) {
      rotX += (targetRotX - rotX) * 0.04;
      rotY += (targetRotY - rotY) * 0.04;
    } else {
      // Gentle auto-rotation with figure-8 drift
      autoRotY += 0.002;
      rotY += (autoRotY - rotY) * 0.02;
      const driftX = Math.sin(frame * 0.006) * 0.35;
      rotX += (driftX - rotX) * 0.02;
    }

    // Speed-based rotation boost
    const speedMult = 1 + mouseSpeed * 0.3;

    const fov = 3.2;

    const pi = iv.map(v => project(rotatePoint(v, rotX, rotY), fov));
    const pt = tips.map(v => project(rotatePoint(v, rotX, rotY), fov));

    // Ambient glow — warm gold
    const glowR = W * 0.42 + pulse * 20;
    const grd = ctx.createRadialGradient(CX, CY, W * 0.05, CX, CY, glowR);
    grd.addColorStop(0, 'rgba(224,160,16,0.10)');
    grd.addColorStop(0.5, 'rgba(200,150,30,0.06)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Collect faces for painter's algorithm
    const drawFaces = [];
    icoFaces.forEach((f) => {
      const [a, b, c] = f;
      const pa = pi[a], pb = pi[b], pc = pi[c];

      const ax = pb[0]-pa[0], ay = pb[1]-pa[1], az = pb[2]-pa[2];
      const bx = pc[0]-pa[0], by = pc[1]-pa[1], bz = pc[2]-pa[2];
      const nx = ay*bz - az*by;
      const ny = az*bx - ax*bz;
      const nz = ax*by - ay*bx;
      const nlen = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1;
      const light = [0.4, -0.7, 0.7];
      const dot = Math.max(0, (nx/nlen)*light[0] + (ny/nlen)*light[1] + (nz/nlen)*light[2]);

      [[a,b],[b,c],[c,a]].forEach(([i,j]) => {
        drawFaces.push({
          verts: [pi[i], pi[j], pt[i]],
          z: (pi[i][2] + pi[j][2] + pt[i][2]) / 3,
          dot, type: 'spike', tipIdx: i
        });
      });

      drawFaces.push({
        verts: [pa, pb, pc],
        z: (pa[2] + pb[2] + pc[2]) / 3,
        dot, type: 'inner'
      });
    });

    drawFaces.sort((a, b) => a.z - b.z);

    // Draw — all gold palette, no purple
    drawFaces.forEach(face => {
      const [v0, v1, v2] = face.verts;
      ctx.beginPath();
      ctx.moveTo(v0[0], v0[1]);
      ctx.lineTo(v1[0], v1[1]);
      ctx.lineTo(v2[0], v2[1]);
      ctx.closePath();

      const pulsed = 0.85 + pulse * 0.15;

      if (face.type === 'inner') {
        // Inner faces — dark warm amber
        const alpha = (0.12 + face.dot * 0.18) * pulsed;
        ctx.fillStyle = `rgba(184,131,13,${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(224,160,16,${0.15 + face.dot * 0.2})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else {
        // Spike faces — warm gold variations
        const isLight = face.tipIdx % 3 === 0;
        const isMid = face.tipIdx % 3 === 1;
        let r, g, b2;
        if (isLight) {
          r = 245; g = 208; b2 = 96;  // bright gold
        } else if (isMid) {
          r = 224; g = 160; b2 = 16;  // brand gold
        } else {
          r = 200; g = 140; b2 = 20;  // deep gold
        }
        const alpha = (0.22 + face.dot * 0.45) * pulsed;
        ctx.fillStyle = `rgba(${r},${g},${b2},${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(224,180,60,${(0.18 + face.dot * 0.32) * pulsed})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    });

    // Core light — warm white/gold
    const coreR = W * 0.04 + pulse * W * 0.015;
    const coreGrd = ctx.createRadialGradient(CX - W*0.02, CY - W*0.02, 2, CX, CY, coreR);
    coreGrd.addColorStop(0, 'rgba(255,252,235,0.95)');
    coreGrd.addColorStop(0.4, 'rgba(255,240,200,0.5)');
    coreGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, coreR, 0, Math.PI * 2);
    ctx.fillStyle = coreGrd;
    ctx.fill();

    // Specular highlight
    const specR = W * 0.015 + pulse * 3;
    const specGrd = ctx.createRadialGradient(CX - W*0.07, CY - W*0.07, 1, CX - W*0.06, CY - W*0.06, specR + W*0.02);
    specGrd.addColorStop(0, 'rgba(255,255,255,0.8)');
    specGrd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(CX - W*0.06, CY - W*0.06, specR + W*0.02, 0, Math.PI * 2);
    ctx.fillStyle = specGrd;
    ctx.fill();

    // Decay mouse speed
    mouseSpeed *= 0.95;
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  // Mouse-follow: orb rotates toward mouse position
  const hero = canvas.parentElement;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;   // 0 to 1
    const my = (e.clientY - rect.top) / rect.height;    // 0 to 1

    // Map mouse position to rotation (-1 to 1 range)
    targetRotY = (mx - 0.5) * 3.0;
    targetRotX = (my - 0.5) * 1.5;

    // Calculate speed
    const now = performance.now();
    const dt = now - lastMouseTime;
    if (dt > 0) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      mouseSpeed = Math.min(dist / dt * 8, 5); // capped
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastMouseTime = now;
  });

  hero.addEventListener('mouseenter', () => {
    mouseOver = true;
  });

  hero.addEventListener('mouseleave', () => {
    mouseOver = false;
    mouseSpeed = 0;
    autoRotY = rotY; // continue from current position
  });

  // Touch support
  hero.addEventListener('touchmove', e => {
    const rect = hero.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) / rect.width;
    const my = (touch.clientY - rect.top) / rect.height;
    targetRotY = (mx - 0.5) * 3.0;
    targetRotX = (my - 0.5) * 1.5;
    mouseOver = true;

    const now = performance.now();
    const dt = now - lastMouseTime;
    if (dt > 0) {
      const dx = touch.clientX - lastMouseX;
      const dy = touch.clientY - lastMouseY;
      mouseSpeed = Math.min(Math.sqrt(dx*dx + dy*dy) / dt * 8, 5);
    }
    lastMouseX = touch.clientX;
    lastMouseY = touch.clientY;
    lastMouseTime = now;
  }, {passive: true});

  hero.addEventListener('touchend', () => {
    mouseOver = false;
    mouseSpeed = 0;
    autoRotY = rotY;
  });
})();
