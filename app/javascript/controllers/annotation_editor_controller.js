import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    projectId: Number,
    recordId: Number,
    csrfToken: String
  }

  connect() {
    this.canvasContainer = document.getElementById('canvas-container')
    this.canvasWrapper = document.getElementById('canvas-wrapper')
    this.canvasContent = document.getElementById('canvas-content')
    this.annotationsLayer = document.getElementById('annotations-layer')
    this.baseImage = document.getElementById('base-image')
    this.annotationListPanel = document.getElementById('annotation-list-panel')
    this.annotationListContainer = document.getElementById('annotation-list-container')
    this.annotationEmptyState = document.getElementById('annotation-empty-state')

    this.scale = 1
    this.panX = 0
    this.panY = 0
    this.isPanning = false
    this.panStartX = 0
    this.panStartY = 0

    this.currentTool = 'select'
    this.currentDisease = 'flaking'
    this.currentSeverity = 'moderate'
    this.currentColor = '#ef4444'

    this.isDrawing = false
    this.drawStartX = 0
    this.drawStartY = 0
    this.tempRect = null

    this.selectedAnnotationId = null
    this.isDragging = false
    this.dragStartX = 0
    this.dragStartY = 0
    this.dragOffsetX = 0
    this.dragOffsetY = 0

    this.isResizing = false
    this.resizeStartX = 0
    this.resizeStartY = 0
    this.resizeStartWidth = 0
    this.resizeStartHeight = 0

    this.isDrawingScale = false
    this.scaleStartX = 0
    this.scaleStartY = 0
    this.tempScaleLine = null

    this._boundMouseDown = this.onMouseDown.bind(this)
    this._boundMouseMove = this.onMouseMove.bind(this)
    this._boundMouseUp = this.onMouseUp.bind(this)
    this._boundWheel = this.onWheel.bind(this)

    this.canvasContainer.addEventListener('mousedown', this._boundMouseDown)
    window.addEventListener('mousemove', this._boundMouseMove)
    window.addEventListener('mouseup', this._boundMouseUp)
    this.canvasContainer.addEventListener('wheel', this._boundWheel, { passive: false })

    this.bindToolEvents()
    this.bindListEvents()
    this.bindPropertyEvents()
    this.fitView()
    this.updateZoomDisplay()
  }

  disconnect() {
    this.canvasContainer.removeEventListener('mousedown', this._boundMouseDown)
    window.removeEventListener('mousemove', this._boundMouseMove)
    window.removeEventListener('mouseup', this._boundMouseUp)
    this.canvasContainer.removeEventListener('wheel', this._boundWheel)
  }

  bindToolEvents() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b =>
          b.classList.remove('bg-amber-50', 'text-amber-700', 'ring-2', 'ring-amber-200')
        )
        btn.classList.add('bg-amber-50', 'text-amber-700', 'ring-2', 'ring-amber-200')
        this.currentTool = btn.dataset.tool
        if (btn.dataset.disease) {
          this.currentDisease = btn.dataset.disease
          this.currentColor = btn.dataset.color
        }
        this.updateCursor()
      })
    })

    document.querySelectorAll('.severity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.severity-btn').forEach(b => {
          b.classList.remove('ring-2', 'ring-offset-1', 'ring-slate-300')
          b.classList.add('bg-slate-100', 'text-slate-600', 'hover:bg-slate-200')
        })
        const sevClasses = {
          mild: 'bg-emerald-100 text-emerald-700',
          moderate: 'bg-amber-100 text-amber-700',
          severe: 'bg-red-100 text-red-700'
        }
        btn.classList.remove('bg-slate-100', 'text-slate-600', 'hover:bg-slate-200')
        btn.classList.add(...(sevClasses[btn.dataset.severity] || '').split(' '), 'ring-2', 'ring-offset-1', 'ring-slate-300')
        this.currentSeverity = btn.dataset.severity
      })
    })

    document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn())
    document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut())
    document.getElementById('fit-view').addEventListener('click', () => this.fitView())
  }

  bindListEvents() {
    document.querySelectorAll('.annotation-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectAnnotation(item.dataset.id)
      })
    })
  }

  bindPropertyEvents() {
    document.getElementById('save-annotation').addEventListener('click', () => this.saveAnnotationProperties())
    document.getElementById('delete-annotation').addEventListener('click', () => this.deleteSelectedAnnotation())

    ;['prop-disease', 'prop-severity', 'prop-x', 'prop-y', 'prop-width', 'prop-height', 'prop-description'].forEach(id => {
      const el = document.getElementById(id)
      if (el) el.addEventListener('change', () => this.updateAnnotationFromProps())
    })
  }

  updateCursor() {
    if (this.currentTool === 'select') {
      this.canvasContainer.style.cursor = 'grab'
    } else if (this.currentTool === 'rectangle' || this.currentTool === 'scale') {
      this.canvasContainer.style.cursor = 'crosshair'
    } else {
      this.canvasContainer.style.cursor = 'default'
    }
  }

  getImageCoords(e) {
    const rect = this.canvasContent.getBoundingClientRect()
    const x = (e.clientX - rect.left) / this.scale
    const y = (e.clientY - rect.top) / this.scale
    return { x: Math.round(x), y: Math.round(y) }
  }

  getSelectedBox() {
    if (!this.selectedAnnotationId) return null
    return this.annotationsLayer.querySelector(`.annotation-box[data-id="${this.selectedAnnotationId}"]`)
  }

  onMouseDown(e) {
    if (e.button !== 0) return

    const resizeHandle = e.target.closest('.resize-handle')
    if (resizeHandle) {
      const box = resizeHandle.closest('.annotation-box')
      if (box) {
        this.selectAnnotation(box.dataset.id)
        this.startResize(e)
        e.preventDefault()
        e.stopPropagation()
        return
      }
    }

    const annotationBox = e.target.closest('.annotation-box')
    if (annotationBox) {
      this.selectAnnotation(annotationBox.dataset.id)
      this.startDrag(e)
      e.preventDefault()
      return
    }

    if (this.currentTool === 'select') {
      this.startPan(e)
    } else if (this.currentTool === 'rectangle') {
      this.startDraw(e)
    } else if (this.currentTool === 'scale') {
      this.startDrawScale(e)
    }
  }

  onMouseMove(e) {
    const coords = this.getImageCoords(e)
    const cursorEl = document.getElementById('cursor-pos')
    if (cursorEl) cursorEl.textContent = `X: ${coords.x}, Y: ${coords.y}`

    if (this.isPanning) {
      this.doPan(e)
    } else if (this.isDrawing) {
      this.doDraw(e)
    } else if (this.isDragging) {
      this.doDrag(e)
    } else if (this.isResizing) {
      this.doResize(e)
    } else if (this.isDrawingScale) {
      this.doDrawScale(e)
    }
  }

  onMouseUp(e) {
    if (this.isPanning) {
      this.endPan()
    } else if (this.isDrawing) {
      this.endDraw(e)
    } else if (this.isDragging) {
      this.endDrag()
    } else if (this.isResizing) {
      this.endResize()
    } else if (this.isDrawingScale) {
      this.endDrawScale(e)
    }
  }

  startPan(e) {
    this.isPanning = true
    this.panStartX = e.clientX - this.panX
    this.panStartY = e.clientY - this.panY
    this.canvasContainer.style.cursor = 'grabbing'
  }

  doPan(e) {
    this.panX = e.clientX - this.panStartX
    this.panY = e.clientY - this.panStartY
    this.applyTransform()
  }

  endPan() {
    this.isPanning = false
    this.updateCursor()
  }

  applyTransform() {
    this.canvasContent.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`
    this.canvasContent.style.transformOrigin = '0 0'
  }

  startDraw(e) {
    const coords = this.getImageCoords(e)
    this.isDrawing = true
    this.drawStartX = coords.x
    this.drawStartY = coords.y

    this.tempRect = document.createElement('div')
    this.tempRect.className = 'absolute border-2 border-dashed pointer-events-none'
    this.tempRect.style.borderColor = this.currentColor
    this.tempRect.style.backgroundColor = this.currentColor + '20'
    this.tempRect.style.left = coords.x + 'px'
    this.tempRect.style.top = coords.y + 'px'
    this.tempRect.style.width = '0px'
    this.tempRect.style.height = '0px'
    this.annotationsLayer.appendChild(this.tempRect)
  }

  doDraw(e) {
    if (!this.tempRect) return
    const coords = this.getImageCoords(e)
    const x = Math.min(this.drawStartX, coords.x)
    const y = Math.min(this.drawStartY, coords.y)
    const w = Math.abs(coords.x - this.drawStartX)
    const h = Math.abs(coords.y - this.drawStartY)
    this.tempRect.style.left = x + 'px'
    this.tempRect.style.top = y + 'px'
    this.tempRect.style.width = w + 'px'
    this.tempRect.style.height = h + 'px'
  }

  endDraw(e) {
    this.isDrawing = false
    if (!this.tempRect) return
    const coords = this.getImageCoords(e)
    const x = Math.min(this.drawStartX, coords.x)
    const y = Math.min(this.drawStartY, coords.y)
    const w = Math.abs(coords.x - this.drawStartX)
    const h = Math.abs(coords.y - this.drawStartY)

    this.tempRect.remove()
    this.tempRect = null

    if (w > 5 && h > 5) {
      this.createAnnotation(x, y, w, h)
    }
  }

  createAnnotation(x, y, width, height) {
    const data = {
      annotation: {
        disease_type: this.currentDisease,
        severity: this.currentSeverity,
        x: x,
        y: y,
        width: width,
        height: height,
        description: '',
        color: this.currentColor
      }
    }

    fetch(`/projects/${this.projectIdValue}/records/${this.recordIdValue}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfTokenValue,
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok')
      return response.json()
    })
    .then(annotation => {
      this.addAnnotationToCanvas(annotation)
      this.addAnnotationToList(annotation)
      this.selectAnnotation(String(annotation.id))
      this.updateAnnotationCount()
    })
    .catch(error => {
      console.error('Create annotation error:', error)
    })
  }

  addAnnotationToList(annotation) {
    const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
    const sevNames = { mild: '轻微', moderate: '中等', severe: '重度' }
    const sevClasses = {
      mild: 'text-emerald-600 bg-emerald-50',
      moderate: 'text-amber-600 bg-amber-50',
      severe: 'text-red-600 bg-red-50'
    }
    const color = annotation.color || this.defaultColor(annotation.disease_type)

    if (this.annotationEmptyState) {
      this.annotationEmptyState.style.display = 'none'
    }

    if (!this.annotationListContainer) return

    const item = document.createElement('div')
    item.className = 'annotation-item p-3 hover:bg-slate-50 cursor-pointer'
    item.dataset.id = String(annotation.id)

    item.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="w-3 h-3 rounded-sm mt-0.5 shrink-0" style="background-color: ${color}"></span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-800">${diseaseNames[annotation.disease_type] || annotation.disease_type}</span>
            <span class="px-1.5 py-0.5 text-xs font-medium rounded ${sevClasses[annotation.severity] || sevClasses.moderate}">${sevNames[annotation.severity] || annotation.severity}</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${annotation.width} × ${annotation.height} px</p>
          ${annotation.description ? `<p class="text-xs text-slate-400 mt-1 truncate">${annotation.description}</p>` : ''}
        </div>
      </div>
    `

    item.addEventListener('click', () => {
      this.selectAnnotation(String(annotation.id))
    })

    this.annotationListContainer.insertBefore(item, this.annotationListContainer.firstChild)
  }

  addAnnotationToCanvas(annotation) {
    const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
    const color = annotation.color || this.defaultColor(annotation.disease_type)

    const box = document.createElement('div')
    box.className = 'annotation-box absolute border-2 cursor-move pointer-events-auto'
    box.dataset.id = String(annotation.id)
    box.dataset.disease = annotation.disease_type
    box.dataset.severity = annotation.severity
    box.dataset.description = annotation.description || ''
    box.style.left = annotation.x + 'px'
    box.style.top = annotation.y + 'px'
    box.style.width = annotation.width + 'px'
    box.style.height = annotation.height + 'px'
    box.style.borderColor = color
    box.style.backgroundColor = color + '20'

    box.innerHTML = `
      <div class="absolute -top-6 left-0 px-1.5 py-0.5 text-xs font-medium text-white rounded whitespace-nowrap" style="background-color: ${color};">
        ${diseaseNames[annotation.disease_type] || annotation.disease_type}
      </div>
      <div class="resize-handle absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full cursor-nwse-resize" style="border: 2px solid ${color};"></div>
    `

    this.annotationsLayer.appendChild(box)
  }

  defaultColor(type) {
    return {
      flaking: '#ef4444',
      efflorescence: '#f59e0b',
      discoloration: '#8b5cf6',
      crack: '#3b82f6',
      other: '#6b7280'
    }[type] || '#6b7280'
  }

  selectAnnotation(id) {
    this.selectedAnnotationId = String(id)

    this.annotationsLayer.querySelectorAll('.annotation-box').forEach(box => {
      box.classList.remove('ring-2', 'ring-offset-1', 'ring-amber-500')
    })
    if (this.annotationListContainer) {
      this.annotationListContainer.querySelectorAll('.annotation-item').forEach(item => {
        item.classList.remove('bg-amber-50')
      })
    }

    const box = this.getSelectedBox()
    const item = this.annotationListContainer
      ? this.annotationListContainer.querySelector(`.annotation-item[data-id="${id}"]`)
      : null

    if (box) {
      box.classList.add('ring-2', 'ring-offset-1', 'ring-amber-500')
      this.showAnnotationProperties(box)

      const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
      const sevNames = { mild: '轻微', moderate: '中等', severe: '重度' }
      document.getElementById('selected-info').textContent =
        `${diseaseNames[box.dataset.disease] || box.dataset.disease} (${sevNames[box.dataset.severity] || box.dataset.severity})`
    }
    if (item) {
      item.classList.add('bg-amber-50')
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  showAnnotationProperties(box) {
    const panel = document.getElementById('annotation-properties')
    panel.classList.remove('hidden')

    document.getElementById('prop-disease').value = box.dataset.disease
    document.getElementById('prop-severity').value = box.dataset.severity
    document.getElementById('prop-x').value = parseInt(box.style.left)
    document.getElementById('prop-y').value = parseInt(box.style.top)
    document.getElementById('prop-width').value = parseInt(box.style.width)
    document.getElementById('prop-height').value = parseInt(box.style.height)
    document.getElementById('prop-description').value = box.dataset.description || ''
  }

  updateAnnotationFromProps() {
    const box = this.getSelectedBox()
    if (!box) return

    const disease = document.getElementById('prop-disease').value
    const severity = document.getElementById('prop-severity').value
    const x = parseInt(document.getElementById('prop-x').value) || 0
    const y = parseInt(document.getElementById('prop-y').value) || 0
    const width = parseInt(document.getElementById('prop-width').value) || 0
    const height = parseInt(document.getElementById('prop-height').value) || 0
    const description = document.getElementById('prop-description').value
    const color = this.defaultColor(disease)

    box.dataset.disease = disease
    box.dataset.severity = severity
    box.dataset.description = description
    box.style.left = x + 'px'
    box.style.top = y + 'px'
    box.style.width = width + 'px'
    box.style.height = height + 'px'
    box.style.borderColor = color
    box.style.backgroundColor = color + '20'

    const label = box.querySelector('div:first-child')
    if (label) {
      const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
      label.textContent = diseaseNames[disease] || disease
      label.style.backgroundColor = color
    }
    const handle = box.querySelector('.resize-handle')
    if (handle) handle.style.borderColor = color
  }

  saveAnnotationProperties() {
    const box = this.getSelectedBox()
    if (!box) return

    const id = box.dataset.id
    const data = {
      annotation: {
        disease_type: document.getElementById('prop-disease').value,
        severity: document.getElementById('prop-severity').value,
        x: parseInt(document.getElementById('prop-x').value) || 0,
        y: parseInt(document.getElementById('prop-y').value) || 0,
        width: parseInt(document.getElementById('prop-width').value) || 0,
        height: parseInt(document.getElementById('prop-height').value) || 0,
        description: document.getElementById('prop-description').value
      }
    }

    fetch(`/projects/${this.projectIdValue}/records/${this.recordIdValue}/annotations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfTokenValue,
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(() => {
      this.updateAnnotationCount()
      const item = this.annotationListContainer
        ? this.annotationListContainer.querySelector(`.annotation-item[data-id="${id}"]`)
        : null
      if (item) {
        const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
        const sevNames = { mild: '轻微', moderate: '中等', severe: '重度' }
        const color = this.defaultColor(data.annotation.disease_type)
        const nameEl = item.querySelector('.text-sm.font-medium')
        if (nameEl) nameEl.textContent = diseaseNames[data.annotation.disease_type] || data.annotation.disease_type
        const sizeEl = item.querySelector('.text-xs.text-slate-500')
        if (sizeEl) sizeEl.textContent = `${data.annotation.width} × ${data.annotation.height} px`
        const colorDot = item.querySelector('.w-3.h-3')
        if (colorDot) colorDot.style.backgroundColor = color
      }
    })
  }

  deleteSelectedAnnotation() {
    if (!this.selectedAnnotationId) return
    if (!confirm('确定删除此标注吗？')) return

    const id = this.selectedAnnotationId

    fetch(`/projects/${this.projectIdValue}/records/${this.recordIdValue}/annotations/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': this.csrfTokenValue,
        'Accept': 'application/json'
      }
    })
    .then(() => {
      const box = this.getSelectedBox()
      if (box) box.remove()
      const item = this.annotationListContainer
        ? this.annotationListContainer.querySelector(`.annotation-item[data-id="${id}"]`)
        : null
      if (item) item.remove()
      this.selectedAnnotationId = null
      document.getElementById('annotation-properties').classList.add('hidden')
      document.getElementById('selected-info').textContent = '未选择标注'
      this.updateAnnotationCount()
    })
  }

  startDrag(e) {
    this.isDragging = true
    const box = this.getSelectedBox()
    if (!box) return
    const coords = this.getImageCoords(e)
    this.dragOffsetX = coords.x - parseInt(box.style.left)
    this.dragOffsetY = coords.y - parseInt(box.style.top)
    this.canvasContainer.style.cursor = 'move'
  }

  doDrag(e) {
    const box = this.getSelectedBox()
    if (!box) return
    const coords = this.getImageCoords(e)
    const x = Math.round(coords.x - this.dragOffsetX)
    const y = Math.round(coords.y - this.dragOffsetY)
    box.style.left = x + 'px'
    box.style.top = y + 'px'
    document.getElementById('prop-x').value = x
    document.getElementById('prop-y').value = y
  }

  endDrag() {
    if (!this.isDragging) return
    this.isDragging = false
    this.saveAnnotationProperties()
    this.updateCursor()
  }

  startResize(e) {
    const box = this.getSelectedBox()
    if (!box) return
    this.isResizing = true
    const coords = this.getImageCoords(e)
    this.resizeStartX = coords.x
    this.resizeStartY = coords.y
    this.resizeStartWidth = parseInt(box.style.width)
    this.resizeStartHeight = parseInt(box.style.height)
  }

  doResize(e) {
    const box = this.getSelectedBox()
    if (!box) return
    const coords = this.getImageCoords(e)
    const dx = coords.x - this.resizeStartX
    const dy = coords.y - this.resizeStartY
    const w = Math.max(10, this.resizeStartWidth + dx)
    const h = Math.max(10, this.resizeStartHeight + dy)
    box.style.width = Math.round(w) + 'px'
    box.style.height = Math.round(h) + 'px'
    document.getElementById('prop-width').value = Math.round(w)
    document.getElementById('prop-height').value = Math.round(h)
  }

  endResize() {
    if (!this.isResizing) return
    this.isResizing = false
    this.saveAnnotationProperties()
    this.updateCursor()
  }

  startDrawScale(e) {
    const coords = this.getImageCoords(e)
    this.isDrawingScale = true
    this.scaleStartX = coords.x
    this.scaleStartY = coords.y

    this.tempScaleLine = document.createElement('div')
    this.tempScaleLine.className = 'absolute pointer-events-none'
    this.tempScaleLine.style.left = coords.x + 'px'
    this.tempScaleLine.style.top = coords.y + 'px'
    this.tempScaleLine.style.width = '0px'
    this.tempScaleLine.style.height = '2px'
    this.tempScaleLine.style.backgroundColor = '#22c55e'
    this.annotationsLayer.appendChild(this.tempScaleLine)
  }

  doDrawScale(e) {
    if (!this.tempScaleLine) return
    const coords = this.getImageCoords(e)
    const w = Math.abs(coords.x - this.scaleStartX)
    const x = Math.min(this.scaleStartX, coords.x)
    this.tempScaleLine.style.left = x + 'px'
    this.tempScaleLine.style.width = w + 'px'
  }

  endDrawScale(e) {
    this.isDrawingScale = false
    if (!this.tempScaleLine) return
    const coords = this.getImageCoords(e)
    const lengthPixels = Math.abs(coords.x - this.scaleStartX)

    this.tempScaleLine.remove()
    this.tempScaleLine = null

    if (lengthPixels > 10) {
      const lengthCm = prompt('请输入实际长度（厘米）：', '10')
      if (lengthCm && parseFloat(lengthCm) > 0) {
        this.createScaleMarker(
          Math.min(this.scaleStartX, coords.x),
          this.scaleStartY,
          lengthPixels,
          parseFloat(lengthCm)
        )
      }
    }
  }

  createScaleMarker(x, y, lengthPixels, lengthCm) {
    const data = {
      scale_marker: {
        x: x,
        y: y,
        length_pixels: lengthPixels,
        length_cm: lengthCm,
        orientation: 'horizontal'
      }
    }

    fetch(`/projects/${this.projectIdValue}/records/${this.recordIdValue}/scale_markers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfTokenValue,
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(marker => {
      this.addScaleMarkerToCanvas(marker)
      this.updateAnnotationCount()
    })
  }

  addScaleMarkerToCanvas(marker) {
    const el = document.createElement('div')
    el.className = 'scale-marker absolute pointer-events-auto'
    el.dataset.id = marker.id
    el.style.left = marker.x + 'px'
    el.style.top = marker.y + 'px'

    el.innerHTML = `
      <div class="relative" style="width: ${marker.length_pixels}px; height: 2px; background: #22c55e;">
        <div class="absolute -left-0.5 -top-1.5 w-1 h-4 bg-emerald-500"></div>
        <div class="absolute -right-0.5 -top-1.5 w-1 h-4 bg-emerald-500"></div>
      </div>
      <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-emerald-400 whitespace-nowrap">
        ${marker.length_cm} cm
      </div>
    `

    this.annotationsLayer.appendChild(el)
  }

  onWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    this.zoomAt(delta, e.clientX, e.clientY)
  }

  zoomIn() {
    this.zoomAt(1.2, this.canvasContainer.clientWidth / 2, this.canvasContainer.clientHeight / 2)
  }

  zoomOut() {
    this.zoomAt(0.8, this.canvasContainer.clientWidth / 2, this.canvasContainer.clientHeight / 2)
  }

  zoomAt(factor, cx, cy) {
    const rect = this.canvasContent.getBoundingClientRect()
    const oldScale = this.scale
    const newScale = Math.max(0.1, Math.min(5, this.scale * factor))

    const imageX = (cx - rect.left) / oldScale
    const imageY = (cy - rect.top) / oldScale

    this.scale = newScale
    this.panX = cx - imageX * newScale - this.canvasContainer.getBoundingClientRect().left
    this.panY = cy - imageY * newScale - this.canvasContainer.getBoundingClientRect().top

    this.applyTransform()
    this.updateZoomDisplay()
  }

  fitView() {
    if (!this.baseImage) return
    const containerRect = this.canvasContainer.getBoundingClientRect()

    let imgW, imgH
    if (this.baseImage.tagName === 'IMG') {
      imgW = this.baseImage.naturalWidth || 1832
      imgH = this.baseImage.naturalHeight || 1832
    } else {
      imgW = parseInt(this.baseImage.getAttribute('width')) || 1200
      imgH = parseInt(this.baseImage.getAttribute('height')) || 800
    }

    const scaleX = (containerRect.width - 40) / imgW
    const scaleY = (containerRect.height - 40) / imgH

    this.scale = Math.min(scaleX, scaleY, 1)
    this.panX = (containerRect.width - imgW * this.scale) / 2
    this.panY = (containerRect.height - imgH * this.scale) / 2

    this.applyTransform()
    this.updateZoomDisplay()
  }

  updateZoomDisplay() {
    const el = document.getElementById('zoom-level')
    if (el) el.textContent = Math.round(this.scale * 100) + '%'
  }

  updateAnnotationCount() {
    const count = this.annotationsLayer.querySelectorAll('.annotation-box').length
    const scaleCount = this.annotationsLayer.querySelectorAll('.scale-marker').length
    const el = document.getElementById('annotation-count-info')
    if (el) {
      el.innerHTML = `
        <span>标注总数:</span>
        <span class="font-medium text-slate-700">${count}</span>
        <span class="mx-2">·</span>
        <span>尺度尺:</span>
        <span class="font-medium text-slate-700">${scaleCount}</span>
      `
    }
  }
}
