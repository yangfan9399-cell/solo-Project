// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"

document.addEventListener('DOMContentLoaded', function() {
  // 动态添加嵌套字段
  document.addEventListener('click', function(event) {
    const target = event.target;

    // 处理添加字段按钮
    if (target.classList.contains('add_fields')) {
      event.preventDefault();
      const time = new Date().getTime();
      const id = target.dataset.id;
      const encodedFields = target.dataset.fields;
      
      // URL 解码字段模板
      let fields = decodeURIComponent(encodedFields);

      // 替换模板中的占位符
      const regexp = new RegExp(id, 'g');
      fields = fields.replace(regexp, time);

      // 创建临时容器
      const container = document.createElement('div');
      container.innerHTML = fields;
      const newFields = container.firstElementChild;

      // 插入到按钮前面
      target.parentNode.insertBefore(newFields, target);
    }

    // 处理删除字段按钮
    if (target.classList.contains('remove_fields')) {
      event.preventDefault();
      const hiddenInput = target.previousElementSibling;
      if (hiddenInput && hiddenInput.tagName === 'INPUT' && hiddenInput.type === 'hidden') {
        hiddenInput.value = '1';
      }
      const nestedFields = target.closest('.nested-fields');
      if (nestedFields) {
        nestedFields.style.display = 'none';
      }
    }
  });
});
