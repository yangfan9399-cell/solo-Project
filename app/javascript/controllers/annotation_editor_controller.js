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

    this.selectedAnnotation = null
    this.isDragging = false
    this.dragStartX = 0
    this.dragStartY = 0
    this.dragOffsetX = 0
    this.dragOffsetY = 0

    this.isResizing = false
    this.resizeHandle = null
    this.resizeStartX = 0
    this.resizeStartY = 0
    this.resizeStartWidth = 0
    this.resizeStartHeight = 0

    this.isDrawingScale = false
    this.scaleStartX = 0
    this.scaleStartY = 0
    this.tempScaleLine = null

    this.bindEvents()
    this.updateZoomDisplay()
  }

  bindEvents() {
    this.canvasContainer.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvasContainer.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvasContainer.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvasContainer.addEventListener('mouseleave', this.onMouseUp.bind(this))
    this.canvasContainer.addEventListener('wheel', this.onWheel.bind(this))

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('bg-amber-50', 'text-amber-700', 'ring-2', 'ring-amber-200'))
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
      btn.addEventListener('click', (e) => {
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
        btn.classList.add(...sevClasses[btn.dataset.severity].split(' '), 'ring-2', 'ring-offset-1', 'ring-slate-300')
        this.currentSeverity = btn.dataset.severity
      })
    })

    document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn())
    document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut())
    document.getElementById('fit-view').addEventListener('click', () => this.fitView())

    document.querySelectorAll('.annotation-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id
        this.selectAnnotation(id)
      })
    })

    document.getElementById('save-annotation').addEventListener('click', () => this.saveAnnotationProperties())
    document.getElementById('delete-annotation').addEventListener('click', () => this.deleteSelectedAnnotation())

    ;['prop-disease', 'prop-severity', 'prop-x', 'prop-y', 'prop-width', 'prop-height', 'prop-description'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.updateAnnotationFromProps())
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

  onMouseDown(e) {
    if (e.target.closest('.resize-handle')) {
      this.startResize(e)
      return
    }

    if (e.target.closest('.annotation-box')) {
      const box = e.target.closest('.annotation-box')
      this.selectAnnotation(box.dataset.id)
      this.startDrag(e)
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
    document.getElementById('cursor-pos').textContent = `X: ${coords.x}, Y: ${coords.y}`

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
    this.canvasContainer.style.cursor = 'grab'
  }

  applyTransform() {
    this.canvasContent.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`
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
    if (!this.tempRect) return
    const coords = this.getImageCoords(e)
    const x = Math.min(this.drawStartX, coords.x)
    const y = Math.min(this.drawStartY, coords.y)
    const w = Math.abs(coords.x - this.drawStartX)
    const h = Math.abs(coords.y - this.drawStartY)

    if (w > 5 && h > 5) {
      this.createAnnotation(x, y, w, h)
    }

    if (this.tempRect) {
      this.tempRect.remove()
      this.tempRect = null
    }
    this.isDrawing = false
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
    .then(response => response.json())
    .then(annotation => {
      this.addAnnotationToCanvas(annotation)
      this.addAnnotationToList(annotation)
      this.selectAnnotation(annotation.id)
      this.updateAnnotationCount()
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

    let listContainer = document.querySelector('.flex-1.overflow-y-auto > .divide-y')
    let emptyState = document.querySelector('.flex-1.overflow-y-auto > .p-8.text-center')

    if (!listContainer) {
      if (emptyState) emptyState.remove()
      listContainer = document.createElement('div')
      listContainer.className = 'divide-y divide-slate-100'
      document.querySelector('.flex-1.overflow-y-auto').insertBefore(
        listContainer,
        document.getElementById('annotation-properties')
      )
    }

    const item = document.createElement('div')
    item.className = 'annotation-item p-3 hover:bg-slate-50 cursor-pointer'
    item.dataset.id = annotation.id
    item.dataset.disease = annotation.disease_type
    item.dataset.severity = annotation.severity
    item.dataset.description = annotation.description || ''

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
      this.selectAnnotation(annotation.id)
    })

    listContainer.insertBefore(item, listContainer.firstChild)
  }

  addAnnotationToCanvas(annotation) {
    const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
    const color = annotation.color || this.defaultColor(annotation.disease_type)

    const box = document.createElement('div')
    box.className = 'annotation-box absolute border-2 cursor-pointer pointer-events-auto'
    box.dataset.id = annotation.id
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
    const colors = {
      flaking: '#ef4444',
      efflorescence: '#f59e0b',
      discoloration: '#8b5cf6',
      crack: '#3b82f6',
      other: '#6b7280'
    }
    return colors[type] || '#6b7280'
  }

  selectAnnotation(id) {
    document.querySelectorAll('.annotation-box').forEach(box => {
      box.classList.remove('ring-2', 'ring-offset-1', 'ring-amber-500')
    })
    document.querySelectorAll('.annotation-item').forEach(item => {
      item.classList.remove('bg-amber-50')
    })

    const box = document.querySelector(`.annotation-box[data-id="${id}"]`)
    const item = document.querySelector(`.annotation-item[data-id="${id}"]`)

    if (box) {
      box.classList.add('ring-2', 'ring-offset-1', 'ring-amber-500')
      this.selectedAnnotation = box
      this.showAnnotationProperties(box)
    }
    if (item) {
      item.classList.add('bg-amber-50')
    }

    if (box) {
      const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
      const sevNames = { mild: '轻微', moderate: '中等', severe: '重度' }
      document.getElementById('selected-info').textContent =
        `${diseaseNames[box.dataset.disease]} (${sevNames[box.dataset.severity]}) - ${box.offsetWidth}×${box.offsetHeight}px`
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
    if (!this.selectedAnnotation) return

    const disease = document.getElementById('prop-disease').value
    const severity = document.getElementById('prop-severity').value
    const x = parseInt(document.getElementById('prop-x').value) || 0
    const y = parseInt(document.getElementById('prop-y').value) || 0
    const width = parseInt(document.getElementById('prop-width').value) || 0
    const height = parseInt(document.getElementById('prop-height').value) || 0
    const description = document.getElementById('prop-description').value

    const color = this.defaultColor(disease)

    this.selectedAnnotation.dataset.disease = disease
    this.selectedAnnotation.dataset.severity = severity
    this.selectedAnnotation.dataset.description = description
    this.selectedAnnotation.style.left = x + 'px'
    this.selectedAnnotation.style.top = y + 'px'
    this.selectedAnnotation.style.width = width + 'px'
    this.selectedAnnotation.style.height = height + 'px'
    this.selectedAnnotation.style.borderColor = color
    this.selectedAnnotation.style.backgroundColor = color + '20'

    const label = this.selectedAnnotation.querySelector('div:first-child')
    if (label) {
      const diseaseNames = { flaking: '起甲', efflorescence: '酥碱', discoloration: '变色', crack: '裂隙', other: '其他' }
      label.textContent = diseaseNames[disease] || disease
      label.style.backgroundColor = color
    }

    const handle = this.selectedAnnotation.querySelector('.resize-handle')
    if (handle) {
      handle.style.borderColor = color
    }
  }

  saveAnnotationProperties() {
    if (!this.selectedAnnotation) return

    const id = this.selectedAnnotation.dataset.id
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
    })
  }

  deleteSelectedAnnotation() {
    if (!this.selectedAnnotation) return
    if (!confirm('确定删除此标注吗？')) return

    const id = this.selectedAnnotation.dataset.id

    fetch(`/projects/${this.projectIdValue}/records/${this.recordIdValue}/annotations/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': this.csrfTokenValue,
        'Accept': 'application/json'
      }
    })
    .then(() => {
      this.selectedAnnotation.remove()
      const item = document.querySelector(`.annotation-item[data-id="${id}"]`)
      if (item) item.remove()
      this.selectedAnnotation = null
      document.getElementById('annotation-properties').classList.add('hidden')
      document.getElementById('selected-info').textContent = '未选择标注'
      this.updateAnnotationCount()
    })
  }

  startDrag(e) {
    if (this.currentTool !== 'select') return
    this.isDragging = true
    const coords = this.getImageCoords(e)
    this.dragStartX = coords.x
    this.dragStartY = coords.y
    this.dragOffsetX = coords.x - parseInt(this.selectedAnnotation.style.left)
    this.dragOffsetY = coords.y - parseInt(this.selectedAnnotation.style.top)
  }

  doDrag(e) {
    if (!this.selectedAnnotation) return
    const coords = this.getImageCoords(e)
    const x = Math.round(coords.x - this.dragOffsetX)
    const y = Math.round(coords.y - this.dragOffsetY)
    this.selectedAnnotation.style.left = x + 'px'
    this.selectedAnnotation.style.top = y + 'px'
    document.getElementById('prop-x').value = x
    document.getElementById('prop-y').value = y
  }

  endDrag() {
    if (!this.isDragging) return
    this.isDragging = false
    this.saveAnnotationProperties()
  }

  startResize(e) {
    e.stopPropagation()
    if (!this.selectedAnnotation) return
    this.isResizing = true
    const coords = this.getImageCoords(e)
    this.resizeStartX = coords.x
    this.resizeStartY = coords.y
    this.resizeStartWidth = parseInt(this.selectedAnnotation.style.width)
    this.resizeStartHeight = parseInt(this.selectedAnnotation.style.height)
  }

  doResize(e) {
    if (!this.selectedAnnotation) return
    const coords = this.getImageCoords(e)
    const dx = coords.x - this.resizeStartX
    const dy = coords.y - this.resizeStartY
    const w = Math.max(5, this.resizeStartWidth + dx)
    const h = Math.max(5, this.resizeStartHeight + dy)
    this.selectedAnnotation.style.width = w + 'px'
    this.selectedAnnotation.style.height = h + 'px'
    document.getElementById('prop-width').value = Math.round(w)
    document.getElementById('prop-height').value = Math.round(h)
  }

  endResize() {
    if (!this.isResizing) return
    this.isResizing = false
    this.saveAnnotationProperties()
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
    if (!this.tempScaleLine) return
    const coords = this.getImageCoords(e)
    const lengthPixels = Math.abs(coords.x - this.scaleStartX)

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

    if (this.tempScaleLine) {
      this.tempScaleLine.remove()
      this.tempScaleLine = null
    }
    this.isDrawingScale = false
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
      this.updateScaleCount()
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

    this.panX = cx - imageX * newScale
    this.panY = cy - imageY * newScale

    this.applyTransform()
    this.updateZoomDisplay()
  }

  fitView() {
    const containerRect = this.canvasContainer.getBoundingClientRect()
    const contentRect = this.baseImage.getBoundingClientRect()

    const scaleX = (containerRect.width - 40) / (this.baseImage.width || 1200)
    const scaleY = (containerRect.height - 40) / (this.baseImage.height || 800)

    this.scale = Math.min(scaleX, scaleY, 1)
    this.panX = 0
    this.panY = 0

    this.applyTransform()
    this.updateZoomDisplay()
  }

  updateZoomDisplay() {
    document.getElementById('zoom-level').textContent = Math.round(this.scale * 100) + '%'
  }

  updateAnnotationCount() {
    const count = document.querySelectorAll('.annotation-box').length
    const scaleCount = document.querySelectorAll('.scale-marker').length
    const infoEl = document.querySelector('.space-y-2 .text-xs')
    if (infoEl) {
      infoEl.innerHTML = `
        <span>标注总数:</span>
        <span class="font-medium text-slate-700">${count}</span>
        <span class="mx-2">·</span>
        <span>尺度尺:</span>
        <span class="font-medium text-slate-700">${scaleCount}</span>
      `
    }
  }

  updateScaleCount() {
    this.updateAnnotationCount()
  }
}
