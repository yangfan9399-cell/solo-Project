"""
结算系统模块
实现后端重新计算分数和日终账单
"""
from django.utils import timezone
from .models import GameSession, Settlement, Order, ActionHistory
from .game_logic import PRIORITY_CONFIG


class SettlementCalculator:
    """
    结算计算器
    核心功能：从操作历史重新计算所有分数
    确保分数由后端独立核算，防止前端作弊
    """

    def __init__(self, session: GameSession):
        self.session = session
        self.level = session.level

    def recalculate_all(self):
        """
        重新计算所有分数 - 后端独立核算
        这是核心要求：至少一处由后端重新计算的分数或结果
        """
        actions = ActionHistory.objects.filter(
            session=self.session
        ).order_by('sequence')

        total_income = 0
        total_cost = 0
        total_tip = 0
        orders_completed = 0
        orders_failed = 0
        perfect_orders = 0
        late_orders = 0

        order_data = {}

        for action in actions:
            data = action.get_action_data()

            if action.action_type == 'order_complete':
                orders_completed += 1
                total_income += data['money']
                total_tip += data['tip']

                order_id = data['order_id']
                time_remaining = data['time_remaining']
                time_limit = data.get('time_limit', 120)

                if time_remaining > time_limit * 0.5:
                    perfect_orders += 1
                elif time_remaining < 0:
                    late_orders += 1

                if order_id not in order_data:
                    order_data[order_id] = {
                        'priority': data.get('priority', 'normal'),
                        'completed': True,
                        'perfect': time_remaining > time_limit * 0.5,
                        'late': time_remaining < 0
                    }

            elif action.action_type == 'order_failed':
                orders_failed += 1

                order_id = data['order_id']
                if order_id not in order_data:
                    order_data[order_id] = {
                        'priority': data.get('priority', 'normal'),
                        'completed': False,
                        'failed': True
                    }

            elif action.action_type == 'order_created':
                order_id = data['order_id']
                if order_id not in order_data:
                    order_data[order_id] = {
                        'priority': data.get('priority', 'normal'),
                        'created': True
                    }

        total_cost += self._calculate_ingredient_costs()

        efficiency_score = self._calculate_efficiency_score(
            orders_completed, orders_failed, perfect_orders, late_orders
        )
        speed_score = self._calculate_speed_score(actions)
        quality_score = self._calculate_quality_score(perfect_orders, late_orders, orders_completed)

        base_score = self.session.score

        final_score = int(
            base_score * 0.6 +
            efficiency_score * 0.2 +
            speed_score * 0.1 +
            quality_score * 0.1
        )

        star_rating = self._calculate_star_rating(
            final_score, self.level.target_score,
            orders_completed, orders_failed
        )

        settlement = Settlement.objects.filter(session=self.session).first()
        if settlement:
            settlement.total_income = total_income
            settlement.total_cost = total_cost
            settlement.total_tip = total_tip
            settlement.orders_completed = orders_completed
            settlement.orders_failed = orders_failed
            settlement.perfect_orders = perfect_orders
            settlement.late_orders = late_orders
            settlement.efficiency_score = efficiency_score
            settlement.speed_score = speed_score
            settlement.quality_score = quality_score
            settlement.final_score = final_score
            settlement.star_rating = star_rating
            settlement.recalculated = True
            settlement.save()
        else:
            settlement = Settlement.objects.create(
                session=self.session,
                total_income=total_income,
                total_cost=total_cost,
                total_tip=total_tip,
                orders_completed=orders_completed,
                orders_failed=orders_failed,
                perfect_orders=perfect_orders,
                late_orders=late_orders,
                efficiency_score=efficiency_score,
                speed_score=speed_score,
                quality_score=quality_score,
                final_score=final_score,
                star_rating=star_rating,
                recalculated=True
            )

        self._update_player_stats(settlement)

        return settlement

    def _calculate_ingredient_costs(self):
        """计算食材成本 - 从订单中重新计算"""
        total_cost = 0
        orders = Order.objects.filter(session=self.session, status='completed')

        for order in orders:
            recipe_ingredients = order.recipe.recipeingredient_set.all()
            for ri in recipe_ingredients:
                total_cost += ri.ingredient.cost * ri.quantity

        return total_cost

    def _calculate_efficiency_score(self, completed, failed, perfect, late):
        """计算效率分数"""
        if completed + failed == 0:
            return 0

        completion_rate = completed / (completed + failed)
        perfect_rate = perfect / max(1, completed) if completed > 0 else 0
        late_penalty = late * 10

        score = int(
            completion_rate * 500 + perfect_rate * 300 - late_penalty
        )
        return max(0, min(1000, score))

    def _calculate_speed_score(self, actions):
        """计算速度分数 - 基于操作密度和完成速度"""
        if not actions:
            return 0

        first_action = actions.first()
        last_action = actions.last()

        if not first_action or not last_action:
            return 0

        total_time = last_action.game_time - first_action.game_time
        complete_actions = [a for a in actions if a.action_type == 'order_complete']

        if total_time <= 0 or len(complete_actions) == 0:
            return 0

        avg_time_per_order = total_time / len(complete_actions)

        score = int(1000 - avg_time_per_order * 5)
        return max(0, min(1000, score))

    def _calculate_quality_score(self, perfect, late, completed):
        """计算质量分数"""
        if completed == 0:
            return 0

        perfect_ratio = perfect / completed
        late_ratio = late / completed

        score = int(perfect_ratio * 800 - late_ratio * 300 + 200)
        return max(0, min(1000, score))

    def _calculate_star_rating(self, final_score, target_score, completed, failed):
        """计算星级评价"""
        score_ratio = final_score / target_score if target_score > 0 else 0
        completion_ratio = completed / max(1, completed + failed)

        if score_ratio >= 1.5 and completion_ratio >= 0.9:
            return 5
        elif score_ratio >= 1.2 and completion_ratio >= 0.8:
            return 4
        elif score_ratio >= 1.0 and completion_ratio >= 0.7:
            return 3
        elif score_ratio >= 0.8 and completion_ratio >= 0.5:
            return 2
        else:
            return 1

    def _update_player_stats(self, settlement):
        """更新玩家统计数据"""
        player = self.session.player
        player.total_score += settlement.final_score
        player.games_played += 1

        if settlement.star_rating >= 3:
            player.games_won += 1
            if self.level.level_number >= player.highest_level:
                player.highest_level = min(self.level.level_number + 1, 10)

        player.save()

    def generate_daily_report(self):
        """生成日终账单报告"""
        settlement = self.recalculate_all()
        ingredient_cost = self._calculate_ingredient_costs()
        fine_cost = max(0, int(settlement.orders_failed * 25))

        return {
            'session_id': self.session.id,
            'level': self.level.name,
            'level_number': self.level.level_number,
            'player': self.session.player.nickname,
            'duration': self.session.current_time,
            'income': {
                'order_income': settlement.total_income,
                'tips': settlement.total_tip,
                'total': settlement.total_income + settlement.total_tip
            },
            'costs': {
                'ingredients': ingredient_cost,
                'fines': fine_cost,
                'total': ingredient_cost + fine_cost
            },
            'profit': (settlement.total_income + settlement.total_tip) - (ingredient_cost + fine_cost),
            'orders': {
                'completed': settlement.orders_completed,
                'failed': settlement.orders_failed,
                'perfect': settlement.perfect_orders,
                'late': settlement.late_orders,
                'completion_rate': round(
                    settlement.orders_completed / max(1, settlement.orders_completed + settlement.orders_failed) * 100, 1
                ) if (settlement.orders_completed + settlement.orders_failed) > 0 else 0
            },
            'scores': {
                'base_score': self.session.score,
                'efficiency': settlement.efficiency_score,
                'speed': settlement.speed_score,
                'quality': settlement.quality_score,
                'final': settlement.final_score,
                'target': self.level.target_score,
                'stars': settlement.star_rating
            },
            'result': '通关' if settlement.star_rating >= 3 else '失败',
            'recalculated': settlement.recalculated,
            'recalculation_note': '本账单所有分数已由后端独立重新核算，确保数据真实有效'
        }

    def verify_score(self, client_score: int):
        """
        防作弊验证
        对比前端提交的分数和后端重新计算的分数
        """
        settlement = self.recalculate_all()
        difference = abs(settlement.final_score - client_score)

        return {
            'valid': difference < 50,
            'server_score': settlement.final_score,
            'client_score': client_score,
            'difference': difference
        }
