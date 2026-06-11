import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    setTimeout(() => {
      this.element.style.opacity = '0'
      this.element.style.transform = 'translateY(-10px)'
      this.element.style.transition = 'all 0.3s ease'
      setTimeout(() => this.remove(), 300)
    }, 3000)
  }

  remove() {
    this.element.remove()
  }
}
