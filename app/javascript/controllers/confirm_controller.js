import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    message: String,
    title: String
  }

  confirm(event) {
    if (!window.confirm(this.messageValue || "确定要执行此操作吗？")) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }
    return true
  }
}
