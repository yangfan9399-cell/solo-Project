const GEAR_COLORS = {
  gear: { fill: '#78716c', stroke: '#44403c' },
  waterwheel: { fill: '#853c26', stroke: '#5c2a1a' },
  target: { fill: '#9ca3af', stroke: '#6b7280' },
  target_active: { fill: '#059669', stroke: '#047857' }
};

class WatermillGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.gearsLayer = document.getElementById('gears-layer');
    this.connectionsLayer = document.getElementById('connections-layer');
    this.sessionId = document.querySelector('meta[name="game-session-id"]')?.content;
    this.csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    this.gears = [];
    this.selectedAvailableGear = null;
    this.draggingGear = null;
    this.dragOffset = { x: 0, y: 0 };
    this.animating = false;
    this.startTime = Date.now();
    this.timerInterval = null;
    this.animationFrame = null;

    this.movesCountEl = document.getElementById('moves-count');
    this.currentRpmEl = document.getElementById('current-rpm');
    this.rpmStatusEl = document.getElementById('rpm-status');
    this.timerEl = document.getElementById('timer');
    this.undoBtn = document.getElementById('undo-btn');
    this.completeBtn = document.getElementById('complete-btn');
    this.gearHint = document.getElementById('gear-hint');

    this.targetRpm = parseFloat(window.__TARGET_RPM__ || 60);
    this.rpmTolerance = parseFloat(window.__RPM_TOLERANCE__ || 10);
    this.waterForce = parseFloat(window.__WATER_FORCE__ || 1.0);

    this.init();
  }

  init() {
    this.loadGearsFromData();
    this.setupEventListeners();
    this.renderAllGears();
    this.updateConnections();
    this.startTimer();
    this.startAnimation();
    this.refreshRpm();
  }

  loadGearsFromData() {
    try {
      const gearsData = JSON.parse(window.__INITIAL_GEARS_STATE__ || '[]');
      this.gears = gearsData.map(g => ({
        ...g,
        rotation: parseFloat(g.rotation) || 0,
        rpm: parseFloat(g.rpm) || 0
      }));
    } catch (e) {
      console.error('Failed to parse gears data', e);
      this.gears = [];
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener('mouseleave', () => this.stopDragging());

    document.querySelectorAll('.gear-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.gear-item').forEach(i =>
          i.classList.remove('border-wood-500', 'bg-wood-100'));
        item.classList.add('border-wood-500', 'bg-wood-100');
        this.selectedAvailableGear = {
          teeth: parseInt(item.dataset.teeth),
          size: parseFloat(item.dataset.size)
        };
        this.showHint('点击画布放置齿轮');
      });
    });

    if (this.undoBtn) {
      this.undoBtn.addEventListener('click', () => this.undo());
    }

    if (this.completeBtn) {
      this.completeBtn.addEventListener('click', () => this.complete());
    }
  }

  getSVGPoint(e) {
    const pt = this.canvas.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(this.canvas.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  }

  handleCanvasClick(e) {
    if (!this.selectedAvailableGear) return;
    if (this.draggingGear) return;

    const point = this.getSVGPoint(e);
    this.addGear(point.x, point.y);
    this.selectedAvailableGear = null;
    document.querySelectorAll('.gear-item').forEach(i =>
      i.classList.remove('border-wood-500', 'bg-wood-100'));
    this.hideHint();
  }

  handleMouseDown(e) {
    const point = this.getSVGPoint(e);
    const gear = this.findGearAtPoint(point.x, point.y);

    if (gear && gear.type !== 'waterwheel') {
      this.draggingGear = gear;
      this.dragOffset = {
        x: point.x - gear.x,
        y: point.y - gear.y
      };
      this.canvas.style.cursor = 'grabbing';
    }
  }

  handleMouseMove(e) {
    const point = this.getSVGPoint(e);
    const gear = this.findGearAtPoint(point.x, point.y);

    if (gear) {
      this.showHint(`${gear.teeth}齿 | ${gear.type === 'target' ? '目标齿轮' : gear.type === 'waterwheel' ? '水轮' : '齿轮'}${gear.rpm ? ` | ${gear.rpm.toFixed(1)} RPM` : ''}`, e);
      if (gear.type === 'waterwheel') {
        this.canvas.style.cursor = 'not-allowed';
      } else {
        this.canvas.style.cursor = 'grab';
      }
    } else if (this.selectedAvailableGear) {
      this.showHint('点击放置齿轮', e);
      this.canvas.style.cursor = 'copy';
    } else {
      this.hideHint();
      this.canvas.style.cursor = 'grab';
    }

    if (this.draggingGear) {
      this.draggingGear.x = point.x - this.dragOffset.x;
      this.draggingGear.y = point.y - this.dragOffset.y;
      this.draggingGear.x = Math.max(this.draggingGear.size, Math.min(800 - this.draggingGear.size, this.draggingGear.x));
      this.draggingGear.y = Math.max(this.draggingGear.size, Math.min(500 - this.draggingGear.size, this.draggingGear.y));
      this.renderAllGears();
      this.updateConnections();
    }
  }

  handleMouseUp(e) {
    if (this.draggingGear) {
      const gearId = this.draggingGear.id;
      const newX = this.draggingGear.x;
      const newY = this.draggingGear.y;
      this.stopDragging();
      this.sendMoveGear(gearId, newX, newY);
    }
  }

  handleDoubleClick(e) {
    const point = this.getSVGPoint(e);
    const gear = this.findGearAtPoint(point.x, point.y);

    if (gear && gear.type === 'gear') {
      this.removeGear(gear.id);
    }
  }

  stopDragging() {
    this.draggingGear = null;
    this.canvas.style.cursor = 'grab';
  }

  findGearAtPoint(x, y) {
    for (let i = this.gears.length - 1; i >= 0; i--) {
      const gear = this.gears[i];
      const dist = Math.sqrt((x - gear.x) ** 2 + (y - gear.y) ** 2);
      if (dist <= gear.size) {
        return gear;
      }
    }
    return null;
  }

  showHint(text, e = null) {
    if (!this.gearHint) return;
    this.gearHint.textContent = text;
    this.gearHint.classList.remove('hidden');
    if (e) {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.gearHint.style.left = (e.clientX - rect.left + 15) + 'px';
      this.gearHint.style.top = (e.clientY - rect.top + 15) + 'px';
    }
  }

  hideHint() {
    if (this.gearHint) {
      this.gearHint.classList.add('hidden');
    }
  }

  createGearSVG(gear) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${gear.x}, ${gear.y})`);
    g.setAttribute('data-gear-id', gear.id);
    g.classList.add('gear-group');

    let content = '';
    if (gear.type === 'waterwheel') {
      content = this.createWaterwheelContent(gear);
    } else if (gear.type === 'target') {
      content = this.createTargetGearContent(gear);
    } else {
      content = this.createRegularGearContent(gear);
    }

    g.innerHTML = content;
    return g;
  }

  createRegularGearContent(gear) {
    const colors = GEAR_COLORS.gear;
    const rotation = gear.rotation || 0;
    return this.createGearPathSVG(gear.teeth, gear.size, colors.fill, colors.stroke, rotation);
  }

  createTargetGearContent(gear) {
    const active = gear.active && gear.rpm > 0;
    const colors = active ? GEAR_COLORS.target_active : GEAR_COLORS.target;
    const rotation = gear.rotation || 0;
    let svg = this.createGearPathSVG(gear.teeth, gear.size, colors.fill, colors.stroke, rotation);
    const centerR = gear.size * 0.3;
    svg += `<circle cx="0" cy="0" r="${centerR + 5}" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="5,3" opacity="${active ? 1 : 0.4}"/>`;
    svg += `<text x="0" y="5" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="bold">🎯</text>`;
    return svg;
  }

  createWaterwheelContent(gear) {
    const colors = GEAR_COLORS.waterwheel;
    const rotation = gear.rotation || 0;
    const paddleCount = 8;
    const paddleLength = gear.size * 0.35;
    const paddleWidth = gear.size * 0.15;

    let svg = `<g transform="rotate(${rotation})">`;

    for (let i = 0; i < paddleCount; i++) {
      const angle = (i * 360.0 / paddleCount) * Math.PI / 180;
      const xEnd = Math.cos(angle) * gear.size;
      const yEnd = Math.sin(angle) * gear.size;
      const perpAngle = angle + Math.PI / 2;
      const dx = Math.cos(perpAngle) * paddleWidth / 2;
      const dy = Math.sin(perpAngle) * paddleWidth / 2;

      const innerR = gear.size - paddleLength;
      const x1 = Math.cos(angle) * innerR + dx;
      const y1 = Math.sin(angle) * innerR + dy;
      const x2 = xEnd + dx;
      const y2 = yEnd + dy;
      const x3 = xEnd - dx;
      const y3 = yEnd - dy;
      const x4 = Math.cos(angle) * innerR - dx;
      const y4 = Math.sin(angle) * innerR - dy;

      svg += `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1"/>`;
    }

    svg += `<circle cx="0" cy="0" r="${gear.size * 0.5}" fill="#a64a25" stroke="${colors.stroke}" stroke-width="2"/>`;
    svg += `<circle cx="0" cy="0" r="${gear.size * 0.15}" fill="${colors.stroke}"/>`;
    svg += `</g>`;
    return svg;
  }

  createGearPathSVG(teeth, radius, fill, stroke, rotation = 0) {
    teeth = parseInt(teeth);
    radius = parseFloat(radius);
    const innerRadius = radius * 0.65;
    const axleRadius = radius * 0.2;
    const toothHeight = radius * 0.12;

    const angleStep = (2 * Math.PI) / teeth;
    let pathData = '';

    for (let i = 0; i < teeth; i++) {
      const angle = i * angleStep;
      const nextAngle = (i + 0.5) * angleStep;

      const outerAngle1 = angle - angleStep * 0.2;
      const outerAngle2 = angle + angleStep * 0.2;

      const x1 = Math.cos(outerAngle1) * (radius - toothHeight);
      const y1 = Math.sin(outerAngle1) * (radius - toothHeight);
      const x2 = Math.cos(outerAngle1) * radius;
      const y2 = Math.sin(outerAngle1) * radius;
      const x3 = Math.cos(outerAngle2) * radius;
      const y3 = Math.sin(outerAngle2) * radius;
      const x4 = Math.cos(outerAngle2) * (radius - toothHeight);
      const y4 = Math.sin(outerAngle2) * (radius - toothHeight);
      const x5 = Math.cos(nextAngle) * innerRadius;
      const y5 = Math.sin(nextAngle) * innerRadius;

      if (i === 0) {
        pathData += `M ${x1} ${y1} `;
      }
      pathData += `L ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} L ${x5} ${y5} `;
    }
    pathData += 'Z';

    let svg = `<g transform="rotate(${rotation})">`;
    svg += `<path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`;
    svg += `<circle cx="0" cy="0" r="${axleRadius}" fill="${stroke}" stroke="${stroke}" stroke-width="1"/>`;

    const spokeCount = Math.max(Math.floor(teeth / 4), 4);
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * 360.0 / spokeCount);
      svg += `<line x1="0" y1="0" x2="0" y2="${-(innerRadius - axleRadius - 2)}" stroke="${stroke}" stroke-width="3" transform="rotate(${angle})" opacity="0.5"/>`;
    }

    svg += '</g>';
    return svg;
  }

  renderAllGears() {
    this.gearsLayer.innerHTML = '';
    this.gears.forEach(gear => {
      const gearEl = this.createGearSVG(gear);
      this.gearsLayer.appendChild(gearEl);
    });
  }

  updateConnections() {
    this.connectionsLayer.innerHTML = '';

    this.gears.forEach(gear => {
      if (!gear.connected_to || gear.connected_to.length === 0) return;

      gear.connected_to.forEach(connectedId => {
        const connected = this.gears.find(g => g.id === connectedId);
        if (!connected) return;
        if (connectedId > gear.id) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', gear.x);
        line.setAttribute('y1', gear.y);
        line.setAttribute('x2', connected.x);
        line.setAttribute('y2', connected.y);
        this.connectionsLayer.appendChild(line);
      });
    });
  }

  startAnimation() {
    this.animating = true;
    const animate = () => {
      if (!this.animating) return;

      this.gears.forEach(gear => {
        if (gear.rpm && gear.rpm > 0) {
          const degPerFrame = (gear.rpm * 360) / 60 / 60;
          gear.rotation = (gear.rotation || 0) + degPerFrame;
          if (gear.rotation > 360) gear.rotation -= 360;
        }
      });

      this.renderAllGears();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      if (this.timerEl) {
        this.timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 1000);
  }

  getElapsedSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  async refreshRpm() {
    try {
      const res = await fetch(`/game_sessions/${this.sessionId}/calculate_rpm`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      this.gears.forEach(gear => {
        const gearData = data.gears_state?.find(g => g.id === gear.id);
        if (gearData) {
          gear.rpm = gearData.rpm || 0;
          gear.active = gearData.active || false;
          gear.connected_to = gearData.connected_to || [];
        }
      });

      this.updateConnections();
      this.updateRpmDisplay(data.target_rpm, data.target_connected);
    } catch (e) {
      console.error('Failed to refresh RPM', e);
    }
  }

  updateRpmDisplay(actualRpm, connected) {
    if (!this.currentRpmEl) return;

    this.currentRpmEl.textContent = `${parseFloat(actualRpm).toFixed(1)} RPM`;

    const diff = Math.abs(actualRpm - this.targetRpm);

    if (!connected) {
      this.currentRpmEl.className = 'text-3xl font-bold text-center text-orange-600';
      if (this.rpmStatusEl) {
        this.rpmStatusEl.innerHTML = '<span class="text-orange-600">目标齿轮未连接</span>';
      }
    } else if (diff <= this.rpmTolerance) {
      this.currentRpmEl.className = 'text-3xl font-bold text-center text-emerald-600';
      if (this.rpmStatusEl) {
        this.rpmStatusEl.innerHTML = '<span class="text-emerald-600">✓ 转速达标！</span>';
      }
    } else {
      this.currentRpmEl.className = 'text-3xl font-bold text-center text-orange-600';
      if (this.rpmStatusEl) {
        this.rpmStatusEl.innerHTML = `<span class="text-orange-600">偏差 ${diff.toFixed(1)} RPM</span>`;
      }
    }
  }

  async addGear(x, y) {
    if (!this.selectedAvailableGear) return;

    const formData = new FormData();
    formData.append('gear[teeth]', this.selectedAvailableGear.teeth);
    formData.append('gear[size]', this.selectedAvailableGear.size);
    formData.append('gear[x]', x);
    formData.append('gear[y]', y);

    try {
      const res = await fetch(`/game_sessions/${this.sessionId}/add_gear`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.csrfToken,
          'Accept': 'application/json'
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        this.gears = data.gears_state;
        this.renderAllGears();
        this.updateConnections();
        this.updateMovesCount(data.moves_count);
        this.updateRpmDisplay(data.current_rpm, data.gears_state?.find(g => g.type === 'target')?.active);
        this.updateUndoButton();
      }
    } catch (e) {
      console.error('Failed to add gear', e);
    }
  }

  async removeGear(gearId) {
    try {
      const res = await fetch(`/game_sessions/${this.sessionId}/remove_gear?gear_id=${encodeURIComponent(gearId)}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': this.csrfToken,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        this.gears = data.gears_state;
        this.renderAllGears();
        this.updateConnections();
        this.updateMovesCount(data.moves_count);
        this.updateRpmDisplay(data.current_rpm, data.gears_state?.find(g => g.type === 'target')?.active);
        this.updateUndoButton();
      }
    } catch (e) {
      console.error('Failed to remove gear', e);
    }
  }

  async sendMoveGear(gearId, x, y) {
    const formData = new FormData();
    formData.append('gear_id', gearId);
    formData.append('x', x);
    formData.append('y', y);

    try {
      const res = await fetch(`/game_sessions/${this.sessionId}/move_gear`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': this.csrfToken,
          'Accept': 'application/json'
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        this.gears = data.gears_state;
        this.renderAllGears();
        this.updateConnections();
        this.updateMovesCount(data.moves_count);
        this.updateRpmDisplay(data.current_rpm, data.gears_state?.find(g => g.type === 'target')?.active);
        this.updateUndoButton();
      }
    } catch (e) {
      console.error('Failed to move gear', e);
    }
  }

  async undo() {
    try {
      const res = await fetch(`/game_sessions/${this.sessionId}/undo`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.csrfToken,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        this.gears = data.gears_state;
        this.renderAllGears();
        this.updateConnections();
        this.updateMovesCount(data.moves_count);
        this.updateRpmDisplay(data.current_rpm, data.gears_state?.find(g => g.type === 'target')?.active);
        this.updateUndoButton(data.can_undo);
      }
    } catch (e) {
      console.error('Failed to undo', e);
    }
  }

  async complete() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const formData = new FormData();
    formData.append('time_spent', this.getElapsedSeconds());

    try {
      const res = await fetch(`/game_sessions/${this.sessionId}/complete`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.csrfToken,
          'Accept': 'application/json'
        },
        body: formData
      });
      const data = await res.json();

      window.location.href = `/game_sessions/${this.sessionId}/result`;
    } catch (e) {
      console.error('Failed to complete', e);
      if (this.timerInterval) this.startTimer();
    }
  }

  updateMovesCount(count) {
    if (this.movesCountEl) {
      this.movesCountEl.textContent = count;
    }
  }

  updateUndoButton(canUndo = null) {
    if (!this.undoBtn) return;
    if (canUndo === null) {
      canUndo = parseInt(this.movesCountEl?.textContent || '0') > 0;
    }
    this.undoBtn.disabled = !canUndo;
  }

  destroy() {
    this.animating = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('game-canvas')) {
    window.__game__ = new WatermillGame();
  }
});
