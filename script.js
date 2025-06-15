// script.js

// --- Constantes e Funções Auxiliares ---

const POTENCIA_MINIMA_ILUMINACAO_COMODO_6M2 = 60;
const POTENCIA_MINIMA_ILUMINACAO_COMODO_MAIOR_6M2 = 100;
const POTENCIA_MINIMA_ILUMINACAO_INCREMENTO = 60;
const POTENCIA_TUG_GERAL = 100;
const POTENCIA_TUG_ADICIONAL = 60;
const POTENCIA_TUE_MINIMA = 600;
const FATOR_DEMANDA_ILUMINACAO_TUG = 0.8;
const FATOR_DEMANDA_TUE = 1;
const RESISTIVIDADE_COBRE = 0.0172;

const TABELA_AMPACIDADE_CABOS = {
    1.5: { '2': 15, '3': 13 },
    2.5: { '2': 20, '3': 18 },
    4.0: { '2': 28, '3': 24 },
    6.0: { '2': 36, '3': 31 },
    10.0: { '2': 50, '3': 42 },
    16.0: { '2': 68, '3': 59 },
    25.0: { '2': 89, '3': 77 },
    35.0: { '2': 108, '3': 94 },
    50.0: { '2': 134, '3': 116 },
    70.0: { '2': 167, '3': 145 },
    95.0: { '2': 201, '3': 174 },
    120.0: { '2': 233, '3': 202 },
    150.0: { '2': 267, '3': 231 },
    185.0: { '2': 304, '3': 264 },
    240.0: { '2': 358, '3': 310 },
    300.0: { '2': 409, '3': 354 },
};

const TABELA_ELETRODUTO = {
    '2': {
        1.5: 20, 2.5: 20, 4.0: 20, 6.0: 25, 10.0: 25, 16.0: 32, 25.0: 32,
        35.0: 40, 50.0: 40, 70.0: 50, 95.0: 50, 120.0: 60,
    },
    '3': {
        1.5: 20, 2.5: 25, 4.0: 25, 6.0: 32, 10.0: 32, 16.0: 40, 25.0: 40,
        35.0: 50, 50.0: 50, 70.0: 60, 95.0: 60, 120.0: 75,
    },
    '4': {
        1.5: 25, 2.5: 32, 4.0: 32, 6.0: 40, 10.0: 40, 16.0: 50, 25.0: 50,
        35.0: 60, 50.0: 60, 70.0: 75, 95.0: 75, 120.0: 85,
    }
};

function calcularPotenciaIluminacao(area) {
    if (area <= 6) return POTENCIA_MINIMA_ILUMINACAO_COMODO_6M2;
    let potencia = POTENCIA_MINIMA_ILUMINACAO_COMODO_MAIOR_6M2;
    let areaRestante = area - 6;
    potencia += Math.ceil(areaRestante / 4) * POTENCIA_MINIMA_ILUMINACAO_INCREMENTO;
    return potencia;
}

function calcularNumeroTUGs(perimetro, tipoComodo) {
    const perimetroArredondado = Math.ceil(perimetro);
    if (['cozinha', 'areaServico', 'lavanderia', 'copa', 'copa-cozinha'].includes(tipoComodo)) {
        let numTugs = Math.ceil(perimetroArredondado / 3.5);
        return Math.max(numTugs, 3);
    } else if (tipoComodo === 'banheiro') {
        return 1;
    } else {
        let numTugs = Math.ceil(perimetroArredondado / 5);
        return Math.max(numTugs, 1);
    }
}

function calcularPotenciaTotalTUGs(numTUGs) {
    if (numTUGs <= 3) return numTUGs * POTENCIA_TUG_GERAL;
    return (3 * POTENCIA_TUG_GERAL) + ((numTUGs - 3) * POTENCIA_TUG_ADICIONAL);
}

function obterBitolaFio(corrente, numCondutoresCarregados) {
    let bitolaIdeal = null;
    const bitolasDisponiveis = Object.keys(TABELA_AMPACIDADE_CABOS).map(Number).sort((a, b) => a - b);
    const numCondString = numCondutoresCarregados.toString();

    for (const bitola of bitolasDisponiveis) {
        const ampacidade = TABELA_AMPACIDADE_CABOS[bitola][numCondString];
        if (ampacidade !== undefined && corrente <= ampacidade) {
            bitolaIdeal = bitola;
            break;
        }
    }
    return bitolaIdeal;
}

function calcularQuedaTensao(corrente, comprimento, secaoCabo, tensao, tipoSistema) {
    if (secaoCabo <= 0 || tensao <= 0) return Infinity;
    let fatorK = tipoSistema === 'monofasico' || tipoSistema === 'bifasico' ? 2 : Math.sqrt(3);
    const resistenciaCabo = RESISTIVIDADE_COBRE * comprimento / secaoCabo;
    const quedaVolts = fatorK * corrente * resistenciaCabo;
    return (quedaVolts / tensao) * 100;
}

function obterEletroduto(numCondutoresCarregados, bitolaFio) {
    const condutorKey = numCondutoresCarregados.toString();
    if (TABELA_ELETRODUTO[condutorKey]) {
        const bitolasEletrodutoDisponiveis = Object.keys(TABELA_ELETRODUTO[condutorKey]).map(Number).sort((a, b) => a - b);
        let eletrodutoIdeal = null;
        for (let b of bitolasEletrodutoDisponiveis) {
            if (bitolaFio <= b) {
                eletrodutoIdeal = TABELA_ELETRODUTO[condutorKey][b];
                break;
            }
        }
        if (!eletrodutoIdeal && bitolasEletrodutoDisponiveis.length > 0) {
            eletrodutoIdeal = TABELA_ELETRODUTO[condutorKey][bitolasEletrodutoDisponiveis[bitolasEletrodutoDisponiveis.length - 1]];
        }
        return eletrodutoIdeal;
    }
    return null;
}

// --- Funções de Interface ---

document.addEventListener('DOMContentLoaded', () => {
    // Menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navUl = document.querySelector('#main-nav ul');

    if (menuToggle && navUl) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            menuToggle.textContent = !isExpanded ? '✕' : '☰';
            navUl.classList.toggle('active');
        });
    }

    // Tabs interativas
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.setAttribute('aria-selected', 'false'));
            tabContents.forEach(content => content.setAttribute('aria-hidden', 'true'));

            button.setAttribute('aria-selected', 'true');
            const targetContent = document.getElementById(button.getAttribute('data-tab'));
            if (targetContent) {
                targetContent.setAttribute('aria-hidden', 'false');
            }
        });
    });

    // Validação em tempo real
    const inputs = document.querySelectorAll('.calculator input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const errorSpan = document.getElementById(`${input.id}-error`);
            if (input.validity.valid) {
                errorSpan.textContent = '';
            } else if (input.validity.valueMissing) {
                errorSpan.textContent = 'Este campo é obrigatório.';
            } else if (input.validity.rangeUnderflow) {
                errorSpan.textContent = 'O valor deve ser maior que 0.';
            }
        });
    });

    // Botão voltar ao topo
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '↑';
    backToTopButton.setAttribute('aria-label', 'Voltar ao topo');
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

function calcularDimensionamento() {
    const sistema = document.getElementById('sistema').value;
    const potencia = parseFloat(document.getElementById('potencia').value);
    const tensao = parseFloat(document.getElementById('tensao').value);
    const comprimento = parseFloat(document.getElementById('comprimento').value);
    const resultadoDiv = document.getElementById('resultado');

    if (!sistema || isNaN(potencia) || isNaN(tensao) || isNaN(comprimento)) {
        resultadoDiv.innerHTML = '<p class="error">Preencha todos os campos corretamente.</p>';
        return;
    }

    const numCondutores = sistema === 'monofasico' ? 2 : 3;
    const corrente = sistema === 'monofasico' ? potencia / tensao : potencia / (tensao * Math.sqrt(3));
    const bitola = obterBitolaFio(corrente, numCondutores) || 2.5;
    const queda = calcularQuedaTensao(corrente, comprimento, bitola, tensao, sistema);
    const eletroduto = obterEletroduto(numCondutores, bitola);

    resultadoDiv.innerHTML = `
        <h4>Resultado do Dimensionamento</h4>
        <table aria-label="Resumo do dimensionamento do circuito">
            <tr><th>Corrente</th><td>${corrente.toFixed(2)} A</td></tr>
            <tr><th>Bitola do Cabo</th><td>${bitola} mm²</td></tr>
            <tr><th>Queda de Tensão</th><td>${queda.toFixed(2)} %</td></tr>
            <tr><th>Eletroduto</th><td>${eletroduto ? eletroduto + ' mm' : 'Consultar tabela'}</td></tr>
        </table>
        <p><strong>Nota:</strong> Consulte a NBR 5410 para ajustes específicos (ex.: agrupamento, temperatura).</p>
    `;
}

function resetForm() {
    const form = document.querySelector('.calculator');
    form.reset();
    document.getElementById('resultado').innerHTML = '';
    document.querySelectorAll('.error').forEach(span => span.textContent = '');
}

// Função para adicionar campos de TUE
let tueCount = [0]; // Array para contar TUEs por cômodo
function addTUEField(comodoIndex) {
    const tueFields = document.getElementById(`tueFields_${comodoIndex}`);
    const tueIndex = tueCount[comodoIndex] || 0;
    tueCount[comodoIndex] = tueIndex + 1;

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
}

function removeTUEField(comodoIndex, button) {
    button.parentElement.remove();
    tueCount[comodoIndex]--;
}

// Função para adicionar cômodos
let comodoCount = 1;
function addComodoField() {
    const containerComodos = document.getElementById('containerComodos');
    const comodoItem = document.createElement('div');
    comodoItem.className = 'comodo-item';
    comodoItem.innerHTML = `
        <h4>Cômodo ${comodoCount + 1}</h4>
        <label for="nomeComodo_${comodoCount}">Nome do Cômodo:</label>
        <input type="text" id="nomeComodo_${comodoCount}" value="Cômodo ${comodoCount + 1}" required>
        <label for="tipoComodo_${comodoCount}">Tipo de Cômodo:</label>
        <select id="tipoComodo_${comodoCount}" required>
            <option value="sala">Sala</option>
            <option value="quarto">Quarto</option>
            <option value="cozinha">Cozinha</option>
            <option value="banheiro">Banheiro</option>
            <option value="areaServico">Área de Serviço</option>
            <option value="circulacao">Corredor/Hall</option>
            <option value="garagem">Garagem</option>
            <option value="outro">Outro</option>
        </select>
        <label for="areaComodo_${comodoCount}">Área (m²):</label>
        <input type="number" id="areaComodo_${comodoCount}" min="1" step="0.1" value="15" required>
        <label for="perimetroComodo_${comodoCount}">Perímetro (m):</label>
        <input type="number" id="perimetroComodo_${comodoCount}" min="1" step="0.1" value="15" required>
        <div class="tue-container">
            <h5>Tomadas de Uso Específico (TUEs):</h5>
            <button type="button" class="add-tue-btn" onclick="addTUEField(${comodoCount})">+ Adicionar TUE</button>
            <div id="tueFields_${comodoCount}"></div>
        </div>
        <button type="button" class="remove-comodo-btn" onclick="removeComodoField(this)">- Remover Cômodo</button>
    `;
    containerComodos.appendChild(comodoItem);
    tueCount[comodoCount] = 0;
    comodoCount++;
}

function removeComodoField(button) {
    button.parentElement.remove();
    comodoCount--;
}

function calcularDimensionamentoCompleto() {
    const tensaoPrincipal = parseFloat(document.getElementById('tensaoPrincipalProjeto').value);
    const comodos = [];

    for (let i = 0; i < comodoCount; i++) {
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
        document.getElementById('resultadoCompleto').innerHTML = '<p class="error">Preencha todos os campos obrigatórios.</p>';
        return;
    }

    const projeto = { tensaoPrincipal, comodos };
    const relatorio = DimensionadorEletrico.dimensionar(projeto);

    let html = `
        <h4>Relatório do Projeto Elétrico</h4>
        <p><strong>Tensão Principal:</strong> ${relatorio.tensaoPrincipal} V</p>
        <p><strong>Tipo de Sistema:</strong> ${relatorio.tipoSistemaNecessario}</p>
        <p><strong>Demanda Total:</strong> ${(relatorio.demandaTotalVA / 1000).toFixed(2)} kVA</p>
        <p><strong>Corrente Total:</strong> ${relatorio.correnteTotalA.toFixed(2)} A</p>
        <h5>Circuitos:</h5>
        <ul>
    `;
    relatorio.circuitos.forEach(circuito => {
        html += `
            <li>
                <details class="circuit-details">
                    <summary>${circuito.nome}</summary>
                    <ul>
                        <li><strong>Tipo:</strong> ${circuito.tipo}</li>
                        <li><strong>Potência:</strong> ${circuito.potenciaVA} VA</li>
                        <li><strong>Corrente:</strong> ${circuito.correnteA.toFixed(2)} A</li>
                        <li><strong>Bitola:</strong> ${circuito.bitolaFio} mm²</li>
                        <li><strong>Disjuntor:</strong> ${circuito.disjuntorRecomendadoA} A</li>
                        <li><strong>Eletroduto:</strong> ${circuito.eletrodutoMm ? circuito.eletrodutoMm + ' mm' : 'Consultar'}</li>
                        <li><strong>Queda de Tensão:</strong> ${circuito.quedaTensaoPercentual.toFixed(2)} %</li>
                        ${circuito.observacoes.length > 0 ? `<li><strong>Observações:</strong> ${circuito.observacoes.join(', ')}</li>` : ''}
                    </ul>
                </details>
            </li>
        `;
    });
    html += `
        </ul>
        <p><strong>Recomendações Gerais:</strong></p>
        <ul>
            <li><strong>Bitola do Alimentador:</strong> ${relatorio.recomendacoesFioGeral.bitolaMm2} mm² (${relatorio.recomendacoesFioGeral.tipoFio})</li>
            <li><strong>Eletroduto Principal:</strong> ${relatorio.recomendacoesEletrodutoGeral.diametroMm} mm</li>
        </ul>
        ${relatorio.automacaoRecomendada.observacoes.length > 0 ? `<p><strong>Automação Recomendada:</strong> ${relatorio.automacaoRecomendada.observacoes.join(' ')}</p>` : ''}
    `;
    document.getElementById('resultadoCompleto').innerHTML = html;
}

function resetProjetoCompletoForm() {
    document.getElementById('formProjetoCompleto').reset();
    document.getElementById('containerComodos').innerHTML = `
        <div class="comodo-item">
            <h4>Cômodo 1</h4>
            <label for="nomeComodo_0">Nome do Cômodo:</label>
            <input type="text" id="nomeComodo_0" value="Sala" required>
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
            <input type="number" id="areaComodo_0" min="1" step="0.1" value="15" required>
            <label for="perimetroComodo_0">Perímetro (m):</label>
            <input type="number" id="perimetroComodo_0" min="1" step="0.1" value="15" required>
            <div class="tue-container">
                <h5>Tomadas de Uso Específico (TUEs):</h5>
                <button type="button" class="add-tue-btn" onclick="addTUEField(0)">+ Adicionar TUE</button>
                <div id="tueFields_0"></div>
            </div>
        </div>
    `;
    document.getElementById('resultadoCompleto').innerHTML = '';
    comodoCount = 1;
    tueCount = [0];
}

// --- Dimensionador Elétrico ---

const DimensionadorEletrico = {
    dimensionar: function(projeto) {
        let relatorio = {
            tensaoPrincipal: projeto.tensaoPrincipal,
            totalPotenciaIluminacaoVA: 0,
            totalPotenciaTUGsVA: 0,
            totalPotenciaTUEsVA: 0,
            demandaTotalVA: 0,
            correnteTotalA: 0,
            tipoSistemaNecessario: '',
            circuitos: [],
            recomendacoesFioGeral: {},
            recomendacoesEletrodutoGeral: {},
            disjuntoresRecomendados: {},
            numCircuitos: 0,
            automacaoRecomendada: {
                iluminacaoInteligente: false,
                controleTemperatura: false,
                seguranca: false,
                audioVideo: false,
                integracaoVoz: false,
                observacoes: []
            },
            observacoesGerais: []
        };

        const COMPRIMENTO_CIRCUITO_PADRAO_ILUMINACAO = 10;
        const COMPRIMENTO_CIRCUITO_PADRAO_TUG = 15;
        const COMPRIMENTO_CIRCUITO_PADRAO_TUE = 20;

        projeto.comodos.forEach(comodo => {
            const potenciaIluminacao = calcularPotenciaIluminacao(comodo.area);
            relatorio.totalPotenciaIluminacaoVA += potenciaIluminacao;

            const numTUGs = calcularNumeroTUGs(comodo.perimetro, comodo.tipo);
            const potenciaTUGs = calcularPotenciaTotalTUGs(numTUGs);
            relatorio.totalPotenciaTUGsVA += potenciaTUGs;

            if (potenciaIluminacao > 0) {
                const correnteIluminacao = potenciaIluminacao / projeto.tensaoPrincipal;
                const bitolaIluminacao = obterBitolaFio(correnteIluminacao, 2) || 1.5;
                const disjuntorIluminacao = Math.max(10, Math.ceil(correnteIluminacao / 5) * 5);

                relatorio.circuitos.push({
                    nome: `Iluminação - ${comodo.nome}`,
                    tipo: 'Iluminação',
                    potenciaVA: potenciaIluminacao,
                    correnteA: correnteIluminacao,
                    numTomadas: 0,
                    numLuzes: Math.max(1, Math.ceil(potenciaIluminacao / 60)),
                    numInterruptores: Math.max(1, Math.ceil(Math.min(2, Math.ceil(potenciaIluminacao / 60)) / 2)),
                    bitolaFio: bitolaIluminacao,
                    disjuntorRecomendadoA: disjuntorIluminacao,
                    eletrodutoMm: obterEletroduto(2, bitolaIluminacao),
                    quedaTensaoPercentual: calcularQuedaTensao(correnteIluminacao, COMPRIMENTO_CIRCUITO_PADRAO_ILUMINACAO, bitolaIluminacao, projeto.tensaoPrincipal, 'monofasico'),
                    observacoes: []
                });
                relatorio.numCircuitos++;
            }

            if (numTUGs > 0) {
                const correnteTUGs = potenciaTUGs / projeto.tensaoPrincipal;
                const bitolaTUGs = obterBitolaFio(correnteTUGs, 2) || 2.5;
                const disjuntorTUGs = Math.max(20, Math.ceil(correnteTUGs / 5) * 5);

                relatorio.circuitos.push({
                    nome: `TUGs - ${comodo.nome}`,
                    tipo: 'Tomadas de Uso Geral (TUG)',
                    potenciaVA: potenciaTUGs,
                    correnteA: correnteTUGs,
                    numTomadas: numTUGs,
                    numLuzes: 0,
                    numInterruptores: 0,
                    bitolaFio: bitolaTUGs,
                    disjuntorRecomendadoA: disjuntorTUGs,
                    eletrodutoMm: obterEletroduto(2, bitolaTUGs),
                    quedaTensaoPercentual: calcularQuedaTensao(correnteTUGs, COMPRIMENTO_CIRCUITO_PADRAO_TUG, bitolaTUGs, projeto.tensaoPrincipal, 'monofasico'),
                    observacoes: []
                });
                relatorio.numCircuitos++;
            }

            if (comodo.tue && comodo.tue.length > 0) {
                comodo.tue.forEach(tue => {
                    relatorio.totalPotenciaTUEsVA += tue.potencia;
                    const correnteTUE = tue.potencia / projeto.tensaoPrincipal;
                    const bitolaTUE = obterBitolaFio(correnteTUE, 2) || 2.5;
                    const disjuntorTUE = Math.max(25, Math.ceil(correnteTUE / 5) * 5);

                    relatorio.circuitos.push({
                        nome: `TUE - ${tue.nome} (${comodo.nome})`,
                        tipo: 'Tomada de Uso Específico (TUE)',
                        potenciaVA: tue.potencia,
                        correnteA: correnteTUE,
                        numTomadas: 1,
                        numLuzes: 0,
                        numInterruptores: 0,
                        bitolaFio: bitolaTUE,
                        disjuntorRecomendadoA: disjuntorTUE,
                        eletrodutoMm: obterEletroduto(2, bitolaTUE),
                        quedaTensaoPercentual: calcularQuedaTensao(correnteTUE, COMPRIMENTO_CIRCUITO_PADRAO_TUE, bitolaTUE, projeto.tensaoPrincipal, 'monofasico'),
                        observacoes: ['Circuito dedicado para este equipamento.']
                    });
                    relatorio.numCircuitos++;
                });
            }
        });

        relatorio.demandaTotalVA = (relatorio.totalPotenciaIluminacaoVA * FATOR_DEMANDA_ILUMINACAO_TUG) +
                                   (relatorio.totalPotenciaTUGsVA * FATOR_DEMANDA_ILUMINACAO_TUG) +
                                   (relatorio.totalPotenciaTUEsVA * FATOR_DEMANDA_TUE);

        let numCondutoresPrincipal;
        if (relatorio.tensaoPrincipal === 127) {
            relatorio.tipoSistemaNecessario = 'Monofásico (F+N)';
            numCondutoresPrincipal = 2;
            relatorio.correnteTotalA = relatorio.demandaTotalVA / relatorio.tensaoPrincipal;
        } else if (relatorio.tensaoPrincipal === 220) {
            if (relatorio.demandaTotalVA <= 10000) {
                relatorio.tipoSistemaNecessario = 'Bifásico (2F+N ou F+F)';
                numCondutoresPrincipal = 3;
                relatorio.correnteTotalA = relatorio.demandaTotalVA / relatorio.tensaoPrincipal;
            } else {
                relatorio.tipoSistemaNecessario = 'Trifásico (3F+N)';
                numCondutoresPrincipal = 4;
                relatorio.correnteTotalA = relatorio.demandaTotalVA / (relatorio.tensaoPrincipal * Math.sqrt(3));
            }
        } else if (relatorio.tensaoPrincipal === 380) {
            relatorio.tipoSistemaNecessario = 'Trifásico (3F+N)';
            numCondutoresPrincipal = 4;
            relatorio.correnteTotalA = relatorio.demandaTotalVA / (relatorio.tensaoPrincipal * Math.sqrt(3));
        } else {
            relatorio.tipoSistemaNecessario = 'Não definido (Tensão incomum)';
            numCondutoresPrincipal = 2;
            relatorio.correnteTotalA = relatorio.demandaTotalVA / relatorio.tensaoPrincipal;
        }

        const bitolaFioGeral = obterBitolaFio(relatorio.correnteTotalA, numCondutoresPrincipal);
        relatorio.recomendacoesFioGeral.bitolaMm2 = bitolaFioGeral || 6;
        relatorio.recomendacoesFioGeral.tipoFio = 'Cabo de Cobre PVC 70°C';
        relatorio.recomendacoesFioGeral.numCondutoresCarregados = numCondutoresPrincipal;
        relatorio.recomendacoesFioGeral.observacao = `Para o alimentador principal da residência. Consulte a concessionária local para bitola mínima do ramal de entrada.`;

        const eletrodutoGeral = obterEletroduto(numCondutoresPrincipal, relatorio.recomendacoesFioGeral.bitolaMm2);
        relatorio.recomendacoesEletrodutoGeral.diametroMm = eletrodutoGeral;
        relatorio.recomendacoesEletrodutoGeral.tipo = 'PVC Rígido ou Flexível (corrugado)';
        relatorio.recomendacoesEletrodutoGeral.observacao = `Para o alimentador principal. Verifique o fator de ocupação (máx. 40%).`;

        relatorio.circuitos.forEach(circuito => {
            if (circuito.disjuntorRecomendadoA) {
                const disjuntor = `${circuito.disjuntorRecomendadoA}A`;
                relatorio.disjuntoresRecomendados[disjuntor] = (relatorio.disjuntoresRecomendados[disjuntor] || 0) + 1;
            }
        });

        if (projeto.comodos.some(c => c.tipo === 'sala' || c.tipo === 'quarto')) {
            relatorio.automacaoRecomendada.iluminacaoInteligente = true;
            relatorio.automacaoRecomendada.observacoes.push('Iluminação inteligente (dimmers, controle por app/voz) é recomendada para salas e quartos.');
        }
        if (projeto.comodos.some(c => c.tipo === 'sala' || (c.tue && c.tue.some(t => t.nome.toLowerCase().includes('ar condicionado'))))) {
            relatorio.automacaoRecomendada.controleTemperatura = true;
            relatorio.automacaoRecomendada.observacoes.push('Controle inteligente de temperatura (termostatos Wi-Fi) pode otimizar o uso de ar condicionado.');
        }

        return relatorio;
    }
};