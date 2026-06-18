document.addEventListener('DOMContentLoaded', () => {
    Board.init();
    Events.init();
    Timeline.init();
    Settlement.init();
    UI.init();

    const hasSavedGame = GameState.load();
    
    if (hasSavedGame && GameState.initialized) {
        UI.showModal(
            '发现存档',
            `检测到之前的游戏进度：\n\n${GameState.getGameConfig()?.name || '未知游戏'}\n回合：${GameState.currentTurn}/${GameState.getGameConfig()?.turns || 0}\n\n是否继续？`,
            () => {
                Game.resume();
            }
        );
    }

    console.log('❄️ 霜花塔楼竞速经营游戏已加载');
    console.log('📁 项目结构：');
    console.log('   - index.html - 主页面');
    console.log('   - styles.css - 样式文件');
    console.log('   - js/config.js - 游戏配置（三局数据、公式）');
    console.log('   - js/state.js - 状态管理与本地存储');
    console.log('   - js/board.js - 局面盘组件');
    console.log('   - js/events.js - 事件匣组件');
    console.log('   - js/timeline.js - 回放轴组件');
    console.log('   - js/settlement.js - 结算簿组件');
    console.log('   - js/game.js - 游戏主逻辑');
    console.log('   - js/main.js - 入口文件');
    console.log('\n💾 游戏进度自动保存到 localStorage，刷新后可继续');
    console.log('📊 结算由前端按公式重算，确保结果可追溯');
});
