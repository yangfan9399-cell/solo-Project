const ModalUI = {
    modal: null,
    titleEl: null,
    textEl: null,
    closeBtn: null,
    onClose: null,

    init() {
        this.modal = document.getElementById('modal');
        this.titleEl = document.getElementById('modalTitle');
        this.textEl = document.getElementById('modalText');
        this.closeBtn = document.getElementById('modalClose');

        this.closeBtn.addEventListener('click', () => {
            this.hide();
            if (this.onClose) {
                this.onClose();
            }
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
                if (this.onClose) {
                    this.onClose();
                }
            }
        });
    },

    show(title, text, onClose) {
        if (!this.modal) return;

        this.titleEl.textContent = title;
        this.textEl.innerHTML = text;
        this.onClose = onClose || null;

        this.modal.classList.remove('hidden');
    },

    hide() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
    }
};
