import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "content"]

  open() {
    this.containerTarget.classList.remove("hidden")
    this.containerTarget.classList.add("flex")
    document.body.classList.add("overflow-hidden")
  }

  close() {
    this.containerTarget.classList.add("hidden")
    this.containerTarget.classList.remove("flex")
    document.body.classList.remove("overflow-hidden")
  }

  closeOnBackground(event) {
    if (event.target === this.containerTarget) {
      this.close()
    }
  }

  closeOnEscape(event) {
    if (event.key === "Escape") {
      this.close()
    }
  }

  connect() {
    document.addEventListener("keydown", this.closeOnEscape.bind(this))
  }

  disconnect() {
    document.removeEventListener("keydown", this.closeOnEscape.bind(this))
  }
}
