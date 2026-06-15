import math
import random
import uuid
from django.utils import timezone
from .models import (
    RescueSession, RescueNode, RescueDetail, RescueHistory, RescueResult,
    TerrainType, NodeType, WeatherType, GameStatus, SeedSample
)


TERRAIN_LOAD_CAPACITY = {
    TerrainType.ICE: 8.0,
    TerrainType.ROCK: 25.0,
    TerrainType.SNOW_CORNICE: 3.0,
}

WEATHER_EFFECTS = {
    WeatherType.CLEAR: {'load_factor': 1.0, 'visibility': 1.0, 'wind_effect': 0},
    WeatherType.SNOWFALL: {'load_factor': 0.9, 'visibility': 0.7, 'wind_effect': 1},
    WeatherType.WIND: {'load_factor': 0.85, 'visibility': 0.8, 'wind_effect': 2},
    WeatherType.BLIZZARD: {'load_factor': 0.7, 'visibility': 0.4, 'wind_effect': 3},
    WeatherType.AVALANCHE_RISK: {'load_factor': 0.5, 'visibility': 0.6, 'wind_effect': 2},
}

NODE_LOAD_CAPACITY = {
    NodeType.ANCHOR: 15.0,
    NodeType.PULLEY: 12.0,
    NodeType.PROTECTION: 10.0,
    NodeType.KNOT: 8.0,
}

VICTIM_WEIGHT = 0.75
RESCUER_WEIGHT = 0.8
GRAVITY = 9.8
SAFETY_FACTOR_TARGET = 3.0


class GameEngine:
    def __init__(self, session):
        self.session = session
        self.nodes = list(session.nodes.all().order_by('order_index'))
        self.details = list(session.details.all().order_by('order_index'))
        self.histories = list(session.histories.all().order_by('step'))
        self.weather_effect = WEATHER_EFFECTS.get(session.weather, WEATHER_EFFECTS[WeatherType.CLEAR])

    def calculate_node_load(self, node):
        terrain_capacity = TERRAIN_LOAD_CAPACITY.get(node.terrain_type, 5.0)
        base_capacity = NODE_LOAD_CAPACITY.get(node.node_type, 5.0)
        weather_factor = self.weather_effect['load_factor']
        effective_capacity = min(terrain_capacity, base_capacity) * weather_factor
        return effective_capacity

    def calculate_rope_tension(self, point_a, point_b, load_kg):
        dx = point_b[0] - point_a[0]
        dy = point_b[1] - point_a[1]
        distance = math.sqrt(dx * dx + dy * dy)
        if distance == 0:
            return 0
        angle = math.atan2(abs(dy), distance)
        tension = (load_kg * GRAVITY / 1000) / math.sin(max(angle, 0.1))
        return tension

    def validate_nodes(self):
        failures = []
        for node in self.nodes:
            capacity = self.calculate_node_load(node)
            node.load_capacity = capacity
            if node.actual_load > capacity:
                node.is_valid = False
                node.failure_reason = f'受力{node.actual_load:.2f}KN超过承力{capacity:.2f}KN'
                failures.append(node)
            else:
                node.is_valid = True
                node.failure_reason = None
            node.save()
        return failures

    def check_route_integrity(self):
        anchors = [n for n in self.nodes if n.node_type == NodeType.ANCHOR and n.is_valid]
        if len(anchors) < 2:
            return False, '锚点数量不足，至少需要2个有效锚点'

        protections = [d for d in self.details if d.detail_type == 'protection' and d.is_valid]
        if not protections:
            return False, '缺少保护站，救援路线不安全'

        return True, '路线检查通过'

    def calculate_position_loads(self, victim_x, victim_y):
        total_load = VICTIM_WEIGHT + RESCUER_WEIGHT
        valid_nodes = [n for n in self.nodes if n.is_valid]
        node_loads = {}
        detail_loads = {}
        max_tension = 0

        if not valid_nodes:
            return node_loads, detail_loads, 0

        load_per_node = total_load / len(valid_nodes)

        for node in valid_nodes:
            tension = self.calculate_rope_tension(
                (node.x, node.y),
                (victim_x, victim_y),
                load_per_node
            )
            node_loads[node.id] = tension
            node.actual_load = tension
            if tension > max_tension:
                max_tension = tension

        for detail in self.details:
            if not detail.is_valid:
                continue
            tension = self.calculate_rope_tension(
                (detail.x, detail.y),
                (victim_x, victim_y),
                load_per_node
            )
            detail_loads[detail.id] = tension
            detail.actual_load = tension

        return node_loads, detail_loads, max_tension

    def check_safety_at_position(self, victim_x, victim_y):
        node_loads, detail_loads, max_tension = self.calculate_position_loads(victim_x, victim_y)

        is_safe = True
        failures = []

        for node in self.nodes:
            if node.id in node_loads:
                load = node_loads[node.id]
                capacity = self.calculate_node_load(node)
                node.load_capacity = capacity
                if load > capacity:
                    is_safe = False
                    node.is_valid = False
                    node.failure_reason = f'受力{load:.2f}KN超过承力{capacity:.2f}KN'
                    failures.append({
                        'type': 'node',
                        'id': node.node_id,
                        'reason': node.failure_reason,
                        'load': load,
                        'capacity': capacity
                    })
                else:
                    node.is_valid = True
                    node.failure_reason = None

        for detail in self.details:
            if detail.id in detail_loads:
                load = detail_loads[detail.id]
                terrain_capacity = TERRAIN_LOAD_CAPACITY.get(
                    self._get_detail_terrain(detail), 5.0
                )
                base_capacity = 12.0 if detail.detail_type == 'pulley' else 10.0
                capacity = min(terrain_capacity, base_capacity) * self.weather_effect['load_factor']
                detail.load_capacity = capacity
                detail.efficiency = 0.95 if detail.detail_type == 'pulley' else 1.0
                if load > capacity:
                    is_safe = False
                    detail.is_valid = False
                    failures.append({
                        'type': 'detail',
                        'id': detail.detail_id,
                        'reason': f'{detail.get_detail_type_display()}受力{load:.2f}KN超过承力{capacity:.2f}KN',
                        'load': load,
                        'capacity': capacity
                    })
                else:
                    detail.is_valid = True

        return is_safe, failures, node_loads, detail_loads, max_tension

    def _get_detail_terrain(self, detail):
        for node in self.nodes:
            dist = math.sqrt((node.x - detail.x)**2 + (node.y - detail.y)**2)
            if dist < 50:
                return node.terrain_type
        return TerrainType.ROCK

    def save_transfer_step(self, step_num, victim_x, victim_y, action, action_type='transfer'):
        is_safe, failures, node_loads, detail_loads, max_tension = self.check_safety_at_position(victim_x, victim_y)

        for node in self.nodes:
            node.save()
        for detail in self.details:
            detail.save()

        nodes_snapshot = []
        for n in self.nodes:
            nodes_snapshot.append({
                'id': n.id,
                'node_id': n.node_id,
                'node_type': n.node_type,
                'x': n.x,
                'y': n.y,
                'terrain_type': n.terrain_type,
                'actual_load': round(n.actual_load, 4),
                'load_capacity': round(n.load_capacity, 4),
                'is_valid': n.is_valid,
                'failure_reason': n.failure_reason,
            })

        details_snapshot = []
        for d in self.details:
            details_snapshot.append({
                'id': d.id,
                'detail_id': d.detail_id,
                'detail_type': d.detail_type,
                'x': d.x,
                'y': d.y,
                'actual_load': round(d.actual_load, 4),
                'load_capacity': round(d.load_capacity, 4),
                'efficiency': d.efficiency,
                'is_valid': d.is_valid,
            })

        safety_score = self.calculate_safety_score()
        technique_score = self.calculate_technique_score()
        min_safety_factor = float('inf')
        for n in self.nodes:
            if n.actual_load > 0 and n.load_capacity > 0 and n.is_valid:
                sf = n.load_capacity / n.actual_load
                if sf < min_safety_factor:
                    min_safety_factor = sf

        state_snapshot = {
            'nodes': nodes_snapshot,
            'details': details_snapshot,
            'node_loads': {str(k): round(v, 4) for k, v in node_loads.items()},
            'detail_loads': {str(k): round(v, 4) for k, v in detail_loads.items()},
            'max_tension': round(max_tension, 4),
            'weather': self.session.weather,
            'weather_effect': self.weather_effect,
            'node_validity': {str(n.id): n.is_valid for n in self.nodes},
            'detail_validity': {str(d.id): d.is_valid for d in self.details},
            'failures': failures,
            'safety_score': safety_score,
            'technique_score': technique_score,
            'min_safety_factor': None if min_safety_factor == float('inf') else round(min_safety_factor, 4),
            'valid_node_count': len([n for n in self.nodes if n.is_valid]),
            'total_node_count': len(self.nodes),
            'pulley_count': len([d for d in self.details if d.detail_type == 'pulley']),
            'protection_count': len([d for d in self.details if d.detail_type == 'protection']),
        }

        history = RescueHistory(
            session=self.session,
            step=step_num,
            action=action,
            action_type=action_type,
            victim_x=victim_x,
            victim_y=victim_y,
            weather=self.session.weather,
            rope_tension=round(max_tension, 4),
            is_safe=is_safe,
            remark=f'{len(failures)}个装置失效' if failures else '状态安全',
        )
        history.set_state_snapshot(state_snapshot)
        history.save()

        self.histories.append(history)

        return {
            'step': step_num,
            'victim_x': victim_x,
            'victim_y': victim_y,
            'is_safe': is_safe,
            'failures': failures,
            'rope_tension': round(max_tension, 4),
            'weather': self.session.weather,
            'nodes': nodes_snapshot,
            'details': details_snapshot,
            'safety_score': safety_score,
            'technique_score': technique_score,
        }

    def execute_full_transfer(self, start_x, start_y, end_x, end_y, steps=20, weather_events=None):
        RescueHistory.objects.filter(session=self.session).delete()
        self.histories = []

        step_size_x = (end_x - start_x) / steps
        step_size_y = (end_y - start_y) / steps
        all_steps = []
        transfer_success = True
        stop_reason = None
        global_step = 0

        for i in range(steps + 1):
            current_x = start_x + step_size_x * i
            current_y = start_y + step_size_y * i

            if i == 0:
                action = '救援开始，被困者准备转移'
            elif i == steps:
                action = '救援完成，被困者安全抵达'
            else:
                action = f'转移中... 进度{int(i/steps*100)}%'

            global_step += 1
            step_result = self.save_transfer_step(global_step, current_x, current_y, action, 'transfer')
            all_steps.append(step_result)

            if weather_events:
                for we in weather_events:
                    if we.get('step') == i and not we.get('triggered'):
                        we['triggered'] = True
                        weather_type = we.get('weather')
                        weather_failures, weather_step_num = self.apply_weather_event(weather_type, global_step)
                        global_step = weather_step_num
                        step_result['weather_event'] = {
                            'weather': weather_type,
                            'failures_count': len(weather_failures),
                            'description': we.get('description', ''),
                            'step': weather_step_num,
                        }

            if not step_result['is_safe']:
                transfer_success = False
                stop_reason = f'步骤{global_step}: 救援路线失效 - {len(step_result["failures"])}个装置过载'
                global_step += 1
                failure_snap = step_result.get('nodes', [])
                snap = {
                    'nodes': failure_snap,
                    'details': step_result.get('details', []),
                    'safety_score': self.calculate_safety_score(),
                    'technique_score': self.calculate_technique_score(),
                }
                failure_history = RescueHistory(
                    session=self.session,
                    step=global_step,
                    action=f'救援失败: {stop_reason}',
                    action_type='failure',
                    victim_x=current_x,
                    victim_y=current_y,
                    weather=self.session.weather,
                    rope_tension=step_result['rope_tension'],
                    is_safe=False,
                    remark=stop_reason,
                )
                failure_history.set_state_snapshot(snap)
                failure_history.save()
                self.histories.append(failure_history)
                break

        return {
            'success': transfer_success,
            'total_steps': len(all_steps),
            'total_history_steps': global_step,
            'steps': all_steps,
            'stop_reason': stop_reason,
            'final_safety_score': self.calculate_safety_score(),
        }

    def apply_weather_event(self, weather_type, current_global_step):
        self.session.weather = weather_type
        self.session.save()
        self.weather_effect = WEATHER_EFFECTS.get(weather_type, WEATHER_EFFECTS[WeatherType.CLEAR])

        failures = self.validate_nodes()

        last_victim_x = self.histories[-1].victim_x if self.histories else 0
        last_victim_y = self.histories[-1].victim_y if self.histories else 0
        last_tension = self.histories[-1].rope_tension if self.histories else 0

        new_step_num = current_global_step + 1
        safety_score = self.calculate_safety_score()
        technique_score = self.calculate_technique_score()

        nodes_snapshot = []
        for n in self.nodes:
            nodes_snapshot.append({
                'id': n.id, 'node_id': n.node_id, 'node_type': n.node_type,
                'x': n.x, 'y': n.y, 'terrain_type': n.terrain_type,
                'actual_load': round(n.actual_load, 4), 'load_capacity': round(n.load_capacity, 4),
                'is_valid': n.is_valid, 'failure_reason': n.failure_reason,
            })
        details_snapshot = []
        for d in self.details:
            details_snapshot.append({
                'id': d.id, 'detail_id': d.detail_id, 'detail_type': d.detail_type,
                'x': d.x, 'y': d.y,
                'actual_load': round(d.actual_load, 4), 'load_capacity': round(d.load_capacity, 4),
                'efficiency': d.efficiency, 'is_valid': d.is_valid,
            })

        state_snapshot = {
            'nodes': nodes_snapshot,
            'details': details_snapshot,
            'weather': weather_type,
            'weather_effect': self.weather_effect,
            'node_validity': {str(n.id): n.is_valid for n in self.nodes},
            'detail_validity': {str(d.id): d.is_valid for d in self.details},
            'failures': failures,
            'safety_score': safety_score,
            'technique_score': technique_score,
            'pulley_count': len([d for d in self.details if d.detail_type == 'pulley']),
            'protection_count': len([d for d in self.details if d.detail_type == 'protection']),
            'valid_node_count': len([n for n in self.nodes if n.is_valid]),
            'total_node_count': len(self.nodes),
        }

        history = RescueHistory(
            session=self.session,
            step=new_step_num,
            action=f'天气变化: {dict(WeatherType.choices).get(weather_type, weather_type)}',
            action_type='weather',
            victim_x=last_victim_x,
            victim_y=last_victim_y,
            weather=weather_type,
            rope_tension=last_tension,
            is_safe=len(failures) == 0,
            remark=f'天气事件导致{len(failures)}个节点失效' if failures else '天气变化，无节点失效',
        )
        history.set_state_snapshot(state_snapshot)
        history.save()
        self.histories.append(history)

        return failures, new_step_num

    def calculate_safety_score(self):
        valid_nodes = [n for n in self.nodes if n.is_valid]
        total_nodes = len(self.nodes)
        if total_nodes == 0:
            return 0

        node_validity_ratio = len(valid_nodes) / total_nodes

        min_safety_factor = float('inf')
        for node in valid_nodes:
            if node.actual_load > 0:
                safety_factor = node.load_capacity / node.actual_load
                if safety_factor < min_safety_factor:
                    min_safety_factor = safety_factor

        if min_safety_factor == float('inf'):
            safety_factor_score = 100
        else:
            safety_factor_score = min(100, (min_safety_factor / SAFETY_FACTOR_TARGET) * 100)

        route_valid, _ = self.check_route_integrity()
        route_score = 100 if route_valid else 40

        safety_score = (node_validity_ratio * 30) + (safety_factor_score * 40) + (route_score * 30)
        return round(safety_score, 2)

    def calculate_speed_score(self, total_time_seconds):
        base_time = 120
        if total_time_seconds <= 0:
            return 0
        speed_score = max(0, min(100, (base_time / total_time_seconds) * 50))
        return round(speed_score, 2)

    def calculate_technique_score(self):
        pulley_count = len([d for d in self.details if d.detail_type == 'pulley'])
        protection_count = len([d for d in self.details if d.detail_type == 'protection'])
        anchor_count = len([n for n in self.nodes if n.node_type == NodeType.ANCHOR])

        pulley_score = min(pulley_count * 10, 30)
        protection_score = min(protection_count * 15, 40)
        anchor_score = min(anchor_count * 8, 30)

        technique_score = pulley_score + protection_score + anchor_score
        return round(technique_score, 2)

    def calculate_final_score(self, total_time_seconds):
        safety_score = self.calculate_safety_score()
        speed_score = self.calculate_speed_score(total_time_seconds)
        technique_score = self.calculate_technique_score()

        final_score = safety_score * 0.5 + speed_score * 0.2 + technique_score * 0.3
        return round(final_score, 2), safety_score, speed_score, technique_score

    def get_grade(self, score):
        if score >= 90:
            return 'S'
        elif score >= 80:
            return 'A'
        elif score >= 70:
            return 'B'
        elif score >= 60:
            return 'C'
        elif score >= 40:
            return 'D'
        else:
            return 'F'

    def generate_result(self, total_time_seconds):
        final_score, safety_score, speed_score, technique_score = self.calculate_final_score(total_time_seconds)

        ice_nodes = [n for n in self.nodes if n.terrain_type == TerrainType.ICE]
        rock_nodes = [n for n in self.nodes if n.terrain_type == TerrainType.ROCK]
        snow_nodes = [n for n in self.nodes if n.terrain_type == TerrainType.SNOW_CORNICE]

        max_ice_load = max([n.actual_load for n in ice_nodes], default=0)
        max_rock_load = max([n.actual_load for n in rock_nodes], default=0)
        max_snow_load = max([n.actual_load for n in snow_nodes], default=0)

        tensions = [h.rope_tension for h in self.histories if h.rope_tension > 0]
        max_tension = max(tensions) if tensions else 0
        avg_tension = sum(tensions) / len(tensions) if tensions else 0

        valid_count = len([n for n in self.nodes if n.is_valid])
        failed_count = len([n for n in self.nodes if not n.is_valid])

        weather_event_count = len([h for h in self.histories if h.action_type == 'weather'])

        grade = self.get_grade(final_score)

        evaluations = {
            'S': '完美！专业级救援操作，所有指标优秀。',
            'A': '优秀！救援方案合理，安全系数高。',
            'B': '良好！整体操作规范，仍有改进空间。',
            'C': '合格！救援成功，但安全储备不足。',
            'D': '较差！勉强完成救援，存在较大安全隐患。',
            'F': '失败！救援方案存在严重问题，需要重新设计。',
        }

        result = RescueResult(
            session=self.session,
            terrain_ice_load=round(max_ice_load, 2),
            terrain_rock_load=round(max_rock_load, 2),
            terrain_snow_load=round(max_snow_load, 2),
            max_tension=round(max_tension, 2),
            avg_tension=round(avg_tension, 2),
            safety_factor=round(min([n.load_capacity / n.actual_load for n in self.nodes if n.actual_load > 0], default=0), 2),
            transfer_distance=0,
            total_time=round(total_time_seconds, 2),
            nodes_valid=valid_count,
            nodes_failed=failed_count,
            weather_events=weather_event_count,
            final_score=final_score,
            safety_score=safety_score,
            speed_score=speed_score,
            technique_score=technique_score,
            grade=grade,
            evaluation=evaluations.get(grade, '未知评价'),
        )
        result.save()

        self.session.total_score = final_score
        self.session.safety_score = safety_score
        self.session.speed_score = speed_score
        self.session.save()

        return result

    def rollback_to_step(self, step_number):
        valid_histories = [h for h in self.histories if h.step <= step_number]
        if not valid_histories:
            return False

        RescueHistory.objects.filter(session=self.session, step__gt=step_number).delete()

        for node in self.nodes:
            node.is_valid = True
            node.failure_reason = None
            node.actual_load = 0
            node.save()

        if valid_histories:
            last_history = valid_histories[-1]
            self.session.weather = last_history.weather
            self.session.save()

        rollback_history = RescueHistory(
            session=self.session,
            step=step_number + 1,
            action=f'回滚到步骤{step_number}',
            action_type='rollback',
            victim_x=valid_histories[-1].victim_x,
            victim_y=valid_histories[-1].victim_y,
            weather=valid_histories[-1].weather,
            rope_tension=valid_histories[-1].rope_tension,
            is_safe=True,
            remark='系统已回滚到安全状态',
        )
        rollback_history.save()

        return True


def create_session_from_seed(seed, player_name='玩家'):
    session_id = f'session_{uuid.uuid4().hex[:12]}'

    session = RescueSession(
        session_id=session_id,
        player_name=player_name,
        status=GameStatus.PREPARING,
        terrain_type=seed.terrain_type,
        weather=seed.weather,
        difficulty=seed.difficulty,
        seed_type=seed.seed_type,
    )
    session.save()

    preset_nodes = seed.get_preset_nodes()
    for i, node_data in enumerate(preset_nodes):
        nt = node_data.get('node_type', NodeType.ANCHOR)
        if not isinstance(nt, str):
            nt = getattr(nt, 'value', str(nt))
        tt = node_data.get('terrain_type', seed.terrain_type)
        if not isinstance(tt, str):
            tt = getattr(tt, 'value', str(tt))
        node = RescueNode(
            session=session,
            node_type=nt,
            node_id=node_data.get('node_id', f'node_{i}'),
            x=node_data.get('x', 0),
            y=node_data.get('y', 0),
            terrain_type=tt,
            order_index=i,
        )
        props = node_data.get('properties', {})
        node.set_properties(props)
        node.save()

    return session


def add_node_to_session(session, node_type, x, y, terrain_type, node_id=None):
    if node_id is None:
        node_id = f'{node_type}_{uuid.uuid4().hex[:8]}'

    existing_count = session.nodes.count()
    node = RescueNode(
        session=session,
        node_type=node_type,
        node_id=node_id,
        x=x,
        y=y,
        terrain_type=terrain_type,
        order_index=existing_count,
    )
    node.save()
    session.anchor_count = session.nodes.filter(node_type=NodeType.ANCHOR).count()
    session.save()
    return node


def add_detail_to_session(session, detail_type, x, y, node_id=None):
    if node_id is None:
        detail_id = f'{detail_type}_{uuid.uuid4().hex[:8]}'
    else:
        detail_id = node_id

    existing_count = session.details.count()
    detail = RescueDetail(
        session=session,
        detail_type=detail_type,
        detail_id=detail_id,
        x=x,
        y=y,
        order_index=existing_count,
    )
    detail.save()
    return detail


def recalculate_session_score(session):
    if not hasattr(session, 'result') or session.result is None:
        total_time = 0
        if session.end_time and session.start_time:
            total_time = (session.end_time - session.start_time).total_seconds()
    else:
        total_time = session.result.total_time

    engine = GameEngine(session)
    engine.histories = list(session.histories.all().order_by('step'))
    engine.nodes = list(session.nodes.all())
    engine.details = list(session.details.all())

    result = engine.generate_result(total_time)
    return result
