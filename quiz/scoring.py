"""Pontuação: até 1000 pts na resposta correta mais rápida × multiplicador."""


def calculate_points(
    is_correct: bool,
    response_time_ms: int,
    time_seconds: int,
    multiplier: float = 1.0,
) -> int:
    if not is_correct:
        return 0
    if time_seconds <= 0:
        return int(round(1000 * multiplier))
    ratio = max(0.0, min(1.0, 1.0 - (response_time_ms / (time_seconds * 1000.0))))
    return max(0, int(round(1000 * ratio * multiplier)))


def format_score(score: int) -> str:
    return f"{score:,}".replace(",", ".")


def format_ms(ms: int) -> str:
    if ms < 1000:
        return f"{ms} ms"
    return f"{ms / 1000:.1f} s"
