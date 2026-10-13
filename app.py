"""
Quiz Distribuição — Quiz ao vivo (Streamlit)
Publicar no Streamlit Community Cloud e compartilhar o link.
"""

from __future__ import annotations

import io
import uuid
from datetime import datetime
from urllib.parse import urlencode

import pandas as pd
import qrcode
import streamlit as st

from quiz import db
from quiz.scoring import format_ms, format_score
from quiz.seed import DIFFICULTY_LABEL, STATUS_LABEL
from quiz import kahoot_ui as kui
from quiz.styles import brand_header, inject_css

st.set_page_config(
    page_title="Quiz Distribuição",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="collapsed",
)

try:
    db.init_db()
except Exception as exc:
    st.error(f"Erro ao iniciar o banco de dados: {exc}")

inject_css()


def admin_password() -> str:
    try:
        return st.secrets.get("admin_password", "bayer2026")
    except Exception:
        return "bayer2026"


def ensure_token() -> str:
    if "client_token" not in st.session_state:
        st.session_state.client_token = str(uuid.uuid4())
    return st.session_state.client_token


def set_view(view: str, **params) -> None:
    q = {"view": view, **{k: str(v) for k, v in params.items() if v is not None}}
    st.query_params.from_dict(q)


def current_view() -> str:
    return st.query_params.get("view", "home")


def public_base_url() -> str:
    """Melhor esforço para montar link compartilhável."""
    try:
        headers = getattr(st, "context", None)
        if headers is not None:
            origin = st.context.headers.get("origin", "") or ""
            if origin:
                return origin
            host = st.context.headers.get("host", "")
            if host:
                proto = st.context.headers.get("x-forwarded-proto", "https")
                return f"{proto}://{host}"
    except Exception:
        pass
    return ""


def build_play_link(session_id: str | None = None) -> str:
    base = public_base_url() or "http://localhost:8502"
    params = {"view": "play"}
    if session_id:
        params["session"] = session_id
    return f"{base}/?{urlencode(params)}"


def qr_image(url: str, box_size: int = 10):
    """Gera QR Code novo a cada chamada (para cada uso/sessão)."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#003E7E", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def render_join_qr(session: dict | None, *, large: bool = True, key_suffix: str = "home") -> None:
    """Painel de QR para entrada pelo celular — regenerado a cada render."""
    if session and session.get("status") not in ("draft", "finished"):
        link = build_play_link(session["id"])
        code = session.get("access_code", "")
        title = "Entre pelo celular"
        caption = "Escaneie o QR Code com a câmera"
    else:
        link = build_play_link()
        code = "—"
        title = "QR Code"
        caption = "Inicie uma sessão no painel do apresentador"

    with st.container(border=True):
        st.markdown(f"**{title}**")
        st.caption(caption)
        width = 240 if large else 180
        c1, c2, c3 = st.columns([1, 1.4, 1])
        with c2:
            st.image(qr_image(link, box_size=10 if large else 8), width=width)
            if code != "—":
                st.markdown(
                    f'<div class="dac-qr-code-label">{code}</div>',
                    unsafe_allow_html=True,
                )
        st.caption(link)
        if st.button("Atualizar QR", key=f"qr_refresh_{key_suffix}"):
            st.rerun()


def require_admin() -> bool:
    if st.session_state.get("is_admin"):
        return True
    brand_header(compact=True)
    with st.container(border=True):
        st.subheader("Acesso do apresentador")
        pwd = st.text_input("Senha", type="password")
        if st.button("Entrar", type="primary", use_container_width=True):
            if pwd == admin_password():
                st.session_state.is_admin = True
                st.rerun()
            else:
                st.error("Senha incorreta")
        st.caption("Senha padrão: bayer2026")
    if st.button("← Voltar"):
        set_view("home")
        st.rerun()
    return False


def render_home() -> None:
    brand_header()

    active = db.get_active_session()
    render_join_qr(active, large=True, key_suffix="home")

    st.markdown("### Quem é você?")
    st.caption("Participantes jogam no celular. Você, como apresentador, controla as perguntas.")

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Participante**")
        st.caption("Responder perguntas · ranking ao vivo")
        if st.button("Entrar no jogo", type="primary", use_container_width=True, key="go_play"):
            if active:
                set_view("play", session=active["id"])
            else:
                set_view("play")
            st.rerun()
    with c2:
        st.markdown("**Apresentador (você)**")
        st.caption("Liberar perguntas · cronômetro · gabarito")
        if st.button("Controlar o jogo", use_container_width=True, key="go_admin"):
            set_view("admin")
            st.rerun()

    if st.button("Ver ranking / projetor", use_container_width=True, key="go_rank"):
        set_view("ranking")
        st.rerun()


def render_admin_dashboard() -> None:
    brand_header(compact=True)
    st.info(
        "Painel do apresentador — aqui você controla o jogo. "
        "Os participantes entram por **Entrar no jogo** ou pelo QR Code."
    )
    cols = st.columns(4)
    actions = [
        ("Criar sessão", "admin_create"),
        ("Banco de perguntas", "admin_bank"),
        ("Histórico", "historico"),
        ("Sessões / ao vivo", "admin_sessions"),
    ]
    for col, (label, view) in zip(cols, actions):
        with col:
            if st.button(label, use_container_width=True, key=f"dash_{view}"):
                set_view(view)
                st.rerun()
    if st.button("Sair do admin"):
        st.session_state.is_admin = False
        set_view("home")
        st.rerun()


def render_question_bank() -> None:
    if st.button("← Voltar"):
        set_view("admin")
        st.rerun()
    st.title("Banco de perguntas")
    questions = db.list_questions(include_archived=True)
    active = [q for q in questions if not q["archived"]]
    themes = sorted({q["theme"] for q in active})

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total", len(active))
    m2.metric("Temas", len(themes))
    most = sorted(active, key=lambda q: q["usage_count"], reverse=True)
    m3.metric("Mais usada", f"{most[0]['usage_count']} usos" if most else "—")
    last = sorted([q for q in active if q["last_used_at"]], key=lambda q: q["last_used_at"] or "", reverse=True)
    m4.metric("Última uso", (last[0]["last_used_at"][:10] if last else "—"))

    with st.expander("Nova pergunta / editar", expanded=False):
        edit_id = st.selectbox(
            "Editar existente (opcional)",
            options=[""] + [q["id"] for q in questions],
            format_func=lambda i: "Nova pergunta" if i == "" else next(
                (q["statement"][:60] for q in questions if q["id"] == i), i
            ),
        )
        base = next((q for q in questions if q["id"] == edit_id), None) if edit_id else None
        with st.form("q_form"):
            theme = st.text_input("Tema", value=base["theme"] if base else "")
            difficulty = st.selectbox(
                "Dificuldade",
                ["facil", "medio", "dificil"],
                index=["facil", "medio", "dificil"].index(base["difficulty"]) if base else 1,
                format_func=lambda x: DIFFICULTY_LABEL[x],
            )
            statement = st.text_area("Enunciado", value=base["statement"] if base else "", height=100)
            a = st.text_input("Alternativa A", value=base["option_a"] if base else "")
            b = st.text_input("Alternativa B", value=base["option_b"] if base else "")
            c = st.text_input("Alternativa C", value=base["option_c"] if base else "")
            d = st.text_input("Alternativa D", value=base["option_d"] if base else "")
            correct = st.selectbox(
                "Correta",
                ["A", "B", "C", "D"],
                index=["A", "B", "C", "D"].index(base["correct_option"]) if base else 0,
            )
            c1, c2, c3 = st.columns(3)
            time_s = c1.number_input("Tempo (s)", 5, 300, int(base["time_seconds"]) if base else 30)
            mult = c2.number_input(
                "Multiplicador", 0.1, 5.0, float(base["points_multiplier"]) if base else 1.0, 0.1
            )
            tags = c3.text_input("Tags", value=base["tags"] if base else "")
            explanation = st.text_area("Explicação", value=base["explanation"] if base else "")
            if st.form_submit_button("Salvar", type="primary"):
                db.save_question(
                    {
                        "theme": theme,
                        "difficulty": difficulty,
                        "statement": statement,
                        "explanation": explanation,
                        "time_seconds": time_s,
                        "points_multiplier": mult,
                        "tags": tags,
                        "option_a": a,
                        "option_b": b,
                        "option_c": c,
                        "option_d": d,
                        "correct_option": correct,
                    },
                    question_id=edit_id or None,
                )
                st.success("Pergunta salva")
                st.rerun()

    up = st.file_uploader("Importar CSV", type=["csv"])
    if up is not None:
        try:
            items = db.parse_csv_questions(up.getvalue().decode("utf-8-sig"))
            n = db.import_questions_from_dicts(items)
            st.success(f"{n} pergunta(s) importada(s)")
            st.rerun()
        except Exception as e:
            st.error(str(e))

    search = st.text_input("Pesquisar")
    for q in questions:
        if q["archived"]:
            continue
        if search and search.lower() not in f"{q['statement']} {q['theme']} {q['tags']}".lower():
            continue
        with st.container(border=True):
            st.markdown(
                f'<span class="dac-badge">{q["theme"]}</span>'
                f'<span class="dac-badge dac-badge-slate">{DIFFICULTY_LABEL[q["difficulty"]]}</span>'
                + (
                    f'<span class="dac-badge dac-badge-yellow">{q["points_multiplier"]}x</span>'
                    if float(q["points_multiplier"]) > 1
                    else ""
                ),
                unsafe_allow_html=True,
            )
            st.write(q["statement"])
            b1, b2, b3, b4 = st.columns(4)
            if b1.button("Duplicar", key=f"dup_{q['id']}"):
                db.duplicate_question(q["id"])
                st.rerun()
            if b2.button("Arquivar", key=f"arc_{q['id']}"):
                db.archive_question(q["id"], True)
                st.rerun()
            if b3.button("Excluir", key=f"del_{q['id']}"):
                db.delete_question(q["id"])
                st.rerun()
            b4.caption(f"{q['time_seconds']}s · {q['usage_count']} usos")


def render_create_session() -> None:
    if st.button("← Voltar"):
        set_view("admin")
        st.rerun()
    st.title("Criar sessão")
    questions = db.list_questions(False)
    name = st.text_input("Nome da sessão", value="Quiz Distribuição")
    options = {q["id"]: f"[{q['theme']}] {q['statement'][:80]}" for q in questions}
    selected = st.multiselect(
        "Selecione de 5 a 15 perguntas (ordem = ordem do quiz)",
        options=list(options.keys()),
        format_func=lambda i: options[i],
    )
    st.caption(f"Selecionadas: {len(selected)} / 15 (mínimo 5)")
    if st.button("Criar sessão", type="primary", disabled=not (5 <= len(selected) <= 15)):
        try:
            session = db.create_session(name, selected)
            set_view("admin_live", session=session["id"])
            st.rerun()
        except Exception as e:
            st.error(str(e))


def render_sessions_list() -> None:
    if st.button("← Voltar"):
        set_view("admin")
        st.rerun()
    st.title("Sessões")
    if st.button("➕ Nova sessão", type="primary"):
        set_view("admin_create")
        st.rerun()
    for s in db.list_sessions():
        with st.container(border=True):
            c1, c2 = st.columns([3, 1])
            with c1:
                st.markdown(f"**{s['name']}**")
                st.caption(
                    f"{STATUS_LABEL.get(s['status'], s['status'])} · código {s['access_code']}"
                )
            with c2:
                if st.button("Abrir", key=f"open_{s['id']}"):
                    set_view("admin_live", session=s["id"])
                    st.rerun()


def render_live_control() -> None:
    if not require_admin():
        return
    sid = st.query_params.get("session")
    if not sid:
        set_view("admin_sessions")
        st.rerun()
        return

    # Painel do apresentador (sem UI Kahoot dos jogadores)
    @st.fragment(run_every=1)
    def live_body():
        if db.maybe_auto_close_question(sid):
            st.rerun()

        session = db.get_session(sid)
        if not session:
            st.error("Sessão não encontrada")
            return
        if st.button("← Sessões"):
            set_view("admin_sessions")
            st.rerun()

        st.title(session["name"])
        st.caption("Modo apresentador — controle o ritmo do jogo nesta tela.")
        st.markdown(
            f"**Status:** {STATUS_LABEL.get(session['status'], session['status'])}"
        )

        participants = db.list_participants(sid)
        questions = db.session_questions(sid)
        current = db.current_question(session)
        connected = sum(1 for p in participants if p["is_connected"])

        left, right = st.columns([1.2, 1])
        with left:
            render_join_qr(session, large=True, key_suffix="live")
            st.caption(f"{connected} conectados · {len(participants)} no total")

            st.subheader("Controles do jogo")
            status = session["status"]
            bcols = st.columns(2)
            if status == "draft":
                if bcols[0].button("Iniciar sessão (lobby)", type="primary"):
                    db.start_lobby(sid)
                    st.rerun()
            if status == "lobby":
                if bcols[0].button("Liberar 1ª pergunta", type="primary"):
                    db.open_question(sid, 1)
                    st.rerun()
            if status == "question_open":
                if bcols[0].button("Encerrar respostas agora"):
                    db.close_answers(sid)
                    st.rerun()
            if status in ("question_open", "question_closed"):
                if bcols[1].button("Revelar gabarito"):
                    db.reveal_answer(sid)
                    st.rerun()
            if status in ("revealing", "question_closed", "ranking"):
                if bcols[0].button("Exibir ranking"):
                    db.show_ranking(sid)
                    st.rerun()
                if bcols[1].button("Avançar pergunta", type="primary"):
                    db.advance_question(sid)
                    st.rerun()
            if status not in ("draft", "finished"):
                if st.button("Encerrar sessão", type="secondary"):
                    db.finish_session(sid)
                    st.rerun()

            if current:
                st.subheader(f"Pergunta {current['order_index']} / {len(questions)}")
                st.write(current["statement"])
                if status == "question_open":
                    remaining = kui.remaining_seconds(
                        current["opened_at"], current["time_seconds"]
                    )
                    st.metric("Tempo restante", f"{int(remaining)}s")
                    st.caption(
                        f"Limite: {current['time_seconds']}s · "
                        "Quem acerta mais rápido ganha mais pontos (até 1000)."
                    )
                    st.progress(
                        min(1.0, remaining / max(1, current["time_seconds"]))
                    )
                st.info(
                    f"Respostas recebidas: {db.answer_count(current['id'])} / {len(participants)}"
                )
                if session["show_answer"]:
                    st.success(
                        f"Gabarito: {current['correct_option']} — {current['explanation']}"
                    )

        with right:
            st.subheader("Ranking ao vivo")
            render_ranking_table(participants[:10])
            st.subheader("Participantes")
            for p in participants:
                dot = "#66B512" if p["is_connected"] else "#CBD5E1"
                st.markdown(
                    f'<span style="color:{dot}">●</span> **{p["nickname"]}** — {p["total_score"]} pts',
                    unsafe_allow_html=True,
                )

    live_body()


def render_ranking_table(participants: list) -> None:
    if not participants:
        st.caption("Aguardando pontuações…")
        return
    for i, p in enumerate(participants, start=1):
        st.markdown(
            f"**{i}.** **{p['nickname']}** — {format_score(p['total_score'])} pts "
            f"· {p['correct_count']} acertos · {format_ms(p['total_response_ms'])}"
        )


def render_podium(participants: list) -> None:
    top = participants[:3]
    while len(top) < 3:
        top.append({"nickname": "—", "total_score": 0})
    with st.container(border=True):
        st.markdown("**Pódio final**")
        st.caption("Quiz Distribuição")
        # Ordem visual: 2º · 1º · 3º
        order_rows = [(top[1], "2º"), (top[0], "1º"), (top[2], "3º")]
        cols = st.columns(3)
        for col, (p, label) in zip(cols, order_rows):
            with col:
                st.markdown(f"**{label}**")
                st.markdown(f"**{p['nickname']}**")
                st.caption(f"{format_score(p['total_score'])} pts")


def render_play() -> None:
    ensure_token()
    token = st.session_state.client_token
    sid = st.query_params.get("session")
    session = db.get_session(sid) if sid else db.get_active_session()

    kui.inject_kahoot_css()
    brand_header(compact=True)

    if not session or session["status"] == "draft":
        kui.render_waiting_next()
        st.caption("O apresentador ainda não liberou o jogo. Escaneie o QR na tela principal.")
        if st.button("Atualizar", use_container_width=True):
            st.rerun()
        return

    sid = session["id"]
    participant = db.get_participant_by_token(sid, token)

    if not participant:
        with st.form("join"):
            st.subheader("Entre no quiz")
            st.caption(session["name"])
            nick = st.text_input("Nome ou apelido", max_chars=24)
            submitted = st.form_submit_button("Entrar e jogar", type="primary", use_container_width=True)
            if submitted:
                try:
                    p = db.join_session(sid, nick, token)
                    st.session_state.participant_id = p["id"]
                    set_view("play", session=sid)
                    st.rerun()
                except Exception as e:
                    st.error(str(e))
        return

    # UI dinâmica só para participantes
    @st.fragment(run_every=0.5)
    def play_loop():
        if db.maybe_auto_close_question(sid):
            st.rerun()

        session_now = db.get_session(sid)
        if not session_now:
            st.warning("Sessão encerrada.")
            return
        me = db.get_participant(participant["id"])
        parts = db.list_participants(sid)
        rank = next((i for i, p in enumerate(parts, 1) if p["id"] == me["id"]), None)
        current = db.current_question(session_now)
        questions = db.session_questions(sid)
        q_total = max(1, len(questions))
        q_index = current["order_index"] if current else 0

        kui.render_hud(me["nickname"], me["total_score"], rank, q_index, q_total)
        status = session_now["status"]

        if status == "lobby":
            kui.render_lobby(me["nickname"], len(parts))
            return

        if status == "finished":
            st.markdown(
                f"""
                <div class="k-feedback ok">
                  <div class="emoji">🏆</div>
                  <h3>Fim de jogo!</h3>
                  <div class="pts">#{rank} · {format_score(me['total_score'])} pts</div>
                  <p>Confira o pódio no ranking.</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
            if st.button("Ver ranking", type="primary", use_container_width=True):
                set_view("ranking", session=sid)
                st.rerun()
            return

        if not current:
            kui.render_waiting_next()
            return

        my_answer = db.get_answer(me["id"], current["id"])
        selected = my_answer["selected_option"] if my_answer else None
        show_answer = bool(session_now["show_answer"])
        can_answer = status == "question_open" and not my_answer

        if status == "question_open":
            remaining = kui.remaining_seconds(current["opened_at"], current["time_seconds"])
            kui.render_timer(remaining, current["time_seconds"])
            if can_answer:
                st.caption("⚡ Quanto mais rápido você acertar, mais pontos (até 1000).")

        kui.render_question_box(
            current["statement"],
            current["order_index"],
            q_total,
            current["points_multiplier"],
        )

        options = [
            ("A", current["option_a"]),
            ("B", current["option_b"]),
            ("C", current["option_c"]),
            ("D", current["option_d"]),
        ]

        # Grade colorida só enquanto dá para responder (ou para ver escolha/gabarito)
        if status == "question_open" or show_answer or my_answer:
            clicked = kui.render_option_grid(
                options,
                question_id=current["id"],
                can_answer=can_answer,
                selected=selected,
                correct_option=current["correct_option"] if show_answer else None,
                show_answer=show_answer,
            )
            if clicked:
                try:
                    db.submit_answer(
                        me["id"],
                        token,
                        current["id"],
                        clicked,
                        kui.response_ms(current["opened_at"]),
                    )
                    st.rerun()
                except Exception as e:
                    st.error(str(e))

        if my_answer and status == "question_open":
            kui.render_answer_sent()
            if my_answer.get("points_awarded") is not None and not show_answer:
                st.caption("Pontos serão confirmados na revelação do gabarito.")
        elif status == "question_closed" and not show_answer:
            kui.render_feedback(
                correct=None,
                points=0,
                rank=rank,
                waiting_reveal=True,
            )
        elif show_answer:
            if my_answer:
                kui.render_feedback(
                    correct=bool(my_answer["is_correct"]),
                    points=int(my_answer["points_awarded"] or 0),
                    rank=rank,
                    correct_option=current["correct_option"],
                    explanation=current.get("explanation") or "",
                )
            else:
                kui.render_feedback(
                    correct=False,
                    points=0,
                    rank=rank,
                    correct_option=current["correct_option"],
                    explanation=current.get("explanation") or "",
                )

    play_loop()


def render_ranking() -> None:
    brand_header(compact=True)
    sid = st.query_params.get("session")
    session = db.get_session(sid) if sid else db.get_active_session()
    if not session:
        finished = [s for s in db.list_sessions() if s["status"] == "finished"]
        session = finished[0] if finished else None
    if not session:
        st.info("Nenhuma sessão para exibir.")
        return

    @st.fragment(run_every=2)
    def ranking_loop():
        s = db.get_session(session["id"])
        parts = db.list_participants(session["id"])
        st.caption(s["name"] if s else "")
        st.subheader("Ranking final" if s and s["status"] == "finished" else "Ranking ao vivo")
        if s and (s["status"] == "finished" or s["show_ranking"]) and parts:
            render_podium(parts)
        limit = 50 if s and s["status"] == "finished" else 10
        render_ranking_table(parts[:limit])

    ranking_loop()


def render_historico() -> None:
    if not require_admin():
        return
    if st.button("← Voltar"):
        set_view("admin")
        st.rerun()
    st.title("Histórico")
    sessions = [s for s in db.list_sessions() if s["status"] == "finished"]
    if not sessions:
        st.info("Nenhuma sessão concluída ainda.")
        return

    for s in sessions:
        parts = db.list_participants(s["id"])
        qs = db.session_questions(s["id"])
        answers = db.list_answers(s["id"])
        winner = parts[0]["nickname"] if parts else "—"
        acc = (
            round(100 * sum(1 for a in answers if a["is_correct"]) / len(answers))
            if answers
            else 0
        )
        with st.container(border=True):
            st.markdown(f"**{s['name']}**")
            st.caption(
                f"{(s['finished_at'] or s['created_at'])[:16]} · "
                f"{len(parts)} participantes · {len(qs)} perguntas · "
                f"média acertos {acc}% · vencedor: {winner}"
            )
            if st.button("Detalhes", key=f"hist_{s['id']}"):
                set_view("historico_detail", session=s["id"])
                st.rerun()


def render_historico_detail() -> None:
    if not require_admin():
        return
    sid = st.query_params.get("session")
    if st.button("← Histórico"):
        set_view("historico")
        st.rerun()
    session = db.get_session(sid) if sid else None
    if not session:
        st.error("Sessão não encontrada")
        return

    parts = db.list_participants(sid)
    qs = db.session_questions(sid)
    answers = db.list_answers(sid)

    st.title(session["name"])
    if parts:
        render_podium(parts)
    render_ranking_table(parts)

    st.subheader("Desempenho por pergunta")
    stats = []
    for q in qs:
        qans = [a for a in answers if a["session_question_id"] == q["id"]]
        correct = sum(1 for a in qans if a["is_correct"])
        avg_t = int(sum(a["response_time_ms"] for a in qans) / len(qans)) if qans else 0
        acc = round(100 * correct / len(qans)) if qans else 0
        stats.append(
            {
                "Pergunta": q["order_index"],
                "Tema": q["theme"],
                "Acerto %": acc,
                "Tempo médio": format_ms(avg_t),
                "Erros": len(qans) - correct,
                "Enunciado": q["statement"][:80],
            }
        )
    st.dataframe(pd.DataFrame(stats), use_container_width=True, hide_index=True)

    hardest = sorted(stats, key=lambda x: x["Erros"], reverse=True)[:3]
    st.subheader("Perguntas com mais erros")
    for h in hardest:
        st.write(f"**#{h['Pergunta']}** ({h['Erros']} erros) — {h['Enunciado']}")

    csv_df = pd.DataFrame(db.export_session_csv_rows(sid))
    st.download_button(
        "Exportar ranking CSV",
        data=csv_df.to_csv(index=False).encode("utf-8-sig"),
        file_name=f"historico-{session['access_code']}.csv",
        mime="text/csv",
    )


def main() -> None:
    view = current_view()

    # Admin-gated views
    admin_views = {
        "admin",
        "admin_bank",
        "admin_create",
        "admin_sessions",
        "admin_live",
        "historico",
        "historico_detail",
    }

    if view in admin_views:
        if view != "admin_live" and not require_admin():
            return
        if view == "admin":
            render_admin_dashboard()
        elif view == "admin_bank":
            render_question_bank()
        elif view == "admin_create":
            render_create_session()
        elif view == "admin_sessions":
            render_sessions_list()
        elif view == "admin_live":
            render_live_control()
        elif view == "historico":
            render_historico()
        elif view == "historico_detail":
            render_historico_detail()
        return

    if view == "play":
        render_play()
    elif view == "ranking":
        render_ranking()
    else:
        render_home()


if __name__ == "__main__":
    main()
else:
    main()
