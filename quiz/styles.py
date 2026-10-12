from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

import streamlit as st
from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "assets"
BAYER_LOGO = ASSETS / "bayer_logo.png"


def _logo_image(size: int = 56) -> Image.Image | None:
    """Logo Bayer: anel colorido, miolo preto, nome em cinza claro — fora transparente."""
    if not BAYER_LOGO.exists():
        return None
    logo = Image.open(BAYER_LOGO).convert("RGBA")
    return logo.resize((size, size), Image.Resampling.LANCZOS)


def _logo_data_uri(size: int = 56) -> str:
    img = _logo_image(size)
    if img is None:
        return ""
    buf = BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


BAYER_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

html, body, [class*="css"] {
  font-family: "IBM Plex Sans", sans-serif;
  color: #1A2B3C;
}

.stApp { background: #F7F9FC; }

#MainMenu, footer { visibility: hidden; }
header[data-testid="stHeader"] { background: transparent; }

.block-container {
  padding-top: 1.1rem !important;
  max-width: 920px;
}

h1, h2, h3 { color: #003E7E !important; letter-spacing: -0.02em; }

div.stButton > button[kind="primary"] {
  background: #003E7E;
  border-color: #003E7E;
}
div.stButton > button[kind="primary"]:hover {
  background: #005299;
  border-color: #005299;
}

.dac-qr-code-label {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #003E7E;
  margin-top: 0.25rem;
}

.dac-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 0.1rem 0 0.75rem;
}
.dac-brand img {
  width: 52px;
  height: 52px;
  display: block;
  flex-shrink: 0;
}
.dac-brand .dac-title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 700;
  color: #003E7E;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
</style>
"""


def inject_css() -> None:
    st.markdown(BAYER_CSS, unsafe_allow_html=True)


def brand_header(compact: bool = False) -> None:
    uri = _logo_data_uri(56)
    logo_html = f'<img src="{uri}" alt="Bayer" />' if uri else ""
    st.markdown(
        f'<div class="dac-brand">{logo_html}<div class="dac-title">Quiz Distribuição</div></div>',
        unsafe_allow_html=True,
    )
    if not compact:
        st.caption("IA na prática: decisões mais ágeis, processos mais inteligentes")
    st.divider()


def ai_wait_block(title: str, caption: str) -> None:
    with st.container(border=True):
        st.subheader(title)
        st.caption(caption)
