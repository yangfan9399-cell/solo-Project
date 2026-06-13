import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["form", "status"]

  connect() {
    this.lastSaved = null
  }

  save() {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.performSave()
    }, 2000)
  }

  async performSave() {
    this.showStatus("正在保存...", "text-blue-600")

    try {
      const formData = new FormData(this.formTarget)
      const url = this.formTarget.action
      const method = this.formTarget.method

      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json"
        }
      })

      if (response.ok) {
        this.lastSaved = new Date()
        this.showStatus(`已保存于 ${this.formatTime(this.lastSaved)}`, "text-green-600")
      } else {
        this.showStatus("保存失败，请重试", "text-red-600")
      }
    } catch (error) {
      this.showStatus("保存失败，请重试", "text-red-600")
    }
  }

  showStatus(message, colorClass) {
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = message
      this.statusTarget.className = `text-xs ${colorClass}`
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
}
