-- =============================================================================
-- Seed: 7 perguntas oficiais — Quiz Distribuição
-- Execute no SQL Editor do Supabase (substitui o banco atual).
-- =============================================================================

delete from public.question_bank;

do $$
declare
  qid uuid;
begin
  -- 1
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Valor da IA',
    'facil',
    'Onde a IA pode gerar mais valor?',
    'A IA apoia produtividade e análise; a responsabilidade pelas decisões permanece com o time.',
    20, 1.00, array['valor','produtividade','decisoes']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Assumir qualquer decisão operacional sem revisão', false),
    (qid, 'B', 'Eliminar a necessidade de dados organizados', false),
    (qid, 'C', 'Reduzir tarefas repetitivas e apoiar análises para decisões mais rápidas', true),
    (qid, 'D', 'Substituir a comunicação entre as áreas', false);

  -- 2
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Validação humana',
    'facil',
    'Qual é a atitude mais importante ao usar uma resposta gerada por IA?',
    'IA acelera o trabalho, mas não substitui o julgamento e a responsabilidade de quem usa.',
    20, 1.00, array['validacao','responsabilidade']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Confiar, pois a IA sempre traz a melhor solução', false),
    (qid, 'B', 'Copiar e enviar imediatamente para ganhar tempo', false),
    (qid, 'C', 'Validar dados, contexto e impactos antes de tomar uma decisão', true),
    (qid, 'D', 'Usar a resposta apenas se ela tiver mais de uma página', false);

  -- 3
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Cultura de IA',
    'medio',
    'Qual ação fortalece mais a cultura de IA no time?',
    'Compartilhar casos reais, boas práticas, erros e aprendizados acelera a adoção responsável da IA entre as áreas.',
    20, 1.00, array['cultura','compartilhamento']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Manter aprendizados restritos a quem já conhece as ferramentas', false),
    (qid, 'B', 'Compartilhar casos reais, boas práticas, erros e aprendizados entre as áreas', true),
    (qid, 'C', 'Usar IA somente quando houver uma solicitação da liderança', false),
    (qid, 'D', 'Escolher uma única ferramenta e proibir qualquer experimentação', false);

  -- 4
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Pendências',
    'medio',
    'O time quer reduzir o tempo gasto para consolidar pendências. Qual solução tem maior potencial de escalar com segurança?',
    'Essa solução une estrutura, colaboração, automação e governança — a transformação mostrada no PPT.',
    20, 1.00, array['pendencias','escala','governanca']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Cada pessoa continua atualizando sua própria planilha, sem um padrão comum', false),
    (qid, 'B', 'Criar um fluxo único, com dados integrados, regras claras e IA para apoiar classificação e priorização', true),
    (qid, 'C', 'Substituir todas as validações por respostas da IA', false),
    (qid, 'D', 'Concentrar todo o conhecimento e os acessos em uma única pessoa', false);

  -- 5
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Integração',
    'medio',
    'Uma demanda envolve diversos times. Qual é a melhor forma de usar IA?',
    'Essa alternativa valoriza integração entre áreas e visão ponta a ponta.',
    20, 1.00, array['integracao','colaboracao']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Cada área trata isoladamente para terminar mais rápido', false),
    (qid, 'B', 'Usar dados integrados para resumir o caso, identificar dependências e apoiar uma ação conjunta', true),
    (qid, 'C', 'Pedir para a IA escolher quem é responsável sem consultar ninguém', false),
    (qid, 'D', 'Esperar o fechamento do mês para analisar tudo de uma vez', false);

  -- 6
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Cultura de IA',
    'facil',
    'Com a IA evoluindo tão rápido, qual é a melhor forma de se manter atualizado?',
    'A evolução em IA exige aprendizado contínuo: capacitação estruturada, troca de experiências nos AI Talks e experimentação prática com casos reais da área. A apresentação já posiciona treinamentos, AI Talks quinzenais, troca de práticas e IA no dia a dia como pilares dessa cultura.',
    20, 1.00, array['cultura','capacitacao','ai-talks','unico-skills']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Esperar uma ferramenta se tornar obrigatória para começar a aprender', false),
    (qid, 'B', 'Fazer cursos no Unico Skills, participar dos AI Talks e testar IA na prática em situações do dia a dia', true),
    (qid, 'C', 'Usar somente ferramentas que já conhece, sem explorar novidades', false),
    (qid, 'D', 'Deixar o tema de IA apenas para o time de tecnologia', false);

  -- 7
  insert into public.question_bank (theme, difficulty, statement, explanation, time_seconds, points_multiplier, tags)
  values (
    'Dados',
    'facil',
    'Qual é a principal função do Denodo?',
    'O Denodo integra dados por uma camada de virtualização, sem precisar centralizar tudo em um único banco.',
    20, 1.00, array['denodo','dados','integracao']
  ) returning id into qid;
  insert into public.question_options (question_id, option_key, option_text, is_correct) values
    (qid, 'A', 'Centralizar dados em um único banco.', false),
    (qid, 'B', 'Integrar dados por uma camada virtual.', true),
    (qid, 'C', 'Criar dashboards e relatórios visuais.', false),
    (qid, 'D', 'Substituir os sistemas de origem.', false);
end $$;
