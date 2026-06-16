import math
from .models import OrderEvaluation, Round, Operation


def calculate_score(round_obj, arranged_text, ink_used, elapsed_seconds, proofread_count, inverted_positions=None):
    level = round_obj.level
    target = level.target_text

    if inverted_positions is None:
        inverted_positions = []

    target_chars = list(target)
    arranged_chars = list(arranged_text)

    wrong_count = 0
    missing_count = 0
    extra_count = 0
    inverted_count = 0

    max_len = max(len(target_chars), len(arranged_chars))
    for i in range(max_len):
        if i >= len(arranged_chars):
            missing_count += 1
        elif i >= len(target_chars):
            extra_count += 1
        elif arranged_chars[i] != target_chars[i]:
            wrong_count += 1

    inverted_count = len(inverted_positions)

    total_chars = len(target_chars)
    if total_chars == 0:
        accuracy = 0.0
    else:
        correct_chars = total_chars - wrong_count - missing_count
        accuracy = max(0.0, correct_chars / total_chars * 100)

    if ink_used > level.ink_budget:
        ink_waste = ink_used - level.ink_budget
        ink_efficiency = max(0.0, (level.ink_budget / ink_used) * 100)
    else:
        ink_waste = 0
        ink_efficiency = 100.0

    if elapsed_seconds < level.time_limit:
        time_ratio = 1.0 - (elapsed_seconds / level.time_limit)
        time_bonus = time_ratio * 20.0
    else:
        time_bonus = 0.0

    if proofread_count > 0:
        proofread_bonus = min(15.0, proofread_count * 5.0)
    else:
        proofread_bonus = 0.0

    base_score = accuracy
    penalty = (
        wrong_count * level.error_penalty
        + inverted_count * level.inverted_penalty
        + ink_waste * level.ink_waste_penalty
        + extra_count * 2
    )

    raw_score = base_score - penalty + time_bonus + proofread_bonus
    final_score = max(0.0, raw_score)

    difficulty_mult = {1: 1.0, 2: 1.3, 3: 1.6}.get(level.difficulty, 1.0)
    revenue = int(level.base_reward * (final_score / 100.0) * difficulty_mult)

    passed = final_score >= level.pass_score

    evaluation = OrderEvaluation(
        round=round_obj,
        accuracy=round(accuracy, 2),
        wrong_char_count=wrong_count,
        inverted_char_count=inverted_count,
        missing_char_count=missing_count,
        extra_char_count=extra_count,
        ink_efficiency=round(ink_efficiency, 2),
        ink_waste=ink_waste,
        time_bonus=round(time_bonus, 2),
        proofread_bonus=round(proofread_bonus, 2),
        raw_score=round(raw_score, 2),
        final_score=round(final_score, 2),
        revenue=revenue,
        passed=passed,
        server_calculated=True,
    )
    evaluation.save()
    return evaluation


def replay_operations(round_obj):
    ops = round_obj.operations.all()
    arranged = []
    ink = 0
    inverted_set = set()

    for op in ops:
        if op.op_type == 'place_char':
            pos = op.position if op.position is not None else len(arranged)
            if pos <= len(arranged):
                arranged.insert(pos, op.char_value)
            else:
                while len(arranged) < pos:
                    arranged.append(' ')
                arranged.append(op.char_value)

        elif op.op_type == 'swap_char':
            if op.position is not None and op.position < len(arranged):
                arranged[op.position] = op.char_value

        elif op.op_type == 'remove_char':
            if op.position is not None and op.position < len(arranged):
                arranged.pop(op.position)

        elif op.op_type == 'adjust_ink':
            ink += op.ink_delta

        elif op.op_type == 'flip_char':
            if op.position is not None:
                inverted_set.add(op.position)

        elif op.op_type == 'proofread':
            pass

    return {
        'arranged_text': ''.join(arranged),
        'ink_used': max(0, ink),
        'inverted_positions': sorted(inverted_set),
    }


def server_recalculate(round_obj):
    replayed = replay_operations(round_obj)
    arranged_text = replayed['arranged_text']
    ink_used = replayed['ink_used']
    inverted_positions = replayed['inverted_positions']

    if hasattr(round_obj, 'evaluation'):
        round_obj.evaluation.delete()

    evaluation = calculate_score(
        round_obj,
        arranged_text=arranged_text,
        ink_used=ink_used,
        elapsed_seconds=round_obj.elapsed_seconds,
        proofread_count=round_obj.proofread_count,
        inverted_positions=inverted_positions,
    )

    round_obj.arranged_text = arranged_text
    round_obj.ink_used = ink_used

    if evaluation.passed:
        round_obj.status = 'completed'
    else:
        round_obj.status = 'failed'

    from django.utils import timezone
    round_obj.completed_at = timezone.now()
    round_obj.save()

    if evaluation.passed:
        player = round_obj.player
        player.total_revenue += evaluation.revenue
        player.total_rounds += 1
        if evaluation.final_score > player.best_score:
            player.best_score = int(evaluation.final_score)
        if round_obj.level.level_number >= player.current_level:
            player.current_level = round_obj.level.level_number + 1
        player.save()

    return evaluation
