# Compatibilidade: Streamlit Cloud pode apontar para este arquivo ou para app.py
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).resolve().parent / "app.py"), run_name="streamlit_app")
