// ============================================================
// Funções compartilhadas por todas as páginas
// ============================================================

// O LocalStorage é separado por origem: abrir umas páginas do disco (file://)
// e outras pelo servidor (http://) criava carrinhos diferentes. Ao abrir um
// arquivo local, trazemos o carrinho e a sessão para o endereço do servidor.
(function sincronizar_origem() {
  try {
    if (window.location.protocol === "file:") {
      const arquivo = window.location.pathname.split("/").pop() || "index.html";
      let alvo = "http://localhost:3000/" + arquivo;
      try {
        const params = new URLSearchParams(window.location.search);
        const carrinho = localStorage.getItem("carrinho");
        if (carrinho) params.set("carrinho", carrinho);

        const sessao = {};
        ["token", "nome_cliente", "id_cliente"].forEach((chave) => {
          const valor = localStorage.getItem(chave);
          if (valor) sessao[chave] = valor;
        });
        const consulta = params.toString();
        if (consulta) alvo += "?" + consulta;
        if (Object.keys(sessao).length) {
          alvo += "#sessao=" + encodeURIComponent(JSON.stringify(sessao));
        }
      } catch (e) { /* localStorage indisponível */ }
      window.location.replace(alvo);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has("carrinho")) {
      const bruto = params.get("carrinho");
      params.delete("carrinho");
      try {
        const vindos = JSON.parse(bruto);
        if (Array.isArray(vindos)) {
          const atuais = JSON.parse(localStorage.getItem("carrinho") || "[]");
          const itens = new Map();
          [...(Array.isArray(atuais) ? atuais : []), ...vindos].forEach((item) => {
            if (!item || !item.id) return;
            const id = Number(item.id);
            const quantidade = Math.min(999, Number(item.quantidade) > 0 ? Math.floor(Number(item.quantidade)) : 1);
            const anterior = itens.get(id);
            if (anterior) anterior.quantidade = Math.min(999, anterior.quantidade + quantidade);
            else itens.set(id, Object.assign({}, item, { id, quantidade }));
          });
          localStorage.setItem("carrinho", JSON.stringify([...itens.values()]));
        }
      } catch (e) { /* carrinho inválido */ }
      const consulta = params.toString();
      window.history.replaceState(
        {}, "",
        window.location.pathname + (consulta ? "?" + consulta : "") + window.location.hash
      );
    }

    if (window.location.hash.startsWith("#sessao=")) {
      try {
        const dados = JSON.parse(decodeURIComponent(window.location.hash.slice(8)));
        Object.keys(dados).forEach((chave) => localStorage.setItem(chave, dados[chave]));
      } catch (e) { /* sessão inválida */ }
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
  } catch (e) { /* never break the page because of this */ }
})();

function escape_html(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatar_moeda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "R$ 0,00";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrarToast(mensagem, bgClass) {
  const toastEl = document.getElementById("liveToast");
  const toastMessage = document.getElementById("toast-message");

  if (!toastEl || !toastMessage) {
    // Fallback caso o Bootstrap não tenha carregado
    window.alert(mensagem);
    return;
  }

  toastMessage.textContent = mensagem;
  toastEl.classList.remove("bg-success", "bg-danger", "bg-warning");
  toastEl.classList.add(bgClass || "bg-success");

  if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
    new bootstrap.Toast(toastEl).show();
  } else {
    toastEl.classList.add("show");
  }
}

function atualizar_navbar() {
  const nome = localStorage.getItem("nome_cliente");
  const token = localStorage.getItem("token");

  const navLogin = document.getElementById("nav-login");
  const btnUserInfo = document.getElementById("user-info");

  if (navLogin) navLogin.style.display = token && nome ? "none" : "inline";
  if (btnUserInfo) {
    const logado = Boolean(token && nome);
    btnUserInfo.style.display = logado ? "inline-block" : "none";
    btnUserInfo.textContent = logado ? "Olá, " + nome.split(" ")[0] : "Opções";
  }

  const contador = document.getElementById("cart-count");
  if (contador) {
    const quantidade = typeof carrinho_quantidade_total === "function"
      ? carrinho_quantidade_total()
      : 0;
    contador.textContent = quantidade;
    contador.style.display = quantidade > 0 ? "inline-block" : "none";
  }
}

function logout() {
  limpar_sessao(); // mantém o carrinho salvo no LocalStorage
  window.location.href = "login.html";
}

window.addEventListener("DOMContentLoaded", atualizar_navbar);
window.addEventListener("storage", atualizar_navbar);
