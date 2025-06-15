// script.js - Script completo e integrado para projeto-online.html

// Estado global para o projeto online
const projetoOnline = {
    comodoCount: 0,
    tueCounts: []
};

// Inicializar o formulário ao carregar a página
function initProjetoOnline() {
    projetoOnline.comodoCount = 0;
    projetoOnline.tueCounts = [];
    addComodoField(); // Cria o primeiro cômodo
    document.getElementById('formProjetoOnline').reset();
    document.getElementById('resultadoProjetoOnline').innerHTML = '';
}

// Adicionar campo de TUE
function addTUEField(comodoIndex) {
    const tueFields = document.getElementById(`tueFields_${comodoIndex}`);
    if (!tueFields) return;

    const tueIndex = projetoOnline.tueCounts[comodoIndex] || 0;
    projetoOnline.tueCounts[comodoIndex] = tueIndex + 1;

    const tueItem = document.createElement('div');
    tueItem.className = 'tue-item';
    tueItem.innerHTML = `
        <div class="form-group">
            <label for="tueNome_${comodoIndex}_${tueIndex}">Nome da TUE:</label>
            <input type="text" id="tueNome_${comodoIndex}_${tueIndex}" required placeholder="Ex.: Chuveiro">
        </div>
        <div class="form-group">
            <label for="tuePotencia_${comodoIndex}_${tueIndex}">Potência (W):</label>
            <input type="number" id="tuePotencia_${comodoIndex}_${tueIndex}" min="0" step="1" required placeholder="Ex.: 5400">
        </div>
        <button type="button" class="btn btn-remove" onclick="removeTUEField(${comodoIndex}, this)">- Remover TUE</button>
    `;
    tueFields.appendChild(tueItem);
}

// Remover campo de TUE
function removeTUEField(comodoIndex, button) {
    if (button.parentElement) {
        button.parentElement.remove();
        projetoOnline.tueCounts[comodoIndex]--;
    }
}

// Adicionar cômodo
function addComodoField() {
    const containerComodos = document.getElementById('containerComodos');
    if (!containerComodos) return;

    const comodoItem = document.createElement('div');
    comodoItem.className = 'comodo-item';
    comodoItem.dataset.comodoId = projetoOnline.comodoCount;
    comodoItem.innerHTML = `
        <h3>Cômodo ${projetoOnline.comodoCount + 1}</h3>
        <div class="form-group">
            <label for="nomeComodo_${projetoOnline.comodoCount}">Nome do Cômodo:</label>
            <input type="text" id="nomeComodo_${projetoOnline.comodoCount}" value="Cômodo ${projetoOnline.comodoCount + 1}" required placeholder="Ex.: Sala">
        </div>
        <div class="form-group">
            <label for="tipoComodo_${projetoOnline.comodoCount}">Tipo de Cômodo:</label>
            <select id="tipoComodo_${projetoOnline.comodoCount}" required>
                <option value="sala">Sala</option>
                <option value="quarto">Quarto</option>
                <option value="cozinha">Cozinha</option>
                <option value="banheiro">Banheiro</option>
                <option value="areaServico">Área de Serviço</option>
                <option value="circulacao">Corredor/Hall</option>
                <option value="garagem">Garagem</option>
                <option value="outro">Outro</option>
            </select>
        </div>
        <div class="form-group">
            <label for="areaComodo_${projetoOnline.comodoCount}">Área (m²):</label>
            <input type="number" id="areaComodo_${projetoOnline.comodoCount}" min="1" step="0.1" value="15" required placeholder="Ex.: 15">
        </div>
        <div class="form-group">
            <label for="perimetroComodo_${projetoOnline.comodoCount}">Perímetro (m):</label>
            <input type="number" id="perimetroComodo_${projetoOnline.comodoCount}" min="1" step="0.1" value="15" required placeholder="Ex.: 15">
        </div>
        <div class="tue-container">
            <h4>Tomadas de Uso Específico (TUEs):</h4>
            <button type="button" class="btn btn-add" onclick="addTUEField(${projetoOnline.comodoCount})">+ Adicionar TUE</button>
            <div id="tueFields_${projetoOnline.comodoCount}"></div>
        </div>
        <button type="button" class="btn btn-remove" onclick="removeComodoField(this)">- Remover Cômodo</button>
    `;
    containerComodos.appendChild(comodoItem);
    projetoOnline.tueCounts[projetoOnline.comodoCount] = 0;
    projetoOnline.comodoCount++;
}

// Remover cômodo
function removeComodoField(button) {
    if (button.parentElement) {
        button.parentElement.remove();
        projetoOnline.comodoCount--;
        // Ajustar tueCounts se necessário (não é crítico aqui, mas pode ser otimizado)
    }
}

// Calcular projeto
function calcularProjetoOnline() {
    const tensaoPrincipal = parseFloat(document.getElementById('tensaoPrincipalProjeto')?.value);
    const comodos = [];
    const resultadoDiv = document.getElementById('resultadoProjetoOnline');

    // Validação inicial
    if (!tensaoPrincipal || isNaN(tensaoPrincipal)) {
        resultadoDiv.innerHTML = '<p class="error">Selecione uma tensão principal válida.</p>';
        return;
    }

    for (let i = 0; i < projetoOnline.comodoCount; i++) {
        const nome = document.getElementById(`nomeComodo_${i}`)?.value;
        if (!nome) continue;

        const tipo = document.getElementById(`tipoComodo_${i}`)?.value;
        const area = parseFloat(document.getElementById(`areaComodo_${i}`)?.value);
        const perimetro = parseFloat(document.getElementById(`perimetroComodo_${i}`)?.value);
        const tueFields = document.getElementById(`tueFields_${i}`)?.children || [];
        const tue = [];

        // Validação de cômodo
        if (isNaN(area) || isNaN(perimetro) || area <= 0 || perimetro <= 0) {
            resultadoDiv.innerHTML = '<p class="error">Verifique os valores de área e perímetro do cômodo.</p>';
            return;
        }

        for (let j = 0; j < tueFields.length; j++) {
            const tueNome = document.getElementById(`tueNome_${i}_${j}`)?.value;
            const tuePotencia = parseFloat(document.getElementById(`tuePotencia_${i}_${j}`)?.value);
            if (tueNome && !isNaN(tuePotencia) && tuePotencia > 0) {
                tue.push({ nome: tueNome, potencia: tuePotencia });
            }
        }

        comodos.push({ nome, tipo, area, perimetro, tue });
    }

    if (comodos.length === 0) {
        resultadoDiv.innerHTML = '<p class="error">Adicione pelo menos um cômodo.</p>';
        return;
    }

    // Depuração
    console.log('Projeto enviado para dimensionamento:', { tensaoPrincipal, comodos });

    try {
        const projeto = { tensaoPrincipal, comodos };
        const relatorio = DimensionadorEletrico.dimensionar(projeto);

        // Depuração do relatorio recebido
        console.log('Relatório retornado:', relatorio);

        if (!relatorio || typeof relatorio !== 'object') {
            throw new Error('Relatório inválido retornado por DimensionadorEletrico');
        }

        let html = `
            <h3>Relatório do Projeto Elétrico</h3>
            <p><strong>Tensão Principal:</strong> ${relatorio.tensaoPrincipal || tensaoPrincipal} V</p>
            <p><strong>Tipo de Sistema:</strong> ${relatorio.tipoSistemaNecessario || 'Não especificado'}</p>
            <p><strong>Demanda Total:</strong> ${(relatorio.demandaTotalVA / 1000 || 0).toFixed(2)} kVA</p>
            <p><strong>Corrente Total:</strong> ${relatorio.correnteTotalA?.toFixed(2) || 'N/A'} A</p>
            <h4>Circuitos:</h4>
            <table aria-label="Resumo dos circuitos">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Potência (VA)</th>
                        <th>Corrente (A)</th>
                        <th>Bitola (mm²)</th>
                        <th>Disjuntor (A)</th>
                        <th>Eletroduto (mm)</th>
                        <th>Queda de Tensão (%)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (Array.isArray(relatorio.circuitos)) {
            relatorio.circuitos.forEach(circuito => {
                html += `
                    <tr>
                        <td>${circuito.nome || 'N/A'}</td>
                        <td>${circuito.tipo || 'N/A'}</td>
                        <td>${circuito.potenciaVA || 0}</td>
                        <td>${(circuito.correnteA || 0).toFixed(2)}</td>
                        <td>${circuito.bitolaFio || 'N/A'}</td>
                        <td>${circuito.disjuntorRecomendadoA || 'N/A'}</td>
                        <td>${circuito.eletrodutoMm || 'Consultar'}</td>
                        <td>${(circuito.quedaTensaoPercentual || 0).toFixed(2)}</td>
                    </tr>
                `;
            });
        } else {
            html += '<tr><td colspan="8">Nenhum circuito calculado.</td></tr>';
        }

        html += `
                </tbody>
            </table>
            <h4>Recomendações Gerais:</h4>
            <ul>
                <li><strong>Bitola do Alimentador:</strong> ${relatorio.recomendacoesFioGeral?.bitolaMm2 || 'N/A'} mm² (${relatorio.recomendacoesFioGeral?.tipoFio || 'N/A'})</li>
                <li><strong>Eletroduto Principal:</strong> ${relatorio.recomendacoesEletrodutoGeral?.diametroMm || 'N/A'} mm</li>
            </ul>
            ${relatorio.automacaoRecomendada?.observacoes?.length > 0 ? `<p><strong>Automação Recomendada:</strong> ${relatorio.automacaoRecomendada.observacoes.join(' ')}</p>` : ''}
            <p class="error">Nota: Consulte um engenheiro eletricista para validar o projeto (NBR 5410).</p>
        `;
        resultadoDiv.innerHTML = html;
    } catch (error) {
        console.error('Erro ao calcular projeto:', error);
        resultadoDiv.innerHTML = '<p class="error">Erro ao processar o projeto. Verifique os dados e tente novamente. Detalhes no console.</p>';
    }
}

// Resetar formulário
function resetProjetoOnlineForm() {
    projetoOnline.comodoCount = 0;
    projetoOnline.tueCounts = [];
    const containerComodos = document.getElementById('containerComodos');
    if (containerComodos) {
        containerComodos.innerHTML = '';
        addComodoField(); // Recria o primeiro cômodo
    }
    const resultadoDiv = document.getElementById('resultadoProjetoOnline');
    if (resultadoDiv) resultadoDiv.innerHTML = '';
    const form = document.getElementById('formProjetoOnline');
    if (form) form.reset();
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', initProjetoOnline);