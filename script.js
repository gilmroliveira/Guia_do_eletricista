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
// Estes fatores podem variar significativamente com base na concessionária e tipo de carga.
const FATOR_DEMANDA_ILUMINACAO_TUG = 0.8;
const FATOR_DEMANDA_TUE = 1; // Para TUEs, geralmente 100% da potência

// Tabela de ampacidade de cabos (NBR 5410 - Método de referência B1 - Condutores isolados em eletroduto de seção circular embutido em parede)
// Formato: { bitola_mm2: { num_condutores_carregados: ampacidade_A } }
// Os números de condutores carregados são '2' (Fase-Neutro ou Fase-Fase) ou '3' (Trifásico ou Bifásico com Neutro)
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
    150.0: { '2': 267, '3': 231 }, // Adicionado mais alguns tamanhos comuns
    185.0: { '2': 304, '3': 264 },
    240.0: { '2': 358, '3': 310 },
    300.0: { '2': 409, '3': 354 },
};

// Resistividade do cobre (em Ω·mm²/m) para cálculo de queda de tensão (para 70°C, conforme NBR 5410)
const RESISTIVIDADE_COBRE = 0.0172;

// Mapa de bitolas de eletroduto por número e bitola de condutores (exemplo simplificado, base NBR 5410)
// Diâmetros internos mínimos em mm. Os valores são estimativas e podem variar com o fabricante.
// Eletrodutos devem ter no máximo 40% de ocupação para até 3 condutores.
// Refere-se ao diâmetro nominal do eletroduto, que é o diâmetro externo, mas representa a capacidade.
const TABELA_ELETRODUTO = {
    '2': { // Para 2 condutores carregados (Fase + Neutro ou Fase + Fase)
        1.5: 20, // (3/4") - pode ser 15.8 (1/2") dependendo da ocupação
        2.5: 20,
        4.0: 20,
        6.0: 25, // (1")
        10.0: 25,
        16.0: 32, // (1 1/4")
        25.0: 32,
        35.0: 40, // (1 1/2")
        50.0: 40,
        70.0: 50, // (2")
        95.0: 50,
        120.0: 60, // (2 1/2")
    },
    '3': { // Para 3 condutores carregados (3 Fases, ou 2 Fases + Neutro)
        1.5: 20,
        2.5: 25,
        4.0: 25,
        6.0: 32,
        10.0: 32,
        16.0: 40,
        25.0: 40,
        35.0: 50,
        50.0: 50,
        70.0: 60,
        95.0: 60,
        120.0: 75, // (3")
    },
    '4': { // Para 4 condutores carregados (3 Fases + Neutro, para sistemas trifásicos)
        1.5: 25,
        2.5: 32,
        4.0: 32,
        6.0: 40,
        10.0: 40,
        16.0: 50,
        25.0: 50,
        35.0: 60,
        50.0: 60,
        70.0: 75,
        95.0: 75,
        120.0: 85, // (3 1/2")
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
    // Para cozinhas, copas, copas-cozinhas, áreas de serviço, lavanderias e locais análogos:
    // Uma tomada para cada 3,5m ou fração de perímetro, com um mínimo de 3 tomadas,
    // exceto em banheiros, onde o mínimo é 1.
    const perimetroArredondado = Math.ceil(perimetro); // Arredonda para cima para garantir o mínimo
    if (['cozinha', 'areaServico', 'lavanderia', 'copa', 'copa-cozinha'].includes(tipoComodo)) {
        let numTugs = Math.ceil(perimetroArredondado / 3.5);
        return Math.max(numTugs, 3); // Mínimo de 3 TUGs para essas áreas
    } else if (tipoComodo === 'banheiro') {
        return 1; // Mínimo de 1 TUG para banheiro
    } else {
        // Demais cômodos: 1 TUG a cada 5m ou fração de perímetro. Mínimo de 1.
        let numTugs = Math.ceil(perimetroArredondado / 5);
        return Math.max(numTugs, 1);
    }
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
 * Retorna a bitola do fio com base na corrente e no número de condutores carregados.
 * @param {number} corrente - Corrente em Ampères.
 * @param {number} numCondutoresCarregados - Número de condutores carregados (2, 3 ou 4 para trifásico com neutro).
 * @returns {number | null} Bitola do fio em mm² ou null se não encontrada.
 */
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

/**
 * Calcula a queda de tensão percentual.
 * @param {number} corrente - Corrente em Ampères.
 * @param {number} comprimento - Comprimento do circuito em metros.
 * @param {number} secaoCabo - Seção do cabo em mm².
 * @param {number} tensao - Tensão nominal do sistema em Volts.
 * @param {string} tipoSistema - 'monofasico', 'bifasico' ou 'trifasico'.
 * @returns {number} Queda de tensão em percentual.
 */
function calcularQuedaTensao(corrente, comprimento, secaoCabo, tensao, tipoSistema) {
    if (secaoCabo <= 0 || tensao <= 0) return Infinity; // Evita divisão por zero ou negativos

    let fatorK; // Fator de correção para queda de tensão
    // K = 2 para sistemas monofásicos (Fase-Neutro ou Fase-Fase)
    // K = sqrt(3) para sistemas trifásicos (3 ou 4 condutores)
    if (tipoSistema === 'monofasico' || tipoSistema === 'bifasico') {
        fatorK = 2; // Para sistemas fase-neutro ou fase-fase (bifásico)
    } else if (tipoSistema === 'trifasico') {
        fatorK = Math.sqrt(3);
    } else {
        return Infinity; // Tipo de sistema desconhecido
    }

    // Cálculo da resistência do cabo (R = ρ * L / A)
    const resistenciaCabo = RESISTIVIDADE_COBRE * comprimento / secaoCabo;

    // Queda de tensão em Volts (ΔV = K * I * R)
    const quedaVolts = fatorK * corrente * resistenciaCabo;

    // Queda de tensão percentual (ΔV%)
    return (quedaVolts / tensao) * 100;
}


/**
 * Retorna o diâmetro do eletroduto recomendado com base nos condutores.
 * @param {number} numCondutoresCarregados - Número de condutores carregados.
 * @param {number} bitolaFio - Bitola do fio em mm².
 * @returns {number | null} Diâmetro do eletroduto em mm, ou null se não encontrado.
 */
function obterEletroduto(numCondutoresCarregados, bitolaFio) {
    const condutorKey = numCondutoresCarregados.toString();
    if (TABELA_ELETRODUTO[condutorKey]) {
        // Encontra a maior bitola de fio na tabela que seja menor ou igual à bitola fornecida
        const bitolasEletrodutoDisponiveis = Object.keys(TABELA_ELETRODUTO[condutorKey]).map(Number).sort((a, b) => a - b);
        let eletrodutoIdeal = null;
        for (let b of bitolasEletrodutoDisponiveis) {
            if (bitolaFio <= b) {
                eletrodutoIdeal = TABELA_ELETRODUTO[condutorKey][b];
                break;
            }
        }
        // Se a bitola for maior que as tabeladas, retorna a maior disponível
        if (!eletrodutoIdeal && bitolasEletrodutoDisponiveis.length > 0) {
            eletrodutoIdeal = TABELA_ELETRODUTO[condutorKey][bitolasEletrodutoDisponiveis[bitolasEletrodutoDisponiveis.length - 1]];
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
     * @returns {Object} Relatório detalhado do dimensionamento.
     */
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
            disjuntoresRecomendados: {}, // Contagem de disjuntores por valor
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

        const COMPRIMENTO_CIRCUITO_PADRAO_ILUMINACAO = 10; // m
        const COMPRIMENTO_CIRCUITO_PADRAO_TUG = 15; // m
        const COMPRIMENTO_CIRCUITO_PADRAO_TUE = 20; // m

        projeto.comodos.forEach(comodo => {
            const potenciaIluminacao = calcularPotenciaIluminacao(comodo.area);
            relatorio.totalPotenciaIluminacaoVA += potenciaIluminacao;

            const numTUGs = calcularNumeroTUGs(comodo.perimetro, comodo.tipo);
            const potenciaTUGs = calcularPotenciaTotalTUGs(numTUGs);
            relatorio.totalPotenciaTUGsVA += potenciaTUGs;

            // Circuito para iluminação do cômodo
            if (potenciaIluminacao > 0) {
                const correnteIluminacao = potenciaIluminacao / projeto.tensaoPrincipal;
                const bitolaIluminacao = obterBitolaFio(correnteIluminacao, 2) || 1.5; // Mínimo de 1.5mm² para iluminação
                const disjuntorIluminacao = Math.max(10, Math.ceil(correnteIluminacao / 5) * 5); // Mínimo 10A, arredonda para o próximo múltiplo de 5

                relatorio.circuitos.push({
                    nome: `Iluminação - ${comodo.nome}`,
                    tipo: 'Iluminação',
                    potenciaVA: potenciaIluminacao,
                    correnteA: correnteIluminacao,
                    numTomadas: 0,
                    numLuzes: Math.max(1, Math.ceil(potenciaIluminacao / 60)), // Estimativa de luzes
                    numInterruptores: Math.max(1, Math.ceil(Math.min(2, Math.ceil(potenciaIluminacao / 60)) / 2)),
                    bitolaFio: bitolaIluminacao,
                    disjuntorRecomendadoA: disjuntorIluminacao,
                    eletrodutoMm: obterEletroduto(2, bitolaIluminacao),
                    quedaTensaoPercentual: calcularQuedaTensao(correnteIluminacao, COMPRIMENTO_CIRCUITO_PADRAO_ILUMINACAO, bitolaIluminacao, projeto.tensaoPrincipal, 'monofasico'),
                    observacoes: []
                });
                relatorio.numCircuitos++;
            }

            // Circuito para TUGs do cômodo
            if (numTUGs > 0) {
                const correnteTUGs = potenciaTUGs / projeto.tensaoPrincipal;
                const bitolaTUGs = obterBitolaFio(correnteTUGs, 2) || 2.5; // Mínimo de 2.5mm² para TUGs
                const disjuntorTUGs = Math.max(20, Math.ceil(correnteTUGs / 5) * 5); // Mínimo 20A, arredonda para o próximo múltiplo de 5

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

            // Circuitos para TUEs
            if (comodo.tue && comodo.tue.length > 0) {
                comodo.tue.forEach(tue => {
                    relatorio.totalPotenciaTUEsVA += tue.potencia;
                    const correnteTUE = tue.potencia / projeto.tensaoPrincipal;
                    const bitolaTUE = obterBitolaFio(correnteTUE, 2) || 2.5; // Mínimo de 2.5mm² para TUEs
                    const disjuntorTUE = Math.max(25, Math.ceil(correnteTUE / 5) * 5); // Geralmente 25A ou mais, arredonda para 5

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

        // Cálculo da demanda total (simplificado para exemplo)
        // A NBR 5410 tem um método mais complexo de cálculo de demanda,
        // este é um exemplo para fins didáticos.
        relatorio.demandaTotalVA = (relatorio.totalPotenciaIluminacaoVA * FATOR_DEMANDA_ILUMINACAO_TUG) +
                                   (relatorio.totalPotenciaTUGsVA * FATOR_DEMANDA_ILUMINACAO_TUG) +
                                   (relatorio.totalPotenciaTUEsVA * FATOR_DEMANDA_TUE);

        // Ajustar a corrente total com base na tensão e tipo de sistema
        let numCondutoresPrincipal;
        if (relatorio.tensaoPrincipal === 127) { // Monofásico 127V
            relatorio.tipoSistemaNecessario = 'Monofásico (F+N)';
            numCondutoresPrincipal = 2; // Fase + Neutro
            relatorio.correnteTotalA = relatorio.demandaTotalVA / relatorio.tensaoPrincipal;
        } else if (relatorio.tensaoPrincipal === 220) {
            // Se a demanda for maior, pode ser bifásico (2F+N ou 2F) ou trifásico (3F+N)
            if (relatorio.demandaTotalVA <= 10000) { // Exemplo de limite para bifásico
                relatorio.tipoSistemaNecessario = 'Bifásico (2F+N ou F+F)';
                numCondutoresPrincipal = 3; // 2 Fases + Neutro, ou 2 Fases
                relatorio.correnteTotalA = relatorio.demandaTotalVA / relatorio.tensaoPrincipal; // Aproximação para bifásico
            } else {
                relatorio.tipoSistemaNecessario = 'Trifásico (3F+N)';
                numCondutoresPrincipal = 4; // 3 Fases + Neutro
                relatorio.correnteTotalA = relatorio.demandaTotalVA / (relatorio.tensaoPrincipal * Math.sqrt(3)); // Corrente para trifásico
            }
        } else if (relatorio.tensaoPrincipal === 380) {
            relatorio.tipoSistemaNecessario = 'Trifásico (3F+N)';
            numCondutoresPrincipal = 4; // 3 Fases + Neutro
            relatorio.correnteTotalA = relatorio.demandaTotalVA / (relatorio.tensaoPrincipal * Math.sqrt(3)); // Corrente para trifásico
        } else {
            relatorio.tipoSistemaNecessario = 'Não definido (Tensão incomum)';
            numCondutoresPrincipal = 2; // Padrão
            relatorio.correnteTotalA = relatorio.demandaTotalVA / relatorio.tensaoPrincipal;
        }

        // Bitola do fio geral para a entrada
        const bitolaFioGeral = obterBitolaFio(relatorio.correnteTotalA, numCondutoresPrincipal);
        relatorio.recomendacoesFioGeral.bitolaMm2 = bitolaFioGeral || 6; // Mínimo de 6mm² para entrada, ou 10mm² dependendo da concessionária
        relatorio.recomendacoesFioGeral.tipoFio = 'Cabo de Cobre PVC 70°C';
        relatorio.recomendacoesFioGeral.numCondutoresCarregados = numCondutoresPrincipal;
        relatorio.recomendacoesFioGeral.observacao = `Para o alimentador principal da residência. Consulte a concessionária local para bitola mínima do ramal de entrada.`;

        // Eletroduto para a entrada
        const eletrodutoGeral = obterEletroduto(numCondutoresPrincipal, relatorio.recomendacoesFioGeral.bitolaMm2);
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
        if (relatorio.numCircuitos > 5 || projeto.comodos.length > 3) { // Se há muitos circuitos ou cômodos, a casa se beneficia de mais automação
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

        if (relatorio.circuitos.some(c => c.quedaTensaoPercentual > 3)) {
            relatorio.observacoesGerais.push('**ATENÇÃO:** Alguns circuitos apresentam queda de tensão acima de 3%, que é o limite recomendado pela NBR 5410 para circuitos terminais. Considere aumentar a bitola dos cabos ou reduzir o comprimento desses circuitos.');
        }
        if (relatorio.correnteTotalA > 100) { // Exemplo de limite para DR geral
            relatorio.observacoesGerais.push('Considerar a instalação de Dispositivo Diferencial Residual (DR) de proteção geral, além dos DRs específicos para áreas úmidas, conforme NBR 5410.');
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
    const numComodosInput = document.getElementById('numComodos');
    let numComodos = parseInt(numComodosInput.value);
    const container = document.getElementById('containerComodos');

    // Salva os dados atuais dos cômodos para recriá-los
    const dadosComodosAtuais = Array.from(container.children).map((comodoDiv, index) => {
        const nome = comodoDiv.querySelector(`[id^="nomeComodo_"]`).value;
        const tipo = comodoDiv.querySelector(`[id^="tipoComodo_"]`).value;
        const area = parseFloat(comodoDiv.querySelector(`[id^="areaComodo_"]`).value);
        const perimetro = parseFloat(comodoDiv.querySelector(`[id^="perimetroComodo_"]`).value);
        
        const tues = Array.from(comodoDiv.querySelector(`[id^="tueFields_"]`).children).map(tueDiv => {
            const tueNome = tueDiv.querySelector(`[id^="tueNome_"]`).value;
            const tuePotencia = parseFloat(tueDiv.querySelector(`[id^="tuePotencia_"]`).value);
            return { nome: tueNome, potencia: tuePotencia };
        });
        return { nome, tipo, area, perimetro, tues };
    });

    container.innerHTML = ''; // Limpa os campos existentes

    for (let i = 0; i < numComodos; i++) {
        const comodoDiv = document.createElement('div');
        comodoDiv.classList.add('comodo-item');

        const comodoData = dadosComodosAtuais[i] || {}; // Usa dados existentes ou vazio

        comodoDiv.innerHTML = `
            <h4>Cômodo ${i + 1}</h4>
            <label for="nomeComodo_${i}">Nome do Cômodo (Ex: Sala, Cozinha):</label>
            <input type="text" id="nomeComodo_${i}" value="${comodoData.nome || `Cômodo ${i+1}`}" required>

            <label for="tipoComodo_${i}">Tipo de Cômodo:</label>
            <select id="tipoComodo_${i}" required>
                <option value="sala" ${comodoData.tipo === 'sala' ? 'selected' : ''}>Sala</option>
                <option value="quarto" ${comodoData.tipo === 'quarto' ? 'selected' : ''}>Quarto</option>
                <option value="cozinha" ${comodoData.tipo === 'cozinha' ? 'selected' : ''}>Cozinha</option>
                <option value="banheiro" ${comodoData.tipo === 'banheiro' ? 'selected' : ''}>Banheiro</option>
                <option value="areaServico" ${comodoData.tipo === 'areaServico' ? 'selected' : ''}>Área de Serviço</option>
                <option value="lavanderia" ${comodoData.tipo === 'lavanderia' ? 'selected' : ''}>Lavanderia</option>
                <option value="copa" ${comodoData.tipo === 'copa' ? 'selected' : ''}>Copa</option>
                <option value="copa-cozinha" ${comodoData.tipo === 'copa-cozinha' ? 'selected' : ''}>Copa-Cozinha</option>
                <option value="circulacao" ${comodoData.tipo === 'circulacao' ? 'selected' : ''}>Corredor/Hall</option>
                <option value="garagem" ${comodoData.tipo === 'garagem' ? 'selected' : ''}>Garagem</option>
                <option value="outro" ${comodoData.tipo === 'outro' ? 'selected' : ''}>Outro</option>
            </select>

            <label for="areaComodo_${i}">Área (m²):</label>
            <input type="number" id="areaComodo_${i}" min="1" step="0.1" value="${comodoData.area || 15}" required>

            <label for="perimetroComodo_${i}">Perímetro (m):</label>
            <input type="number" id="perimetroComodo_${i}" min="1" step="0.1" value="${comodoData.perimetro || 15}" required>

            <div class="tue-container">
                <h5>Tomadas de Uso Específico (TUEs) neste cômodo:</h5>
                <button type="button" class="add-tue-btn" onclick="addTUEField(${i})">+ Adicionar TUE</button>
                <div id="tueFields_${i}">
                    </div>
            </div>
            ${numComodos > 1 ? `<button type="button" class="remove-comodo-btn" onclick="removeComodoField(${i})">Remover Cômodo</button>` : ''}
        `;
        container.appendChild(comodoDiv);

        // Preenche as TUEs se houver dados antigos
        if (comodoData.tues && comodoData.tues.length > 0) {
            comodoData.tues.forEach((tue, tueIdx) => {
                const tueContainer = document.getElementById(`tueFields_${i}`);
                const tueDiv = document.createElement('div');
                tueDiv.classList.add('tue-item');
                tueDiv.innerHTML = `
                    <label for="tueNome_${i}_${tueIdx}">Nome da TUE (Ex: Chuveiro, Ar Condicionado):</label>
                    <input type="text" id="tueNome_${i}_${tueIdx}" value="${tue.nome || ''}" required>

                    <label for="tuePotencia_${i}_${tueIdx}">Potência da TUE (W):</label>
                    <input type="number" id="tuePotencia_${i}_${tueIdx}" min="${POTENCIA_TUE_MINIMA}" step="100" value="${tue.potencia || 2000}" required>
                    <button type="button" class="remove-tue-btn" onclick="removeTUEField(${i}, ${tueIdx})">Remover TUE</button>
                `;
                tueContainer.appendChild(tueDiv);
            });
        }
    }
}

function addComodoField() {
    const numComodosInput = document.getElementById('numComodos');
    let currentNumComodos = parseInt(numComodosInput.value);
    numComodosInput.value = currentNumComodos + 1; // Incrementa o contador
    gerarCamposComodos(); // Regenera todos os campos com o novo cômodo
}

function removeComodoField(comodoIndexToRemove) {
    const numComodosInput = document.getElementById('numComodos');
    let currentNumComodos = parseInt(numComodosInput.value);

    if (currentNumComodos > 1) { // Garante que pelo menos um cômodo permaneça
        numComodosInput.value = currentNumComodos - 1; // Decrementa o contador
        gerarCamposComodos(); // Regenera todos os campos sem o cômodo removido
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


// Função principal para acionar o cálculo do projeto completo
function calcularDimensionamentoCompleto() {
    const tensaoPrincipalProjeto = parseFloat(document.getElementById('tensaoPrincipalProjeto').value);
    const numComodos = document.getElementById('containerComodos').children.length; // Pega o número atual de cômodos visíveis
    const resultadoDiv = document.getElementById('resultadoCompleto');

    if (isNaN(tensaoPrincipalProjeto) || tensaoPrincipalProjeto <= 0 || numComodos < 1) {
        resultadoDiv.innerHTML = '<p class="error">Por favor, preencha a tensão principal e garanta que há pelo menos um cômodo.</p>';
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
            resultadoDiv.innerHTML = `<p class="error">Por favor, preencha todos os campos do Cômodo ${i + 1} corretamente (Área e Perímetro devem ser maiores que zero).</p>`;
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
        tipoInstalacaoFio: 'embutido'
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
            <li><strong>Nº Condutores Carregados:</strong> ${resultado.recomendacoesFioGeral.numCondutoresCarregados}</li>
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
                    <li>Bitola do Fio: <strong>${circuito.bitolaFio} mm²</strong></li>
                    <li>Disjuntor Recomendado: <strong>${circuito.disjuntorRecomendadoA} A</strong></li>
                    <li>Eletroduto: ${circuito.eletrodutoMm} mm</li>
                    <li>Queda de Tensão: <strong>${circuito.quedaTensaoPercentual.toFixed(2)} %</strong> ${circuito.quedaTensaoPercentual > 3 ? '<span style="color: red; font-weight: bold;">(ATENÇÃO: Queda de tensão elevada, verificar!)</span>' : ''}</li>
                    ${circuito.observacoes.length > 0 ? `<li>Observações: ${circuito.observacoes.join(', ')}</li>` : ''}
                </ul>
            </details>
        `).join('')}
        </div>

        <h4>Disjuntores Recomendados (Total por Valor)</h4>
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
        ${resultado.observacoesGerais.length > 0 ? `
            <h4>Observações Importantes:</h4>
            <ul>
                ${resultado.observacoesGerais.map(obs => `<li>${obs}</li>`).join('')}
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
    const sistema = document.getElementById('sistema').value; // 'monofasico' ou 'trifasico'
    const resultadoDiv = document.getElementById('resultado');
    const potenciaError = document.getElementById('potencia-error');

    if (isNaN(potencia) || isNaN(tensao) || isNaN(comprimento) || potencia <= 0 || tensao <= 0 || comprimento <= 0) {
        potenciaError.textContent = 'Por favor, insira valores válidos e maiores que zero para todos os campos.';
        resultadoDiv.innerHTML = '';
        return;
    } else {
        potenciaError.textContent = '';
    }

    let corrente;
    let numCondutoresCarregados; // Para a tabela de ampacidade
    let tipoSistemaParaQueda; // Para a função calcularQuedaTensao

    if (sistema === 'monofasico') {
        corrente = potencia / tensao;
        numCondutoresCarregados = 2; // Ex: Fase + Neutro ou Fase + Fase
        tipoSistemaParaQueda = 'monofasico';
    } else if (sistema === 'trifasico') {
        corrente = potencia / (tensao * Math.sqrt(3)); // Para carga trifásica em sistema trifásico
        numCondutoresCarregados = 3; // 3 Fases
        tipoSistemaParaQueda = 'trifasico';
    }

    const bitola = obterBitolaFio(corrente, numCondutoresCarregados);
    if (!bitola) {
        resultadoDiv.innerHTML = `<p class="error">Não foi possível encontrar uma bitola de fio adequada para a corrente de ${corrente.toFixed(2)}A com ${numCondutoresCarregados} condutores carregados na tabela fornecida. Aumente a potência ou verifique os parâmetros.</p>`;
        return;
    }

    const quedaTensao = calcularQuedaTensao(corrente, comprimento, bitola, tensao, tipoSistemaParaQueda);
    const disjuntorRecomendado = Math.max(10, Math.ceil(corrente / 5) * 5); // Mínimo 10A, arredonda para o próximo múltiplo de 5

    resultadoDiv.innerHTML = `
        <p>Corrente calculada: <strong>${corrente.toFixed(2)} A</strong></p>
        <p>Bitola do cabo recomendada: <strong>${bitola} mm²</strong></p>
        <p>Queda de tensão: <strong>${quedaTensao.toFixed(2)} %</strong> ${quedaTensao > 3 ? '<span style="color: red; font-weight: bold;">(Acima do recomendado pela NBR 5410 que é de 3% para circuitos terminais!)</span>' : ''}</p>
        <p>Disjuntor recomendado: <strong>${disjuntorRecomendado} A</strong></p>
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
            label1.textContent = 'Corrente (A):'; // Corrente é essencial para achar a seção
            label2.textContent = 'Comprimento (m):'; // Comprimento para verificar queda
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
        resultadoRosetaDiv.innerHTML = '<p class="error">Por favor, insira valores numéricos válidos e maiores que zero.</p>';
        return;
    }

    let resultado = '';
    const tensaoPadraoRoseta = 220; // Assumindo uma tensão padrão para cálculos simples na roseta
    const tipoSistemaPadraoRoseta = 'monofasico'; // Assumindo sistema monofásico para cálculos simples

    switch (tipoCalculo) {
        case 'corrente':
            resultado = `Corrente: ${(input1 / input2).toFixed(2)} A`;
            break;
        case 'potencia':
            resultado = `Potência: ${(input1 * input2).toFixed(2)} W`;
            break;
        case 'secao':
            const correnteParaSecao = input1;
            const comprimentoParaSecao = input2;
            const secaoCalculada = obterBitolaFio(correnteParaSecao, 2); // Assume 2 condutores carregados para a roseta
            if (secaoCalculada) {
                const queda = calcularQuedaTensao(correnteParaSecao, comprimentoParaSecao, secaoCalculada, tensaoPadraoRoseta, tipoSistemaPadraoRoseta);
                resultado = `Seção do Cabo: <strong>${secaoCalculada} mm²</strong> (Queda: ${queda.toFixed(2)}%)`;
            } else {
                resultado = `Não foi possível determinar a seção do cabo para esta corrente na tabela.`;
            }
            break;
        case 'queda':
            const correnteParaQueda = input1;
            const secaoCaboParaQueda = input2;
            const comprimentoQueda = 15; // Usar um comprimento padrão ou adicionar input para a roseta?
            const quedaCalculada = calcularQuedaTensao(correnteParaQueda, comprimentoQueda, secaoCaboParaQueda, tensaoPadraoRoseta, tipoSistemaPadraoRoseta);
            resultado = `Queda de Tensão: <strong>${quedaCalculada.toFixed(2)} %</strong>`;
            break;
    }
    resultadoRosetaDiv.innerHTML = `<p><strong>${resultado}</strong></p>`;
}
