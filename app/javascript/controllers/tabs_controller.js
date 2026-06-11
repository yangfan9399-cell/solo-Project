import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab"]
  static values = { default: String }

  connect() {
    this.activeTab = this.defaultValue || this.tabTargets[0]?.dataset.tabId
    this.activateTab(this.activeTab)
  }

  select(event) {
    event.preventDefault()
    const tabId = event.currentTarget.dataset.tabId
    if (tabId) this.activateTab(tabId)
  }

  activateTab(tabId) {
    this.tabTargets.forEach(tab => {
      const isActive = tab.dataset.tabId === tabId
      const btn = document.querySelector(`[data-tab-id="${tab.dataset.tabId}"][data-tabs-target="tab"]`)
      if (tab.dataset.tabId === tabId) {
        tab.classList.remove('hidden')
        tab.classList.add('block')
      } else {
        tab.classList.add('hidden')
        tab.classList.remove('block')
      }
    })

    document.querySelectorAll('[data-tabs-target="tab"]').forEach(btn => {
      if (btn.dataset.tabId === tabId) {
        btn.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50')
        btn.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50')
      } else {
        btn.classList.remove('border-blue-500', 'text-blue-600', 'bg-blue-50')
        btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50')
      }
    })

    this.activeTab = tabId
  }
}
