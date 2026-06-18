var ReplayTimeline = {
    container: null,
    history: [],
    currentStep: 0,
    onUndo: null,
    onJump: null,

    init: function(onUndoCallback, onJumpCallback) {
        this.container = document.getElementById('replay-content');
        this.onUndo = onUndoCallback;
        this.onJump = onJumpCallback;
        this.bindControls();
    },

    bindControls: function() {
        var self = this;
        var undoBtn = document.getElementById('btn-undo');
        var resetBtn = document.getElementById('btn-reset');
        
        if (undoBtn) {
            undoBtn.addEventListener('click', function() {
                if (self.onUndo && self.canUndo()) {
                    self.onUndo();
                }
            });
        }
    },

    setHistory: function(history, currentStep) {
        this.history = history || [];
        this.currentStep = currentStep || 0;
        this.render();
        this.updateButtons();
    },

    addStep: function(step) {
        this.history.push(step);
        this.currentStep = this.history.length;
        this.render();
        this.updateButtons();
    },

    canUndo: function() {
        return this.currentStep > 0;
    },

    undo: function() {
        if (this.canUndo()) {
            this.currentStep--;
            this.render();
            this.updateButtons();
        }
    },

    render: function() {
        if (this.history.length === 0) {
            this.container.innerHTML = '<div class="replay-empty">暂无记录</div>';
            return;
        }

        var html = '<div class="replay-timeline">';
        
        for (var i = 0; i < this.history.length; i++) {
            var step = this.history[i];
            var stepNum = i + 1;
            var isCurrent = (i < this.currentStep);
            var isLast = (i === this.currentStep - 1);
            
            var className = 'replay-item';
            if (isLast) className += ' current';
            
            var summary = this.summarizeStep(step);
            
            html += '<div class="' + className + '" data-step="' + i + '">';
            html += '<span class="replay-step">第' + stepNum + '步</span>';
            html += summary;
            html += '</div>';
        }
        
        html += '</div>';
        this.container.innerHTML = html;
        this.bindItemClicks();
        
        var timeline = this.container.querySelector('.replay-timeline');
        if (timeline) {
            timeline.scrollTop = timeline.scrollHeight;
        }
    },

    summarizeStep: function(step) {
        if (!step || !step.choice) return '开始游戏';
        
        var text = step.eventTitle + ' → ' + step.choiceText;
        if (text.length > 30) {
            text = text.substring(0, 28) + '...';
        }
        return text;
    },

    bindItemClicks: function() {
        var self = this;
        var items = this.container.querySelectorAll('.replay-item');
        
        items.forEach(function(item) {
            item.addEventListener('click', function() {
                var stepIndex = parseInt(item.getAttribute('data-step'));
                if (self.onJump) {
                    self.onJump(stepIndex + 1);
                }
            });
        });
    },

    updateButtons: function() {
        var undoBtn = document.getElementById('btn-undo');
        var resetBtn = document.getElementById('btn-reset');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
        }
        if (resetBtn) {
            resetBtn.disabled = (this.history.length === 0);
        }
    },

    clear: function() {
        this.history = [];
        this.currentStep = 0;
        this.render();
        this.updateButtons();
    }
};
