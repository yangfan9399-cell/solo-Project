import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["message"]

  connect() {
    this.timeout = setTimeout(() => {
      this.close()
    }, 5000)
  }

  disconnect() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }

  close() {
    this.element.classList.add("opacity-0", "translate-y-[-10px]")
    this.element.classList.add("transition-all", "duration-300")
    setTimeout(() => {
      this.element.remove()
    }, 300)
  }
}
