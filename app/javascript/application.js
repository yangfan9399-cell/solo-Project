// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"

document.addEventListener('DOMContentLoaded', function() {
  $(document).on('click', '.add_fields', function(event) {
    event.preventDefault();
    var time = new Date().getTime();
    var regexp = new RegExp($(this).data('id'), 'g');
    $(this).before($(this).data('fields').replace(regexp, time));
  });

  $(document).on('click', '.remove_fields', function(event) {
    event.preventDefault();
    $(this).prev('input[type=hidden]').val('1');
    $(this).closest('.nested-fields').hide();
  });
});
