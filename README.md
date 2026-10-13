# Quiz Distribuição

Quiz ao vivo para ~60 pessoas (celular + QR Code).

## Plano B — dia do evento (recomendado)

Sua rede bloqueia túneis (Cloudflare/ngrok). Por isso o evento roda assim:

**Notebook liga o app → todos entram pelo Wi‑Fi da sala no mesmo IP.**

### No dia (quinta)

1. Conecte o notebook no **Wi‑Fi da sala** (o mesmo dos celulares).
2. Abra o PowerShell e rode:

```powershell
cd C:\Users\GPQYG\distribution-ai-challenge
powershell -ExecutionPolicy Bypass -File .\iniciar-evento.ps1
```

3. O script mostra um link tipo:

```text
http://192.168.x.x:8501
```

4. **Deixe a janela aberta.**
5. No navegador do notebook: **Controlar o jogo** → senha `bayer2026`.
6. Crie a sessão (5 perguntas) → lobby → mostre o **QR Code** da tela  
   (ou projete o link `http://IP:8501`).
7. Celulares: mesmo Wi‑Fi → escanear QR / abrir o link → **Entrar no jogo**.

### Checklist

- [ ] Notebook e celulares no **mesmo Wi‑Fi**
- [ ] Script `iniciar-evento.ps1` rodando
- [ ] Teste com 2 celulares antes de começar
- [ ] Senha apresentador: `bayer2026`
- [ ] Firewall do Windows permitindo a porta (o script tenta criar a regra)

### Se o celular não abrir

1. Confirme que está no mesmo Wi‑Fi (não use dados móveis).
2. No notebook, rode o PowerShell **como Administrador** e execute o script de novo (firewall).
3. Desative temporariamente VPN no notebook, se houver.

## Só na sua máquina (teste)

```powershell
cd C:\Users\GPQYG\distribution-ai-challenge
streamlit run app.py
```

http://localhost:8501

## Pontuação

- Só acerto gera pontos  
- Até **1000 pts** na resposta correta mais rápida  
- Tempo limite por pergunta (fecha sozinho)

## Observação

O histórico fica em `data/quiz.db` no notebook. Sem Streamlit Cloud = mais estável para o evento.
