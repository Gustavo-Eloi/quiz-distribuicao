from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quiz.scoring import calculate_points
from quiz.seed import SEED_QUESTIONS

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "quiz.db"
_LOCK = threading.RLock()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # timeout alto: ~60 celulares respondendo quase juntos
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=60)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=60000")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db():
    # Lock em processo + busy_timeout no SQLite para pico de respostas
    with _LOCK:
        conn = _connect()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS question_bank (
                id TEXT PRIMARY KEY,
                theme TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                statement TEXT NOT NULL,
                explanation TEXT NOT NULL DEFAULT '',
                time_seconds INTEGER NOT NULL DEFAULT 30,
                points_multiplier REAL NOT NULL DEFAULT 1.0,
                tags TEXT NOT NULL DEFAULT '',
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_option TEXT NOT NULL,
                archived INTEGER NOT NULL DEFAULT 0,
                usage_count INTEGER NOT NULL DEFAULT 0,
                last_used_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS quiz_sessions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                current_question_order INTEGER NOT NULL DEFAULT 0,
                show_answer INTEGER NOT NULL DEFAULT 0,
                show_ranking INTEGER NOT NULL DEFAULT 0,
                access_code TEXT NOT NULL,
                started_at TEXT,
                finished_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS session_questions (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL REFERENCES quiz_sessions(id),
                question_bank_id TEXT,
                order_index INTEGER NOT NULL,
                theme TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                statement TEXT NOT NULL,
                explanation TEXT NOT NULL DEFAULT '',
                time_seconds INTEGER NOT NULL,
                points_multiplier REAL NOT NULL DEFAULT 1.0,
                tags TEXT NOT NULL DEFAULT '',
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_option TEXT NOT NULL,
                opened_at TEXT,
                closed_at TEXT,
                answer_revealed INTEGER NOT NULL DEFAULT 0,
                UNIQUE(session_id, order_index)
            );

            CREATE TABLE IF NOT EXISTS participants (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL REFERENCES quiz_sessions(id),
                nickname TEXT NOT NULL,
                client_token TEXT NOT NULL,
                total_score INTEGER NOT NULL DEFAULT 0,
                correct_count INTEGER NOT NULL DEFAULT 0,
                total_response_ms INTEGER NOT NULL DEFAULT 0,
                is_connected INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                UNIQUE(session_id, client_token),
                UNIQUE(session_id, nickname)
            );

            CREATE TABLE IF NOT EXISTS answers (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                session_question_id TEXT NOT NULL,
                participant_id TEXT NOT NULL,
                selected_option TEXT NOT NULL,
                is_correct INTEGER NOT NULL DEFAULT 0,
                response_time_ms INTEGER NOT NULL,
                points_awarded INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(session_question_id, participant_id)
            );

            CREATE INDEX IF NOT EXISTS idx_participants_rank
                ON participants(session_id, total_score DESC, correct_count DESC, total_response_ms ASC);
            CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(session_question_id);
            """
        )

        count = conn.execute("SELECT COUNT(*) AS c FROM question_bank").fetchone()["c"]
        if count == 0:
            for q in SEED_QUESTIONS:
                conn.execute(
                    """
                    INSERT INTO question_bank (
                        id, theme, difficulty, statement, explanation, time_seconds,
                        points_multiplier, tags, option_a, option_b, option_c, option_d,
                        correct_option, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()),
                        q["theme"],
                        q["difficulty"],
                        q["statement"],
                        q["explanation"],
                        q["time_seconds"],
                        q["points_multiplier"],
                        q["tags"],
                        q["option_a"],
                        q["option_b"],
                        q["option_c"],
                        q["option_d"],
                        q["correct_option"],
                        _now(),
                    ),
                )


def _row(r: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(r) if r else None


def _rows(rs: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(r) for r in rs]


# ----- Questions -----

def list_questions(include_archived: bool = False) -> list[dict[str, Any]]:
    with db() as conn:
        if include_archived:
            rs = conn.execute(
                "SELECT * FROM question_bank ORDER BY created_at DESC"
            ).fetchall()
        else:
            rs = conn.execute(
                "SELECT * FROM question_bank WHERE archived = 0 ORDER BY created_at DESC"
            ).fetchall()
        return _rows(rs)


def save_question(data: dict[str, Any], question_id: str | None = None) -> str:
    qid = question_id or str(uuid.uuid4())
    with db() as conn:
        if question_id:
            conn.execute(
                """
                UPDATE question_bank SET
                    theme=?, difficulty=?, statement=?, explanation=?, time_seconds=?,
                    points_multiplier=?, tags=?, option_a=?, option_b=?, option_c=?,
                    option_d=?, correct_option=?
                WHERE id=?
                """,
                (
                    data["theme"],
                    data["difficulty"],
                    data["statement"],
                    data["explanation"],
                    int(data["time_seconds"]),
                    float(data["points_multiplier"]),
                    data.get("tags", ""),
                    data["option_a"],
                    data["option_b"],
                    data["option_c"],
                    data["option_d"],
                    data["correct_option"],
                    qid,
                ),
            )
        else:
            conn.execute(
                """
                INSERT INTO question_bank (
                    id, theme, difficulty, statement, explanation, time_seconds,
                    points_multiplier, tags, option_a, option_b, option_c, option_d,
                    correct_option, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    qid,
                    data["theme"],
                    data["difficulty"],
                    data["statement"],
                    data["explanation"],
                    int(data["time_seconds"]),
                    float(data["points_multiplier"]),
                    data.get("tags", ""),
                    data["option_a"],
                    data["option_b"],
                    data["option_c"],
                    data["option_d"],
                    data["correct_option"],
                    _now(),
                ),
            )
    return qid


def archive_question(qid: str, archived: bool = True) -> None:
    with db() as conn:
        conn.execute(
            "UPDATE question_bank SET archived = ? WHERE id = ?",
            (1 if archived else 0, qid),
        )


def delete_question(qid: str) -> None:
    with db() as conn:
        conn.execute("DELETE FROM question_bank WHERE id = ?", (qid,))


def duplicate_question(qid: str) -> None:
    with db() as conn:
        q = conn.execute("SELECT * FROM question_bank WHERE id = ?", (qid,)).fetchone()
        if not q:
            raise ValueError("Pergunta não encontrada")
        d = dict(q)
        d["statement"] = f"{d['statement']} (cópia)"
        d.pop("id", None)
        d.pop("usage_count", None)
        d.pop("last_used_at", None)
        d.pop("archived", None)
        d.pop("created_at", None)
    save_question(d)


# ----- Sessions -----

def create_session(name: str, question_ids: list[str]) -> dict[str, Any]:
    if not (5 <= len(question_ids) <= 15):
        raise ValueError("Selecione de 5 a 15 perguntas")

    sid = str(uuid.uuid4())
    code = uuid.uuid4().hex[:6].upper()

    with db() as conn:
        questions = []
        for qid in question_ids:
            q = conn.execute("SELECT * FROM question_bank WHERE id = ?", (qid,)).fetchone()
            if not q:
                raise ValueError(f"Pergunta {qid} não encontrada")
            questions.append(dict(q))

        conn.execute(
            """
            INSERT INTO quiz_sessions (id, name, status, access_code, created_at)
            VALUES (?, ?, 'draft', ?, ?)
            """,
            (sid, name.strip(), code, _now()),
        )

        for i, q in enumerate(questions, start=1):
            conn.execute(
                """
                INSERT INTO session_questions (
                    id, session_id, question_bank_id, order_index, theme, difficulty,
                    statement, explanation, time_seconds, points_multiplier, tags,
                    option_a, option_b, option_c, option_d, correct_option
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    sid,
                    q["id"],
                    i,
                    q["theme"],
                    q["difficulty"],
                    q["statement"],
                    q["explanation"],
                    q["time_seconds"],
                    q["points_multiplier"],
                    q["tags"],
                    q["option_a"],
                    q["option_b"],
                    q["option_c"],
                    q["option_d"],
                    q["correct_option"],
                ),
            )
            conn.execute(
                """
                UPDATE question_bank
                SET usage_count = usage_count + 1, last_used_at = ?
                WHERE id = ?
                """,
                (_now(), q["id"]),
            )

        row = conn.execute("SELECT * FROM quiz_sessions WHERE id = ?", (sid,)).fetchone()
        return dict(row)


def list_sessions() -> list[dict[str, Any]]:
    with db() as conn:
        return _rows(
            conn.execute("SELECT * FROM quiz_sessions ORDER BY created_at DESC").fetchall()
        )


def get_session(session_id: str) -> dict[str, Any] | None:
    with db() as conn:
        return _row(
            conn.execute("SELECT * FROM quiz_sessions WHERE id = ?", (session_id,)).fetchone()
        )


def get_active_session() -> dict[str, Any] | None:
    with db() as conn:
        return _row(
            conn.execute(
                """
                SELECT * FROM quiz_sessions
                WHERE status IN ('lobby','question_open','question_closed','revealing','ranking')
                ORDER BY created_at DESC LIMIT 1
                """
            ).fetchone()
        )


def update_session(session_id: str, **fields: Any) -> dict[str, Any]:
    if not fields:
        s = get_session(session_id)
        if not s:
            raise ValueError("Sessão não encontrada")
        return s
    cols = ", ".join(f"{k} = ?" for k in fields)
    vals = list(fields.values()) + [session_id]
    with db() as conn:
        conn.execute(f"UPDATE quiz_sessions SET {cols} WHERE id = ?", vals)
        row = conn.execute("SELECT * FROM quiz_sessions WHERE id = ?", (session_id,)).fetchone()
        if not row:
            raise ValueError("Sessão não encontrada")
        return dict(row)


def session_questions(session_id: str) -> list[dict[str, Any]]:
    with db() as conn:
        return _rows(
            conn.execute(
                """
                SELECT * FROM session_questions
                WHERE session_id = ?
                ORDER BY order_index
                """,
                (session_id,),
            ).fetchall()
        )


def current_question(session: dict[str, Any]) -> dict[str, Any] | None:
    order = session.get("current_question_order") or 0
    if order <= 0:
        return None
    with db() as conn:
        return _row(
            conn.execute(
                """
                SELECT * FROM session_questions
                WHERE session_id = ? AND order_index = ?
                """,
                (session["id"], order),
            ).fetchone()
        )


def start_lobby(session_id: str) -> None:
    update_session(
        session_id,
        status="lobby",
        started_at=_now(),
        current_question_order=0,
        show_answer=0,
        show_ranking=0,
    )


def open_question(session_id: str, order_index: int) -> None:
    with db() as conn:
        conn.execute(
            """
            UPDATE session_questions
            SET opened_at = ?, closed_at = NULL, answer_revealed = 0
            WHERE session_id = ? AND order_index = ?
            """,
            (_now(), session_id, order_index),
        )
    update_session(
        session_id,
        status="question_open",
        current_question_order=order_index,
        show_answer=0,
        show_ranking=0,
    )


def close_answers(session_id: str) -> None:
    session = get_session(session_id)
    if not session:
        return
    with db() as conn:
        conn.execute(
            """
            UPDATE session_questions SET closed_at = ?
            WHERE session_id = ? AND order_index = ?
            """,
            (_now(), session_id, session["current_question_order"]),
        )
    update_session(session_id, status="question_closed", show_answer=0)


def _elapsed_ms(opened_at: str | None) -> int | None:
    if not opened_at:
        return None
    try:
        opened = datetime.fromisoformat(opened_at)
        if opened.tzinfo is None:
            opened = opened.replace(tzinfo=timezone.utc)
        return max(0, int((datetime.now(timezone.utc) - opened.astimezone(timezone.utc)).total_seconds() * 1000))
    except Exception:
        return None


def maybe_auto_close_question(session_id: str) -> bool:
    """Encerra respostas automaticamente quando o tempo da pergunta acaba."""
    session = get_session(session_id)
    if not session or session["status"] != "question_open":
        return False
    q = current_question(session)
    if not q:
        return False
    elapsed = _elapsed_ms(q.get("opened_at"))
    if elapsed is None:
        return False
    limit_ms = int(q["time_seconds"]) * 1000
    if elapsed >= limit_ms:
        close_answers(session_id)
        return True
    return False


def reveal_answer(session_id: str) -> None:
    session = get_session(session_id)
    if not session:
        return
    with db() as conn:
        conn.execute(
            """
            UPDATE session_questions SET answer_revealed = 1
            WHERE session_id = ? AND order_index = ?
            """,
            (session_id, session["current_question_order"]),
        )
    update_session(session_id, status="revealing", show_answer=1)


def show_ranking(session_id: str) -> None:
    update_session(session_id, status="ranking", show_ranking=1)


def advance_question(session_id: str) -> None:
    session = get_session(session_id)
    if not session:
        return
    qs = session_questions(session_id)
    nxt = session["current_question_order"] + 1
    if nxt > len(qs):
        finish_session(session_id)
    else:
        open_question(session_id, nxt)


def finish_session(session_id: str) -> None:
    update_session(
        session_id,
        status="finished",
        finished_at=_now(),
        show_ranking=1,
        show_answer=0,
    )


# ----- Participants / answers -----

def join_session(session_id: str, nickname: str, client_token: str) -> dict[str, Any]:
    nick = nickname.strip()
    if not nick or len(nick) > 24:
        raise ValueError("Apelido inválido (máx. 24 caracteres)")

    session = get_session(session_id)
    if not session:
        raise ValueError("Sessão não encontrada")
    if session["status"] in ("draft", "finished"):
        raise ValueError("Sessão não está aberta para entrada")

    with db() as conn:
        existing = conn.execute(
            """
            SELECT * FROM participants
            WHERE session_id = ? AND client_token = ?
            """,
            (session_id, client_token),
        ).fetchone()
        if existing:
            conn.execute(
                """
                UPDATE participants SET nickname = ?, is_connected = 1
                WHERE id = ?
                """,
                (nick, existing["id"]),
            )
            return dict(
                conn.execute(
                    "SELECT * FROM participants WHERE id = ?", (existing["id"],)
                ).fetchone()
            )

        clash = conn.execute(
            """
            SELECT id FROM participants
            WHERE session_id = ? AND lower(nickname) = lower(?)
            """,
            (session_id, nick),
        ).fetchone()
        if clash:
            raise ValueError("Este apelido já está em uso nesta sessão")

        pid = str(uuid.uuid4())
        conn.execute(
            """
            INSERT INTO participants (
                id, session_id, nickname, client_token, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (pid, session_id, nick, client_token, _now()),
        )
        return dict(
            conn.execute("SELECT * FROM participants WHERE id = ?", (pid,)).fetchone()
        )


def list_participants(session_id: str) -> list[dict[str, Any]]:
    with db() as conn:
        return _rows(
            conn.execute(
                """
                SELECT * FROM participants
                WHERE session_id = ?
                ORDER BY total_score DESC, correct_count DESC, total_response_ms ASC, created_at ASC
                """,
                (session_id,),
            ).fetchall()
        )


def get_participant(participant_id: str) -> dict[str, Any] | None:
    with db() as conn:
        return _row(
            conn.execute(
                "SELECT * FROM participants WHERE id = ?", (participant_id,)
            ).fetchone()
        )


def get_participant_by_token(session_id: str, token: str) -> dict[str, Any] | None:
    with db() as conn:
        return _row(
            conn.execute(
                """
                SELECT * FROM participants
                WHERE session_id = ? AND client_token = ?
                """,
                (session_id, token),
            ).fetchone()
        )


def answer_count(session_question_id: str) -> int:
    with db() as conn:
        return conn.execute(
            "SELECT COUNT(*) AS c FROM answers WHERE session_question_id = ?",
            (session_question_id,),
        ).fetchone()["c"]


def get_answer(participant_id: str, session_question_id: str) -> dict[str, Any] | None:
    with db() as conn:
        return _row(
            conn.execute(
                """
                SELECT * FROM answers
                WHERE participant_id = ? AND session_question_id = ?
                """,
                (participant_id, session_question_id),
            ).fetchone()
        )


def list_answers(session_id: str) -> list[dict[str, Any]]:
    with db() as conn:
        return _rows(
            conn.execute(
                "SELECT * FROM answers WHERE session_id = ?", (session_id,)
            ).fetchall()
        )


def submit_answer(
    participant_id: str,
    client_token: str,
    session_question_id: str,
    selected_option: str,
    response_time_ms: int,
) -> dict[str, Any]:
    with db() as conn:
        p = conn.execute(
            "SELECT * FROM participants WHERE id = ? AND client_token = ?",
            (participant_id, client_token),
        ).fetchone()
        if not p:
            raise ValueError("Participante inválido")

        session = conn.execute(
            "SELECT * FROM quiz_sessions WHERE id = ?", (p["session_id"],)
        ).fetchone()
        if not session or session["status"] != "question_open":
            raise ValueError("Respostas encerradas para esta pergunta")

        q = conn.execute(
            """
            SELECT * FROM session_questions
            WHERE id = ? AND session_id = ?
            """,
            (session_question_id, p["session_id"]),
        ).fetchone()
        if not q:
            raise ValueError("Pergunta inválida")
        if q["order_index"] != session["current_question_order"]:
            raise ValueError("Esta não é a pergunta ativa")

        existing = conn.execute(
            """
            SELECT id FROM answers
            WHERE session_question_id = ? AND participant_id = ?
            """,
            (session_question_id, participant_id),
        ).fetchone()
        if existing:
            raise ValueError("Você já respondeu esta pergunta")

        # Limite de tempo: respostas após o prazo não valem
        elapsed = _elapsed_ms(q["opened_at"])
        limit_ms = int(q["time_seconds"]) * 1000
        if elapsed is not None and elapsed > limit_ms:
            raise ValueError("Tempo esgotado para esta pergunta")

        # Usa o menor tempo entre o reportado e o decorrido real (anti-atraso)
        real_ms = elapsed if elapsed is not None else max(0, int(response_time_ms))
        response_ms = max(0, min(max(0, int(response_time_ms)), real_ms, limit_ms))

        opt = selected_option.upper()
        is_correct = 1 if opt == q["correct_option"] else 0
        points = calculate_points(
            bool(is_correct),
            response_ms,
            int(q["time_seconds"]),
            float(q["points_multiplier"]),
        )
        aid = str(uuid.uuid4())
        conn.execute(
            """
            INSERT INTO answers (
                id, session_id, session_question_id, participant_id,
                selected_option, is_correct, response_time_ms, points_awarded, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                aid,
                p["session_id"],
                session_question_id,
                participant_id,
                opt,
                is_correct,
                response_ms,
                points,
                _now(),
            ),
        )
        conn.execute(
            """
            UPDATE participants SET
                total_score = total_score + ?,
                correct_count = correct_count + ?,
                total_response_ms = total_response_ms + ?
            WHERE id = ?
            """,
            (points, is_correct, response_ms, participant_id),
        )
        return dict(conn.execute("SELECT * FROM answers WHERE id = ?", (aid,)).fetchone())


def export_session_csv_rows(session_id: str) -> list[dict[str, Any]]:
    parts = list_participants(session_id)
    rows = []
    for i, p in enumerate(parts, start=1):
        rows.append(
            {
                "rank": i,
                "nickname": p["nickname"],
                "total_score": p["total_score"],
                "correct_count": p["correct_count"],
                "total_response_ms": p["total_response_ms"],
            }
        )
    return rows


def import_questions_from_dicts(items: list[dict[str, Any]]) -> int:
    n = 0
    for item in items:
        save_question(item)
        n += 1
    return n


def parse_csv_questions(text: str) -> list[dict[str, Any]]:
    import csv
    from io import StringIO

    reader = csv.DictReader(StringIO(text.lstrip("\ufeff")))
    required = [
        "theme",
        "difficulty",
        "statement",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_option",
    ]
    if not reader.fieldnames:
        raise ValueError("CSV vazio")
    fields = [f.strip().lower() for f in reader.fieldnames]
    for r in required:
        if r not in fields:
            raise ValueError(f"Coluna obrigatória ausente: {r}")

    out = []
    for raw in reader:
        row = {k.strip().lower(): (v or "").strip() for k, v in raw.items() if k}
        diff = row.get("difficulty", "medio").lower()
        if diff not in ("facil", "medio", "dificil"):
            diff = "medio"
        correct = row.get("correct_option", "A").upper()
        if correct not in ("A", "B", "C", "D"):
            correct = "A"
        out.append(
            {
                "theme": row["theme"],
                "difficulty": diff,
                "statement": row["statement"],
                "explanation": row.get("explanation", ""),
                "time_seconds": int(row.get("time_seconds") or 30),
                "points_multiplier": float(row.get("points_multiplier") or 1),
                "tags": row.get("tags", "").replace("|", ","),
                "option_a": row["option_a"],
                "option_b": row["option_b"],
                "option_c": row["option_c"],
                "option_d": row["option_d"],
                "correct_option": correct,
            }
        )
    return out


# silence unused import warning helper
def dump_debug() -> str:
    return json.dumps({"db": str(DB_PATH)})
