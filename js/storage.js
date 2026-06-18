var Storage = {
    STORAGE_KEY: 'moss_post_office_save',

    save: function(gameState) {
        try {
            var data = JSON.stringify(gameState);
            localStorage.setItem(this.STORAGE_KEY, data);
            return true;
        } catch (e) {
            console.warn('保存失败:', e);
            return false;
        }
    },

    load: function() {
        try {
            var data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            console.warn('读取失败:', e);
            return null;
        }
    },

    clear: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.warn('清除失败:', e);
            return false;
        }
    },

    hasSave: function() {
        return this.load() !== null;
    }
};
