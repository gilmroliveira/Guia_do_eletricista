// script.js - Adições para projeto-online.html

// Contadores para cômodos e TUEs
let comodoCountOnline = 1;
let tueCountOnline = [0];

// Adicionar campo de TUE
function addTUEField(comodoIndex) {
    const tueFields = document.getElementById(`tueFields_${comodoIndex}`);
    const tueIndex = tueCountOnline[comodoIndex] || 0;
    tueCountOnline[comodoIndex] = tueIndex + 1;

    const tueItem = document.createElement('div');
    tueItem.className = 'tue-item';
    tueItem.innerHTML = `
        <label for="tueNome_${comodoIndex}_${tueIndex}">Nome da TUE (Ex: Chuveiro):</label>
        <input type="text" id="tueNome_${comodoIndex}_${tueIndex}" required placeholder="Ex.: Chuveiro">
        <label for="tuePotencia_${comodoIndex}_${tueIndex}">Potência (W):</label>
        <input type="number" id="tuePotencia_${comodoIndex}_${tueIndex}" min="0" step="1" required placeholder="Ex.: 5400">
        <button type="button" class="remove-tue-btn" onclick="removeTUEField(${comodoIndex}, this)">- Remover TUE</button>
    `;
    tueFields.appendChild(tueItem);
    tueItem.style.animation = 'fadeIn 0.3s ease-in';
}

// Remover campo de TUE
function removeTUEField(comodoIndex, button) {
    button.parentElement.remove();
    tueCountOnline[comodoIndex]--;
}

// Adicionar cômodo
function addComodoField() {
    const containerComodos = document.getElementById('containerComodos');
    const comodoItem = document.createElement('div');
    comodoItem.className = 'comodo-item';
    comodoItem.dataset.comodoId = comodoCountOnline;
    comodoItem.innerHTML = `
        <h3>Cômodo ${comodoCountOnline + 1}</h3>
        <label for="nomeComodo_${comodoCountOnline}">Nome do Cômodo:</label>
        <input type="text" id="nomeComodo_${comodoCountOnline}" value="Cômodo ${comodoCountOnline + 1}" required placeholder="Ex.: Sala">
        <label for="tipoComodo_${comodoCountOnline}">Tipo de Cômodo:</label>
        <select id="tipoComodo_${comodoCountOnline}" required>
            <option value="sala">Sala</option>
            <option value="quarto">Quarto</option>
            <option value="cozinha">Cozinha</option>
            <option value="banheiro">Banheiro</option>
            <option value="areaServico">Área de Serviço</option>
            <option value="circulacao">Corredor/Hall</option>
            <option value="garagem">Garagem</option>
            <option value="outro">Outro</option>
        </select>
        <label for="areaComodo_${comodoCountOnline}">Área (m²):</label>
        <input type="number" id="areaComodo_${comodoCountOnline}" min="1" step="0.1" value="15" required placeholder="Ex.: 15">
        <label for="perimetroComodo_${comodoCountOnline}">Perímetro (m):</label>
        <input type="number" id="perimetroComodo_${comodoCountOnline}" min="1" step="0.1" value="15" required placeholder="Ex.: 15">
        <div class="tue-container">
            <h4>Tomadas de Uso Específico (TUEs):</h4>
            <button type="button" class="add-tue-btn" onclick="addTUEField(${comodoCountOnline})">+ Adicionar TUE</button>
            <div id="tueFields_${comodoCountOnline}"></div>
        </div>
        <button type="button" class="remove-comodo-btn" onclick="removeComodoField(this)">- Remover Cômodo</button>
    `;
    containerComodos.appendChild(comodoItem);
    comodoItem.style.animation = 'fadeIn 0.3s ease-in';
    tueCountOnline[comodoCountOnline] = 0;
    comodoCountOnline++;
}

// Remover cômodo
function removeComodoField(button) {
    button.parentElement.remove();
    comodoCountOnline--;
}

// Calcular projeto online
function calcularProjetoOnline() {
    const tensaoPrincipal = parseFloat(document.getElementById('tensaoPrincipalProjeto').value);
    const comodos = [];

    for (let i = 0; i < comodoCountOnline; i++) {
        const nome = document.getElementById(`nomeComodo_${i}`)?.value;
        if (!nome) continue;

        const tipo = document.getElementById(`tipoComodo_${i}`).value;
        const area = parseFloat(document.getElementById(`areaComodo_${i}`).value);
        const perimetro = parseFloat(document.getElementById(`perimetroComodo_${i}`).value);
        const tueFields = document.getElementById(`tueFields_${i}`).children;
        const tue = [];

        for (let j = 0; j < tueFields.length; j++) {
            const tueNome = document.getElementById(`tueNome_${i}_${j}`)?.value;
            const tuePotencia = parseFloat(document.getElementById(`tuePotencia_${i}_${j}`)?.value);
            if (tueNome && !isNaN(tuePotencia)) {
                tue.push({ nome: tueNome, potencia: tuePotencia });
            }
        }

        comodos.push({ nome, tipo, area, perimetro, tue });
    }

    if (comodos.length === 0 || isNaN(tensaoPrincipal)) {
        document.getElementById('resultadoProjetoOnline').innerHTML = '<p class="error">Preencha todos os campos obrigatórios.</p>';
        return;
    }

    const projeto = { tensaoPrincipal, comodos };
    const relatorio = DimensionadorEletrico.dimensionar(projeto);

    let html = `
        <h3>Relatório do Projeto Elétrico</h3>
        <p><strong>Tensão Principal:</strong> ${relatorio.tensaoPrincipal} V</p>
        <p><strong>Tipo de Sistema:</strong> ${relatorio.tipoSistemaNecessario}</p>
        <p><strong>Demanda Total:</strong> ${(relatorio.demandaTotalVA / 1000).toFixed(2)} kVA</p>
        <p><strong>Corrente Total:</strong> ${relatorio.correnteTotalA.toFixed(2)} A</p>
        <h4>Circuitos:</h4>
        <table aria-label="Resumo dos circuitos do projeto">
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
    relatorio.circuitos.forEach(circuito => {
        html += `
            <tr>
                <td>${circuito.nome}</td>
                <td>${circuito.tipo}</td>
                <td>${circuito.potenciaVA}</td>
                <td>${circuito.correnteA.toFixed(2)}</td>
                <td>${circuito.bitolaFio}</td>
                <td>${circuito.disjuntorRecomendadoA}</td>
                <td>${circuito.eletrodutoMm || 'Consultar'}</td>
                <td>${circuito.quedaTensaoPercentual.toFixed(2)}</td>
            </tr>
        `;
    });
    html += `
            </tbody>
        </table>
        <h4>Recomendações Gerais:</h4>
        <ul>
            <li><strong>Bitola do Alimentador:</strong> ${relatorio.recomendacoesFioGeral.bitolaMm2} mm² (${relatorio.recomendacoesFioGeral.tipoFio})</li>
            <li><strong>Eletroduto Principal:</strong> ${relatorio.recomendacoesEletrodutoGeral.diametroMm} mm</li>
        </ul>
        ${relatorio.automacaoRecomendada.observacoes.length > 0 ? `<p><strong>Automação Recomendada:</strong> ${relatorio.automacaoRecomendada.observacoes.join(' ')}</p>` : ''}
        <p><strong>Nota:</strong> Consulte um engenheiro eletricista para validar o projeto conforme a NBR 5410 e as exigências da concessionária local.</p>
    `;
    const resultadoDiv = document.getElementById('resultadoProjetoOnline');
    resultadoDiv.innerHTML = html;
    resultadoDiv.style.animation = 'fadeIn 0.3s ease-in';
}

// Resetar formulário
function resetProjetoOnlineForm() {
    document.getElementById('formProjetoOnline').reset();
    document.getElementById('containerComodos').innerHTML = `
        <div class="comodo-item" data-comodo-id="0">
            <h3>Cômodo 1</h3>
            <label for="nomeComodo_0">Nome do Cômodo:</label>
            <input type="text" id="nomeComodo_0" value="Sala" required placeholder="Ex.: Sala">
            <label for="tipoComodo_0">Tipo de Cômodo:</label>
            <select id="tipoComodo_0" required>
                <option value="sala">Sala</option>
                <option value="quarto">Quarto</option>
                <option value="cozinha">Cozinha</option>
                <option value="banheiro">Banheiro</option>
                <option value="areaServico">Área de Serviço</option>
                <option value="circulacao">Corredor/Hall</option>
                <option value="garagem">Garagem</option>
                <option value="outro">Outro</option>
            </select>
            <label for="areaComodo_0">Área (m²):</label>
            <input type="number" id="areaComodo_0" min="1" step="0.1" value="15" required placeholder="Ex.: 15">
            <label for="perimetroComodo_0">Perímetro (m):</label>
            <input type="number" id="perimetroComodo_0" min="1" step="0.1" value="15" required placeholder="Ex.: 15">
            <div class="tue-container">
                <h4>Tomadas de Uso Específico (TUEs):</h4>
                <button type="button" class="add-tue-btn" onclick="addTUEField(0)">+ Adicionar TUE</button>
                <div id="tueFields_0"></div>
            </div>
        </div>
    `;
    document.getElementById('resultadoProjetoOnline').innerHTML = '';
    comodoCountOnline = 1;
    tueCountOnline = [0];
}