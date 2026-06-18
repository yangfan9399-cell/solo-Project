var EventBox = {
    container: null,
    currentEvent: null,
    onChoice: null,

    init: function(onChoiceCallback) {
        this.container = document.getElementById('event-content');
        this.onChoice = onChoiceCallback;
    },

    showEmpty: function() {
        this.container.innerHTML = '<div class="event-empty">等待抽取事件...</div>';
        this.currentEvent = null;
    },

    showEvent: function(event, currentState) {
        this.currentEvent = event;
        
        var html = '<div class="event-card">';
        html += '<div class="event-title">' + event.title + '</div>';
        html += '<div class="event-description">' + event.description + '</div>';
        html += '<div class="event-choices">';
        
        for (var i = 0; i < event.choices.length; i++) {
            var choice = event.choices[i];
            var disabled = '';
            
            if (choice.requires) {
                var canChoose = true;
                for (var reqKey in choice.requires) {
                    if (currentState[reqKey] < choice.requires[reqKey]) {
                        canChoose = false;
                        break;
                    }
                }
                if (!canChoose) {
                    disabled = 'disabled style="opacity: 0.5; cursor: not-allowed;"';
                }
            }
            
            html += '<button class="event-choice" data-choice-index="' + i + '" ' + disabled + '>';
            html += choice.text;
            html += '<span class="choice-effect">' + choice.effectText + '</span>';
            html += '</button>';
        }
        
        html += '</div></div>';
        
        this.container.innerHTML = html;
        this.bindEvents();
    },

    bindEvents: function() {
        var self = this;
        var buttons = this.container.querySelectorAll('.event-choice');
        
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (btn.disabled) return;
                var index = parseInt(btn.getAttribute('data-choice-index'));
                if (self.onChoice && self.currentEvent) {
                    self.onChoice(self.currentEvent, self.currentEvent.choices[index]);
                }
            });
        });
    },

    showResult: function(event, choice, state) {
        var html = '<div class="event-card">';
        html += '<div class="event-title">' + event.title + '</div>';
        html += '<div class="event-description">';
        html += '你选择了：<strong>' + choice.text + '</strong><br><br>';
        html += '效果：' + choice.effectText;
        html += '</div>';
        html += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 0.9rem; color: #666;">';
        html += '点击「抽取事件」继续下一回合';
        html += '</div>';
        html += '</div>';
        
        this.container.innerHTML = html;
        this.currentEvent = null;
    }
};
