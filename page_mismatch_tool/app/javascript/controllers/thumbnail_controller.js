import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = []

  connect() {
  }

  openEditor() {
    const mappingId = this.element.dataset.mappingId
    const row = document.querySelector(`tr[data-mapping-id="${mappingId}"]`) || document.getElementById(`page_mapping_${mappingId}`)

    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" })
      row.classList.add("bg-blue-50", "ring-2", "ring-blue-400")
      setTimeout(() => {
        row.classList.remove("bg-blue-50", "ring-2", "ring-blue-400")
      }, 2000)

      const input = row.querySelector("input[type='number'], select, input[type='text']")
      if (input) input.focus()
    }
  }
}
