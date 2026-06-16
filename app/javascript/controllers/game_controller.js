import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    sessionId: Number,
    timeLimit: Number,
    targetScore: Number,
    timeRemaining: Number
  }

  connect() {
    this.draggedContainer = null
    this.isPlaying = this.element.dataset.gameIsPlaying !== 'false'

    if (this.timeRemainingValue > 0 && this.isPlaying) {
      this.startTimer()
    }

    this.setupDropzones()
    this.updateUndoRedoButtons()

    if (!this.isPlaying) {
      this.disableAllInteractions()
    }
  }

  disconnect() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemainingValue--
      this.updateTimerDisplay()

      if (this.timeRemainingValue <= 0) {
        clearInterval(this.timerInterval)
        this.handleTimeExpired()
      }
    }, 1000)
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemainingValue / 60)
    const seconds = this.timeRemainingValue % 60
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    const timerEl = document.getElementById('timer')
    if (timerEl) {
      timerEl.textContent = display
      if (this.timeRemainingValue <= 30) {
        timerEl.classList.add('text-red-400', 'animate-pulse')
        timerEl.classList.remove('text-cyan-400')
      } else if (this.timeRemainingValue <= 60) {
        timerEl.classList.add('text-yellow-400')
        timerEl.classList.remove('text-cyan-400', 'text-red-400', 'animate-pulse')
      }
    }
  }

  async handleTimeExpired() {
    this.disableAllInteractions()
    try {
      const response = await fetch(`/game_sessions/${this.sessionIdValue}/time_expired`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        body: JSON.stringify({ remaining: 0 })
      })
      const data = await response.json()
      this.updateGameState(data.game_session)
      this.showResultModal(data.status, data.score, data.lose_reason)
    } catch (error) {
      console.error('Time expired error:', error)
    }
  }

  setupDropzones() {
    const dropzones = this.element.querySelectorAll('[data-dropzone="true"]')
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => this.handleDragOver(e))
      zone.addEventListener('dragleave', (e) => this.handleDragLeave(e))
      zone.addEventListener('drop', (e) => this.handleDrop(e))
    })
  }

  dragStart(event) {
    if (!this.isPlaying) {
      event.preventDefault()
      return
    }
    this.draggedContainer = event.currentTarget
    event.currentTarget.classList.add('opacity-50', 'scale-95')
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', event.currentTarget.dataset.containerId)
  }

  dragEnd(event) {
    event.currentTarget.classList.remove('opacity-50', 'scale-95')
    this.draggedContainer = null
    this.clearDropzoneHighlights()
  }

  handleDragOver(event) {
    if (!this.isPlaying || !this.draggedContainer) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    event.currentTarget.classList.add('border-cyan-400', 'bg-cyan-500/10', 'border-solid')
    const hint = event.currentTarget.querySelector('.berth-drop-hint')
    if (hint) hint.classList.remove('hidden')
  }

  handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove('border-cyan-400', 'bg-cyan-500/10', 'border-solid')
      const hint = event.currentTarget.querySelector('.berth-drop-hint')
      if (hint) hint.classList.add('hidden')
    }
  }

  async handleDrop(event) {
    event.preventDefault()
    this.clearDropzoneHighlights()

    if (!this.isPlaying || !this.draggedContainer) return

    const containerId = this.draggedContainer.dataset.containerId
    const berthId = event.currentTarget.dataset.berthId

    if (!containerId || !berthId) return

    await this.placeContainer(containerId, berthId)
  }

  clearDropzoneHighlights() {
    this.element.querySelectorAll('[data-dropzone="true"]').forEach(zone => {
      zone.classList.remove('border-cyan-400', 'bg-cyan-500/10', 'border-solid')
      const hint = zone.querySelector('.berth-drop-hint')
      if (hint) hint.classList.add('hidden')
    })
  }

  async placeContainer(containerId, berthId, allowWarnings = false) {
    try {
      const response = await fetch(`/game_sessions/${this.sessionIdValue}/place_container`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        body: JSON.stringify({
          container_id: containerId,
          berth_id: berthId,
          allow_warnings: allowWarnings
        })
      })

      const data = await response.json()

      if (data.success) {
        this.updateGameState(data.game_session)
        this.showAlert('success', `货柜已放置到泊位！得分: ${data.result.score}`)
        if (data.result.status !== 'playing') {
          this.isPlaying = false
          this.showResultModal(data.result.status, data.result.score)
        }
        this.updateUndoRedoButtons()
      } else {
        if (data.conflicts && data.conflicts.length > 0) {
          const warnings = data.conflicts.filter(c => c.severity === 'warning')
          if (warnings.length > 0 && !allowWarnings) {
            this.showWarningConfirmation(containerId, berthId, warnings)
            return
          }
        }
        this.showAlert('error', data.errors.join('\n'))
        if (data.conflicts && data.conflicts.length > 0) {
          this.showConflictDetails(data.conflicts)
        }
      }
    } catch (error) {
      console.error('Place container error:', error)
      this.showAlert('error', '放置货柜失败，请重试')
    }
  }

  async removeContainer(event) {
    if (!this.isPlaying) return

    const containerId = event.currentTarget.dataset.containerId
    if (!containerId) return

    if (!confirm('确定要移除此货柜吗？')) return

    try {
      const response = await fetch(`/game_sessions/${this.sessionIdValue}/remove_container`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        body: JSON.stringify({ container_id: containerId })
      })

      const data = await response.json()

      if (data.success) {
        this.updateGameState(data.game_session)
        this.showAlert('info', '货柜已移回待调度区')
        this.updateUndoRedoButtons()
      } else {
        this.showAlert('error', data.errors.join('\n'))
      }
    } catch (error) {
      console.error('Remove container error:', error)
      this.showAlert('error', '移除货柜失败，请重试')
    }
  }

  async undo() {
    if (!this.isPlaying) return

    try {
      const response = await fetch(`/game_sessions/${this.sessionIdValue}/undo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      })

      const data = await response.json()

      if (data.success) {
        this.updateGameState(data.game_session)
        this.showAlert('info', '已撤销上一步操作')
        this.updateUndoRedoButtons()
      } else {
        this.showAlert('error', data.errors.join('\n'))
      }
    } catch (error) {
      console.error('Undo error:', error)
      this.showAlert('error', '撤销失败，请重试')
    }
  }

  async redo() {
    if (!this.isPlaying) return

    try {
      const response = await fetch(`/game_sessions/${this.sessionIdValue}/redo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      })

      const data = await response.json()

      if (data.success) {
        this.updateGameState(data.game_session)
        this.showAlert('info', '已重做操作')
        this.updateUndoRedoButtons()
      } else {
        this.showAlert('error', data.errors.join('\n'))
      }
    } catch (error) {
      console.error('Redo error:', error)
      this.showAlert('error', '重做失败，请重试')
    }
  }

  async recalculateScore() {
    try {
      const response = await fetch(`/game_sessions/${this.sessionIdValue}/recalculate_score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      })

      const data = await response.json()

      if (data.success) {
        this.updateGameState(data.game_session)
        this.updateScoreDetails(data.score_details)
        this.showAlert('success', `分数已重新计算：${data.score}`)
      }
    } catch (error) {
      console.error('Recalculate score error:', error)
      this.showAlert('error', '分数计算失败，请重试')
    }
  }

  updateGameState(gameSession) {
    const scoreEl = document.getElementById('current-score')
    if (scoreEl) {
      scoreEl.textContent = this.formatNumber(gameSession.score)
    }

    const remainingEl = document.getElementById('remaining-containers')
    if (remainingEl && gameSession.available_container_ids) {
      const total = gameSession.placed_container_ids.length + gameSession.available_container_ids.length
      remainingEl.textContent = `${gameSession.available_container_ids.length} / ${total}`
    }

    if (gameSession.berth_weights) {
      this.updateBerthWeights(gameSession.berth_weights)
      this.updateContainerPositions(gameSession.berth_weights, gameSession.available_container_ids)
    }

    if (gameSession.operations) {
      this.updateOperationsList(gameSession.operations)
    }

    if (this.timeRemainingValue !== gameSession.time_remaining) {
      this.timeRemainingValue = gameSession.time_remaining
      this.updateTimerDisplay()
    }
  }

  updateContainerPositions(berths, availableContainerIds) {
    const containerPool = document.getElementById('containers-pool')
    if (!containerPool) return

    const containerDataMap = new Map()
    document.querySelectorAll('.container-card, .placed-container').forEach(el => {
      const id = el.dataset.containerId
      if (!id) return
      containerDataMap.set(id, {
        id: id,
        color: el.dataset.containerColor || el.classList.toString().match(/border-(\w+)-500/)?.[1] || 'cyan',
        label: el.querySelector('span.font-bold')?.textContent || `C-${id}`,
        weight: el.dataset.containerWeight || el.querySelector('span.text-slate-400')?.textContent?.replace('吨', '') || '0',
        destination: el.dataset.containerDestination || el.querySelector('span.text-purple-400')?.textContent || '',
        priority: el.dataset.containerPriority || '1'
      })
      el.remove()
    })

    berths.forEach(berth => {
      const berthEl = document.querySelector(`[data-berth-id="${berth.id}"]`)
      if (!berthEl) return

      const berthContainer = berthEl.querySelector('.min-h-\\[80px\\]')
      if (!berthContainer) return

      berthContainer.querySelectorAll('.placed-container').forEach(el => el.remove())

      const placedIds = berth.container_ids || []
      placedIds.forEach(containerId => {
        const sid = String(containerId)
        const data = containerDataMap.get(sid)
        if (!data) return

        const placedEl = document.createElement('div')
        placedEl.className = `placed-container bg-slate-600/80 rounded-lg p-2 border border-${data.color}-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-${data.color}-500/20 cursor-pointer animate-fade-in`
        placedEl.dataset.containerId = sid
        placedEl.dataset.berthId = String(berth.id)
        placedEl.dataset.action = 'click->game#removeContainer'

        placedEl.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold">${data.label}</span>
            <span class="text-slate-400">${data.weight}吨</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">
            目的地: <span class="text-purple-400">${data.destination}</span>
            <span class="ml-2 text-red-400 opacity-0 hover:opacity-100 transition">点击移除</span>
          </div>
        `
        berthContainer.appendChild(placedEl)
      })
    })

    containerPool.querySelectorAll('.container-card').forEach(el => el.remove())

    availableContainerIds.forEach(containerId => {
      const sid = String(containerId)
      const data = containerDataMap.get(sid)
      if (!data) return

      const poolEl = document.createElement('div')
      poolEl.className = `container-card cursor-grab active:cursor-grabbing bg-slate-700/80 hover:bg-slate-600/80 rounded-lg p-3 border border-slate-600 hover:border-${data.color}-400/50 transition-all duration-200 shadow-lg hover:shadow-${data.color}-500/20 animate-fade-in`
      poolEl.draggable = true
      poolEl.dataset.containerId = sid
      poolEl.dataset.containerWeight = data.weight
      poolEl.dataset.containerDestination = data.destination
      poolEl.dataset.containerPriority = data.priority
      poolEl.dataset.containerColor = data.color
      poolEl.dataset.action = 'dragstart->game#dragStart dragend->game#dragEnd'

      poolEl.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-sm">${data.label}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-${data.color}-500/30 text-${data.color}-400">
            P${data.priority}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-slate-400">重量:</span>
            <span class="font-mono font-bold text-cyan-400">${data.weight}</span>
          </div>
          <div>
            <span class="text-slate-400">目的地:</span>
            <span class="font-mono text-purple-400">${data.destination}</span>
          </div>
        </div>
        <div class="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-${data.color}-400 to-${data.color}-600 rounded-full"
               style="width: ${Math.min(parseInt(data.weight) / 50 * 100, 100)}%"></div>
        </div>
      `
      containerPool.appendChild(poolEl)
    })

    this.updateEmptyState(containerPool, availableContainerIds)
  }

  updateEmptyState(containerPool, availableContainerIds) {
    const emptyState = containerPool.querySelector('.text-center.py-8')
    if (availableContainerIds.length === 0 && this.isPlaying) {
      if (!emptyState) {
        const emptyEl = document.createElement('div')
        emptyEl.className = 'text-center text-slate-400 py-8'
        emptyEl.innerHTML = `
          <div class="text-4xl mb-2">✨</div>
          <div>所有货柜已放置！</div>
          <div class="text-sm mt-1">正在计算最终得分...</div>
        `
        containerPool.appendChild(emptyEl)
      }
    } else if (emptyState) {
      emptyState.remove()
    }
  }

  updateBerthWeights(berths) {
    berths.forEach(berth => {
      const berthEl = document.querySelector(`[data-berth-id="${berth.id}"]`)
      if (!berthEl) return

      const weightText = berthEl.querySelector('span.font-mono')
      if (weightText) {
        weightText.textContent = `${berth.current_weight} / ${berth.max_weight}`
        this.updateWeightColor(weightText, berth.current_weight, berth.max_weight)
      }

      const weightBar = berthEl.querySelector('.berth-weight-bar')
      if (weightBar) {
        const percentage = Math.min((berth.current_weight / berth.max_weight) * 100, 100)
        weightBar.style.width = `${percentage}%`
        weightBar.className = `berth-weight-bar h-full rounded-full transition-all duration-300 ${this.getWeightBarColor(berth.current_weight, berth.max_weight)}`
      }
    })
  }

  updateWeightColor(element, current, max) {
    element.classList.remove('text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400')
    const ratio = current / max
    if (ratio < 0.5) element.classList.add('text-green-400')
    else if (ratio < 0.8) element.classList.add('text-yellow-400')
    else if (ratio <= 1.0) element.classList.add('text-orange-400')
    else element.classList.add('text-red-400')
  }

  getWeightBarColor(current, max) {
    const ratio = current / max
    if (ratio < 0.5) return 'bg-green-500'
    if (ratio < 0.8) return 'bg-yellow-500'
    if (ratio <= 1.0) return 'bg-orange-500'
    return 'bg-red-500'
  }

  updateOperationsList(operations) {
    const listEl = document.getElementById('operations-list')
    if (!listEl) return

    const html = operations.reverse().map(op => `
      <div class="flex items-center gap-2 text-slate-400 py-1 border-b border-slate-700/50 last:border-0">
        <span class="text-xs font-mono text-slate-500 w-8">#${op.sequence}</span>
        <span class="${op.action_type === 'place' ? 'text-green-400' : 'text-orange-400'}">
          ${op.action_type === 'place' ? '放置' : '移除'}
        </span>
        <span>货柜 <span class="text-cyan-400">C-${op.container_id}</span></span>
        ${op.berth_id ? `<span>→ 泊位 <span class="text-purple-400">B-${op.berth_id}</span></span>` : ''}
      </div>
    `).join('')

    listEl.innerHTML = html || '<div class="text-slate-500 text-center py-4">暂无操作记录</div>'
  }

  updateScoreDetails(details) {
    if (!details) return

    const mappings = {
      base_score: '基础分',
      weight_bonus: '重量奖励',
      priority_bonus: '优先级奖励',
      destination_bonus: '目的地匹配',
      berth_utilization_bonus: '泊位利用率',
      efficiency_bonus: '效率奖励',
      time_bonus: '时间奖励',
      perfect_bonus: '完美奖励',
      final_score: '总分'
    }

    Object.keys(mappings).forEach(key => {
      if (details[key] !== undefined) {
        const el = document.querySelector(`[data-score-key="${key}"]`)
        if (el) {
          if (key === 'multiplier') {
            el.textContent = `×${details[key]}`
          } else {
            el.textContent = this.formatNumber(details[key])
          }
        }
      }
    })
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn')
    const redoBtn = document.getElementById('redo-btn')
    if (!undoBtn || !redoBtn) return

    fetch(`/game_sessions/${this.sessionIdValue}/operations.json`)
      .then(r => r.json())
      .then(data => {
        const hasActive = data.filter(op => !op.undone).length > 0
        const hasUndone = data.filter(op => op.undone).length > 0
        undoBtn.disabled = !hasActive || !this.isPlaying
        redoBtn.disabled = !hasUndone || !this.isPlaying
      })
      .catch(() => {
        undoBtn.disabled = !this.isPlaying
        redoBtn.disabled = !this.isPlaying
      })
  }

  showAlert(type, message) {
    const alertsContainer = document.getElementById('game-alerts')
    if (!alertsContainer) return

    const colorClasses = {
      success: 'bg-green-500/20 border-green-500/50 text-green-300',
      error: 'bg-red-500/20 border-red-500/50 text-red-300',
      warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
      info: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    }

    const alertEl = document.createElement('div')
    alertEl.className = `p-4 rounded-lg border ${colorClasses[type] || colorClasses.info} animate-fade-in`
    alertEl.textContent = message

    alertsContainer.appendChild(alertEl)

    setTimeout(() => {
      alertEl.classList.add('opacity-0', 'transition-opacity', 'duration-500')
      setTimeout(() => alertEl.remove(), 500)
    }, 4000)
  }

  showConflictDetails(conflicts) {
    conflicts.forEach(conflict => {
      if (conflict.severity === 'error') {
        this.showAlert('error', `❌ ${conflict.message}`)
      } else if (conflict.severity === 'warning') {
        this.showAlert('warning', `⚠️ ${conflict.message}`)
      }
    })
  }

  showWarningConfirmation(containerId, berthId, warnings) {
    const warningText = warnings.map(w => `⚠️ ${w.message}`).join('\n\n')
    const confirmed = confirm(`存在以下警告：\n\n${warningText}\n\n是否仍然继续放置？`)
    if (confirmed) {
      this.placeContainer(containerId, berthId, true)
    }
  }

  showResultModal(status, score, reason = null) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
    this.disableAllInteractions()

    const isWin = status === 'won'
    const modalHtml = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div class="bg-slate-800 rounded-2xl p-8 max-w-lg w-full mx-4 border border-purple-500/30 shadow-2xl">
          <div class="text-center">
            <div class="text-6xl mb-4">${isWin ? '🎉' : '😢'}</div>
            <h3 class="text-3xl font-bold mb-2 ${isWin ? 'text-green-400' : 'text-red-400'}">
              ${isWin ? '挑战成功！' : '挑战失败'}
            </h3>
            ${reason ? `<p class="text-slate-400 mb-6">${reason}</p>` : ''}
            <div class="bg-slate-700/50 rounded-xl p-6 mb-6">
              <div class="text-sm text-slate-400 mb-2">最终得分</div>
              <div class="text-5xl font-mono font-bold text-yellow-400 mb-4">
                ${this.formatNumber(score)}
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div class="text-slate-400">目标分数</div>
                  <div class="font-mono">${this.formatNumber(this.targetScoreValue)}</div>
                </div>
                <div>
                  <div class="text-slate-400">剩余时间</div>
                  <div class="font-mono">${this.formatTime(this.timeRemainingValue)}</div>
                </div>
              </div>
            </div>
            <div class="flex gap-4">
              <a href="/levels" class="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-center">返回关卡</a>
              <button onclick="location.reload()" class="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-medium transition">再来一局</button>
            </div>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  disableAllInteractions() {
    this.isPlaying = false
    this.element.querySelectorAll('.container-card, .placed-container').forEach(el => {
      el.classList.add('opacity-50', 'pointer-events-none')
    })
    this.element.querySelectorAll('[data-dropzone="true"]').forEach(el => {
      el.classList.remove('berth-highlight')
    })
    const buttons = document.querySelectorAll('#undo-btn, #redo-btn')
    buttons.forEach(btn => btn.disabled = true)
  }

  getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]')
    return token ? token.content : ''
  }

  formatNumber(num) {
    if (num === null || num === undefined) return '0'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  formatTime(seconds) {
    if (!seconds || seconds <= 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
}
