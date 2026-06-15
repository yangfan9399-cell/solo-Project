"""
Django视图 - 处理HTTP请求和API接口
"""
import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Level, GameSession
from .services import GameService
from .game_logic import find_path


def index(request):
    """首页 - 关卡选择"""
    levels = Level.objects.all()
    recent_sessions = GameSession.objects.order_by('-started_at')[:10]
    return render(request, 'game/index.html', {
        'levels': levels,
        'recent_sessions': recent_sessions,
    })


def game_board(request, session_id):
    """游戏主界面"""
    session = get_object_or_404(GameSession, session_id=session_id)
    return render(request, 'game/game_board.html', {
        'session': session,
        'level': session.level,
    })


def level_list(request):
    """关卡列表页"""
    levels = Level.objects.all()
    return render(request, 'game/level_list.html', {
        'levels': levels,
    })


def level_editor(request):
    """关卡编辑器"""
    return render(request, 'game/level_editor.html')


@csrf_exempt
@require_http_methods(["POST"])
def api_start_game(request, level_id):
    """开始新游戏"""
    try:
        session = GameService.start_new_game(level_id)
        return JsonResponse({
            'success': True,
            'session_id': session.session_id,
            'redirect_url': f'/game/{session.session_id}/',
        })
    except Level.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': '关卡不存在',
        }, status=404)


@require_http_methods(["GET"])
def api_get_state(request, session_id):
    """获取游戏状态"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    return JsonResponse({
        'success': True,
        'state': {
            'session_id': session.session_id,
            'level': {
                'id': session.level.id,
                'name': session.level.name,
                'grid_width': session.level.grid_width,
                'grid_height': session.level.grid_height,
                'addresses': session.level.addresses,
                'roads': session.level.roads,
                'letters': session.level.letters,
                'post_office': session.level.post_office,
                'max_steps': session.level.max_steps,
                'min_folds': session.level.min_folds,
                'fold_directions': session.level.fold_directions,
            },
            'current_state': session.current_state,
            'postman_position': session.postman_position,
            'step_count': session.step_count,
            'fold_count': session.fold_count,
            'remaining_letters': session.remaining_letters,
            'delivered_letters': session.delivered_letters,
            'status': session.status,
            'status_display': session.get_status_display(),
            'score': session.score,
            'result': session.result.values() if hasattr(session, 'result') else None,
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_move_postman(request, session_id):
    """移动邮差"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    try:
        data = json.loads(request.body)
        to_x = data['to_x']
        to_y = data['to_y']
    except (KeyError, json.JSONDecodeError):
        return HttpResponseBadRequest('缺少参数')
    
    success, message, result = GameService.move_postman(session, to_x, to_y)
    
    response_data = {
        'success': success,
        'message': message,
    }
    if success:
        response_data.update(result)
        response_data['new_state'] = {
            'postman_position': session.postman_position,
            'step_count': session.step_count,
            'status': session.status,
        }
    
    return JsonResponse(response_data)


@csrf_exempt
@require_http_methods(["POST"])
def api_deliver_letter(request, session_id):
    """投递信件"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    try:
        data = json.loads(request.body)
        letter_id = data['letter_id']
    except (KeyError, json.JSONDecodeError):
        return HttpResponseBadRequest('缺少参数')
    
    success, message, result = GameService.deliver_letter(session, letter_id)
    
    response_data = {
        'success': success,
        'message': message,
    }
    if success:
        response_data.update(result)
        response_data['new_state'] = {
            'remaining_letters': session.remaining_letters,
            'delivered_letters': session.delivered_letters,
            'step_count': session.step_count,
            'status': session.status,
        }
    
    return JsonResponse(response_data)


@csrf_exempt
@require_http_methods(["POST"])
def api_fold_map(request, session_id):
    """折叠地图"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    try:
        data = json.loads(request.body)
        direction = data['direction']
        fold_line = data['fold_line']
    except (KeyError, json.JSONDecodeError):
        return HttpResponseBadRequest('缺少参数')
    
    success, message, result = GameService.fold_map(session, direction, fold_line)
    
    response_data = {
        'success': success,
        'message': message,
    }
    if success:
        response_data.update(result)
        response_data['new_state'] = {
            'current_state': session.current_state,
            'fold_count': session.fold_count,
            'step_count': session.step_count,
            'status': session.status,
        }
    
    return JsonResponse(response_data)


@csrf_exempt
@require_http_methods(["POST"])
def api_undo_action(request, session_id):
    """撤销操作"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    success, message, result = GameService.undo_action(session)
    
    response_data = {
        'success': success,
        'message': message,
    }
    if success:
        response_data.update(result)
        response_data['new_state'] = {
            'current_state': session.current_state,
            'postman_position': session.postman_position,
            'fold_count': session.fold_count,
            'step_count': session.step_count,
            'remaining_letters': session.remaining_letters,
            'delivered_letters': session.delivered_letters,
        }
    
    return JsonResponse(response_data)


@require_http_methods(["GET"])
def api_get_history(request, session_id):
    """获取游戏历史"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    history = GameService.get_game_history(session)
    return JsonResponse({
        'success': True,
        'history': history,
    })


@require_http_methods(["GET"])
def api_compare_optimal(request, session_id):
    """与最短解对比"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    comparison = GameService.compare_with_optimal(session)
    return JsonResponse({
        'success': True,
        'comparison': comparison,
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_validate_route(request, session_id):
    """验证路线"""
    session = GameService.get_session(session_id)
    if not session:
        return JsonResponse({'success': False, 'error': '会话不存在'}, status=404)
    
    try:
        data = json.loads(request.body)
        from_x = data['from_x']
        from_y = data['from_y']
        to_x = data['to_x']
        to_y = data['to_y']
    except (KeyError, json.JSONDecodeError):
        return HttpResponseBadRequest('缺少参数')
    
    path = find_path(session.current_state, session.level, (from_x, from_y), (to_x, to_y))
    
    if path:
        positions = []
        for cell_id in path:
            cell = session.current_state['cells'].get(cell_id, {})
            positions.append({'x': cell.get('x'), 'y': cell.get('y')})
        
        return JsonResponse({
            'success': True,
            'valid': True,
            'path': positions,
            'path_length': len(positions) - 1,
            'message': f'路线有效，需要 {len(positions) - 1} 步',
        })
    else:
        return JsonResponse({
            'success': True,
            'valid': False,
            'path': None,
            'message': '无法到达目的地，道路不连通',
        })


@require_http_methods(["GET"])
def api_level_list(request):
    """获取关卡列表"""
    levels = Level.objects.all().values()
    return JsonResponse({
        'success': True,
        'levels': list(levels),
    })


@require_http_methods(["GET"])
def api_level_detail(request, level_id):
    """获取关卡详情"""
    try:
        level = Level.objects.get(id=level_id)
        return JsonResponse({
            'success': True,
            'level': {
                'id': level.id,
                'name': level.name,
                'description': level.description,
                'grid_width': level.grid_width,
                'grid_height': level.grid_height,
                'addresses': level.addresses,
                'roads': level.roads,
                'letters': level.letters,
                'post_office': level.post_office,
                'max_steps': level.max_steps,
                'min_solution': level.min_solution,
                'min_folds': level.min_folds,
                'fold_directions': level.fold_directions,
                'required_folds': level.required_folds,
            }
        })
    except Level.DoesNotExist:
        return JsonResponse({'success': False, 'error': '关卡不存在'}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def api_create_level(request):
    """创建新关卡"""
    try:
        data = json.loads(request.body)
        
        level = Level.objects.create(
            name=data.get('name', '新关卡'),
            description=data.get('description', ''),
            grid_width=data.get('grid_width', 5),
            grid_height=data.get('grid_height', 5),
            addresses=data.get('addresses', []),
            roads=data.get('roads', []),
            letters=data.get('letters', []),
            post_office=data.get('post_office', {'x': 0, 'y': 0}),
            max_steps=data.get('max_steps', 20),
            min_solution=data.get('min_solution', None),
            min_folds=data.get('min_folds', 0),
            fold_directions=data.get('fold_directions', []),
            required_folds=data.get('required_folds', []),
        )
        
        return JsonResponse({
            'success': True,
            'level_id': level.id,
            'message': '关卡创建成功',
        })
    except json.JSONDecodeError:
        return HttpResponseBadRequest('JSON格式错误')
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
        }, status=500)
