// script.js - Script integrado para todas as páginas

// Estado para projeto online
const ProjetoOnlineState = {
    comodoCount: 0,
    tueCounts: []
};

// Funções para tabs (normas)
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.setAttribute('aria-selected', 'false'));
            button.setAttribute('aria-selected', 'true');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.setAttribute('aria-hidden', 'true');
            });
            document.getElementById(button.dataset.tab).setAttribute('aria-hidden', 'false');
        });
    });

    // Inicializa projeto online apenas na página correspondente
    if (document.getElementById('projeto-online')) {
        initProjetoOnline();
        updateRosetaLabels(); // Inicializa labels da roseta
    }
});

// Calculadora Simplificada (index.html)
function calcularDimensionamento() {
    const potencia = parseFloat(document.getElementById('potencia').value) || 0;
    const tensao = parseFloat(document.getElementById('tensao').value) || 220;
    const comprimento = parseFloat(document.getElementById('comprimento').value) || 0;
    const sistema = document.getElementById('sistema').value;
    const resultado = document.getElementById('resultado');

    if (potencia <= 0 || tensao <= 0) {
        document.getElementById('potencia-error').textContent = 'Potência e tensão devem ser maiores que zero.';
        resultado.innerHTML = '';
        return;
    }

    const corrente = (sistema === 'monofasico') ? potencia / tensao : potencia / (tensao * Math.sqrt(3));
    const quedaTensao = (2 * corrente * comprimento * 0.017) / tensao * 100; // Aproximação com R = 0.017 Ω/mm²
    const bitolaMinima = Math.ceil(corrente / 10) * 2.5; // Regra simplificada

    resultado.innerHTML = `
        <p><strong>Corrente:</strong> ${corrente.toFixed(2)} A</p>
        <p><strong>Queda de Tensão:</strong> ${quedaTensao.toFixed(2)} %</p>
        <p><strong>Bitola Mínima Sugerida:</strong> ${bitolaMinima} mm²</p>
        <p class="error">Nota: Consulte NBR 5410 para validação.</p>
    `;
    document.getElementById('potencia-error').textContent = '';
}

function resetForm() {
    document.getElementById('sistema').value = 'monofasico';
    document.getElementById('potencia').value = '';
    document.getElementById('tensao').value = '220';
    document.getElementById('comprimento').value = '';
    document.getElementById('resultado').innerHTML = '';
    document.getElementById('potencia-error').textContent = '';
}

// Projeto Online
function initProjetoOnline() {
    ProjetoOnlineState.comodoCount = 0;
    ProjetoOnlineState.tueCounts = [];
    addComodoField();
}

function addComodoField() {
    const containerComodos = document.getElementById('containerComodos');
    if (!containerComodos) return;

    const comodoItem = document.createElement('div');
    comodoItem.className = 'comodo-item';
    comodoItem.dataset.comodoId = ProjetoOnlineState.comodoCount;
    comodoItem.innerHTML = `
        <h3>Cômodo ${ProjetoOnlineState.comodoCount + 1}</h3>
        <div class="form-group">
            <label for="nomeComodo_${ProjetoOnlineState.comodoCount}">Nome do Cômodo:</label>
            <input type="text" id="nomeComodo_${ProjetoOnlineState.comodoCount}" value="Cômodo ${ProjetoOnlineState.comodoCount + 1}" required>
        </div>
        <div class="form-group">
            <label for="tipoComodo_${ProjetoOnlineState.comodoCount}">Tipo de Cômodo:</label>
            <select id="tipoComodo_${ProjetoOnlineState.comodoCount}" required>
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
            <label for="areaComodo_${ProjetoOnlineState.comodoCount}">Área (m²):</label>
            <input type="number" id="areaComodo_${ProjetoOnlineState.comodoCount}" min="1" step="0.1" value="15" required>
        </div>
        <div class="form-group">
            <label for="perimetroComodo_${ProjetoOnlineState.comodoCount}">Perímetro (m):</label>
            <input type="number" id="perimetroComodo_${ProjetoOnlineState.comodoCount}" min="1" step="0.1" value="15" required>
        </div>
        <div class="tue-container">
            <h4>Tomadas de Uso Específico (TUEs):</h4>
            <button type="button" class="btn btn-add" onclick="addTUEField(${ProjetoOnlineState.comodoCount})">+ Adicionar TUE</button>
            <div id="tueFields_${ProjetoOnlineState.comodoCount}"></div>
        </div>
        <button type="button" class="btn btn-remove" onclick="removeComodoField(this)">- Remover Cômodo</button>
    `;
    containerComodos.appendChild(comodoItem);
    ProjetoOnlineState.tueCounts[ProjetoOnlineState.comodoCount] = 0;
    ProjetoOnlineState.comodoCount++;
}

function addTUEField(comodoIndex) {
    const tueFields = document.getElementById(`tueFields_${comodoIndex}`);
    if (!tueFields) return;

    const tueIndex = ProjetoOnlineState.tueCounts[comodoIndex] || 0;
    ProjetoOnlineState.tueCounts[comodoIndex] = tueIndex + 1;

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

function removeTUEField(comodoIndex, button) {
    if (button.parentElement) {
        button.parentElement.remove();
        ProjetoOnlineState.tueCounts[comodoIndex]--;
    }
}

function removeComodoField(button) {
    if (button.parentElement) {
        button.parentElement.remove();
        ProjetoOnlineState.comodoCount--;
    }
}

function resetProjetoOnlineForm() {
    if (document.getElementById('projeto-online')) {
        ProjetoOnlineState.comodoCount = 0;
        ProjetoOnlineState.tueCounts = [];
        const containerComodos = document.getElementById('containerComodos');
        if (containerComodos) containerComodos.innerHTML = '';
        addComodoField();
        document.getElementById('formProjetoOnline').reset();
        document.getElementById('resultadoProjetoOnline').innerHTML = '';
        document.getElementById('resultadoRoseta').innerHTML = '';
    }
}

function calcularProjetoOnline() {
    const tensaoPrincipal = parseFloat(document.getElementById('tensaoPrincipalProjeto').value);
    const comodos = [];
    const resultadoDiv = document.getElementById('resultadoProjetoOnline');

    if (!tensaoPrincipal || isNaN(tensaoPrincipal)) {
        resultadoDiv.innerHTML = '<p class="error">Selecione uma tensão principal válida.</p>';
        return;
    }

    for (let i = 0; i < ProjetoOnlineState.comodoCount; i++) {
        const nome = document.getElementById(`nomeComodo_${i}`)?.value;
        if (!nome) continue;

        const tipo = document.getElementById(`tipoComodo_${i}`)?.value;
        const area = parseFloat(document.getElementById(`areaComodo_${i}`)?.value);
        const perimetro = parseFloat(document.getElementById(`perimetroComodo_${i}`)?.value);
        const tueFields = document.getElementById(`tueFields_${i}`)?.children || [];
        const tue = [];

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

    console.log('Projeto enviado:', { tensaoPrincipal, comodos });

    try {
        const projeto = { tensaoPrincipal, comodos };
        const relatorio = DimensionadorEletrico.dimensionar(projeto);

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

// Roseta
function updateRosetaLabels() {
    if (document.getElementById('projeto-online')) {
        const tipo = document.getElementById('tipoCalculo').value;
        const labels = {
            corrente: ['Potência (W)', 'Tensão (V)'],
            potencia: ['Corrente (A)', 'Tensão (V)'],
            secao: ['Corrente (A)', 'Comprimento (m)'],
            queda: ['Corrente (A)', 'Tensão (V)']
        };
        document.getElementById('labelValor1').textContent = labels[tipo][0] + ':';
        document.getElementById('labelValor2').textContent = labels[tipo][1] + ':';
    }
}

function calcularRoseta() {
    if (document.getElementById('projeto-online')) {
        const tipo = document.getElementById('tipoCalculo').value;
        const valor1 = parseFloat(document.getElementById('rosetaInput1').value) || 0;
        const valor2 = parseFloat(document.getElementById('rosetaInput2').value) || 0;
        const resultado = document.getElementById('resultadoRoseta');

        let calculo;
        switch (tipo) {
            case 'corrente':
                calculo = valor1 / valor2;
                resultado.innerHTML = `<p>Corrente: ${calculo.toFixed(2)} A</p>`;
                break;
            case 'potencia':
                calculo = valor1 * valor2;
                resultado.innerHTML = `<p>Potência: ${calculo.toFixed(2)} W</p>`;
                break;
            case 'secao':
                calculo = (valor1 * valor2 * 0.017) / 10; // Aproximação
                resultado.innerHTML = `<p>Seção: ${calculo.toFixed(2)} mm²</p>`;
                break;
            case 'queda':
                calculo = (valor1 * valor2 * 0.017) / 100;
                resultado.innerHTML = `<p>Queda de Tensão: ${calculo.toFixed(2)} %</p>`;
                break;
        }
    }
}

// Mock para DimensionadorEletrico
if (typeof DimensionadorEletrico === 'undefined') {
    console.warn('DimensionadorEletrico não definido. Usando mock para depuração.');
    window.DimensionadorEletrico = {
        dimensionar: function(projeto) {
            const totalPotencia = projeto.comodos.reduce((sum, comodo) => sum + comodo.tue.reduce((s, t) => s + t.potencia, 0), 0);
            const correnteTotal = totalPotencia / projeto.tensaoPrincipal;
            return {
                tensaoPrincipal: projeto.tensaoPrincipal,
                tipoSistemaNecessario: 'Bifásico',
                demandaTotalVA: totalPotencia,
                correnteTotalA: correnteTotal,
                circuitos: projeto.comodos.map(comodo => ({
                    nome: comodo.nome,
                    tipo: comodo.tipo,
                    potenciaVA: comodo.tue.reduce((s, t) => s + t.potencia, 0),
                    correnteA: comodo.tue.reduce((s, t) => s + t.potencia, 0) / projeto.tensaoPrincipal,
                    bitolaFio: '2.5 mm²', // Aproximação
                    disjuntorRecomendadoA: 20, // Aproximação
                    eletrodutoMm: 20,
                    quedaTensaoPercentual: 2.5
                })),
                recomendacoesFioGeral: { bitolaMm2: '4 mm²', tipoFio: 'Fio de Cobre' },
                recomendacoesEletrodutoGeral: { diametroMm: 25 },
                automacaoRecomendada: { observacoes: ['Instalar disjuntor DR'] }
            };
        }
    };
}