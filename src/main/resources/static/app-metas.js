document.addEventListener("DOMContentLoaded", () => {
  
  // URLs da API
  const API_URL = "http://localhost:8080";
  const CATEGORIAS_URL = `${API_URL}/categorias`;
  const METAS_URL = `${API_URL}/metas`;
  const ECONOMIAS_URL = `${API_URL}/economias`;
  const DASHBOARD_URL = `${API_URL}/dashboard/resumo-principal`;

  // --- Elementos do Modal "Nova Meta" ---
  const modalMetaOverlay = document.getElementById("modal-meta-overlay");
  const formMeta = document.getElementById("form-meta");
  const btnAbrirMeta = document.getElementById("btn-abrir-meta");
  const btnFecharMeta = document.getElementById("btn-fechar-meta");
  const btnCancelarMeta = document.getElementById("btn-cancelar-meta");
  const selectCategoria = document.getElementById("categoria");

  // --- Elementos do Modal "Adicionar Economia" ---
  const modalEconomiaOverlay = document.getElementById("modal-economia-overlay");
  const formEconomia = document.getElementById("form-economia");
  const selectMeta = document.getElementById("meta");
  const btnAbrirEconomia = document.getElementById("btn-abrir-economia");
  const btnFecharEconomia = document.getElementById("btn-fechar-economia");
  const btnCancelarEconomia = document.getElementById("btn-cancelar-economia");

  // --- Elementos da Página ---
  const statSaldo = document.getElementById("stat-saldo");
  const statMetas = document.getElementById("stat-metas");
  const statSucesso = document.getElementById("stat-sucesso");
  const statReceitaMes = document.getElementById("stat-receita-mes");
  const listaMetasContainer = document.getElementById("lista-metas-container");

  // --- Elementos do Formulário de Meta ---
  const selectPeriodo = document.getElementById("periodo");
  const campoMes = document.getElementById("campo-mes");

  // =============================================
  // --- LÓGICA DOS MODAIS ---
  // =============================================

  // --- Modal de Metas ---
  btnAbrirMeta.addEventListener("click", () => modalMetaOverlay.classList.add("ativo"));
  btnFecharMeta.addEventListener("click", fecharModalMeta);
  btnCancelarMeta.addEventListener("click", fecharModalMeta);
  modalMetaOverlay.addEventListener("click", (e) => {
    if (e.target === modalMetaOverlay) fecharModalMeta();
  });
  function fecharModalMeta() {
    modalMetaOverlay.classList.remove("ativo");
    formMeta.reset();
    campoMes.style.display = 'none'; // Esconde campo 'mes'
  }

  // --- Modal de Economia ---
  btnAbrirEconomia.addEventListener("click", () => {
    // Carrega as metas no dropdown ANTES de abrir o modal
    carregarMetasParaSelect(); 
    modalEconomiaOverlay.classList.add("ativo");
  });

  btnFecharEconomia.addEventListener("click", fecharModalEconomia);
  btnCancelarEconomia.addEventListener("click", fecharModalEconomia);
  
  modalEconomiaOverlay.addEventListener("click", (e) => {
    if (e.target === modalEconomiaOverlay) fecharModalEconomia();
  });

  function fecharModalEconomia() {
    modalEconomiaOverlay.classList.remove("ativo");
    formEconomia.reset();
  }

  // =============================================
  // --- CARREGAMENTO DE DADOS (GET) ---
  // =============================================

  // Formata um número para Real (BRL)
  const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  /**
   * Busca categorias (GET /categorias) e preenche o <select>
   */
  async function carregarCategorias() {
    try {
      const response = await fetch(CATEGORIAS_URL);
      if (!response.ok) throw new Error("Falha ao carregar categorias.");
      const categorias = await response.json();
      
      selectCategoria.innerHTML = '<option value="">Nenhuma (Meta Geral)</option>'; 
      categorias.forEach(categoria => {
        const option = document.createElement("option");
        option.value = categoria.id;
        option.textContent = `${categoria.nome} (${categoria.tipo})`;
        selectCategoria.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      selectCategoria.innerHTML = '<option value="">Erro ao carregar</option>';
    }
  }

 /**
 * Busca metas (GET /metas) e preenche o <select> do modal de economia
 */
async function carregarMetasParaSelect() {
  try {
    const response = await fetch(METAS_URL);
    if (!response.ok) throw new Error("Falha ao carregar metas.");
    
    const metas = await response.json();
    
    selectMeta.innerHTML = '<option value="">Selecione uma meta</option>'; // Limpa
    
    if (metas.length === 0) {
       selectMeta.innerHTML = '<option value="">Nenhuma meta criada</option>';
       return;
    }

    metas.forEach(meta => {
      const option = document.createElement("option");
      option.value = meta.id;
      // Ex: "Viagem (MENSAL - 10/2025)" ou "Casa (ANUAL - 2026)"
      const textoPeriodo = meta.periodo === 'MENSAL' 
        ? `(${meta.periodo} - ${meta.mes}/${meta.ano})`
        : `(${meta.periodo} - ${meta.ano})`;

      option.textContent = `${meta.nome} ${textoPeriodo}`;
      selectMeta.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar metas no select:", error);
    selectMeta.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

  /**
   * Busca os dados do Dashboard (GET /dashboard/resumo-principal)
   * Busca TODAS as metas (GET /metas)
   * Busca TODAS as economias (GET /economias)
   * e preenche a página inteira.
   */
  async function carregarDashboard() {
    // Pega o mês e ano atuais
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1; // JS (0-11) -> Java (1-12)
    const anoAtual = hoje.getFullYear();

    try {
      // 1. Inicia as TRÊS requisições em paralelo
      const dashboardPromise = fetch(`${DASHBOARD_URL}?mes=${mesAtual}&ano=${anoAtual}`);
      const metasPromise = fetch(METAS_URL);
      const economiasPromise = fetch(ECONOMIAS_URL);

      // 2. Espera todas terminarem
      const [dashboardResponse, metasResponse, economiasResponse] = await Promise.all([
        dashboardPromise,
        metasPromise,
        economiasPromise
      ]);

      if (!dashboardResponse.ok) throw new Error("Falha ao carregar dados do dashboard.");
      if (!metasResponse.ok) throw new Error("Falha ao carregar lista de metas.");
      if (!economiasResponse.ok) throw new Error("Falha ao carregar lista de economias.");
      
      // 3. Extrai o JSON das três
      const dashboard = await dashboardResponse.json();
      const todasAsMetas = await metasResponse.json();
      const todasAsEconomias = await economiasResponse.json();

      // 4. Lógica de "Metas Ativas"
      const metasAtivasGeral = todasAsMetas.filter(meta => meta.ano >= anoAtual);

      // 5. Lógica de "Total Economizado"
      const totalEconomizado = todasAsEconomias.reduce(
        (total, item) => total + item.economia, 
        0
      );

      // 6. ✨ LÓGICA CORRIGIDA: Calcular o total economizado ESTE MÊS ✨
      const economiasDoMes = todasAsEconomias.filter(item => {
        
        // 👇 *** ESTA É A CORREÇÃO *** 👇
        // Se a economia não tiver uma data (ex: é um registro antigo),
        // ela não é do mês atual, então pulamos (return false).
        if (!item.data) {
          return false;
        }
        // Se a data existir, continuamos a verificação
        const [ano, mes] = item.data.split('-');
        return parseInt(ano) === anoAtual && parseInt(mes) === mesAtual;
      });

      // Soma os valores do array que acabamos de filtrar
      const totalEconomizadoMes = economiasDoMes.reduce(
        (total, item) => total + item.economia,
        0
      );

      // 7. Preenche os Cartões de Estatísticas
      statSaldo.textContent = formatadorBRL.format(totalEconomizado || 0);
      statReceitaMes.textContent = formatadorBRL.format(totalEconomizadoMes || 0); // <-- Agora deve funcionar
      statMetas.textContent = `${metasAtivasGeral.length} ativas`;
      // statSucesso.textContent = ...

      // 8. Preenche a Lista de Metas
      listaMetasContainer.innerHTML = "";
      if (dashboard.progresso_metas_mes && dashboard.progresso_metas_mes.length > 0) {
        dashboard.progresso_metas_mes.forEach(adicionarMetaNoDOM);
      } else {
        listaMetasContainer.innerHTML = "<p>Nenhuma meta ativa encontrada para este período.</p>";
      }

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      listaMetasContainer.innerHTML = "<p>Erro ao carregar metas.</p>";
    }
  }

  /**
   * Cria o HTML de um Card de Meta e o insere na página
   */
  function adicionarMetaNoDOM(meta) {
    const valorAlvo = meta.valorAlvo;
    const valorAtual = meta.valorAtual;
    const percentual = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
    const restante = valorAlvo - valorAtual;

    const div = document.createElement("div");
    div.className = "meta-card";
    div.innerHTML = `
      <div class="meta-card-header">
        <i class="meta-icon fas fa-bullseye"></i>
        <div>
          <h3>${meta.nome}</h3>
          <p>${meta.categoria ? `Meta de gastos: ${meta.categoria.nome}` : 'Meta geral de economia'}</p>
        </div>
        <div>
          <span class="meta-target-value">${formatadorBRL.format(valorAlvo)}</span>
          <span class="meta-target-date">até ${meta.mes ? `${meta.mes}/` : ''}${meta.ano}</span>
        </div>
      </div>

      <div class="progress-labels">
        <span>${formatadorBRL.format(valorAtual)} de ${formatadorBRL.format(valorAlvo)}</span>
        <span class="progress-percent">${percentual.toFixed(0)}%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${percentual.toFixed(0)}%;"></div>
      </div>

      <div class="meta-card-footer">
        <span class="meta-remaining">Faltam ${formatadorBRL.format(restante)}</span>
        </div>
    `;
    listaMetasContainer.appendChild(div);
  }

  // =============================================
  // --- CRIAÇÃO DE DADOS (POST) ---
  // =============================================

  formMeta.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(formMeta);
    
    // Pega o ID da categoria (pode ser "" se for "Nenhuma")
    const categoriaId = formData.get("categoria");

    const metaData = {
      nome: formData.get("nome"),
      valorAlvo: parseFloat(formData.get("valorAlvo")),
      periodo: formData.get("periodo"),
      mes: formData.get("periodo") === "MENSAL" ? parseInt(formData.get("mes")) : null,
      ano: parseInt(formData.get("ano")),
      // Envia a categoria {id: ...} se um ID foi selecionado, ou null se não
      categoria: categoriaId ? { id: parseInt(categoriaId) } : null
    };

    try {
      const response = await fetch(METAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaData),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar meta.");
      }
      
      const novaMeta = await response.json();
      
      // *** ESTA É A CORREÇÃO ***
      // Apenas CHAME a função para recarregar o dashboard
      carregarDashboard(); 
      
      fecharModalMeta();

    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      alert("Não foi possível salvar a meta. Verifique o console.");
    }
  });

  // --- Listener para Salvar Economia ---
  formEconomia.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const formData = new FormData(formEconomia);
    const metaId = formData.get("meta");
    const valorEconomia = formData.get("economia");
    const dataEconomia = formData.get("data_economia");

    if (!metaId) {
      alert("Por favor, selecione uma meta.");
      return;
    }

    if (!dataEconomia) { 
      alert("Por favor, selecione uma data para a economia.");
      return; 
    }

    // O JSON deve ser exatamente como o seu Controller espera
    const economiaData = {
      meta: {
        id: parseInt(metaId)
      },
      economia: parseFloat(valorEconomia),
      data: dataEconomia
    };

    try {
      const response = await fetch(ECONOMIAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(economiaData),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar economia.");
      }
      
      // Sucesso!
      fecharModalEconomia();
      
      // Recarrega o dashboard para atualizar o "valorAtual" da meta
      carregarDashboard(); 

    } catch (error) {
      console.error("Erro ao salvar economia:", error);
      alert("Não foi possível salvar a economia. Verifique o console.");
    }
  });


  // --- INICIALIZAÇÃO ---
  carregarCategorias(); // Carrega o <select> do modal
  carregarDashboard();  // Carrega a página inteira
});
