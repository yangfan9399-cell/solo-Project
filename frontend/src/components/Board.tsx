import { Cell, GameSession, MazeConfig } from '../types';

interface BoardProps {
  maze: MazeConfig;
  session: GameSession;
  onMove: (x: number, y: number) => void;
}

export function Board({ maze, session, onMove }: BoardProps) {
  const isPath = (x: number, y: number) =>
    session.path.some((p) => p.x === x && p.y === y);
  const isCurrent = (x: number, y: number) =>
    session.currentPos.x === x && session.currentPos.y === y;
  const canReach = (x: number, y: number) => {
    if (session.status !== 'playing') return false;
    const dx = Math.abs(x - session.currentPos.x);
    const dy = Math.abs(y - session.currentPos.y);
    if (dx + dy !== 1) return false;
    const cell = maze.grid[y]?.[x];
    return cell && cell.type !== 'wall';
  };

  const getCellClass = (cell: Cell) => {
    const classes = ['cell', `cell-${cell.type}`];
    if (cell.reverseMark) classes.push('cell-reverse');
    if (cell.groove) classes.push('cell-groove');
    if (isPath(cell.x, cell.y)) classes.push('cell-path');
    if (isCurrent(cell.x, cell.y)) classes.push('cell-current');
    if (canReach(cell.x, cell.y)) classes.push('cell-reachable');
    if (session.hiddenTriggered && cell.type === 'hidden') classes.push('cell-hidden-on');
    return classes.join(' ');
  };

  const cellSymbol = (cell: Cell) => {
    switch (cell.type) {
      case 'wall': return '▓';
      case 'start': return '◎';
      case 'end': return '★';
      case 'reward': return '◆';
      case 'trap': return '▲';
      case 'event': return '✦';
      case 'hidden': return session.hiddenTriggered ? '❖' : '◇';
      default: return cell.groove ? '~' : cell.reverseMark ? '¬' : '';
    }
  };

  return (
    <div className="board-wrap">
      <h2 className="section-title">局面盘 · {maze.name}</h2>
      <div
        className="maze-grid"
        style={{
          gridTemplateColumns: `repeat(${maze.width}, 48px)`,
        }}
      >
        {maze.grid.flat().map((cell) => (
          <div
            key={`${cell.x}-${cell.y}`}
            className={getCellClass(cell)}
            onClick={() => canReach(cell.x, cell.y) && onMove(cell.x, cell.y)}
            title={`(${cell.x},${cell.y}) ${cell.type}`}
          >
            <span className="cell-symbol">{cellSymbol(cell)}</span>
          </div>
        ))}
      </div>
      <div className="board-legend">
        <span><b>◎</b>起点</span>
        <span><b>★</b>终点</span>
        <span><b>◆</b>奖励</span>
        <span><b>▲</b>陷阱</span>
        <span><b>✦</b>事件</span>
        <span><b>~</b>描线槽</span>
        <span><b>¬</b>倒排痕</span>
        <span><b>◇</b>隐藏</span>
      </div>
    </div>
  );
}
