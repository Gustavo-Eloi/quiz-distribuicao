# Quiz Distribuição

Quiz ao vivo para a área de Distribuição da Bayer — ranking por acerto e velocidade, com publicação no **Streamlit Community Cloud** para acesso pelo celular (QR Code).

## Rodar localmente

```bash
pip install -r requirements.txt
streamlit run app.py
```

Abre em: http://localhost:8501

- **Participante:** Entrar no jogo  
- **Apresentador:** Controlar o jogo (senha nos Secrets)  
- **Ranking / projetor:** Ver ranking  

## Publicar (evento com ~60 celulares)

### 1) GitHub

1. Crie um repositório no GitHub (pode ser **público** — facilita o Streamlit Cloud).
2. Envie este projeto (sem `.streamlit/secrets.toml` e sem `data/*.db`).

### 2) Streamlit Cloud

1. Acesse https://share.streamlit.io e entre com GitHub.
2. **New app** → repositório → arquivo principal: `app.py`.
3. Em **Advanced settings → Secrets**:

```toml
admin_password = "sua_senha_forte"
```

4. Deploy. Link típico: `https://SEU-APP.streamlit.app`

### 3) No dia do evento

1. Abra o app no notebook **antes** do horário (aquece a instância).
2. **Controlar o jogo** → criar sessão com as 5 perguntas do evento → iniciar lobby.
3. Projete o **QR Code** (ou o ranking em outra aba).
4. Os ~60 participantes entram pelo celular no mesmo link → **Entrar no jogo**.
5. Liberar pergunta → o tempo fecha sozinho → revelar gabarito → avançar.

### Capacidade (~60 pessoas)

- Um único app no Streamlit Cloud atende bem um evento pontual desse tamanho.
- O banco é SQLite com WAL e espera em caso de pico de respostas simultâneas.
- O disco do Cloud é temporário: ótimo para o evento; histórico pode resetar se o app dormir por muito tempo.

## Pontuação

- Só acerto gera pontos  
- Até **1000 pontos** na resposta correta mais rápida  
- Decai com o tempo (e multiplicador, se houver)  
