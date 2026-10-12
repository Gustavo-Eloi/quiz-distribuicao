"""UI estilo Kahoot — grade colorida, timer e feedback dinâmico."""

from __future__ import annotations

import html
from datetime import datetime

import streamlit as st

from quiz.scoring import format_score

OPTION_META = {
    "A": {"color": "#E21B3C", "shape": "▲"},
    "B": {"color": "#1368CE", "shape": "◆"},
    "C": {"color": "#D89E00", "shape": "●"},
    "D": {"color": "#26890C", "shape": "■"},
}

KAHOOT_CSS = """
<style>
.k-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  background: #0B1F33;
  color: #fff;
  border-radius: 16px;
  padding: 0.7rem 1rem;
  margin-bottom: 0.85rem;
}
.k-hud .nick { font-weight: 700; font-size: 1rem; }
.k-hud .meta { opacity: 0.85; font-size: 0.85rem; }
.k-hud .pill {
  background: #FFD100;
  color: #0B1F33;
  font-weight: 800;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.95rem;
}

.k-timer-wrap { text-align: center; margin: 0.35rem 0 0.85rem; }
.k-timer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #1a3a5c, #0B1F33);
  color: #fff;
  font-size: 2.4rem;
  font-weight: 800;
  box-shadow: 0 0 0 6px rgba(0,163,224,0.35);
  animation: k-pulse 1.2s ease-in-out infinite;
}
.k-timer.urgent {
  background: radial-gradient(circle at 30% 30%, #c0392b, #7b1113);
  box-shadow: 0 0 0 6px rgba(226,27,60,0.45);
  animation: k-pulse-fast 0.55s ease-in-out infinite;
}
.k-timer-bar {
  height: 10px;
  border-radius: 999px;
  background: #d9e2ec;
  overflow: hidden;
  margin: 0.55rem auto 0;
  max-width: 280px;
}
.k-timer-bar > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #00A3E0, #66B512);
  transition: width 0.35s linear;
}
.k-timer-bar.urgent > span {
  background: linear-gradient(90deg, #E21B3C, #FFD100);
}

@keyframes k-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes k-pulse-fast {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.k-qbox {
  background: #fff;
  border-radius: 18px;
  padding: 1rem 1.1rem;
  margin-bottom: 0.9rem;
  box-shadow: 0 8px 28px rgba(11,31,51,0.08);
  border: 1px solid #e6edf5;
}
.k-qbox .q-num {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5B6B7C;
  margin-bottom: 0.35rem;
}
.k-qbox .q-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0B1F33;
  line-height: 1.35;
  margin: 0;
}
.k-mult {
  display: inline-block;
  margin-top: 0.5rem;
  background: #FFD100;
  color: #0B1F33;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.k-wait {
  text-align: center;
  padding: 1.6rem 1rem;
  background: linear-gradient(160deg, #0B1F33, #003E7E 55%, #005299);
  color: #fff;
  border-radius: 20px;
  margin: 0.5rem 0 1rem;
}
.k-wait h2 {
  color: #fff !important;
  margin: 0.4rem 0 0.35rem !important;
  font-size: 1.55rem !important;
}
.k-wait p { opacity: 0.9; margin: 0; }
.k-dots::after {
  content: "";
  animation: k-dots 1.4s steps(4, end) infinite;
}
@keyframes k-dots {
  0% { content: ""; }
  25% { content: "."; }
  50% { content: ".."; }
  75% { content: "..."; }
}

.k-feedback {
  text-align: center;
  border-radius: 20px;
  padding: 1.4rem 1rem;
  margin: 0.6rem 0 1rem;
  animation: k-pop 0.35s ease-out;
}
.k-feedback.ok {
  background: linear-gradient(145deg, #1f7a1f, #26890C);
  color: #fff;
}
.k-feedback.bad {
  background: linear-gradient(145deg, #a3162d, #E21B3C);
  color: #fff;
}
.k-feedback.wait {
  background: linear-gradient(145deg, #0B1F33, #1368CE);
  color: #fff;
}
.k-feedback .emoji { font-size: 2.6rem; line-height: 1; }
.k-feedback h3 {
  color: #fff !important;
  margin: 0.35rem 0 !important;
  font-size: 1.45rem !important;
}
.k-feedback .pts {
  font-size: 1.8rem;
  font-weight: 800;
  color: #FFD100;
}
@keyframes k-pop {
  from { transform: scale(0.92); opacity: 0.4; }
  to { transform: scale(1); opacity: 1; }
}

/* Botões grandes estilo Kahoot */
div[class*="st-key-kopt_"] button {
  min-height: 118px !important;
  border: none !important;
  border-radius: 16px !important;
  font-size: 0.98rem !important;
  font-weight: 700 !important;
  color: #fff !important;
  white-space: normal !important;
  line-height: 1.25 !important;
  padding: 0.85rem 0.7rem !important;
  box-shadow: 0 6px 0 rgba(0,0,0,0.18) !important;
}
div[class*="st-key-kopt_"] button:hover:enabled {
  filter: brightness(1.06);
  transform: translateY(-2px);
}
div[class*="st-key-kopt_"] button:disabled {
  opacity: 0.5 !important;
  box-shadow: none !important;
}
</style>
"""


def inject_kahoot_css() -> None:
    st.markdown(KAHOOT_CSS, unsafe_allow_html=True)


def _option_button_css(question_id: str) -> None:
    """Aplica cor Kahoot por opção via classe st-key-* do Streamlit."""
    rules = []
    for key, meta in OPTION_META.items():
        cls = f"st-key-kopt_{question_id}_{key}"
        rules.append(
            f'div[class*="{cls}"] button {{ background: {meta["color"]} !important; '
            f'border-color: {meta["color"]} !important; color: #fff !important; }}'
        )
        rules.append(
            f'div[class*="{cls}"] button[kind="primary"] {{ '
            f'outline: 3px solid #FFD100 !important; outline-offset: 2px; }}'
        )
    st.markdown(f"<style>{''.join(rules)}</style>", unsafe_allow_html=True)


def render_hud(nickname: str, score: int, rank: int | None, q_index: int, q_total: int) -> None:
    rank_txt = f"#{rank}" if rank else "—"
    nick = html.escape(nickname)
    st.markdown(
        f"""
        <div class="k-hud">
          <div>
            <div class="nick">{nick}</div>
            <div class="meta">Pergunta {q_index}/{q_total} · Posição {rank_txt}</div>
          </div>
          <div class="pill">{format_score(score)} pts</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_timer(remaining: float, total: int) -> None:
    total = max(1, total)
    pct = max(0.0, min(1.0, remaining / total))
    urgent = "urgent" if remaining <= 5 else ""
    st.markdown(
        f"""
        <div class="k-timer-wrap">
          <div class="k-timer {urgent}">{int(remaining)}</div>
          <div class="k-timer-bar {urgent}"><span style="width:{pct*100:.1f}%;"></span></div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_question_box(statement: str, order_index: int, total: int, multiplier: float) -> None:
    mult = (
        f'<span class="k-mult">{multiplier:g}x pontos</span>'
        if float(multiplier) > 1
        else ""
    )
    text = html.escape(statement)
    st.markdown(
        f"""
        <div class="k-qbox">
          <div class="q-num">Pergunta {order_index} de {total}</div>
          <p class="q-text">{text}</p>
          {mult}
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_lobby(nickname: str, players: int) -> None:
    nick = html.escape(nickname)
    st.markdown(
        f"""
        <div class="k-wait">
          <div style="font-size:2.2rem;">🎮</div>
          <h2>Ei, {nick}!</h2>
          <p>Você está dentro. Aguarde o apresentador liberar a pergunta<span class="k-dots"></span></p>
          <p style="margin-top:0.85rem;font-weight:700;">{players} jogador(es) na sala</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_waiting_next() -> None:
    st.markdown(
        """
        <div class="k-wait">
          <div style="font-size:2.2rem;">⚡</div>
          <h2>Prepare-se!</h2>
          <p>A próxima pergunta vem aí<span class="k-dots"></span></p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_answer_sent() -> None:
    st.markdown(
        """
        <div class="k-feedback wait">
          <div class="emoji">🔒</div>
          <h3>Resposta travada!</h3>
          <p>Aguarde o apresentador revelar o gabarito…</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_feedback(
    *,
    correct: bool | None,
    points: int,
    rank: int | None,
    correct_option: str | None = None,
    explanation: str = "",
    waiting_reveal: bool = False,
) -> None:
    if waiting_reveal:
        st.markdown(
            """
            <div class="k-feedback wait">
              <div class="emoji">⏱️</div>
              <h3>Tempo esgotado!</h3>
              <p>Respostas encerradas. Aguarde o gabarito…</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        return

    if correct is None:
        return

    if correct:
        st.markdown(
            f"""
            <div class="k-feedback ok">
              <div class="emoji">🎉</div>
              <h3>Acertou!</h3>
              <div class="pts">+{format_score(points)}</div>
              <p>Posição atual: #{rank or '—'}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        gab = f" · Gabarito: {correct_option}" if correct_option else ""
        st.markdown(
            f"""
            <div class="k-feedback bad">
              <div class="emoji">😅</div>
              <h3>Errou!</h3>
              <div class="pts">+0</div>
              <p>Posição atual: #{rank or '—'}{gab}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    if explanation:
        st.info(explanation)


def remaining_seconds(opened_at: str | None, time_seconds: int) -> float:
    if not opened_at:
        return float(time_seconds)
    try:
        opened = datetime.fromisoformat(opened_at)
        if opened.tzinfo is None:
            elapsed = (datetime.utcnow() - opened).total_seconds()
        else:
            elapsed = (datetime.now(opened.tzinfo) - opened).total_seconds()
        return max(0.0, time_seconds - elapsed)
    except Exception:
        return float(time_seconds)


def response_ms(opened_at: str | None) -> int:
    opened_at = opened_at or datetime.utcnow().isoformat()
    opened = datetime.fromisoformat(opened_at)
    if opened.tzinfo is None:
        ms = int((datetime.utcnow() - opened).total_seconds() * 1000)
    else:
        ms = int((datetime.now(opened.tzinfo) - opened).total_seconds() * 1000)
    return max(0, ms)


def render_option_grid(
    options: list[tuple[str, str]],
    *,
    question_id: str,
    can_answer: bool,
    selected: str | None,
    correct_option: str | None,
    show_answer: bool,
) -> str | None:
    """Grade 2x2 estilo Kahoot. Retorna a opção clicada ou None."""
    _option_button_css(question_id)
    clicked: str | None = None
    for row in (options[:2], options[2:]):
        cols = st.columns(2, gap="medium")
        for col, (key, text) in zip(cols, row):
            meta = OPTION_META[key]
            label = f"{meta['shape']}  {text}"
            if selected == key:
                label = f"✓  {label}"
            if show_answer and correct_option == key:
                label = f"★  {label}"
            with col:
                btn_type = "primary" if selected == key else "secondary"
                if st.button(
                    label,
                    use_container_width=True,
                    disabled=not can_answer,
                    key=f"kopt_{question_id}_{key}",
                    type=btn_type,
                ):
                    clicked = key
    return clicked
