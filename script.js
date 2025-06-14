// script.js

// --- Funções Auxiliares e Constantes ---

// Constantes para potências mínimas (NBR 5410)
const POTENCIA_MINIMA_ILUMINACAO_COMODO_6M2 = 60; // W
const POTENCIA_MINIMA_ILUMINACAO_COMODO_MAIOR_6M2 = 100; // W (para os primeiros 6m2)
const POTENCIA_MINIMA_ILUMINACAO_INCREMENTO = 60; // W (a cada 4m2 adicionais)
const POTENCIA_TUG_GERAL = 100; // VA (para as 3 primeiras tomadas de uso geral)
const POTENCIA_TUG_ADICIONAL = 60; // VA (para as demais tomadas de uso geral)
const POTENCIA_TUE_MINIMA = 600; // VA (para TUEs como chuveiro, ar condicionado)

// Fatores de demanda para dimensionamento da entrada (valores aproximados para exemplo)
const FATOR_DEMANDA_ILUMINACAO_TUG = 0.8;
const FATOR_DEMANDA_TUE = 1; // Para TUEs, geralmente 100% da potência

// Tabela de ampacidade de cabos (NBR 5410 - Método de referência B1 - Condutores isolados em eletroduto de seção circular embutido em parede)
// Formato: { bitola_mm2: { 2_condutores_A: valor, 3_condutores_A: valor } }
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
};

// Resistividade do cobre (em Ω·mm²/m) para cálculo de queda de tensão
const RESISTIVIDADE_COBRE = 0.0172;

// Mapa de bitolas de eletroduto por número e bitola de condutores (exemplo simplificado)
// Formato: { num_condutores: { bitola_fio_mm2: diametro_eletroduto_mm } }
const TABELA_ELETRODUTO = {
    '2': {
        1.5: 20, // 3/4"
        2.5: 20,
        4.0: 20,
        6.0: 25, // 1"
        10.0: 25,
        16.0: 32, // 1 1/4"
    },
    '3': {
        1.5: 20,
        2.5: 25,
        4.0: 25,
        6.0: 32,
        10.0: 32,
        16.0: 40, // 1 1/2"
    }
};

/**
 * Calcula a potência de iluminação para um cômodo.
 * Baseado nas diretrizes da NBR 5410.
 * @param {number} area - Área do cômodo em m².
 * @returns {number} Potência mínima de iluminação em VA.
 */
function calcularPotenciaIluminacao(area) {
    if (area <= 6) {
        return POTENCIA_MINIMA_ILUMINACAO_COMODO_6M2;
    } else {
        let potencia = POTENCIA_MINIMA_ILUMINACAO_COMODO_MAIOR_6M2;
        let areaRestante = area - 6;
        potencia += Math.ceil(areaRestante / 4) * POTENCIA_MINIMA_ILUMINACAO_INCREMENTO;
        return potencia;
    }
}

/**
 * Calcula o número de pontos de TUG (Tomadas de Uso Geral) para um cômodo.
 * Baseado nas diretrizes da NBR 5410.
 * @param {number} perimetro - Perímetro do cômodo em metros.
 * @param {string} tipoComodo - Tipo de cômodo (ex: 'cozinha', 'banheiro', 'quarto').
 * @returns {number} Número mínimo de TUGs.
 */
function calcularNumeroTUGs(perimetro, tipoComodo) {
    if (tipoComodo === 'cozinha' || tipoComodo === 'areaServico' || tipoComodo === 'banheiro') {
        // Cozinhas, copas, áreas de serviço, banheiros: 1 TUG a cada 3.5m ou fração de perímetro.
        // Mínimo de 3 em cozinha/área de serviço, 1 em banheiro.
        let numTugs = Math.ceil(perimetro / 3.5);
        if (tipoComodo === 'cozinha' || tipoComodo === 'areaServico') {
            return Math.max(numTugs, 3);
        } else if (tipoComodo === 'banheiro') {
            return Math.max(numTugs, 1);
        }
    } else {
        // Demais cômodos: 1 TUG a cada 5m ou fração de perímetro. Mínimo de 1.
        return Math.max(Math.ceil(perimetro / 5), 1);
    }
    return 0; // Fallback
}

/**
 * Calcula a potência total das TUGs de um cômodo.
 * @param {number} numTUGs - Número de TUGs no cômodo.
 * @returns {number} Potência total das TUGs em VA.
 */
function calcularPotenciaTotalTUGs(numTUGs) {
    if (numTUGs <= 3) {
        return numTUGs * POTENCIA_TUG_GERAL;
    } else {
        return (3 * POTENCIA_TUG_GERAL) + ((numTUGs - 3) * POTENCIA_TUG_ADICIONAL);
    }
}

/**
 * Retorna a bitola do fio com base na corrente e no número de condutores.
 * @param {number} corrente - Corrente em Ampères.
 * @param {number} numCondutores - Número de condutores (2 ou 3).
 * @returns {number | null} Bitola do fio em mm² ou null se não encontrada.
 */
function obterBitolaFio(corrente, numCondutores) {
    let bitolaIdeal = null;
    let bitolasDisponiveis = Object.keys(TABELA_AMPACIDADE_CABOS).map(Number).sort((a, b) => a - b);

    for (let bitola of bitolasDisponiveis) {
        const ampacidade = TABELA_AMPACIDADE_CABOS[bitola][numCondutores.toString()];
        if (ampacidade !== undefined && corrente <= ampacidade) {
            bitolaIdeal = bitola;
            break;
        }
    }
    return bitolaIdeal;
}

/**
 * Calcula a queda de tensão percentual.
 * @param {number} corrente - Corrente em Ampères.
 * @param {number} comprimento - Comprimento do circuito em metros.
 * @param {number} secaoCabo - Seção do cabo em mm².
 * @param {number} tensao - Tensão nominal do sistema em Volts.
 * @param {string} tipoSistema - 'monofasico' ou 'trifasico'.
 * @returns {number} Queda de tensão em percentual.
 */
function calcularQuedaTensao(corrente, comprimento, secaoCabo, tensao, tipoSistema) {
    let fator = (tipoSistema === 'monofasico' || tipoSistema === 'bifasico') ? 2 : Math.sqrt(3); // bifásico considerado 2 fases + neutro ou fase+fase
    if (secaoCabo <= 0) return Infinity; // Evita divisão por zero ou negativos

    const resistenciaCaboPorMetro = RESISTIVIDADE_COBRE / secaoCabo;
    const resistenciaTotal = resistenciaCaboPorMetro * comprimento;
    const quedaVolts = fator * corrente * resistenciaTotal;
    return (quedaVolts / tensao) * 100;
}


/**
 * Retorna o diâmetro do eletroduto recomendado.
 * @param {number} numCondutores - Número de condutores.
 * @param {number} bitolaFio - Bitola do fio em mm².
 * @returns {number | null} Diâmetro do eletroduto em mm, ou null se não encontrado.
 */
function obterEletroduto(numCondutores, bitolaFio) {
    if (TABELA_ELETRODUTO[numCondutores.toString()]) {
        // Encontra a maior bitola de fio na tabela que seja menor ou igual à bitola fornecida
        const bitolasEletrodutoDisponiveis = Object.keys(TABELA_ELETRODUTO[numCondutores.toString()]).map(Number).sort((a, b) => a - b);
        let eletrodutoIdeal = null;
        for (let b of bitolasEletrodutoDisponiveis) {
            if (bitolaFio <= b) {
                eletrodutoIdeal = TABELA_ELETRODUTO[numCondutores.toString()][b];
                break;
            }
        }
        if (!eletrodutoIdeal) { // Se a bitola for maior que as tabeladas, retorna a maior disponível
            eletrodutoIdeal = TABELA_ELETRODUTO[numCondutores.toString()][bitolasEletrodutoDisponiveis[bitolasEletrodutoDisponiveis.length - 1]];
        }
        return eletrodutoIdeal;
    }
    return null;
}

// --- Algoritmo Principal de Dimensionamento ---

/**
 * Objeto principal que contém a lógica de cálculo.
 */
const DimensionadorEletrico = {
    /**
     * Realiza o dimensionamento completo de uma instalação.
     * @param {Object} projeto - Objeto contendo os detalhes do projeto.
     * @param {Array<Object>} projeto.comodos - Array de objetos de cômodos.
     * Cada cômodo: { nome: string, area: number, perimetro: number, tipo: string (ex: 'quarto', 'cozinha', 'banheiro', 'sala', 'areaServico'), tue: Array<{nome: string, potencia: number}> }
     * @param {number} projeto.tensaoPrincipal - Tensão principal da instalação (ex: 127, 220).
     * @param {string} projeto.tipoFornecimento - 'monofasico', 'bifasico', 'trifasico'.
     * @param {string} projeto.tipoInstalacaoFio - 'embutido', 'aparente', 'bandeja' (influencia na ampacidade, aqui simplificado para 'embutido').
     * @returns {Object} Relatório detalhado do dimensionamento.
     */
    dimensionar: function(projeto) {
        let relatorio = {
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
            }
        };

        let numCircuitos = 0;

        // Valor fixo de comprimento para circuitos internos para cálculo de queda, idealmente deveria ser inputado
        const COMPRIMENTO_CIRCUITO_PADRAO_ILUMINACAO = 10;
        const COMPRIMENTO_CIRCUITO_PADRAO_TUG = 15;
        const COMPRIMENTO_CIRCUITO_PADRAO_TUE = 20;


        projeto.comodos.forEach(comodo => {
            const potenciaIluminacao = calcularPotenciaIluminacao(comodo.area);
            relatorio.totalPotenciaIluminacaoVA += potenciaIluminacao;

            const numTUGs = calcularNumeroTUGs(comodo.perimetro, comodo.tipo);
            const potenciaTUGs = calcularPotenciaTotalTUGs(numTUGs);
            relatorio.totalPotenciaTUGsVA += potenciaTUGs;

            // Circuito para iluminação do cômodo
            if (potenciaIluminacao > 0) {
                const circuitoIluminacao = {
                    nome: `Iluminação - ${comodo.nome}`,
                    tipo: 'Iluminação',
                    potenciaVA: potenciaIluminacao,
                    correnteA: potenciaIluminacao / projeto.tensaoPrincipal,
                    numTomadas: 0,
                    numLuzes: Math.max(1, Math.ceil(potenciaIluminacao / 60)), // Estimativa de luzes
                    numInterruptores: Math.max(1, Math.ceil(Math.min(2, Math.ceil(potenciaIluminacao / 60)) / 2)), // Pelo menos 1 interruptor, ou 1 para cada 2 pontos
                    bitolaFio: null,
                    disjuntorRecomendadoA: null,
                    eletrodutoMm: null,
                    quedaTensaoPercentual: 0,
                    observacoes: []
                };
                circuitoIluminacao.bitolaFio = obterBitolaFio(circuitoIluminacao.correnteA, 2);
                circuitoIluminacao.bitolaFio = circuitoIluminacao.bitolaFio || 1.5; // Mínimo de 1.5mm² para iluminação
                circuitoIluminacao.disjuntorRecomendadoA = Math.max(10, Math.ceil(circuitoIluminacao.correnteA / 5) * 5); // Mínimo 10A, arredonda para 5
                circuitoIluminacao.eletrodutoMm = obterEletroduto(2, circuitoIluminacao.bitolaFio);
                circuitoIluminacao.quedaTensaoPercentual = calcularQuedaTensao(circuitoIluminacao.correnteA, COMPRIMENTO_CIRCUITO_PADRAO_ILUMINACAO, circuitoIluminacao.bitolaFio, projeto.tensaoPrincipal, projeto.tipoFornecimento);
                relatorio.circuitos.push(circuitoIluminacao);
                numCircuitos++;
            }

            // Circuito para TUGs do cômodo
            if (numTUGs > 0) {
                const circuitoTUGs = {
                    nome: `TUGs - ${comodo.nome}`,
                    tipo: 'Tomadas de Uso Geral (TUG)',
                    potenciaVA: potenciaTUGs,
                    correnteA: potenciaTUGs / projeto.tensaoPrincipal,
                    numTomadas: numTUGs,
                    numLuzes: 0,
                    numInterruptores: 0,
                    bitolaFio: null,
                    disjuntorRecomendadoA: null,
                    eletrodutoMm: null,
                    quedaTensaoPercentual: 0,
                    observacoes: []
                };
                circuitoTUGs.bitolaFio = obterBitolaFio(circuitoTUGs.correnteA, 2);
                circuitoTUGs.bitolaFio = circuitoTUGs.bitolaFio || 2.5; // Mínimo de 2.5mm² para TUGs
                circuitoTUGs.disjuntorRecomendadoA = Math.max(20, Math.ceil(circuitoTUGs.correnteA / 5) * 5); // Mínimo 20A, arredonda para 5
                circuitoTUGs.eletrodutoMm = obterEletroduto(2, circuitoTUGs.bitolaFio);
                circuitoTUGs.quedaTensaoPercentual = calcularQuedaTensao(circuitoTUGs.correnteA, COMPRIMENTO_CIRCUITO_PADRAO_TUG, circuitoTUGs.bitolaFio, projeto.tensaoPrincipal, projeto.tipoFornecimento);
                relatorio.circuitos.push(circuitoTUGs);
                numCircuitos++;
            }

            // Circuitos para TUEs
            if (comodo.tue && comodo.tue.length > 0) {
                comodo.tue.forEach(tue => {
                    relatorio.totalPotenciaTUEsVA += tue.potencia;
                    const circuitoTUE = {
                        nome: `TUE - ${tue.nome} (${comodo.nome})`,
                        tipo: 'Tomada de Uso Específico (TUE)',
                        potenciaVA: tue.potencia,
                        correnteA: tue.potencia / projeto.tensaoPrincipal,
                        numTomadas: 1,
                        numLuzes: 0,
                        numInterruptores: 0,
                        bitolaFio: null,
                        disjuntorRecomendadoA: null,
                        eletrodutoMm: null,
                        quedaTensaoPercentual: 0,
                        observacoes: ['Circuito dedicado para este equipamento.']
                    };
                    circuitoTUE.bitolaFio = obterBitolaFio(circuitoTUE.correnteA, 2); // Assumindo 2 condutores para TUEs
                    circuitoTUE.bitolaFio = circuitoTUE.bitolaFio || 2.5; // Mínimo de 2.5mm² para TUEs
                    circuitoTUE.disjuntorRecomendadoA = Math.max(20, Math.ceil(circuitoTUE.correnteA / 5) * 5); // Mínimo 20A, arredonda para 5
                    circuitoTUE.eletrodutoMm = obterEletroduto(2, circuitoTUE.bitolaFio);
                    circuitoTUE.quedaTensaoPercentual = calcularQuedaTensao(circuitoTUE.correnteA, COMPRIMENTO_CIRCUITO_PADRAO_TUE, circuitoTUE.bitolaFio, projeto.tensaoPrincipal, projeto.tipoFornecimento);
                    relatorio.circuitos.push(circuitoTUE);
                    numCircuitos++;
                });
            }
        });

        // Cálculo da demanda total (simplificado para exemplo)
        relatorio.demandaTotalVA = (relatorio.totalPotenciaIluminacaoVA * FATOR_DEMANDA_ILUMINACAO_TUG) +
                                   (relatorio.totalPotenciaTUGsVA * FATOR_DEMANDA_ILUMINACAO_TUG) +
                                   (relatorio.totalPotenciaTUEsVA * FATOR_DEMANDA_TUE);

        relatorio.correnteTotalA = relatorio.demandaTotalVA / projeto.tensaoPrincipal;

        // Determinação do tipo de sistema necessário (monofásico/bifásico/trifásico)
        // Regra simplificada baseada na NBR 5410, se a demanda ultrapassa certos limites.
        // Estes limites podem variar por concessionária e são aproximados.
        let tipoSistemaRecomendado = 'Monofásico';
        let numCondutoresPrincipal = 2; // Fase e Neutro

        if (projeto.tensaoPrincipal === 127 || projeto.tensaoPrincipal === 110) {
            if (relatorio.demandaTotalVA > 6000) { // Exemplo de limite para monofásico 127V
                tipoSistemaRecomendado = 'Bifásico'; // Geralmente 2 Fases + Neutro
                numCondutoresPrincipal = 3;
            }
            if (relatorio.demandaTotalVA > 12000) { // Exemplo de limite para bifásico 127V
                tipoSistemaRecomendado = 'Trifásico'; // 3 Fases + Neutro
                numCondutoresPrincipal = 4;
            }
        } else if (projeto.tensaoPrincipal === 220 || projeto.tensaoPrincipal === 380) { // Considerando que 220V pode ser Fase+Fase ou Fase+Neutro
            if (relatorio.demandaTotalVA > 12000) { // Exemplo de limite para monofásico/bifásico 220V
                tipoSistemaRecomendado = 'Trifásico'; // 3 Fases + Neutro
                numCondutoresPrincipal = 4;
            } else if (relatorio.demandaTotalVA > 8000 && projeto.tensaoPrincipal === 220) {
                tipoSistemaRecomendado = 'Bifásico'; // Geralmente 2 Fases + Neutro
                numCondutoresPrincipal = 3;
            }
        }
        relatorio.tipoSistemaNecessario = tipoSistemaRecomendado;
        relatorio.recomendacoesFioGeral.numCondutores = numCondutoresPrincipal;

        // Bitola do fio geral para a entrada
        const bitolaFioGeral = obterBitolaFio(relatorio.correnteTotalA, relatorio.recomendacoesFioGeral.numCondutores);
        relatorio.recomendacoesFioGeral.bitolaMm2 = bitolaFioGeral || 6; // Mínimo de 6mm² para entrada, ou 10mm² dependendo da norma da concessionária
        relatorio.recomendacoesFioGeral.tipoFio = 'Cabo de Cobre PVC 70°C';
        relatorio.recomendacoesFioGeral.observacao = `Para o alimentador principal da residência. Consulte a concessionária local para bitola mínima do ramal de entrada.`;

        // Eletroduto para a entrada
        const eletrodutoGeral = obterEletroduto(relatorio.recomendacoesFioGeral.numCondutores, relatorio.recomendacoesFioGeral.bitolaMm2);
        relatorio.recomendacoesEletrodutoGeral.diametroMm = eletrodutoGeral;
        relatorio.recomendacoesEletrodutoGeral.tipo = 'PVC Rígido ou Flexível (corrugado)';
        relatorio.recomendacoesEletrodutoGeral.observacao = `Para o alimentador principal. Verifique o fator de ocupação (máx. 40%).`;


        // Contabiliza disjuntores por valor
        relatorio.circuitos.forEach(circuito => {
            if (circuito.disjuntorRecomendadoA) {
                const disjuntor = `${circuito.disjuntorRecomendadoA}A`;
                relatorio.disjuntoresRecomendados[disjuntor] = (relatorio.disjuntoresRecomendados[disjuntor] || 0) + 1;
            }
        });
        relatorio.numCircuitos = numCircuitos;

        // --- Automação ---
        // Sugestões baseadas na presença de cômodos específicos ou número de circuitos.
        if (projeto.comodos.some(c => c.tipo === 'sala' || c.tipo === 'quarto')) {
            relatorio.automacaoRecomendada.iluminacaoInteligente = true;
            relatorio.automacaoRecomendada.observacoes.push('Iluminação inteligente (dimmers, controle por app/voz) é recomendada para salas e quartos para conforto e economia de energia.');
        }
        if (projeto.comodos.some(c => c.tipo === 'sala' || (c.tue && c.tue.some(t => t.nome.toLowerCase().includes('ar condicionado'))))) {
            relatorio.automacaoRecomendada.controleTemperatura = true;
            relatorio.automacaoRecomendada.observacoes.push('Controle inteligente de temperatura (termostatos Wi-Fi) pode otimizar o uso de ar condicionado e climatização.');
        }
        if (numCircuitos > 5 || projeto.comodos.length > 3) { // Se há muitos circuitos ou cômodos, a casa se beneficia de mais automação
            relatorio.automacaoRecomendada.seguranca = true;
            relatorio.automacaoRecomendada.observacoes.push('Sistemas de segurança (câmeras, sensores de porta/janela, alarmes) podem ser integrados para maior proteção.');
        }
        if (projeto.comodos.some(c => c.tipo === 'sala' || c.nome.toLowerCase().includes('home theater'))) {
            relatorio.automacaoRecomendada.audioVideo = true;
            relatorio.automacaoRecomendada.observacoes.push('Automação de áudio e vídeo (controle centralizado de TVs, soundbars, projetores) para uma experiência de entretenimento imersiva.');
        }
        if (relatorio.automacaoRecomendada.iluminacaoInteligente || relatorio.automacaoRecomendada.controleTemperatura || relatorio.automacaoRecomendada.seguranca || relatorio.automacaoRecomendada.audioVideo) {
            relatorio.automacaoRecomendada.integracaoVoz = true;
            relatorio.automacaoRecomendada.observacoes.push('Integração com assistentes de voz (Alexa, Google Assistant) para controle de diversos sistemas da casa.');
        }

        return relatorio;
    }
};

// --- Funções para Interação com a Página (script.js) ---

document.addEventListener('DOMContentLoaded', () => {
    // Implementação das tabs de normas
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
                content.setAttribute('aria-hidden', 'true');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.setAttribute('aria-selected', 'false');
            });
            document.getElementById(tabId).style.display = 'block';
            document.getElementById(tabId).setAttribute('aria-hidden', 'false');
            button.setAttribute('aria-selected', 'true');
        });
    });
    // Ativar a primeira tab por padrão
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    // Lógica para o menu toggle em dispositivos menores
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active'); // Usa 'active' para controlar a visibilidade
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Gerar campos de cômodos iniciais
    gerarCamposComodos();
});

// Funções para gerenciamento dinâmico de campos de cômodos e TUEs
function gerarCamposComodos() {
    const numComodos = parseInt(document.getElementById('numComodos').value);
    const container = document.getElementById('containerComodos');
    container.innerHTML = ''; // Limpa os campos existentes

    for (let i = 0; i < numComodos; i++) {
        const comodoDiv = document.createElement('div');
        comodoDiv.classList.add('comodo-item');
        comodoDiv.innerHTML = `
            <h4>Cômodo ${i + 1}</h4>
            <label for="nomeComodo_${i}">Nome do Cômodo (Ex: Sala, Cozinha):</label>
            <input type="text" id="nomeComodo_${i}" value="${i === 0 ? 'Sala' : `Cômodo ${i+1}`}" required>

            <label for="tipoComodo_${i}">Tipo de Cômodo:</label>
            <select id="tipoComodo_${i}" required>
                <option value="sala" ${i === 0 ? 'selected' : ''}>Sala</option>
                <option value="quarto">Quarto</option>
                <option value="cozinha">Cozinha</option>
                <option value="banheiro">Banheiro</option>
                <option value="areaServico">Área de Serviço</option>
                <option value="circulacao">Corredor/Hall</option>
                <option value="garagem">Garagem</option>
                <option value="outro">Outro</option>
            </select>

            <label for="areaComodo_${i}">Área (m²):</label>
            <input type="number" id="areaComodo_${i}" min="1" step="0.1" value="15" required>

            <label for="perimetroComodo_${i}">Perímetro (m):</label>
            <input type="number" id="perimetroComodo_${i}" min="1" step="0.1" value="15" required>

            <div class="tue-container">
                <h5>Tomadas de Uso Específico (TUEs) neste cômodo:</h5>
                <button type="button" class="add-tue-btn" onclick="addTUEField(${i})">+ Adicionar TUE</button>
                <div id="tueFields_${i}">
                    </div>
            </div>
            ${numComodos > 1 ? `<button type="button" class="remove-comodo-btn" onclick="removeComodoField(${i})">Remover Cômodo</button>` : ''}
        `;
        container.appendChild(comodoDiv);
    }
}

function addTUEField(comodoIndex) {
    const tueContainer = document.getElementById(`tueFields_${comodoIndex}`);
    const tueIndex = tueContainer.children.length; // Número de TUEs já existentes para este cômodo

    const tueDiv = document.createElement('div');
    tueDiv.classList.add('tue-item');
    tueDiv.innerHTML = `
        <label for="tueNome_${comodoIndex}_${tueIndex}">Nome da TUE (Ex: Chuveiro, Ar Condicionado):</label>
        <input type="text" id="tueNome_${comodoIndex}_${tueIndex}" value="" required>

        <label for="tuePotencia_${comodoIndex}_${tueIndex}">Potência da TUE (W):</label>
        <input type="number" id="tuePotencia_${comodoIndex}_${tueIndex}" min="${POTENCIA_TUE_MINIMA}" step="100" value="2000" required>
        <button type="button" class="remove-tue-btn" onclick="removeTUEField(${comodoIndex}, ${tueIndex})">Remover TUE</button>
    `;
    tueContainer.appendChild(tueDiv);
}

function removeTUEField(comodoIndex, tueIndexToRemove) {
    const tueContainer = document.getElementById(`tueFields_${comodoIndex}`);
    const tueToRemove = tueContainer.children[tueIndexToRemove];
    if (tueToRemove) {
        tueContainer.removeChild(tueToRemove);
        // Reindexar IDs dos campos restantes para evitar problemas
        for (let i = tueIndexToRemove; i < tueContainer.children.length; i++) {
            const currentTUE = tueContainer.children[i];
            currentTUE.querySelector(`[id^="tueNome_"]`).id = `tueNome_${comodoIndex}_${i}`;
            currentTUE.querySelector(`[id^="tuePotencia_"]`).id = `tuePotencia_${comodoIndex}_${i}`;
            currentTUE.querySelector('.remove-tue-btn').setAttribute('onclick', `removeTUEField(${comodoIndex}, ${i})`);
        }
    }
}

function removeComodoField(comodoIndexToRemove) {
    const numComodosInput = document.getElementById('numComodos');
    let currentNumComodos = parseInt(numComodosInput.value);

    if (currentNumComodos > 1) {
        const container = document.getElementById('containerComodos');
        const comodoToRemove = container.children[comodoIndexToRemove];
        if (comodoToRemove) {
            container.removeChild(comodoToRemove);
            numComodosInput.value = currentNumComodos - 1; // Decrementa o contador de cômodos

            // Reindexar IDs e atributos para os cômodos restantes
            for (let i = comodoIndexToRemove; i < container.children.length; i++) {
                const currentComodoDiv = container.children[i];
                currentComodoDiv.querySelector('h4').textContent = `Cômodo ${i + 1}`;
                currentComodoDiv.querySelector(`[id^="nomeComodo_"]`).id = `nomeComodo_${i}`;
                currentComodoDiv.querySelector(`[id^="tipoComodo_"]`).id = `tipoComodo_${i}`;
                currentComodoDiv.querySelector(`[id^="areaComodo_"]`).id = `areaComodo_${i}`;
                currentComodoDiv.querySelector(`[id^="perimetroComodo_"]`).id = `perimetroComodo_${i}`;
                currentComodoDiv.querySelector(`.add-tue-btn`).setAttribute('onclick', `addTUEField(${i})`);
                currentComodoDiv.querySelector(`[id^="tueFields_"]`).id = `tueFields_${i}`;

                // Reindexar os botões de remoção de cômodo
                const removeBtn = currentComodoDiv.querySelector('.remove-comodo-btn');
                if (removeBtn) {
                    removeBtn.setAttribute('onclick', `removeComodoField(${i})`);
                }

                // E reindexar as TUEs dentro do cômodo (se existirem)
                const tueFieldsContainer = document.getElementById(`tueFields_${i}`);
                if (tueFieldsContainer) {
                    for (let j = 0; j < tueFieldsContainer.children.length; j++) {
                        const currentTUE = tueFieldsContainer.children[j];
                        currentTUE.querySelector(`[id^="tueNome_"]`).id = `tueNome_${i}_${j}`;
                        currentTUE.querySelector(`[id^="tuePotencia_"]`).id = `tuePotencia_${i}_${j}`;
                        currentTUE.querySelector('.remove-tue-btn').setAttribute('onclick', `removeTUEField(${i}, ${j})`);
                    }
                }
            }
        }
    }
}


// Função principal para acionar o cálculo do projeto completo
function calcularDimensionamentoCompleto() {
    const tensaoPrincipalProjeto = parseFloat(document.getElementById('tensaoPrincipalProjeto').value);
    const numComodos = parseInt(document.getElementById('numComodos').value);
    const resultadoDiv = document.getElementById('resultadoCompleto');

    if (isNaN(tensaoPrincipalProjeto) || tensaoPrincipalProjeto <= 0 || isNaN(numComodos) || numComodos < 1) {
        resultadoDiv.innerHTML = '<p class="error">Por favor, preencha a tensão principal e o número de cômodos corretamente.</p>';
        return;
    }

    const comodos = [];
    let isValid = true;

    for (let i = 0; i < numComodos; i++) {
        const nomeComodo = document.getElementById(`nomeComodo_${i}`).value;
        const tipoComodo = document.getElementById(`tipoComodo_${i}`).value;
        const areaComodo = parseFloat(document.getElementById(`areaComodo_${i}`).value);
        const perimetroComodo = parseFloat(document.getElementById(`perimetroComodo_${i}`).value);

        if (!nomeComodo || isNaN(areaComodo) || areaComodo <= 0 || isNaN(perimetroComodo) || perimetroComodo <= 0) {
            resultadoDiv.innerHTML = `<p class="error">Por favor, preencha todos os campos do Cômodo ${i + 1} corretamente.</p>`;
            isValid = false;
            break;
        }

        const tues = [];
        const tueContainer = document.getElementById(`tueFields_${i}`);
        if (tueContainer) {
            for (let j = 0; j < tueContainer.children.length; j++) {
                const tueNome = document.getElementById(`tueNome_${i}_${j}`).value;
                const tuePotencia = parseFloat(document.getElementById(`tuePotencia_${i}_${j}`).value);

                if (!tueNome || isNaN(tuePotencia) || tuePotencia < POTENCIA_TUE_MINIMA) {
                    resultadoDiv.innerHTML = `<p class="error">Por favor, preencha todos os campos da TUE ${j + 1} no Cômodo ${i + 1} corretamente (potência mínima de ${POTENCIA_TUE_MINIMA}W).</p>`;
                    isValid = false;
                    break;
                }
                tues.push({ nome: tueNome, potencia: tuePotencia });
            }
        }
        if (!isValid) break;

        comodos.push({
            nome: nomeComodo,
            tipo: tipoComodo,
            area: areaComodo,
            perimetro: perimetroComodo,
            tue: tues
        });
    }

    if (!isValid) return;

    const projetoConfig = {
        comodos: comodos,
        tensaoPrincipal: tensaoPrincipalProjeto,
        tipoFornecimento: 'monofasico', // O algoritmo irá ajustar isso dinamicamente
        tipoInstalacaoFio: 'embutido' // Por enquanto fixo, poderia ser um input
    };

    const resultadoDimensionamento = DimensionadorEletrico.dimensionar(projetoConfig);

    resultadoDiv.innerHTML = formatarResultado(resultadoDimensionamento);
}

/**
 * Formata o objeto de resultado em HTML legível.
 * @param {Object} resultado - O objeto de resultado do dimensionamento.
 * @returns {string} HTML formatado.
 */
function formatarResultado(resultado) {
    let html = `
        <h3>Resumo do Dimensionamento</h3>
        <p><strong>Tensão Principal da Instalação:</strong> ${resultado.tensaoPrincipal} V</p>
        <p><strong>Tipo de Sistema Recomendado:</strong> ${resultado.tipoSistemaNecessario}</p>
        <p><strong>Potência Total de Iluminação (VA):</strong> ${resultado.totalPotenciaIluminacaoVA.toFixed(2)} VA</p>
        <p><strong>Potência Total de TUGs (VA):</strong> ${resultado.totalPotenciaTUGsVA.toFixed(2)} VA</p>
        <p><strong>Potência Total de TUEs (VA):</strong> ${resultado.totalPotenciaTUEsVA.toFixed(2)} VA</p>
        <p><strong>Demanda Total Estimada (VA):</strong> ${resultado.demandaTotalVA.toFixed(2)} VA</p>
        <p><strong>Corrente Total Estimada (A):</strong> ${resultado.correnteTotalA.toFixed(2)} A</p>
        <p><strong>Número Total de Circuitos:</strong> ${resultado.numCircuitos}</p>

        <h4>Recomendações para o Alimentador Principal</h4>
        <ul>
            <li><strong>Bitola do Fio:</strong> ${resultado.recomendacoesFioGeral.bitolaMm2} mm²</li>
            <li><strong>Tipo de Fio:</strong> ${resultado.recomendacoesFioGeral.tipoFio}</li>
            <li><strong>Número de Condutores:</strong> ${resultado.recomendacoesFioGeral.numCondutores}</li>
            <li><strong>Eletroduto Recomendado:</strong> ${resultado.recomendacoesEletrodutoGeral.diametroMm} mm (${resultado.recomendacoesEletrodutoGeral.tipo})</li>
            <li><em>Observação: ${resultado.recomendacoesFioGeral.observacao}</em></li>
        </ul>

        <h4>Circuitos Detalhados</h4>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 1rem;">
        ${resultado.circuitos.map(circuito => `
            <details class="circuit-details">
                <summary><strong>${circuito.nome}</strong> (${circuito.tipo})</summary>
                <ul>
                    <li>Potência: ${circuito.potenciaVA.toFixed(2)} VA</li>
                    <li>Corrente: ${circuito.correnteA.toFixed(2)} A</li>
                    <li>Tomadas: ${circuito.numTomadas}</li>
                    <li>Luzes: ${circuito.numLuzes}</li>
                    <li>Interruptores: ${circuito.numInterruptores}</li>
                    <li>Bitola do Fio: ${circuito.bitolaFio} mm²</li>
                    <li>Disjuntor Recomendado: ${circuito.disjuntorRecomendadoA} A</li>
                    <li>Eletroduto: ${circuito.eletrodutoMm} mm</li>
                    <li>Queda de Tensão: ${circuito.quedaTensaoPercentual.toFixed(2)} % ${circuito.quedaTensaoPercentual > 3 ? '<span style="color: red; font-weight: bold;">(ATENÇÃO: Queda de tensão elevada, verificar!)</span>' : ''}</li>
                    ${circuito.observacoes.length > 0 ? `<li>Observações: ${circuito.observacoes.join(', ')}</li>` : ''}
                </ul>
            </details>
        `).join('')}
        </div>

        <h4>Disjuntores Recomendados (Total)</h4>
        <ul>
            ${Object.entries(resultado.disjuntoresRecomendados).map(([disjuntor, quantidade]) => `
                <li>${quantidade} x ${disjuntor}</li>
            `).join('')}
        </ul>

        <h3>Recomendações de Automação</h3>
        <ul>
            ${resultado.automacaoRecomendada.iluminacaoInteligente ? '<li>Iluminação Inteligente</li>' : ''}
            ${resultado.automacaoRecomendada.controleTemperatura ? '<li>Controle Inteligente de Temperatura</li>' : ''}
            ${resultado.automacaoRecomendada.seguranca ? '<li>Sistemas de Segurança Integrados</li>' : ''}
            ${resultado.automacaoRecomendada.audioVideo ? '<li>Automação de Áudio e Vídeo</li>' : ''}
            ${resultado.automacaoRecomendada.integracaoVoz ? '<li>Integração com Assistentes de Voz</li>' : ''}
        </ul>
        ${resultado.automacaoRecomendada.observacoes.length > 0 ? `
            <h4>Considerações sobre Automação:</h4>
            <ul>
                ${resultado.automacaoRecomendada.observacoes.map(obs => `<li>${obs}</li>`).join('')}
            </ul>
        ` : ''}
    `;
    return html;
}

// Funções da calculadora original (manter se ainda forem úteis)
function calcularDimensionamento() {
    const potencia = parseFloat(document.getElementById('potencia').value);
    const tensao = parseFloat(document.getElementById('tensao').value);
    const comprimento = parseFloat(document.getElementById('comprimento').value);
    const sistema = document.getElementById('sistema').value;
    const resultadoDiv = document.getElementById('resultado');
    const potenciaError = document.getElementById('potencia-error');

    if (isNaN(potencia) || isNaN(tensao) || isNaN(comprimento) || potencia <= 0 || tensao <= 0 || comprimento <= 0) {
        potenciaError.textContent = 'Por favor, insira valores válidos e maiores que zero para todos os campos.';
        resultadoDiv.innerHTML = '';
        return;
    } else {
        potenciaError.textContent = '';
    }

    const corrente = potencia / tensao;
    let numCondutores = (sistema === 'monofasico') ? 2 : 3; // Simplificado

    const bitola = obterBitolaFio(corrente, numCondutores);
    if (!bitola) {
        resultadoDiv.innerHTML = `<p>Não foi possível encontrar uma bitola de fio adequada para a corrente de ${corrente.toFixed(2)}A com ${numCondutores} condutores.</p>`;
        return;
    }

    const quedaTensao = calcularQuedaTensao(corrente, comprimento, bitola, tensao, sistema);

    resultadoDiv.innerHTML = `
        <p>Corrente calculada: <strong>${corrente.toFixed(2)} A</strong></p>
        <p>Bitola do cabo recomendada: <strong>${bitola} mm²</strong></p>
        <p>Queda de tensão: <strong>${quedaTensao.toFixed(2)} %</strong> ${quedaTensao > 3 ? '<span style="color: red;">(Acima do recomendado pela NBR 5410 que é de 3% para circuitos terminais!)</span>' : ''}</p>
        <p>Disjuntor recomendado: <strong>${Math.ceil(corrente / 5) * 5} A</strong> (arredondado para o próximo múltiplo de 5)</p>
    `;
}

function resetForm() {
    document.getElementById('potencia').value = '';
    document.getElementById('tensao').value = '220';
    document.getElementById('comprimento').value = '';
    document.getElementById('sistema').value = 'monofasico';
    document.getElementById('resultado').innerHTML = '';
    document.getElementById('potencia-error').textContent = '';
}

function resetProjetoCompletoForm() {
    document.getElementById('tensaoPrincipalProjeto').value = '220';
    document.getElementById('numComodos').value = '1';
    document.getElementById('resultadoCompleto').innerHTML = '';
    gerarCamposComodos(); // Regenera o campo de cômodo inicial
}

function updateRosetaLabels() {
    const tipoCalculo = document.getElementById('tipoCalculo').value;
    const label1 = document.getElementById('labelValor1');
    const label2 = document.getElementById('labelValor2');

    switch (tipoCalculo) {
        case 'corrente':
            label1.textContent = 'Potência (W):';
            label2.textContent = 'Tensão (V):';
            break;
        case 'potencia':
            label1.textContent = 'Corrente (A):';
            label2.textContent = 'Tensão (V):';
            break;
        case 'secao':
            label1.textContent = 'Corrente (A):';
            label2.textContent = 'Comprimento (m):';
            break;
        case 'queda':
            label1.textContent = 'Corrente (A):';
            label2.textContent = 'Seção do Cabo (mm²):';
            break;
    }
}

function calcularRoseta() {
    const tipoCalculo = document.getElementById('tipoCalculo').value;
    const input1 = parseFloat(document.getElementById('rosetaInput1').value);
    const input2 = parseFloat(document.getElementById('rosetaInput2').value);
    const resultadoRosetaDiv = document.getElementById('resultadoRoseta');

    if (isNaN(input1) || isNaN(input2) || input1 <= 0 || input2 <= 0) {
        resultadoRosetaDiv.innerHTML = '<p style="color: red;">Por favor, insira valores numéricos válidos e maiores que zero.</p>';
        return;
    }

    let resultado = '';
    switch (tipoCalculo) {
        case 'corrente':
            resultado = `Corrente: ${(input1 / input2).toFixed(2)} A`;
            break;
        case 'potencia':
            resultado = `Potência: ${(input1 * input2).toFixed(2)} W`;
            break;
        case 'secao':
            // Este cálculo é mais complexo, exigiria tensão e tipo de sistema para ser preciso
            // ou uma tabela inversa da ampacidade. Aqui é uma simplificação.
            const correnteParaSecao = input1;
            const comprimentoParaSecao = input2;
            const tensaoRoseta = 220; // Assumindo uma tensão padrão para este cálculo simplificado
            const sistemaRoseta = 'monofasico'; // Assumindo sistema monofásico
            const secaoCalculada = obterBitolaFio(correnteParaSecao, 2); // Exemplo com 2 condutores

            if (secaoCalculada) {
                const queda = calcularQuedaTensao(correnteParaSecao, comprimentoParaSecao, secaoCalculada, tensaoRoseta, sistemaRoseta);
                resultado = `Seção do Cabo: ${secaoCalculada} mm² (Queda: ${queda.toFixed(2)}%)`;
            } else {
                resultado = `Não foi possível determinar a seção do cabo para esta corrente.`;
            }
            break;
        case 'queda':
            const correnteParaQueda = input1;
            const secaoCaboParaQueda = input2;
            const comprimentoQueda = 15; // Exemplo de comprimento para cálculo de queda
            const tensaoQueda = 220; // Exemplo de tensão
            const sistemaQueda = 'monofasico'; // Exemplo de sistema
            const quedaCalculada = calcularQuedaTensao(correnteParaQueda, comprimentoQueda, secaoCaboParaQueda, tensaoQueda, sistemaQueda);
            resultado = `Queda de Tensão: ${quedaCalculada.toFixed(2)} %`;
            break;
    }
    resultadoRosetaDiv.innerHTML = `<p><strong>${resultado}</strong></p>`;
}
