"""
游戏服务层 - 处理游戏流程管理
"""
import copy
from typing import Dict, Tuple, Optional, List
from django.utils import timezone

from .models import Level, GameSession, FoldHistory, DeliveryDetail, GameResult
from .game_logic import (
    create_initial_game_state,
    fold_paper,
    validate_move,
    validate_delivery,
    calculate_score,
    calculate_rank,
    generate_session_id,
    check_special_addresses_unlocked,
)


class GameService:
    """游戏服务类"""
    
    @staticmethod
    def start_new_game(level_id: int, player=None) -> GameSession:
        """开始新游戏"""
        level = Level.objects.get(id=level_id)
        session_id = generate_session_id()
        
        initial_state = create_initial_game_state(level)
        
        remaining_letters = copy.deepcopy(level.letters)
        
        session = GameSession.objects.create(
            level=level,
            player=player,
            session_id=session_id,
            current_state=initial_state,
            postman_position={'x': level.post_office['x'], 'y': level.post_office['y']},
            remaining_letters=remaining_letters,
            delivered_letters=[],
        )
        
        DeliveryDetail.objects.create(
            game_session=session,
            step_number=0,
            action='move',
            to_position={'x': level.post_office['x'], 'y': level.post_office['y']},
            state_before=initial_state,
            state_after=initial_state,
            is_valid=True,
            step_cost=0,
        )
        
        return session
    
    @staticmethod
    def get_session(session_id: str) -> Optional[GameSession]:
        """获取游戏会话"""
        try:
            return GameSession.objects.get(session_id=session_id)
        except GameSession.DoesNotExist:
            return None
    
    @staticmethod
    def move_postman(session: GameSession, to_x: int, to_y: int) -> Tuple[bool, str, Dict]:
        """移动邮差"""
        if session.status != 'playing':
            return False, f"游戏已{session.get_status_display()}", {}
        
        from_pos = (session.postman_position['x'], session.postman_position['y'])
        to_pos = (to_x, to_y)
        
        if from_pos == to_pos:
            return False, "邮差已经在该位置", {}
        
        if session.step_count >= session.level.max_steps:
            return False, "已达到最大步数限制", {}
        
        is_valid, error_msg = validate_move(session.current_state, session.level, from_pos, to_pos)
        
        state_before = copy.deepcopy(session.current_state)
        state_after = copy.deepcopy(session.current_state)
        
        detail = DeliveryDetail.objects.create(
            game_session=session,
            step_number=session.delivery_details.count(),
            action='move',
            from_position={'x': from_pos[0], 'y': from_pos[1]},
            to_position={'x': to_x, 'y': to_y},
            state_before=state_before,
            state_after=state_after,
            is_valid=is_valid,
            error_message=error_msg,
            step_cost=1 if is_valid else 0,
        )
        
        if not is_valid:
            return False, error_msg, {}
        
        session.postman_position = {'x': to_x, 'y': to_y}
        session.current_state = state_after
        session.step_count += detail.step_cost
        session.save()
        
        GameService._check_game_end(session)
        
        return True, "移动成功", {
            'detail_id': detail.id,
            'new_position': session.postman_position,
            'step_count': session.step_count,
        }
    
    @staticmethod
    def deliver_letter(session: GameSession, letter_id: str) -> Tuple[bool, str, Dict]:
        """投递信件"""
        if session.status != 'playing':
            return False, f"游戏已{session.get_status_display()}", {}
        
        postman_pos = (session.postman_position['x'], session.postman_position['y'])
        
        letter = None
        for l in session.remaining_letters:
            if l['id'] == letter_id:
                letter = l
                break
        
        if not letter:
            return False, f"找不到信件 {letter_id}", {}
        
        is_valid, error_msg = validate_delivery(session.current_state, session.level, postman_pos, letter)
        
        state_before = copy.deepcopy(session.current_state)
        state_after = copy.deepcopy(session.current_state)
        
        detail = DeliveryDetail.objects.create(
            game_session=session,
            step_number=session.delivery_details.count(),
            action='deliver',
            from_position={'x': postman_pos[0], 'y': postman_pos[1]},
            to_position={'x': postman_pos[0], 'y': postman_pos[1]},
            letter_color=letter.get('color'),
            address_id=letter.get('address_id'),
            state_before=state_before,
            state_after=state_after,
            is_valid=is_valid,
            error_message=error_msg,
            step_cost=1 if is_valid else 0,
        )
        
        if not is_valid:
            return False, error_msg, {}
        
        remaining = [l for l in session.remaining_letters if l['id'] != letter_id]
        delivered = session.delivered_letters + [letter]
        
        session.remaining_letters = remaining
        session.delivered_letters = delivered
        session.step_count += detail.step_cost
        session.save()
        
        GameService._check_game_end(session)
        
        return True, f"成功投递 {letter.get('color')} 信件", {
            'detail_id': detail.id,
            'delivered_count': len(delivered),
            'remaining_count': len(remaining),
        }
    
    @staticmethod
    def fold_map(session: GameSession, direction: str, fold_line: int) -> Tuple[bool, str, Dict]:
        """折叠地图"""
        if session.status != 'playing':
            return False, f"游戏已{session.get_status_display()}", {}
        
        allowed_directions = session.level.fold_directions
        if allowed_directions and direction not in allowed_directions:
            return False, f"不允许的折叠方向: {direction}", {}
        
        state_before = copy.deepcopy(session.current_state)
        new_state, fold_info = fold_paper(state_before, direction, fold_line, session.level)
        
        fold_history = FoldHistory.objects.create(
            game_session=session,
            fold_number=session.fold_count + 1,
            direction=direction,
            fold_line=fold_line,
            crease_lines=fold_info['crease_lines'],
            merged_cells=fold_info['merged_cells'],
            new_adjacencies=fold_info['new_adjacencies'],
            removed_adjacencies=fold_info['removed_adjacencies'],
            state_before=state_before,
            state_after=new_state,
        )
        
        detail = DeliveryDetail.objects.create(
            game_session=session,
            step_number=session.delivery_details.count(),
            action='fold',
            fold_history=fold_history,
            state_before=state_before,
            state_after=new_state,
            is_valid=True,
            step_cost=2,
        )
        
        if session.step_count + detail.step_cost > session.level.max_steps:
            return False, "折叠会超过最大步数限制", {}
        
        session.current_state = new_state
        session.fold_count += 1
        session.step_count += detail.step_cost
        session.save()
        
        GameService._check_game_end(session)
        
        return True, f"成功折叠地图（{direction}）", {
            'fold_history_id': fold_history.id,
            'detail_id': detail.id,
            'fold_count': session.fold_count,
            'new_adjacencies_count': len(fold_info['new_adjacencies']),
        }
    
    @staticmethod
    def undo_action(session: GameSession) -> Tuple[bool, str, Dict]:
        """撤销上一步操作"""
        if session.status != 'playing':
            return False, f"游戏已{session.get_status_display()}", {}
        
        details = session.delivery_details.order_by('-step_number')
        valid_details = [d for d in details if d.action != 'undo']
        if len(valid_details) <= 1:
            return False, "没有可撤销的操作", {}
        
        last_detail = valid_details[0]
        state_to_restore = last_detail.state_before
        
        if last_detail.action == 'fold' and last_detail.fold_history:
            last_detail.fold_history.delete()
            session.fold_count = max(0, session.fold_count - 1)
        
        if last_detail.is_valid:
            session.step_count = max(0, session.step_count - last_detail.step_cost)
        
        if last_detail.action == 'deliver' and last_detail.letter_color:
            for delivered in session.delivered_letters:
                if delivered.get('color') == last_detail.letter_color:
                    session.delivered_letters.remove(delivered)
                    session.remaining_letters.append(delivered)
                    break
        
        session.current_state = state_to_restore
        session.save()
        
        last_detail.delete()
        
        undo_detail = DeliveryDetail.objects.create(
            game_session=session,
            step_number=session.delivery_details.count(),
            action='undo',
            state_before=last_detail.state_after,
            state_after=state_to_restore,
            is_valid=True,
            step_cost=0,
        )
        
        return True, "撤销成功", {
            'step_count': session.step_count,
            'fold_count': session.fold_count,
        }
    
    @staticmethod
    def _check_game_end(session: GameSession) -> None:
        """检查游戏是否结束"""
        if len(session.remaining_letters) == 0:
            GameService._finish_game(session, 'won')
        elif session.step_count >= session.level.max_steps:
            GameService._finish_game(session, 'lost')
    
    @staticmethod
    def _finish_game(session: GameSession, status: str) -> None:
        """结束游戏并创建结果记录"""
        session.status = status
        session.ended_at = timezone.now()
        
        level = session.level
        final_score, score_breakdown = calculate_score(session, level)
        session.score = final_score
        session.save()
        
        is_optimal = False
        optimal_steps = None
        optimal_folds = None
        
        if level.min_solution:
            optimal_steps = level.min_solution.get('steps')
            optimal_folds = level.min_solution.get('folds')
            if session.step_count <= (optimal_steps or 999) and \
               session.fold_count <= (optimal_folds or 999):
                is_optimal = True
        
        special_unlocked = check_special_addresses_unlocked(session.current_state, level)
        required_folds_used = [
            d for d in session.current_state.get('fold_directions_used', [])
            if d in level.required_folds
        ]
        
        final_rank = calculate_rank(final_score, len(level.letters), is_optimal)
        
        GameResult.objects.create(
            game_session=session,
            is_success=(status == 'won'),
            final_score=final_score,
            steps_used=session.step_count,
            folds_used=session.fold_count,
            delivered_count=len(session.delivered_letters),
            total_letters=len(level.letters),
            optimal_steps=optimal_steps,
            optimal_folds=optimal_folds,
            is_optimal=is_optimal,
            special_addresses_unlocked=special_unlocked,
            required_folds_used=required_folds_used,
            score_breakdown=score_breakdown,
            final_rank=final_rank,
        )
    
    @staticmethod
    def get_game_history(session: GameSession) -> Dict:
        """获取游戏历史记录"""
        fold_histories = list(session.fold_histories.order_by('fold_number').values())
        delivery_details = list(session.delivery_details.order_by('step_number').values())
        
        return {
            'session_id': session.session_id,
            'status': session.status,
            'status_display': session.get_status_display(),
            'fold_histories': fold_histories,
            'delivery_details': delivery_details,
            'result': session.result.values() if hasattr(session, 'result') else None,
        }
    
    @staticmethod
    def compare_with_optimal(session: GameSession) -> Dict:
        """与最短解对比"""
        level = session.level
        if not level.min_solution:
            return {
                'has_optimal': False,
                'message': '该关卡暂无最短解数据',
            }
        
        optimal = level.min_solution
        actual_steps = session.step_count
        actual_folds = session.fold_count
        
        steps_diff = actual_steps - optimal.get('steps', 0)
        folds_diff = actual_folds - optimal.get('folds', 0)
        
        return {
            'has_optimal': True,
            'optimal_steps': optimal.get('steps'),
            'optimal_folds': optimal.get('folds'),
            'optimal_description': optimal.get('description', ''),
            'actual_steps': actual_steps,
            'actual_folds': actual_folds,
            'steps_diff': steps_diff,
            'folds_diff': folds_diff,
            'is_better_or_equal': steps_diff <= 0 and folds_diff <= 0,
        }
