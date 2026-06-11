import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "backdrop"]
  static values = { open: Boolean }

  connect() {
    if (this.openValue) this.open()
  }

  open() {
    this.modalTarget.classList.remove('hidden')
    this.backdropTarget.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
    this.openValue = true
  }

  close() {
    this.modalTarget.classList.add('hidden')
    this.backdropTarget.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
    this.openValue = false
  }

  handleBackdropClick(event) {
    if (event.target === this.backdropTarget) {
      this.close()
    }
  }

  handleEscape(event) {
    if (event.key === 'Escape') {
      this.close()
    }
  }
}
