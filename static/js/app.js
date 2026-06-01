document.addEventListener("DOMContentLoaded", function () {
  if (typeof htmx !== "undefined") {
    htmx.config.defaultSwapStyle = "innerHTML";

    document.body.addEventListener("htmx:beforeRequest", function (event) {
      var indicator = event.detail.elt.querySelector(".htmx-indicator");
      if (indicator) {
        indicator.style.display = "inline-block";
      }
    });

    document.body.addEventListener("htmx:afterRequest", function (event) {
      var indicator = event.detail.elt.querySelector(".htmx-indicator");
      if (indicator) {
        indicator.style.display = "none";
      }

      if (event.detail.successful) {
        var xhr = event.detail.xhr;
        var toastMsg = xhr.getResponseHeader("X-Toast-Message");
        var toastType = xhr.getResponseHeader("X-Toast-Type") || "success";
        if (toastMsg) {
          showToast(decodeURIComponent(toastMsg), toastType);
        }
      }
    });
  }

  var sidebar = document.querySelector(".sidebar");
  var toggleBtn = document.querySelector(".sidebar__toggle");
  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("sidebar--collapsed");
      localStorage.setItem(
        "sidebar-collapsed",
        sidebar.classList.contains("sidebar--collapsed")
      );
    });

    if (localStorage.getItem("sidebar-collapsed") === "true") {
      sidebar.classList.add("sidebar--collapsed");
    }
  }
});

function showToast(message, type) {
  type = type || "success";
  var container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  var flashClassMap = {
    success: "flash--success",
    error: "flash--error",
    warning: "flash--warning",
    info: "flash--info",
  };

  var toast = document.createElement("div");
  toast.className = "flash " + (flashClassMap[type] || "flash--success");
  toast.style.animation = "slideIn 0.3s ease";

  var textSpan = document.createElement("span");
  textSpan.textContent = message;
  toast.appendChild(textSpan);

  var closeBtn = document.createElement("button");
  closeBtn.style.cssText =
    "background:none;border:none;cursor:pointer;font-size:16px;margin-left:12px;opacity:0.6;padding:0;";
  closeBtn.textContent = "\u00D7";
  closeBtn.addEventListener("click", function () {
    removeToast(toast);
  });
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  setTimeout(function () {
    removeToast(toast);
  }, 3000);
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.style.opacity = "0";
  toast.style.transform = "translateX(100%)";
  toast.style.transition = "opacity 0.3s, transform 0.3s";
  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

function confirmAction(message) {
  return confirm(message);
}

function validateForm(formEl) {
  var isValid = true;
  var requiredFields = formEl.querySelectorAll("[required]");
  var errorClass = "form-error";

  requiredFields.forEach(function (field) {
    var existingError = field.parentNode.querySelector("." + errorClass);
    if (existingError) {
      existingError.remove();
    }
    field.style.borderColor = "";

    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = "var(--danger)";
      var error = document.createElement("div");
      error.className = errorClass;
      error.textContent = "此字段为必填项";
      field.parentNode.appendChild(error);
    }
  });

  var emailFields = formEl.querySelectorAll('input[type="email"]');
  emailFields.forEach(function (field) {
    if (field.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
      isValid = false;
      field.style.borderColor = "var(--danger)";
      var existingError = field.parentNode.querySelector("." + errorClass);
      if (!existingError) {
        var error = document.createElement("div");
        error.className = errorClass;
        error.textContent = "请输入有效的邮箱地址";
        field.parentNode.appendChild(error);
      }
    }
  });

  return isValid;
}

function clearFormErrors(formEl) {
  formEl.querySelectorAll(".form-error").forEach(function (el) {
    el.remove();
  });
  formEl.querySelectorAll("[required]").forEach(function (field) {
    field.style.borderColor = "";
  });
}

function initFormValidation(formEl) {
  formEl.addEventListener("submit", function (e) {
    clearFormErrors(formEl);
    if (!validateForm(formEl)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  formEl.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("input", function () {
      field.style.borderColor = "";
      var error = field.parentNode.querySelector(".form-error");
      if (error) {
        error.remove();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("form[data-validate]").forEach(initFormValidation);
});
