// Tela para o próprio usuário escolher as imagens dos produtos
let produtosImagens = {};

async function carregar_produtos_imagem() {
  const select = document.getElementById("select-produto-imagem");
  const grid = document.getElementById("produtos-imagens");
  if (!select || !grid) return;

  try {
    const produtos = await buscar_produtos(new URLSearchParams({ limite: "100" }));
    if (!Array.isArray(produtos)) throw new Error("Resposta inválida da API.");

    produtosImagens = {};
    const selecionado = select.value;

    select.innerHTML =
      '<option value="">Escolha um produto...</option>' +
      produtos
        .map((p) => `<option value="${escape_html(p.id)}">${escape_html(p.nome)}</option>`)
        .join("");
    if (selecionado) select.value = selecionado;

    grid.innerHTML = produtos
      .map((p) => {
        produtosImagens[p.id] = p;
        const imagem = url_api(p.caminho_img || p.imagem || "") + "?v=" + Date.now();
        return `
        <div class="card card-imagem-produto">
          <div class="card-imagem">
            <img src="${escape_html(imagem)}" alt="${escape_html(p.nome)}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <span class="img-fallback" style="display:none">📦</span>
          </div>
          <div class="nome-produto">${escape_html(p.nome)}</div>
          <button type="button" class="btn btn-sm btn-outline-dark mt-2" onclick="selecionar_produto_imagem(${p.id})">
            Escolher este produto
          </button>
        </div>`;
      })
      .join("");
  } catch (erro) {
    grid.innerHTML =
      '<div class="aviso-vazio">❌ Não foi possível carregar os produtos: ' +
      escape_html(erro.message) + "</div>";
  }
}

function selecionar_produto_imagem(id) {
  const select = document.getElementById("select-produto-imagem");
  if (select) select.value = String(id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function prever_imagem() {
  const arquivo = document.getElementById("input-imagem")?.files?.[0];
  const preview = document.getElementById("preview-imagem");
  if (!preview) return;

  if (!arquivo) {
    preview.innerHTML = "<span>Prévia da imagem escolhida</span>";
    return;
  }
  if (!arquivo.type.startsWith("image/")) {
    preview.innerHTML = '<span class="text-danger">Esse arquivo não é uma imagem.</span>';
    return;
  }
  preview.innerHTML = '<img src="' + URL.createObjectURL(arquivo) + '" alt="Prévia">';
}

async function enviar_imagem(event) {
  event.preventDefault();

  const id = document.getElementById("select-produto-imagem")?.value;
  const arquivo = document.getElementById("input-imagem")?.files?.[0];
  const btn = document.getElementById("btn-enviar-imagem");

  if (!id) {
    mostrarToast("Escolha um produto.", "bg-warning");
    return;
  }
  if (!arquivo) {
    mostrarToast("Escolha uma imagem do computador.", "bg-warning");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.value = "Enviando...";
  }

  const dados = new FormData();
  dados.append("imagem", arquivo);

  try {
    const resposta = await fetch(API_BASE + "/produto/" + encodeURIComponent(id) + "/imagem", {
      method: "POST",
      body: dados,
    });
    let json = null;
    try { json = await resposta.json(); } catch (e) { /* resposta sem JSON */ }

    if (!resposta.ok) {
      throw new Error((json && json.msg) || "Erro " + resposta.status + " ao enviar a imagem.");
    }

    const produto = produtosImagens[id];
    mostrarToast("✅ Imagem de " + (produto ? produto.nome : "produto") + " atualizada!", "bg-success");
    document.getElementById("input-imagem").value = "";
    await carregar_produtos_imagem();
  } catch (erro) {
    mostrarToast("❌ " + erro.message, "bg-danger");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.value = "Enviar imagem";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-imagem");
  if (form) form.addEventListener("submit", enviar_imagem);

  const input = document.getElementById("input-imagem");
  if (input) input.addEventListener("change", prever_imagem);

  carregar_produtos_imagem();
});
