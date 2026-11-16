# Site Alves.3D — alves3d.com.br

Site estático hospedado no GitHub Pages. Os produtos ficam no Supabase (projeto **siteAlves3d**) e são cadastrados pelo `admin.html`.

## Cadastrei ou alterei um produto. E agora?

**Nada obrigatório.** Quem visita o site já vê a mudança na hora (o site confere o banco a cada visita).

O que precisa ser regerado são as **páginas prontas** que o Google, as prévias de link do WhatsApp/Instagram e as IAs leem. Isso acontece sozinho:

- **todo dia, às 06:17**, o GitHub roda o build e publica;
- **a cada envio de arquivos** para o repositório;
- **na hora que você quiser**: aba **Actions → Atualizar páginas do site → Run workflow** (ou o botão **🌐 Atualizar Google** no painel admin).

### Rodando no seu computador (opcional)

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo. Não instala nenhuma dependência.

```
npm run build      # gera as páginas
npm run preview    # abre o site em http://localhost:8080 para conferir
```

Depois é só enviar os arquivos alterados para o GitHub.

> Para ver o site no computador use sempre o `npm run preview` (os links começam em `/`, então abrir o arquivo com dois cliques não funciona).

## O que o build gera

| Arquivo | O que é |
|---|---|
| `catalogo.html` | catálogo com todos os cards já escritos no HTML |
| `catalogo/<categoria>.html` | uma página por categoria (ex.: `catalogo/natal.html`) |
| `produto/<nome>-<código>.html` | uma página por peça, com título, preço, foto e prévia de link próprios |
| `index.html` | categorias, destaques e novidades já escritos |
| `sitemap.xml`, `robots.txt` | mapa do site para o Google |

Não edite à mão as pastas `catalogo/` e `produto/`: elas são apagadas e recriadas a cada build.

## Arquivos principais

| Arquivo | Função |
|---|---|
| `index.html`, `catalogo.html`, `produto.html` | páginas (visual + comportamento). O trecho entre `<!--b:nome-->` e `<!--/b:nome-->` é preenchido pelo build |
| `loja.js` | modelos dos cards e da página de produto, usados pelo site **e** pelo build (por isso o HTML gerado é idêntico ao montado no navegador) |
| `carrinho.js` | carrinho que fecha o pedido no WhatsApp |
| `build/gerar.mjs` | o build |
| `.github/workflows/build.yml` | automação do GitHub |
| `404.html` | página de endereço não encontrado (redireciona links de peças/categorias quando possível) |
| `admin.html`, `pesquisa.html` | painel e pesquisa de satisfação (não aparecem no Google) |

## Links antigos

Continuam funcionando: `catalogo.html?cat=Natal`, `catalogo.html?q=...&ord=menor` e `produto.html?id=CÓDIGO`.
