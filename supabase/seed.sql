-- =============================================================================
-- Seed: 8 perguntas de exemplo — IA aplicada à Distribuição Bayer
-- Execute APÓS o schema.sql (com um admin já criado, created_by pode ficar null)
-- =============================================================================

do $$
declare
  qid uuid;
begin
  -- 1. Automação em armazém
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Automação',
    'facil',
    'Em um armazém de Distribuição, qual é o melhor primeiro uso de IA generativa para acelerar decisões operacionais sem substituir o time?',
    'Começar por assistentes que resumem exceções e sugerem ações reduz tempo de análise e mantém a validação humana no fluxo crítico.',
    25, 1.00, array['armazem','automacao','operacoes']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Automatizar 100% do picking sem supervisão no primeiro dia', false),
    (qid, 'B', 'Usar um assistente para resumir exceções de inventário e sugerir prioridades', true),
    (qid, 'C', 'Desligar dashboards existentes e confiar só no chat da IA', false),
    (qid, 'D', 'Treinar um modelo próprio sem dados históricos de movimentação', false);

  -- 2. Dados e planejamento
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Dados',
    'medio',
    'Para melhorar o planejamento de transporte com IA, qual pré-requisito é mais crítico?',
    'Sem dados confiáveis de demanda, lead time e capacidade, qualquer modelo gera recomendações frágeis.',
    30, 1.00, array['transporte','planejamento','dados']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Ter uma interface bonita do chatbot', false),
    (qid, 'B', 'Contratar imediatamente uma startup de roteirização', false),
    (qid, 'C', 'Garantir qualidade e integração dos dados de demanda, lead time e capacidade', true),
    (qid, 'D', 'Ignorar sazonalidade porque a IA “aprende sozinha”', false);

  -- 3. Governança
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Governança',
    'medio',
    'Ao usar IA em processos de pagamentos e devoluções, qual prática de governança é indispensável?',
    'Trilha de auditoria e critérios claros de aprovação protegem compliance e permitem revisar decisões automatizadas.',
    30, 1.00, array['pagamentos','devolucoes','governanca']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Permitir que a IA aprove qualquer valor sem limite', false),
    (qid, 'B', 'Registrar prompts, saídas e decisões humanas em trilha auditável', true),
    (qid, 'C', 'Compartilhar credenciais de sistemas financeiros no chat público', false),
    (qid, 'D', 'Desativar logs para “ganhar velocidade”', false);

  -- 4. Segurança
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Segurança',
    'facil',
    'Qual ação NÃO deve ser feita ao usar ferramentas de IA com dados de Comex e custos?',
    'Dados sensíveis e confidenciais não devem ir para ferramentas públicas sem conformidade e controles aprovados.',
    25, 1.00, array['comex','custos','seguranca']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Anonimizar informações antes de experimentos', false),
    (qid, 'B', 'Usar apenas canais homologados pela empresa', false),
    (qid, 'C', 'Colar planilhas com preços, contratos e PII em IAs públicas não autorizadas', true),
    (qid, 'D', 'Seguir a política de classificação de dados', false);

  -- 5. Prompts
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Prompts',
    'medio',
    'Qual estrutura de prompt tende a gerar melhor apoio em uma análise de custos logísticos?',
    'Contexto + objetivo + restrições + formato de saída aumenta precisão e utilidade operacional.',
    30, 1.00, array['prompts','custos','analise']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', '“Me fala sobre logística”', false),
    (qid, 'B', 'Contexto do problema + objetivo + restrições + formato esperado da resposta', true),
    (qid, 'C', 'Apenas um emoji e a palavra “ajuda”', false),
    (qid, 'D', 'Pedir a senha do ERP no prompt para “facilitar”', false);

  -- 6. Validação humana
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Validação humana',
    'medio',
    'A IA sugeriu priorizar uma rota de entrega com risco de atraso em feriado. O que o time de Distribuição deve fazer?',
    'Human-in-the-loop: validar recomendações críticas com conhecimento operacional antes de executar.',
    30, 1.00, array['transporte','validacao','human-in-the-loop']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Executar automaticamente porque “a IA nunca erra”', false),
    (qid, 'B', 'Validar a recomendação com regras de negócio e experiência do time antes de agir', true),
    (qid, 'C', 'Ignorar a sugestão e nunca mais usar IA', false),
    (qid, 'D', 'Publicar a sugestão no WhatsApp sem checar impacto', false);

  -- 7. Copilot / Perplexity / Cursor
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Ferramentas',
    'facil',
    'Sobre Copilot, Perplexity e Cursor no dia a dia da Distribuição, qual afirmação é a mais adequada?',
    'Cada ferramenta tem força distinta: produtividade de código/documentos, pesquisa com fontes e desenvolvimento assistido — sempre com critério e governança.',
    30, 1.00, array['copilot','perplexity','cursor']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'São a mesma ferramenta com nomes diferentes', false),
    (qid, 'B', 'Servem para apoiar produtividade, pesquisa e desenvolvimento, cada uma com propósito distinto e uso responsável', true),
    (qid, 'C', 'Substituem 100% a necessidade de especialistas de Comex e planejamento', false),
    (qid, 'D', 'Só funcionam se desligarmos todos os sistemas legados', false);

  -- 8. Pergunta final — cenário 2x
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Cenário prático',
    'dificil',
    'CENÁRIO FINAL (2x): Segunda-feira, pico de pedidos. O WMS aponta divergência de inventário, o TMS indica atraso em 3 cargas, e o financeiro questiona créditos de devolução. Sua equipe pode usar IA. Qual abordagem é a mais inteligente?',
    'Orquestrar: triagem assistida por IA + validação humana nos pontos críticos + comunicação clara. Acelera decisão sem perder controle.',
    45, 2.00, array['cenario','armazem','transporte','devolucoes','final']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Pedir para a IA “resolver tudo sozinha” e sair para o café', false),
    (qid, 'B', 'Usar IA para triar e resumir as exceções, priorizar ações com o time e validar manualmente inventário, rotas críticas e créditos sensíveis', true),
    (qid, 'C', 'Parar toda a operação até ter um modelo de deep learning próprio', false),
    (qid, 'D', 'Ignorar dados e decidir só por feeling do plantão', false);

  -- 9. Valor da IA
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Valor da IA', 'facil',
    'Onde a IA pode gerar mais valor?',
    'A IA apoia produtividade e análise; a responsabilidade pelas decisões permanece com o time.',
    25, 1.00, array['valor','produtividade','decisoes']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Assumir qualquer decisão operacional sem revisão', false),
    (qid, 'B', 'Eliminar a necessidade de dados organizados', false),
    (qid, 'C', 'Reduzir tarefas repetitivas e apoiar análises para decisões mais rápidas', true),
    (qid, 'D', 'Substituir a comunicação entre as áreas', false);

  -- 10. Validação humana
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Validação humana', 'facil',
    'Qual é a atitude mais importante ao usar uma resposta gerada por IA?',
    'IA acelera o trabalho, mas não substitui o julgamento e a responsabilidade de quem usa.',
    25, 1.00, array['validacao','responsabilidade','confianca']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Confiar, pois a IA sempre traz a melhor solução', false),
    (qid, 'B', 'Copiar e enviar imediatamente para ganhar tempo', false),
    (qid, 'C', 'Validar dados, contexto e impactos antes de tomar uma decisão', true),
    (qid, 'D', 'Usar a resposta apenas se ela tiver mais de uma página', false);

  -- 11. Cultura de IA
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Cultura de IA', 'medio',
    'Qual ação fortalece mais a cultura de IA no time?',
    'A apresentação propõe AI Talks, troca de práticas e experimentação como formas de desenvolver a cultura do time.',
    30, 1.00, array['cultura','compartilhamento','ai-talks']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Manter aprendizados restritos a quem já conhece as ferramentas', false),
    (qid, 'B', 'Compartilhar casos reais, boas práticas, erros e aprendizados entre as áreas', true),
    (qid, 'C', 'Usar IA somente quando houver uma solicitação da liderança', false),
    (qid, 'D', 'Escolher uma única ferramenta e proibir qualquer experimentação', false);

  -- 12. Pendências
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Pendências', 'medio',
    'O time quer reduzir o tempo gasto para consolidar pendências da Distribuição. Qual solução tem maior potencial de escalar com segurança?',
    'Essa solução une estrutura, colaboração, automação e governança — a transformação mostrada no PPT.',
    30, 1.00, array['pendencias','escala','governanca']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Cada pessoa continua atualizando sua própria planilha, sem um padrão comum', false),
    (qid, 'B', 'Criar um fluxo único, com dados integrados, regras claras e IA para apoiar classificação e priorização', true),
    (qid, 'C', 'Substituir todas as validações por respostas da IA', false),
    (qid, 'D', 'Concentrar todo o conhecimento e os acessos em uma única pessoa', false);

  -- 13. Integração
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Integração', 'medio',
    'Uma pendência envolve Transporte, Pagamentos e Devoluções. Qual é a melhor forma de usar IA?',
    'Essa alternativa valoriza integração entre áreas e visão ponta a ponta.',
    30, 1.00, array['transporte','pagamentos','devolucoes','integracao']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Cada área trata isoladamente para terminar mais rápido', false),
    (qid, 'B', 'Usar dados integrados para resumir o caso, identificar dependências e apoiar uma ação conjunta', true),
    (qid, 'C', 'Pedir para a IA escolher quem é responsável sem consultar ninguém', false),
    (qid, 'D', 'Esperar o fechamento do mês para analisar tudo de uma vez', false);

  -- 14. Capacitação contínua
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Cultura de IA', 'facil',
    'Com a IA evoluindo tão rápido, qual é a melhor forma de o time de Distribuição se manter atualizado?',
    'A evolução em IA exige aprendizado contínuo: capacitação estruturada, troca de experiências nos AI Talks e experimentação prática com casos reais da área. A apresentação já posiciona treinamentos, AI Talks quinzenais, troca de práticas e IA no dia a dia como pilares dessa cultura.',
    30, 1.00, array['cultura','capacitacao','ai-talks','unico-skills']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Esperar uma ferramenta se tornar obrigatória para começar a aprender', false),
    (qid, 'B', 'Fazer cursos no Unico Skills, participar dos AI Talks e testar IA na prática em situações do dia a dia', true),
    (qid, 'C', 'Usar somente ferramentas que já conhece, sem explorar novidades', false),
    (qid, 'D', 'Deixar o tema de IA apenas para o time de tecnologia', false);
end $$;
