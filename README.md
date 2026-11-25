# Loja de Artes Marciais — E-commerce completo (API Node.js + Express + MySQL + Front-end)

Projeto final com **API REST** e **site** (produtos, login/cadastro, carrinho em LocalStorage e compras).

## O que foi implementado

| Etapa | Requisito | Onde está |
|---|---|---|
| AV1 | Cadastro de cliente | `POST /cliente` |
| AV1 | Login do cliente (JWT) | `POST /login` |
| AV1 | Perfil do cliente | `GET /cliente/perfil` (JWT) |
| AV2 | Consulta de produtos com filtro | `GET /produto` |
| AV3 | Imagens no servidor (arquivos locais) | `GET/PUT /produto/:id/imagem` |
| AV3 | Cadastro de compra (vários produtos) | `POST /compra` (JWT + lista) |
| AV3 | Consulta das compras do usuário | `GET /compra` (JWT) |
| Front | Tela principal com imagens do servidor | `index.html` + `index.js` |
| Front | Login e cadastro | `login.html`, `cadastro.html` |
| Front | Carrinho em LocalStorage | `carrinho.html` + `carrinho.js` |
| Front | Finalização da compra | `carrinho.html` → `compras.html` |

## Rodar

```bash
npm install
cp .env.example .env       # ajuste usuário/senha do MySQL se necessário
npm run migrate            # cria o banco 2triDSC, tabelas e dados de exemplo
npm start                  # API + site em http://localhost:3000
```

A migration cria o banco automaticamente. Login de teste: **eduardo@gmail.com / 123456**.

> Se a tela de produtos mostrar só a barra de busca, o servidor ou o banco não está rodando: execute `npm run migrate` (somente na primeira vez, pois recria as tabelas) e depois `npm start`, e abra `http://localhost:3000`.

> As imagens são sempre resolvidas pela API (`/produto/:id/imagem`), que entrega o arquivo de `imagens/`. Funciona sem internet.

> Se você abrir um HTML direto do disco (`file://`), a página encaminha automaticamente para `http://localhost:3000` levando o carrinho e o login junto. Assim o produto adicionado sempre aparece no carrinho, mesmo misturando os dois modos de abertura.

## Rotas da API

Base: `http://localhost:3000`. Rotas marcadas com 🔒 exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/cliente` | Cadastro (nome, cpf, celular, email, senha) — senha salva com bcrypt |
| POST | `/login` | Login — devolve `{ token, id, nome, email }` |
| GET | `/cliente/perfil` 🔒 | Dados do cliente logado (nunca devolve a senha) |
| GET | `/produto` | Filtros: `nome`/`busca`, `categoria`, `preco_min`, `preco_max`, `ordem`/`ordenacao`, `pagina`, `limite` |
| GET | `/produto/:id/imagem` | Entrega a imagem do produto (arquivo local ou URL externa); use `?proxy=1` para buscar pelo servidor |
| PUT | `/produto/:id/imagem` | Vincula a URL da imagem ao produto |
| POST | `/produto/:id/imagem` | Envia a imagem do computador (`multipart/form-data`, campo `imagem`) |
| POST | `/compra` 🔒 | Cadastra vários produtos: `{ "itens": [{ "id": 1, "quantidade": 2 }] }` |
| GET | `/compra` 🔒 | Compras do usuário com todos os itens |

Exemplos:

```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"eduardo@gmail.com","senha":"123456"}'

# Produtos filtrados
curl "http://localhost:3000/produto?busca=luva&ordem=menor_preco"

# Compra de vários produtos (token do login)
curl -X POST http://localhost:3000/compra \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"itens":[{"id":1,"quantidade":2},{"id":3,"quantidade":1}]}'
```

O preço de cada item é buscado no banco (nunca vem do navegador) e a gravação usa **transação**: se um produto não existir, nada é salvo.

## Imagens

Cada produto tem uma ilustração própria em `imagens/produto-XX.svg` (ex.: luva, kimono, faixa). O banco guarda só o caminho (`/imagens/produto-XX.svg`) — nenhuma foto aleatória de terceiros.

O `<img>` da tela aponta para `/produto/:id/imagem`; a API redireciona para o arquivo correspondente, então a imagem **sempre vem do servidor** e funciona sem internet.

Para trocar por uma imagem hospedada (ex.: Google Drive — **Compartilhar → qualquer pessoa com o link → copiar link**):

```bash
curl -X PUT http://localhost:3000/produto/1/imagem \
  -H "Content-Type: application/json" \
  -d '{"imagem":"https://drive.google.com/uc?export=view&id=ID_DO_ARQUIVO"}'
```

A rota aceita caminhos locais (`/imagens/...`) ou URLs http(s).

### Colocar as imagens você mesmo

1. Abra **http://localhost:3000/imagens.html** (ou clique em **IMAGENS** no menu).
2. Escolha o produto na lista (ou clique em "Escolher este produto" em uma das imagens atuais).
3. Selecione a imagem no seu computador (JPG, PNG, WebP, GIF ou SVG, até 5 MB) e clique em **Enviar imagem**.
4. O arquivo é salvo em `imagens/produto-id-<id>.<ext>` e o banco passa a apontar para ele. A loja e o carrinho mostram a nova imagem na hora.

Também dá para fazer na mão: coloque seu arquivo na pasta `imagens/` e depois:

```bash
curl -X PUT http://localhost:3000/produto/1/imagem \
  -H "Content-Type: application/json" \
  -d '{"imagem":"/imagens/minha-foto.jpg"}'
```

## Páginas do site

| Página | O que faz |
|---|---|
| `index.html` | Produtos, busca por nome, filtro de categoria/preço e ordenação; botão "Adicionar ao carrinho" |
| `login.html` / `cadastro.html` | Autenticação (JWT salvo no LocalStorage) |
| `carrinho.html` | Itens salvos no LocalStorage, alterar quantidade, remover, total e finalizar compra |
| `perfil.html` | Dados do cliente (rota protegida) |
| `compras.html` | Histórico de compras do cliente |

## Testes

Com a API rodando em `localhost:3000`:

```bash
npm test
```

O teste cobre todas as rotas obrigatórias, autenticação, filtros, redirecionamento de imagem, total calculado no servidor e rollback da transação.

## Arquivos

- `servidor.js` — API Express + arquivos estáticos do site
- `db.js` — pool MySQL
- `migration.js` — criação do banco/tabelas e dados iniciais
- `api.js` — funções de chamada à API usadas pelo front-end
- `pages.js`, `index.js`, `carrinho.js`, `perfil.js`, `compras.js` — lógica do site
- `test-api.js` — teste de integração das rotas
