# MVP 1 - Casos de Uso (CRUD)

Oct 16, 2026 · @Wolf

## Objetivo e escopo

Este documento descreve o que Karol e consultor fazem no sistema do MVP 1, passo a passo, para o desenvolvedor produzir as classes e dependências e para a consultoria montar os casos de teste.

O MVP 1 cobre só o fluxo principal: cadastrar o imóvel e o plano de ação da montagem dos móveis planejados, gerar o checklist resumido (feito ou não feito) e gerar o relatório em PDF.

O que está **decidido** vem da entrevista e da reunião de alinhamento. O que é **proposta** (exceções, mensagens, regras de exclusão, ordem das telas) está marcado e precisa de validação do Krautein e do Wolf.

## Atores

Só dois atores usam o sistema no MVP 1, e os dois têm o mesmo perfil de acesso: podem cadastrar, marcar itens e gerar o relatório, sem restrição de permissões entre eles. Não há login nem aprovação.

| Ator | Usa o sistema? | Papel no MVP 1 |
| --- | --- | --- |
| Karol | Sim | Usuária principal; valida o relatório (validação soberana) |
| Consultor (Santos) | Sim | Cadastra os 15 imóveis fictícios, executa e registra os testes |
| Montador | Não | Recebe o plano por fora; o que ele fez chega a Karol ou ao consultor fora do sistema |
| Cliente da Karol | Não | Quem comprou o imóvel; recebe o PDF enviado pela Karol, manualmente |
| Investidor da Karol | Não | Financia a Karol; não aparece no sistema |

## Visão geral dos casos de uso

São 13 casos de uso em quatro classes. Os que o usuário decidiu são o núcleo; alterar e excluir entram no MVP 1 por decisão de 16/10, e seus detalhes (cascata, refazer checklist) são propostas a validar.

| Código | Caso de uso | Classe | Ator | Status |
| --- | --- | --- | --- | --- |
| UC01 | Cadastrar imóvel | Imóvel | Karol ou consultor | Decidido |
| UC02 | Consultar imóveis | Imóvel | Karol ou consultor | Decidido ("exibição") |
| UC03 | Alterar imóvel | Imóvel | Karol ou consultor | Decidido |
| UC04 | Excluir imóvel | Imóvel | Karol ou consultor | Decidido |
| UC05 | Cadastrar plano de ação | Plano de Ação, Item do Plano | Karol ou consultor | Decidido |
| UC06 | Consultar plano de ação | Plano de Ação | Karol ou consultor | Decidido ("exibição") |
| UC07 | Alterar plano de ação | Plano de Ação, Item do Plano | Karol ou consultor | Decidido |
| UC08 | Excluir plano de ação | Plano de Ação | Karol ou consultor | Decidido |
| UC09 | Gerar checklist resumido | Checklist, Item do Checklist | Sistema, a partir do plano | Decidido |
| UC10 | Consultar checklist | Checklist | Karol ou consultor | Decidido ("exibição") |
| UC11 | Marcar item como feito ou não feito | Item do Checklist | Karol ou consultor | Decidido |
| UC12 | Gerar relatório em PDF | Relatório | Karol ou consultor | Decidido |
| UC13 | Consultar e baixar relatório | Relatório | Karol ou consultor | Proposta |

## Casos de uso detalhados

### Imóvel

**UC01 Cadastrar imóvel** (decidido)

- Ator: Karol ou consultor.
- Campos: identificação, endereço, cidade, estado e nome do cliente (o campo que a entrevista chamou de "nome do investidor" guarda o nome do cliente da Karol, quem comprou o imóvel).
- Fluxo principal:
  1. O usuário abre o cadastro de imóvel.
  2. Preenche os cinco campos.
  3. Confirma.
  4. O sistema grava o imóvel e o mostra na lista.
- Exceção: campo obrigatório vazio, o sistema não grava e indica qual campo falta. *(Proposta: todos os cinco campos obrigatórios.)*
- Observação: no MVP 1 os imóveis são fictícios (LGPD).

**UC02 Consultar imóveis** (decidido)

- O usuário vê a lista de imóveis e abre um para ver os dados, o plano de ação, o checklist e o relatório ligados a ele.

**UC03 Alterar imóvel** (decidido)

- O usuário edita qualquer campo do imóvel e confirma. Se o relatório já foi gerado, o relatório antigo não muda; um novo é gerado com UC12.

**UC04 Excluir imóvel** (decidido)

- O usuário pede a exclusão e o sistema pede confirmação. Se houver plano de ação ligado, a decisão é do dev: bloquear a exclusão ou excluir em cascata. *(A validar.)*

### Plano de Ação

**UC05 Cadastrar plano de ação** (decidido)

- Ator: Karol ou consultor.
- Pré-condição: o imóvel já está cadastrado (UC01).
- Campos do plano: imóvel, nome do montador e WhatsApp do montador.
- Campos de cada item: descrição, ambiente, ferramentas necessárias e data prevista. O campo "posição onde o móvel fica" não existe no MVP 1, porque o projeto que o montador recebe já traz a posição.
- Fluxo principal:
  1. O usuário escolhe o imóvel.
  2. Informa nome e WhatsApp do montador.
  3. Adiciona os itens do plano, um a um (um plano típico real tem cerca de 100 itens; o MVP 1 cobre só os móveis planejados).
  4. Confirma.
  5. O sistema grava o plano e os itens.
- Exceções: imóvel não escolhido, ou plano sem nenhum item, o sistema não grava. *(Proposta.)*
- Observação: o sistema não envia o plano ao montador. Ele chega por fora, e o WhatsApp é só um dado cadastral.

**UC06 Consultar plano de ação** (decidido)

- O usuário vê o plano de um imóvel com todos os itens e o status de cada um.

**UC07 Alterar plano de ação** (decidido)

- O usuário edita dados do montador e adiciona, altera ou remove itens. Se o checklist já foi gerado, o dev decide se ele é gerado de novo ou se o sistema bloqueia a alteração. *(A validar.)*

**UC08 Excluir plano de ação** (decidido)

- O sistema pede confirmação e exclui o plano e os itens. O checklist e o relatório ligados seguem a mesma regra de UC04. *(A validar.)*

### Checklist

O checklist **não é cadastrado**: o sistema o gera a partir do plano de ação. O MVP 1 gera só o modelo resumido (feito ou não feito); o detalhado, com observação por item, fica para o MVP 2.

**UC09 Gerar checklist resumido** (decidido)

- Ator: o sistema, a pedido de Karol ou consultor.
- Pré-condição: o plano de ação existe e tem pelo menos um item.
- Fluxo principal:
  1. O usuário pede o checklist de um plano.
  2. O sistema cria um item de checklist para cada item do plano, todos começando como "não feito".
  3. O sistema mostra o checklist.
- Observação: não há escolha entre dois modelos no MVP 1, só o resumido existe.

**UC10 Consultar checklist** (decidido)

- O usuário vê o checklist de um imóvel, com o total de itens feitos e não feitos.

**UC11 Marcar item como feito ou não feito** (decidido)

- Ator: Karol ou consultor, conforme a informação que o montador passou por fora do sistema.
- Fluxo principal:
  1. O usuário abre o checklist.
  2. Marca o item como feito ou não feito.
  3. O sistema grava o status e a data e hora da marcação.
- Regra: o usuário pode voltar atrás e mudar a marcação. *(Proposta.)*
- Observação: não há foto, observação nem assinatura (MVP 2 e MVP 3); todos os usuários são 100% confiáveis.

### Relatório

**UC12 Gerar relatório em PDF** (decidido)

- Ator: Karol ou consultor.
- Pré-condição: o imóvel tem checklist.
- Fluxo principal:
  1. O usuário escolhe o imóvel e pede o relatório.
  2. O sistema monta o PDF com os dados do imóvel, o plano e o status de cada item (feito ou não feito).
  3. O sistema oferece o PDF para baixar.
- Regra: o relatório pode ser gerado com itens ainda não feitos; o PDF mostra o que ficou pendente. *(Proposta.)*
- Critério de sucesso do MVP 1: relatório gerado **sem erro** para cada um dos 15 imóveis de teste, e aprovado pela Karol ao compará-lo com os que ela usa hoje.
- Observação: o sistema não envia o PDF a ninguém. A Karol envia ao cliente manualmente (envio pelo sistema é o MVP 4).

**UC13 Consultar e baixar relatório** (proposta)

- O usuário vê a lista de relatórios já gerados de um imóvel e baixa o PDF de novo, sem gerar outro.

## Regras de negócio e dependências

As classes dependem umas das outras nesta ordem, e cada uma só pode ser criada depois da anterior:

1. **Imóvel** não depende de nada.
2. **Plano de Ação** precisa de um Imóvel e tem um ou mais **Itens do Plano**.
3. **Checklist** é gerado a partir de um Plano de Ação e tem um **Item do Checklist** para cada Item do Plano.
4. **Relatório** é gerado a partir do Checklist, com os dados do Imóvel e do Plano.

Regras que valem para todos os casos de uso (decididas):

- Karol e consultor podem fazer tudo, sem restrição de permissão entre os dois.
- O sistema só registra checklist e relatório: não envia nada pelo WhatsApp, não paga prestador e não valida o pagamento do cliente.
- "Cliente da Karol" (quem compra o imóvel e recebe o relatório) é diferente de "investidor da Karol" (quem financia a Karol). Nenhum dos dois aparece no sistema.
- Os imóveis do MVP 1 são fictícios, em conformidade com a LGPD.

Regras propostas, a validar com o dev:

- O que acontece com os registros ligados ao excluir um imóvel ou um plano (bloquear ou excluir em cascata).
- Se alterar um plano depois de gerado o checklist refaz o checklist ou é bloqueado.
- Se o relatório guarda uma cópia fixa do que foi gerado ou é refeito a cada download.

## Fora do escopo e pendências

Não têm caso de uso no MVP 1:

| Item | Quando entra |
| --- | --- |
| Fotos e mídias; checklist detalhado com observação; cadastro de prestador | MVP 2 |
| Assinatura digital; indicar prestadores aptos a receber pagamento | MVP 3 |
| Envio do PDF ao cliente | MVP 4 |
| Log de uso; inventário de ferramentas e almoxarifado | MVP 5 |
| Acesso do montador, login, WhatsApp, notificações, outros blocos da planilha | Sem data |

Para fechar este documento:

- [ ] Dev (Krautein): validar as classes e as regras propostas (alterar, excluir, cascata, checklist refeito).
- [ ] Wolf: revisar o documento e alinhar com o DBA o modelo de dados das quatro classes.
- [ ] Dev: confirmar a data do protótipo do MVP 1.
- [ ] Consultoria: transformar cada caso de uso em cenários de teste no modelo MÓDULO, CENÁRIO, ERRO, SOLICITO.
- [ ] Decidido em 16/10: alterar e excluir entram no MVP 1 (sem pendência).
