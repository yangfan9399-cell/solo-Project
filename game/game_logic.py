"""
游戏核心逻辑模块
包含站点间隔、备料加热、装盘配送、车厢距离、订单优先级等核心机制
"""
import random
import json
from datetime import timedelta
from django.utils import timezone
from .models import (
    GameSession, Order, Preparation, Delivery,
    ActionHistory, Station, Carriage, Recipe,
    OrderTemplate, RecipeIngredient
)


PRIORITY_CONFIG = {
    'normal': {
        'score_multiplier': 1.0,
        'tip_multiplier': 1.0,
        'time_penalty': 5,
        'display_name': '普通'
    },
    'vip': {
        'score_multiplier': 2.0,
        'tip_multiplier': 2.5,
        'time_penalty': 15,
        'display_name': 'VIP'
    },
    'urgent': {
        'score_multiplier': 1.5,
        'tip_multiplier': 1.8,
        'time_penalty': 10,
        'display_name': '紧急'
    }
}


class GameEngine:
    """游戏核心引擎"""

    def __init__(self, session: GameSession):
        self.session = session
        self.level = session.level
        self.state = session.get_game_state()
        self._ensure_state_initialized()

    def _ensure_state_initialized(self):
        """确保游戏状态初始化"""
        if not self.state:
            stations = list(Station.objects.filter(level=self.level).order_by('station_number'))
            carriages = list(Carriage.objects.filter(level=self.level).order_by('carriage_number'))

            self.state = {
                'current_time': 0,
                'current_station': 0,
                'stations': [{'id': s.id, 'name': s.name, 'arrived': False, 'departed': False}
                            for s in stations],
                'carriages': [{'id': c.id, 'name': c.name, 'distance': c.distance_from_kitchen,
                              'type': c.carriage_type} for c in carriages],
                'score': 0,
                'money': 0,
                'orders_completed': 0,
                'orders_failed': 0,
                'waiters': [
                    {'id': 1, 'status': 'idle', 'name': '服务员小王'},
                    {'id': 2, 'status': 'idle', 'name': '服务员小李'}
                ],
                'prep_stations': [
                    {'id': 0, 'status': 'idle', 'name': '备料台'},
                    {'id': 1, 'status': 'idle', 'name': '灶台1'},
                    {'id': 2, 'status': 'idle', 'name': '灶台2'},
                ],
                'pending_orders': [],
                'preparing_orders': [],
                'ready_orders': [],
                'delivering_orders': [],
                'action_sequence': 0
            }
            self.save_state()

    def save_state(self):
        """保存游戏状态"""
        self.session.set_game_state(self.state)
        self.session.current_time = self.state['current_time']
        self.session.current_station = self.state['current_station']
        self.session.score = self.state['score']
        self.session.money = self.state['money']
        self.session.orders_completed = self.state['orders_completed']
        self.session.orders_failed = self.state['orders_failed']
        self.session.save()

    def record_action(self, action_type: str, action_data: dict):
        """记录操作历史 - 用于游戏恢复"""
        self.state['action_sequence'] += 1
        ActionHistory.objects.create(
            session=self.session,
            action_type=action_type,
            action_data=json.dumps(action_data, ensure_ascii=False),
            game_time=self.state['current_time'],
            sequence=self.state['action_sequence']
        )

    def tick(self, delta_time: int = 1):
        """
        游戏时间推进
        核心主循环：处理站点到达/离开、订单生成、任务更新
        """
        self.state['current_time'] += delta_time
        current_time = self.state['current_time']

        self._check_station_events(current_time)
        self._update_preparations(current_time)
        self._update_deliveries(current_time)
        self._check_order_timeouts(current_time)
        self._generate_orders(current_time)

        game_over, result = self._check_game_over(current_time)
        self.save_state()

        return game_over, result

    def _check_station_events(self, current_time: int):
        """检查站点事件 - 站点间隔机制"""
        stations = Station.objects.filter(level=self.level).order_by('station_number')

        for idx, station in enumerate(stations):
            if current_time >= station.arrival_time and not self.state['stations'][idx]['arrived']:
                self.state['stations'][idx]['arrived'] = True
                self.state['current_station'] = idx
                self.record_action('station_arrive', {
                    'station_id': station.id,
                    'station_name': station.name,
                    'station_number': station.station_number
                })

            if current_time >= station.departure_time and not self.state['stations'][idx]['departed']:
                self.state['stations'][idx]['departed'] = True
                self.record_action('station_depart', {
                    'station_id': station.id,
                    'station_name': station.name,
                    'station_number': station.station_number
                })

    def _update_preparations(self, current_time: int):
        """更新备料/加热/烹饪/装盘任务 - 完整备料加热机制"""
        queued_preps = Preparation.objects.filter(
            session=self.session,
            status='queued'
        )
        for prep in queued_preps:
            if current_time >= prep.start_time:
                prep.status = 'processing'
                prep.start_time = current_time
                prep.save()
                self.state['prep_stations'][prep.station_index]['status'] = 'busy'

                task_start_actions = {
                    'prep': 'ingredient_prep_start',
                    'heat': 'ingredient_heat_start',
                    'cook': 'cooking_start',
                    'plate': 'plating_start'
                }
                action_type = task_start_actions.get(prep.task_type, 'prep_start')
                action_data = {
                    'prep_id': prep.id,
                    'order_id': prep.order.id,
                    'task_type': prep.task_type,
                    'duration': prep.duration
                }
                if prep.ingredient:
                    action_data['ingredient'] = prep.ingredient.name
                self.record_action(action_type, action_data)

        preparations = Preparation.objects.filter(
            session=self.session,
            status='processing'
        )

        for prep in preparations:
            elapsed = current_time - prep.start_time
            if elapsed >= prep.duration:
                prep.status = 'completed'
                prep.save()

                self.state['prep_stations'][prep.station_index]['status'] = 'idle'

                task_complete_actions = {
                    'prep': 'ingredient_prep_complete',
                    'heat': 'ingredient_heat_complete',
                    'cook': 'cooking_complete',
                    'plate': 'plating_complete'
                }
                action_type = task_complete_actions.get(prep.task_type, 'prep_complete')
                action_data = {
                    'prep_id': prep.id,
                    'order_id': prep.order.id,
                    'task_type': prep.task_type
                }
                if prep.ingredient:
                    action_data['ingredient'] = prep.ingredient.name
                self.record_action(action_type, action_data)

                self._check_order_ready(prep.order, prep.task_type)

    def _update_deliveries(self, current_time: int):
        """更新配送任务 - 车厢距离机制"""
        deliveries = Delivery.objects.filter(
            session=self.session,
            status__in=['delivering', 'returning']
        )

        for delivery in deliveries:
            elapsed = current_time - delivery.start_time

            if delivery.status == 'delivering':
                if elapsed >= delivery.travel_time:
                    delivery.status = 'delivered'
                    delivery.save()
                    self._complete_delivery(delivery)
            elif delivery.status == 'returning':
                if elapsed >= delivery.return_time:
                    delivery.status = 'completed'
                    delivery.save()

                    for waiter in self.state['waiters']:
                        if waiter['id'] == delivery.waiter_id:
                            waiter['status'] = 'idle'
                            break

                    self.record_action('waiter_return', {
                        'waiter_id': delivery.waiter_id
                    })

    def _complete_delivery(self, delivery: Delivery):
        """完成配送"""
        order = delivery.order
        order.status = 'completed'
        order.completed_at = self.state['current_time']

        time_taken = order.completed_at - order.created_at
        time_remaining = order.time_limit - time_taken

        priority_config = PRIORITY_CONFIG[order.priority]
        base_price = order.base_price
        carriage = order.carriage

        if time_remaining > order.time_limit * 0.5:
            tip_multiplier = priority_config['tip_multiplier'] * carriage.tip_multiplier * 1.5
            perfect_bonus = 50
            self.state['perfect_orders'] = self.state.get('perfect_orders', 0) + 1
        elif time_remaining > 0:
            tip_multiplier = priority_config['tip_multiplier'] * carriage.tip_multiplier
            perfect_bonus = 0
        else:
            tip_multiplier = 0.5
            perfect_bonus = -20
            self.state['late_orders'] = self.state.get('late_orders', 0) + 1

        tip = int(base_price * tip_multiplier * 0.3)
        final_price = base_price + tip + perfect_bonus
        order.final_price = final_price
        order.tip = tip
        order.save()

        score_earned = int(final_price * priority_config['score_multiplier'])
        self.state['score'] += score_earned
        self.state['money'] += final_price
        self.state['orders_completed'] += 1

        if order.id in self.state['delivering_orders']:
            self.state['delivering_orders'].remove(order.id)

        self.record_action('order_complete', {
            'order_id': order.id,
            'recipe_name': order.recipe.name,
            'score': score_earned,
            'money': final_price,
            'tip': tip,
            'time_remaining': time_remaining,
            'time_limit': order.time_limit
        })

        delivery.status = 'returning'
        delivery.start_time = self.state['current_time']
        delivery.save()

    def _check_order_timeouts(self, current_time: int):
        """检查订单超时 - 订单优先级机制"""
        pending_orders = Order.objects.filter(
            session=self.session,
            status__in=['pending', 'preparing', 'cooking', 'ready']
        )

        for order in pending_orders:
            elapsed = current_time - order.created_at
            time_remaining = order.time_limit - elapsed

            if time_remaining <= -30:
                order.status = 'failed'
                order.save()

                penalty = PRIORITY_CONFIG[order.priority]['time_penalty'] * 10
                self.state['score'] = max(0, self.state['score'] - penalty)
                self.state['money'] = max(0, self.state['money'] - int(penalty / 2))
                self.state['orders_failed'] += 1

                order_id = order.id
                for lst in ['pending_orders', 'preparing_orders', 'ready_orders']:
                    if order_id in self.state[lst]:
                        self.state[lst].remove(order_id)

                self.record_action('order_failed', {
                    'order_id': order.id,
                    'recipe_name': order.recipe.name,
                    'penalty': penalty,
                    'priority': order.priority
                })

    def _check_order_ready(self, order: Order, completed_task_type: str):
        """检查订单是否准备完成 - 装盘机制
        
        只有当装盘(plate)任务完成时，才将订单转为ready状态
        """
        if completed_task_type != 'plate':
            return

        plate_prep = order.preparations.filter(task_type='plate').first()
        if plate_prep and plate_prep.status == 'completed':
            order.status = 'ready'
            order.save()

            if order.id in self.state['preparing_orders']:
                self.state['preparing_orders'].remove(order.id)
            if order.id not in self.state['ready_orders']:
                self.state['ready_orders'].append(order.id)

            self.record_action('order_ready', {
                'order_id': order.id,
                'recipe_name': order.recipe.name
            })

    def _generate_orders(self, current_time: int):
        """根据站点生成订单 - 站点间隔机制"""
        stations = Station.objects.filter(level=self.level).order_by('station_number')

        for idx, station in enumerate(stations):
            if (station.arrival_time <= current_time < station.departure_time and
                self.state['stations'][idx]['arrived'] and
                not self.state['stations'][idx].get('orders_generated', False)):

                self.state['stations'][idx]['orders_generated'] = True
                order_count = int(3 + station.order_intensity * 2)

                templates = list(OrderTemplate.objects.filter(level=self.level))
                if templates:
                    for _ in range(min(order_count, self.level.max_orders - len(self.state['pending_orders']))):
                        template = random.choices(
                            templates,
                            weights=[t.weight for t in templates],
                            k=1
                        )[0]
                        self._create_order_from_template(template)

    def _create_order_from_template(self, template: OrderTemplate):
        """从模板创建订单"""
        order = Order.objects.create(
            session=self.session,
            recipe=template.recipe,
            carriage=template.carriage,
            priority=template.priority,
            created_at=self.state['current_time'],
            time_limit=template.time_limit,
            base_price=template.recipe.base_price
        )

        self.state['pending_orders'].append(order.id)
        self.record_action('order_created', {
            'order_id': order.id,
            'recipe_name': order.recipe.name,
            'carriage': order.carriage.name,
            'priority': order.priority,
            'time_limit': order.time_limit
        })

        return order

    def start_preparation(self, order_id: int):
        """开始备料流程：备料(prep) → 加热(heat) → 烹饪(cook) → 装盘(plate)"""
        try:
            order = Order.objects.get(id=order_id, session=self.session)
        except Order.DoesNotExist:
            return {'success': False, 'message': '订单不存在'}

        if order.status != 'pending':
            return {'success': False, 'message': '订单状态不正确'}

        prep_station = None
        for idx, station in enumerate(self.state['prep_stations']):
            if station['status'] == 'idle':
                prep_station = station
                prep_station['status'] = 'busy'
                prep_station_idx = idx
                break

        if not prep_station:
            return {'success': False, 'message': '没有空闲的备料台'}

        order.status = 'preparing'
        order.save()

        if order.id in self.state['pending_orders']:
            self.state['pending_orders'].remove(order.id)
        if order.id not in self.state['preparing_orders']:
            self.state['preparing_orders'].append(order.id)

        recipe_ingredients = RecipeIngredient.objects.filter(recipe=order.recipe).select_related('ingredient')
        current_time = self.state['current_time']

        max_ingredient_end_time = current_time

        for ri in recipe_ingredients:
            ingredient = ri.ingredient
            prep_duration = ingredient.prep_time * ri.quantity
            heat_duration = ingredient.heat_time * ri.quantity

            prep_task = Preparation.objects.create(
                session=self.session,
                order=order,
                ingredient=ingredient,
                task_type='prep',
                status='processing',
                start_time=current_time,
                duration=prep_duration,
                station_index=prep_station_idx
            )

            heat_task = Preparation.objects.create(
                session=self.session,
                order=order,
                ingredient=ingredient,
                task_type='heat',
                status='queued',
                start_time=current_time + prep_duration,
                duration=heat_duration,
                station_index=prep_station_idx
            )

            ingredient_end_time = current_time + prep_duration + heat_duration
            if ingredient_end_time > max_ingredient_end_time:
                max_ingredient_end_time = ingredient_end_time

        cook_task = Preparation.objects.create(
            session=self.session,
            order=order,
            ingredient=None,
            task_type='cook',
            status='queued',
            start_time=max_ingredient_end_time,
            duration=order.recipe.cook_time,
            station_index=prep_station_idx
        )

        plate_task = Preparation.objects.create(
            session=self.session,
            order=order,
            ingredient=None,
            task_type='plate',
            status='queued',
            start_time=max_ingredient_end_time + order.recipe.cook_time,
            duration=5,
            station_index=prep_station_idx
        )

        total_duration = (max_ingredient_end_time - current_time) + order.recipe.cook_time + 5

        self.record_action('start_prep', {
            'order_id': order.id,
            'recipe_name': order.recipe.name,
            'prep_station': prep_station_idx,
            'duration': total_duration,
            'ingredients_count': recipe_ingredients.count(),
            'tasks': {
                'prep': recipe_ingredients.count(),
                'heat': recipe_ingredients.count(),
                'cook': 1,
                'plate': 1
            }
        })

        self.save_state()
        return {'success': True, 'message': '开始备料', 'order_id': order.id}

    def start_delivery(self, order_id: int):
        """开始配送 - 车厢距离机制"""
        try:
            order = Order.objects.get(id=order_id, session=self.session)
        except Order.DoesNotExist:
            return {'success': False, 'message': '订单不存在'}

        if order.status != 'ready':
            return {'success': False, 'message': '订单未准备好'}

        waiter = None
        for w in self.state['waiters']:
            if w['status'] == 'idle':
                waiter = w
                waiter['status'] = 'busy'
                break

        if not waiter:
            return {'success': False, 'message': '没有空闲的服务员'}

        carriage = order.carriage
        travel_time = carriage.distance_from_kitchen * 8
        return_time = carriage.distance_from_kitchen * 6

        delivery = Delivery.objects.create(
            session=self.session,
            order=order,
            carriage=carriage,
            status='delivering',
            start_time=self.state['current_time'],
            travel_time=travel_time,
            return_time=return_time,
            waiter_id=waiter['id']
        )

        order.status = 'delivering'
        order.save()

        if order.id in self.state['ready_orders']:
            self.state['ready_orders'].remove(order.id)
        if order.id not in self.state['delivering_orders']:
            self.state['delivering_orders'].append(order.id)

        self.record_action('start_delivery', {
            'order_id': order.id,
            'recipe_name': order.recipe.name,
            'carriage': carriage.name,
            'waiter_id': waiter['id'],
            'travel_time': travel_time
        })

        self.save_state()
        return {'success': True, 'message': '开始配送', 'order_id': order.id}

    def _check_game_over(self, current_time: int):
        """检查游戏结束条件"""
        if current_time >= self.level.time_limit:
            all_stations_departed = all(s['departed'] for s in self.state['stations'])
            no_pending_orders = not self.state['pending_orders']
            no_preparing_orders = not self.state['preparing_orders']
            no_ready_orders = not self.state['ready_orders']
            no_delivering_orders = not self.state['delivering_orders']

            if all_stations_departed and no_pending_orders and no_preparing_orders and no_ready_orders and no_delivering_orders:
                won = self.state['score'] >= self.level.target_score
                return True, {'won': won, 'score': self.state['score']}
            return True, {'won': False, 'score': self.state['score'], 'reason': '时间到'}

        return False, None

    def restore_from_history(self):
        """从操作历史恢复游戏状态"""
        actions = ActionHistory.objects.filter(
            session=self.session
        ).order_by('sequence')

        self.state = self._get_initial_state()

        for action in actions:
            self._replay_action(action)

        self.save_state()
        return self.state

    def _get_initial_state(self):
        """获取初始状态"""
        stations = list(Station.objects.filter(level=self.level).order_by('station_number'))
        carriages = list(Carriage.objects.filter(level=self.level).order_by('carriage_number'))
        return {
            'current_time': 0,
            'current_station': 0,
            'stations': [{'id': s.id, 'name': s.name, 'arrived': False, 'departed': False}
                        for s in stations],
            'carriages': [{'id': c.id, 'name': c.name, 'distance': c.distance_from_kitchen,
                          'type': c.carriage_type} for c in carriages],
            'score': 0,
            'money': 0,
            'orders_completed': 0,
            'orders_failed': 0,
            'perfect_orders': 0,
            'late_orders': 0,
            'waiters': [
                {'id': 1, 'status': 'idle', 'name': '服务员小王'},
                {'id': 2, 'status': 'idle', 'name': '服务员小李'}
            ],
            'prep_stations': [
                {'id': 0, 'status': 'idle', 'name': '备料台'},
                {'id': 1, 'status': 'idle', 'name': '灶台1'},
                {'id': 2, 'status': 'idle', 'name': '灶台2'},
            ],
            'pending_orders': [],
            'preparing_orders': [],
            'ready_orders': [],
            'delivering_orders': [],
            'action_sequence': 0
        }

    def _replay_action(self, action: ActionHistory):
        """重放单个操作"""
        data = action.get_action_data()
        self.state['action_sequence'] = action.sequence
        self.state['current_time'] = action.game_time

        if action.action_type == 'station_arrive':
            for idx, s in enumerate(self.state['stations']):
                if s['id'] == data['station_id']:
                    s['arrived'] = True
                    self.state['current_station'] = idx
                    break

        elif action.action_type == 'station_depart':
            for s in self.state['stations']:
                if s['id'] == data['station_id']:
                    s['departed'] = True
                    break

        elif action.action_type == 'order_created':
            if data['order_id'] not in self.state['pending_orders']:
                self.state['pending_orders'].append(data['order_id'])

        elif action.action_type == 'start_prep':
            if data['order_id'] in self.state['pending_orders']:
                self.state['pending_orders'].remove(data['order_id'])
            if data['order_id'] not in self.state['preparing_orders']:
                self.state['preparing_orders'].append(data['order_id'])
            self.state['prep_stations'][data['prep_station']]['status'] = 'busy'

        elif action.action_type in ['ingredient_prep_start', 'ingredient_heat_start', 'cooking_start', 'plating_start']:
            for ps in self.state['prep_stations']:
                if ps['status'] == 'idle':
                    ps['status'] = 'busy'
                    break

        elif action.action_type in ['ingredient_prep_complete', 'ingredient_heat_complete', 'cooking_complete', 'plating_complete']:
            for ps in self.state['prep_stations']:
                if ps['status'] == 'busy':
                    ps['status'] = 'idle'
                    break

        elif action.action_type == 'order_ready':
            if data['order_id'] in self.state['preparing_orders']:
                self.state['preparing_orders'].remove(data['order_id'])
            if data['order_id'] not in self.state['ready_orders']:
                self.state['ready_orders'].append(data['order_id'])

        elif action.action_type == 'start_delivery':
            if data['order_id'] in self.state['ready_orders']:
                self.state['ready_orders'].remove(data['order_id'])
            if data['order_id'] not in self.state['delivering_orders']:
                self.state['delivering_orders'].append(data['order_id'])
            for w in self.state['waiters']:
                if w['id'] == data['waiter_id']:
                    w['status'] = 'busy'
                    break

        elif action.action_type == 'order_complete':
            self.state['score'] += data['score']
            self.state['money'] += data['money']
            self.state['orders_completed'] += 1
            if data['time_remaining'] > data.get('time_limit', 120) * 0.5:
                self.state['perfect_orders'] = self.state.get('perfect_orders', 0) + 1
            elif data['time_remaining'] < 0:
                self.state['late_orders'] = self.state.get('late_orders', 0) + 1
            if data['order_id'] in self.state['delivering_orders']:
                self.state['delivering_orders'].remove(data['order_id'])

        elif action.action_type == 'waiter_return':
            for w in self.state['waiters']:
                if w['id'] == data['waiter_id']:
                    w['status'] = 'idle'
                    break

        elif action.action_type == 'order_failed':
            self.state['score'] = max(0, self.state['score'] - data['penalty'])
            self.state['money'] = max(0, self.state['money'] - int(data['penalty'] / 2))
            self.state['orders_failed'] += 1
            order_id = data['order_id']
            for lst in ['pending_orders', 'preparing_orders', 'ready_orders']:
                if order_id in self.state[lst]:
                    self.state[lst].remove(order_id)

    def get_game_state(self):
        """获取完整游戏状态（包含订单详情）"""
        state = self.state.copy()

        pending_orders = Order.objects.filter(
            id__in=state['pending_orders']
        ).select_related('recipe', 'carriage')
        state['pending_orders_detail'] = [self._serialize_order(o) for o in pending_orders]

        preparing_orders = Order.objects.filter(
            id__in=state['preparing_orders']
        ).select_related('recipe', 'carriage')
        state['preparing_orders_detail'] = [self._serialize_order(o) for o in preparing_orders]

        ready_orders = Order.objects.filter(
            id__in=state['ready_orders']
        ).select_related('recipe', 'carriage')
        state['ready_orders_detail'] = [self._serialize_order(o) for o in ready_orders]

        delivering_orders = Order.objects.filter(
            id__in=state['delivering_orders']
        ).select_related('recipe', 'carriage')
        state['delivering_orders_detail'] = [self._serialize_order(o) for o in delivering_orders]

        return state

    def _serialize_order(self, order: Order):
        """序列化订单，包含备料任务进度"""
        elapsed = self.state['current_time'] - order.created_at
        time_remaining = order.time_limit - elapsed

        preparations = order.preparations.all().select_related('ingredient')
        prep_tasks = []
        for prep in preparations:
            task_info = {
                'id': prep.id,
                'task_type': prep.task_type,
                'task_type_display': {
                    'prep': '备料',
                    'heat': '加热',
                    'cook': '烹饪',
                    'plate': '装盘'
                }.get(prep.task_type, prep.task_type),
                'status': prep.status,
                'start_time': prep.start_time,
                'duration': prep.duration,
                'ingredient': prep.ingredient.name if prep.ingredient else None,
                'ingredient_icon': prep.ingredient.icon if prep.ingredient else None
            }
            if prep.status == 'processing':
                task_elapsed = self.state['current_time'] - prep.start_time
                task_info['progress'] = min(100, int(task_elapsed / prep.duration * 100))
                task_info['time_remaining'] = prep.duration - task_elapsed
            elif prep.status == 'queued':
                task_info['progress'] = 0
                task_info['time_remaining'] = prep.start_time - self.state['current_time']
            else:
                task_info['progress'] = 100
                task_info['time_remaining'] = 0
            prep_tasks.append(task_info)

        prep_summary = {
            'total': len(preparations),
            'completed': len([p for p in preparations if p.status == 'completed']),
            'processing': len([p for p in preparations if p.status == 'processing']),
            'queued': len([p for p in preparations if p.status == 'queued'])
        }

        return {
            'id': order.id,
            'recipe_name': order.recipe.name,
            'recipe_icon': order.recipe.icon,
            'carriage': order.carriage.name,
            'carriage_number': order.carriage.carriage_number,
            'priority': order.priority,
            'priority_display': PRIORITY_CONFIG[order.priority]['display_name'],
            'status': order.status,
            'created_at': order.created_at,
            'time_limit': order.time_limit,
            'time_remaining': max(-999, time_remaining),
            'base_price': order.base_price,
            'time_percentage': max(0, min(100, int(time_remaining / order.time_limit * 100))),
            'prep_tasks': prep_tasks,
            'prep_summary': prep_summary
        }
