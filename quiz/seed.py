SEED_QUESTIONS = [
    {
        "theme": "Automação",
        "difficulty": "facil",
        "statement": (
            "Em um armazém de Distribuição, qual é o melhor primeiro uso de IA generativa "
            "para acelerar decisões operacionais sem substituir o time?"
        ),
        "explanation": (
            "Começar por assistentes que resumem exceções e sugerem ações reduz tempo de "
            "análise e mantém a validação humana no fluxo crítico."
        ),
        "time_seconds": 25,
        "points_multiplier": 1.0,
        "tags": "armazem,automacao,operacoes",
        "option_a": "Automatizar 100% do picking sem supervisão no primeiro dia",
        "option_b": "Usar um assistente para resumir exceções de inventário e sugerir prioridades",
        "option_c": "Desligar dashboards existentes e confiar só no chat da IA",
        "option_d": "Treinar um modelo próprio sem dados históricos de movimentação",
        "correct_option": "B",
    },
    {
        "theme": "Dados",
        "difficulty": "medio",
        "statement": (
            "Para melhorar o planejamento de transporte com IA, qual pré-requisito é mais crítico?"
        ),
        "explanation": (
            "Sem dados confiáveis de demanda, lead time e capacidade, qualquer modelo gera "
            "recomendações frágeis."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "transporte,planejamento,dados",
        "option_a": "Ter uma interface bonita do chatbot",
        "option_b": "Contratar imediatamente uma startup de roteirização",
        "option_c": "Garantir qualidade e integração dos dados de demanda, lead time e capacidade",
        "option_d": "Ignorar sazonalidade porque a IA “aprende sozinha”",
        "correct_option": "C",
    },
    {
        "theme": "Governança",
        "difficulty": "medio",
        "statement": (
            "Ao usar IA em processos de pagamentos e devoluções, qual prática de governança "
            "é indispensável?"
        ),
        "explanation": (
            "Trilha de auditoria e critérios claros de aprovação protegem compliance e "
            "permitem revisar decisões automatizadas."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "pagamentos,devolucoes,governanca",
        "option_a": "Permitir que a IA aprove qualquer valor sem limite",
        "option_b": "Registrar prompts, saídas e decisões humanas em trilha auditável",
        "option_c": "Compartilhar credenciais de sistemas financeiros no chat público",
        "option_d": "Desativar logs para “ganhar velocidade”",
        "correct_option": "B",
    },
    {
        "theme": "Segurança",
        "difficulty": "facil",
        "statement": (
            "Qual ação NÃO deve ser feita ao usar ferramentas de IA com dados de Comex e custos?"
        ),
        "explanation": (
            "Dados sensíveis e confidenciais não devem ir para ferramentas públicas sem "
            "conformidade e controles aprovados."
        ),
        "time_seconds": 25,
        "points_multiplier": 1.0,
        "tags": "comex,custos,seguranca",
        "option_a": "Anonimizar informações antes de experimentos",
        "option_b": "Usar apenas canais homologados pela empresa",
        "option_c": "Colar planilhas com preços, contratos e PII em IAs públicas não autorizadas",
        "option_d": "Seguir a política de classificação de dados",
        "correct_option": "C",
    },
    {
        "theme": "Prompts",
        "difficulty": "medio",
        "statement": (
            "Qual estrutura de prompt tende a gerar melhor apoio em uma análise de custos logísticos?"
        ),
        "explanation": (
            "Contexto + objetivo + restrições + formato de saída aumenta precisão e "
            "utilidade operacional."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "prompts,custos,analise",
        "option_a": "“Me fala sobre logística”",
        "option_b": "Contexto do problema + objetivo + restrições + formato esperado da resposta",
        "option_c": "Apenas um emoji e a palavra “ajuda”",
        "option_d": "Pedir a senha do ERP no prompt para “facilitar”",
        "correct_option": "B",
    },
    {
        "theme": "Validação humana",
        "difficulty": "medio",
        "statement": (
            "A IA sugeriu priorizar uma rota de entrega com risco de atraso em feriado. "
            "O que o time de Distribuição deve fazer?"
        ),
        "explanation": (
            "Human-in-the-loop: validar recomendações críticas com conhecimento operacional "
            "antes de executar."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "transporte,validacao,human-in-the-loop",
        "option_a": "Executar automaticamente porque “a IA nunca erra”",
        "option_b": "Validar a recomendação com regras de negócio e experiência do time antes de agir",
        "option_c": "Ignorar a sugestão e nunca mais usar IA",
        "option_d": "Publicar a sugestão no WhatsApp sem checar impacto",
        "correct_option": "B",
    },
    {
        "theme": "Ferramentas",
        "difficulty": "facil",
        "statement": (
            "Sobre Copilot, Perplexity e Cursor no dia a dia da Distribuição, "
            "qual afirmação é a mais adequada?"
        ),
        "explanation": (
            "Cada ferramenta tem força distinta: produtividade de código/documentos, "
            "pesquisa com fontes e desenvolvimento assistido — sempre com critério e governança."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "copilot,perplexity,cursor",
        "option_a": "São a mesma ferramenta com nomes diferentes",
        "option_b": (
            "Servem para apoiar produtividade, pesquisa e desenvolvimento, "
            "cada uma com propósito distinto e uso responsável"
        ),
        "option_c": "Substituem 100% a necessidade de especialistas de Comex e planejamento",
        "option_d": "Só funcionam se desligarmos todos os sistemas legados",
        "correct_option": "B",
    },
    {
        "theme": "Cenário prático",
        "difficulty": "dificil",
        "statement": (
            "CENÁRIO FINAL (2x): Segunda-feira, pico de pedidos. O WMS aponta divergência de "
            "inventário, o TMS indica atraso em 3 cargas, e o financeiro questiona créditos de "
            "devolução. Sua equipe pode usar IA. Qual abordagem é a mais inteligente?"
        ),
        "explanation": (
            "Orquestrar: triagem assistida por IA + validação humana nos pontos críticos + "
            "comunicação clara. Acelera decisão sem perder controle."
        ),
        "time_seconds": 45,
        "points_multiplier": 2.0,
        "tags": "cenario,armazem,transporte,devolucoes,final",
        "option_a": "Pedir para a IA “resolver tudo sozinha” e sair para o café",
        "option_b": (
            "Usar IA para triar e resumir as exceções, priorizar ações com o time e validar "
            "manualmente inventário, rotas críticas e créditos sensíveis"
        ),
        "option_c": "Parar toda a operação até ter um modelo de deep learning próprio",
        "option_d": "Ignorar dados e decidir só por feeling do plantão",
        "correct_option": "B",
    },
    {
        "theme": "Valor da IA",
        "difficulty": "facil",
        "statement": "Onde a IA pode gerar mais valor?",
        "explanation": (
            "A IA apoia produtividade e análise; a responsabilidade pelas decisões "
            "permanece com o time."
        ),
        "time_seconds": 25,
        "points_multiplier": 1.0,
        "tags": "valor,produtividade,decisoes",
        "option_a": "Assumir qualquer decisão operacional sem revisão",
        "option_b": "Eliminar a necessidade de dados organizados",
        "option_c": "Reduzir tarefas repetitivas e apoiar análises para decisões mais rápidas",
        "option_d": "Substituir a comunicação entre as áreas",
        "correct_option": "C",
    },
    {
        "theme": "Validação humana",
        "difficulty": "facil",
        "statement": "Qual é a atitude mais importante ao usar uma resposta gerada por IA?",
        "explanation": (
            "IA acelera o trabalho, mas não substitui o julgamento e a responsabilidade "
            "de quem usa."
        ),
        "time_seconds": 25,
        "points_multiplier": 1.0,
        "tags": "validacao,responsabilidade,confianca",
        "option_a": "Confiar, pois a IA sempre traz a melhor solução",
        "option_b": "Copiar e enviar imediatamente para ganhar tempo",
        "option_c": "Validar dados, contexto e impactos antes de tomar uma decisão",
        "option_d": "Usar a resposta apenas se ela tiver mais de uma página",
        "correct_option": "C",
    },
    {
        "theme": "Cultura de IA",
        "difficulty": "medio",
        "statement": "Qual ação fortalece mais a cultura de IA no time?",
        "explanation": (
            "A apresentação propõe AI Talks, troca de práticas e experimentação como "
            "formas de desenvolver a cultura do time."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "cultura,compartilhamento,ai-talks",
        "option_a": "Manter aprendizados restritos a quem já conhece as ferramentas",
        "option_b": "Compartilhar casos reais, boas práticas, erros e aprendizados entre as áreas",
        "option_c": "Usar IA somente quando houver uma solicitação da liderança",
        "option_d": "Escolher uma única ferramenta e proibir qualquer experimentação",
        "correct_option": "B",
    },
    {
        "theme": "Pendências",
        "difficulty": "medio",
        "statement": (
            "O time quer reduzir o tempo gasto para consolidar pendências da Distribuição. "
            "Qual solução tem maior potencial de escalar com segurança?"
        ),
        "explanation": (
            "Essa solução une estrutura, colaboração, automação e governança — "
            "a transformação mostrada no PPT."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "pendencias,escala,governanca",
        "option_a": "Cada pessoa continua atualizando sua própria planilha, sem um padrão comum",
        "option_b": (
            "Criar um fluxo único, com dados integrados, regras claras e IA para apoiar "
            "classificação e priorização"
        ),
        "option_c": "Substituir todas as validações por respostas da IA",
        "option_d": "Concentrar todo o conhecimento e os acessos em uma única pessoa",
        "correct_option": "B",
    },
    {
        "theme": "Integração",
        "difficulty": "medio",
        "statement": (
            "Uma pendência envolve Transporte, Pagamentos e Devoluções. "
            "Qual é a melhor forma de usar IA?"
        ),
        "explanation": (
            "Essa alternativa valoriza integração entre áreas e visão ponta a ponta."
        ),
        "time_seconds": 30,
        "points_multiplier": 1.0,
        "tags": "transporte,pagamentos,devolucoes,integracao",
        "option_a": "Cada área trata isoladamente para terminar mais rápido",
        "option_b": (
            "Usar dados integrados para resumir o caso, identificar dependências "
            "e apoiar uma ação conjunta"
        ),
        "option_c": "Pedir para a IA escolher quem é responsável sem consultar ninguém",
        "option_d": "Esperar o fechamento do mês para analisar tudo de uma vez",
        "correct_option": "B",
    },
]

DIFFICULTY_LABEL = {
    "facil": "Fácil",
    "medio": "Médio",
    "dificil": "Difícil",
}

STATUS_LABEL = {
    "draft": "Rascunho",
    "lobby": "Lobby — aguardando",
    "question_open": "Pergunta aberta",
    "question_closed": "Respostas encerradas",
    "revealing": "Gabarito",
    "ranking": "Ranking",
    "finished": "Encerrada",
}
