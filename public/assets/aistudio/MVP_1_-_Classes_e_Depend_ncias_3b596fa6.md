# MVP 1 - Classes e Dependências

Oct 16, 2026 · @Wolf

## Objetivo

Este documento diz quais classes o sistema do MVP 1 tem, o que cada uma guarda e como uma cria ou chama a outra. Ele serve de base para o desenvolvedor escrever o documento técnico `MVP 1.0 - DOC_TECNICA_DEV_Classes_e_Dependencias.pdf` e para o alinhamento do Wolf com o DBA.

Os casos de uso (UC01 a UC13) estão no documento "MVP 1 - Casos de Uso (CRUD)". Aqui cada método aponta para o caso de uso que o usa.

O que está **decidido** vem da entrevista e das reuniões. Nomes de tipos, de métodos e regras de exclusão são **propostas** minhas, para o Krautein validar: o dev pode trocar qualquer nome ou tipo sem mudar o escopo.

## Visão geral

&#91;embedded content: classes do MVP 1 · 6 classes, ordem de criação\]

São quatro classes principais em cadeia (Imóvel, Plano de Ação, Checklist, Relatório) e duas de itens, uma ligada ao plano e outra ao checklist.

## Classes e atributos

São seis classes. Os campos vieram da entrevista; os tipos são proposta, e todo `id` é gerado pelo sistema.

### Imóvel

| Campo | Tipo | Obrigatório | Origem |
| --- | --- | --- | --- |
| id | Identificador | Sim | Sistema |
| identificação | Texto | Sim | Usuário |
| endereço | Texto | Sim | Usuário |
| cidade | Texto | Sim | Usuário |
| estado | Texto (UF) | Sim | Usuário |
| nome do cliente | Texto | Sim | Usuário |

O campo "nome do cliente" é o que a entrevista chamou de "nome do investidor". Ele guarda o nome de quem comprou o imóvel e recebe o relatório.

### Plano de Ação

| Campo | Tipo | Obrigatório | Origem |
| --- | --- | --- | --- |
| id | Identificador | Sim | Sistema |
| imóvel | Referência a Imóvel | Sim | Usuário escolhe |
| nome do montador | Texto | Sim | Usuário |
| WhatsApp do montador | Texto (telefone) | Sim | Usuário |

### Item do Plano

| Campo | Tipo | Obrigatório | Origem |
| --- | --- | --- | --- |
| id | Identificador | Sim | Sistema |
| plano | Referência a Plano de Ação | Sim | Sistema |
| descrição | Texto | Sim | Usuário |
| ambiente | Texto | Sim | Usuário |
| ferramentas necessárias | Texto | Sim | Usuário |
| data prevista | Data | Sim | Usuário |

O campo "posição onde o móvel fica" não existe no MVP 1.

### Checklist

| Campo | Tipo | Obrigatório | Origem |
| --- | --- | --- | --- |
| id | Identificador | Sim | Sistema |
| plano | Referência a Plano de Ação | Sim | Sistema |
| modelo | Texto, sempre "resumido" no MVP 1 | Sim | Sistema |
| gerado em | Data e hora | Sim | Sistema |

O checklist não é cadastrado pelo usuário: o sistema o gera a partir do plano.

### Item do Checklist

| Campo | Tipo | Obrigatório | Origem |
| --- | --- | --- | --- |
| id | Identificador | Sim | Sistema |
| checklist | Referência a Checklist | Sim | Sistema |
| item do plano | Referência a Item do Plano | Sim | Sistema |
| status | "feito" ou "não feito", começa como "não feito" | Sim | Usuário marca |
| marcado em | Data e hora | Não | Sistema, ao marcar |

### Relatório

| Campo | Tipo | Obrigatório | Origem |
| --- | --- | --- | --- |
| id | Identificador | Sim | Sistema |
| imóvel | Referência a Imóvel | Sim | Sistema |
| checklist | Referência a Checklist | Sim | Sistema |
| gerado em | Data e hora | Sim | Sistema |
| arquivo PDF | Arquivo | Sim | Sistema |

O MVP 1 não tem foto, observação por item, assinatura, login nem cadastro de prestador, então nenhuma classe guarda esses dados.

## Métodos

Os nomes dos métodos são proposta; o dev pode trocar. A coluna da direita diz qual caso de uso precisa de cada um.

| Classe | Método | O que faz | Caso de uso |
| --- | --- | --- | --- |
| Imóvel | criar(dados) | Valida os cinco campos e grava o imóvel | UC01 |
| Imóvel | listar() | Devolve todos os imóveis | UC02 |
| Imóvel | obter(id) | Devolve um imóvel (a tela de UC02 junta o plano, o checklist e os relatórios ligados a ele) | UC02 |
| Imóvel | alterar(id, dados) | Altera os campos e grava | UC03 |
| Imóvel | excluir(id) | Exclui o imóvel, conforme a regra de exclusão | UC04 |
| Plano de Ação | criar(imóvel, montador, itens) | Exige um imóvel existente, grava o plano e cria os Itens do Plano | UC05 |
| Plano de Ação | obter(id) | Devolve o plano com os itens e o status de cada um | UC06 |
| Plano de Ação | alterar(id, dados, itens) | Altera o montador e adiciona, altera ou remove itens | UC07 |
| Plano de Ação | excluir(id) | Exclui o plano e seus itens, conforme a regra de exclusão | UC08 |
| Checklist | gerarDe(plano) | Cria o Checklist e um Item do Checklist "não feito" para cada Item do Plano | UC09 |
| Checklist | obter(id) | Devolve o checklist com o total de itens feitos e não feitos | UC10 |
| Item do Checklist | marcar(id, status) | Grava "feito" ou "não feito" e a data e hora | UC11 |
| Relatório | gerarDe(checklist) | Junta Imóvel, Plano e Checklist, monta o PDF e o grava | UC12 |
| Relatório | listar(imóvel) | Devolve os relatórios já gerados de um imóvel | UC13 |
| Relatório | baixar(id) | Devolve o PDF gravado | UC13 |

## Instanciação e chamadas entre classes

Cada classe só é criada depois daquela de que depende, e quem cria usa o método da classe seguinte. O caminho completo, do primeiro cadastro ao PDF:

1. **Imóvel.criar** grava o imóvel. Não chama nenhuma outra classe.
2. **Plano de Ação.criar** primeiro chama **Imóvel.obter** para confirmar que o imóvel existe. Se não existe, não grava. Se existe, grava o plano e cria um **Item do Plano** para cada linha informada.
3. **Checklist.gerarDe(plano)** chama **Plano de Ação.obter** para ler os itens, grava o Checklist e cria um **Item do Checklist** "não feito" para cada Item do Plano. Se o plano não tem item, não gera.
4. **Item do Checklist.marcar** só mexe no próprio item: troca o status e grava a data e hora. Não chama outra classe.
5. **Relatório.gerarDe(checklist)** chama **Checklist.obter** (para os status), **Plano de Ação.obter** (para os dados do plano) e **Imóvel.obter** (para os dados do imóvel), monta o PDF e grava o Relatório.

O que **nunca** acontece no MVP 1: nenhuma classe envia mensagem pelo WhatsApp, chama o montador, paga prestador ou valida pagamento. O PDF é só gerado e baixado; quem o envia ao cliente é a Karol, fora do sistema.

A leitura de dados é sempre de cima para baixo na cadeia (Relatório lê Checklist, Plano e Imóvel; Checklist lê Plano; Plano lê Imóvel). Nenhuma classe chama a que está depois dela, o que evita dependência circular. A única visão que olha no sentido contrário é a tela de consulta do imóvel (UC02), que só junta dados já gravados e não altera nada.

## Pendências para o dev e o DBA

Alterar e excluir entram no MVP 1 (decidido em 16/10), mas estas regras ainda não têm dono. Cada uma muda a classe ou o banco:

| # | Decisão em aberto | Opções | Quem decide |
| --- | --- | --- | --- |
| 1 | Excluir um imóvel que já tem plano | Bloquear a exclusão, ou excluir em cascata (plano, itens, checklist, relatório) | Dev (Krautein) |
| 2 | Excluir um plano que já tem checklist | Mesma regra da linha 1 | Dev (Krautein) |
| 3 | Alterar um plano depois de gerado o checklist | Refazer o checklist (perde as marcações), ou bloquear a alteração | Dev e consultoria |
| 4 | Relatório já gerado | Guardar o PDF fixo, ou refazer a cada download | Dev (Krautein) |
| 5 | Tipos dos campos (telefone, UF, data) e chaves das tabelas | Alinhar o modelo de dados das seis classes | Wolf e DBA |
| 6 | Data do protótipo do MVP 1 | Confirmar | Dev (Krautein) |

Próximos passos:

- [ ] Dev: validar nomes, tipos e métodos propostos e responder as linhas 1 a 4.
- [ ] Wolf: alinhar as seis classes com o DBA (linha 5).
- [ ] Dev: usar este documento e o de casos de uso para produzir `MVP 1.0 - DOC_TECNICA_DEV_Classes_e_Dependencias.pdf`.
- [ ] Consultoria: transformar os métodos e as regras acima em cenários de teste no modelo MÓDULO, CENÁRIO, ERRO, SOLICITO.
