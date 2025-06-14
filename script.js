// Tabela de dimensionamento de cabos (NBR 5410)
const tabelaCabos = [
    { bitola: 1.5, ampacidade2: 15, ampacidade3: 13 },
    { bitola: 2.5, ampacidade2: 20, ampacidade3: 18 },
    { bitola: 4.0, ampacidade2: 28, ampacidade3: 24 },
    { bitola: 6.0, ampacidade2: 36, ampacidade3: 31 },
    { bitola: 10.0, ampacidade2: 50, ampacidade3: 42 },
    { bitola: 16.0, ampacidade2: 68, ampacidade3: 57 },
    { bitola: 25.0, ampacidade2: 87, ampacidade3: 73 },
    { bitola: 35.0, ampacidade2: 107, ampacidade3: 90 }
];

// Função para calcular dimensionamento
function calcularDimensionamento() {
    const sistema = document.getElementById('sistema').value;
    const potencia = parseFloat(document.getElementById('potencia').value);
    const tensao = parseFloat(document.getElementById('tensao').value);
    const fatorPotencia = parseFloat(document.getElementById('fatorPotencia').value);
    const comprimento = parseFloat(document.getElementById('comprimento').value);
    const metodoInstalacao = parseFloat(document.getElementById('metodoInstalacao').value);
    const fatorGrupamento = parseFloat(document.getElementById('fatorGrupamento').value);
    const resultado = document.getElementById('resultado');

    if (!potencia || !tensao || !fatorPotencia || !comprimento) {
        resultado.innerHTML = "Por favor, preencha todos os campos.";
        return;
    }

    let corrente;
    if (sistema === 'trifasico') {
        corrente = potencia / (Math.sqrt(3) * tensao * fatorPotencia);
    } else {
        corrente = potencia / (tensao * fatorPotencia);
    }

    // Aplicar fatores de correção
    const correnteCorrigida = corrente / (metodoInstalacao * fatorGrupamento);

    // Selecionar bitola e disjuntor
    let bitolaSelecionada = null;
    let ampacidadeUsada = fatorGrupamento === 0.8 ? 'ampacidade3' : 'ampacidade2';
    for (const cabo of tabelaCabos) {
        if (cabo[ampacidadeUsada] >= correnteCorrigida) {
            bitolaSelecionada = cabo.bitola;
            break;
        }
    }

    // Calcular queda de tensão
    const resistividade = 0.0178; // Resistividade do cobre (ohm·mm²/m)
    const quedaTensao = (2 * corrente * comprimento * resistividade) / (bitolaSelecionada * tensao) * 100;

    // Selecionar disjuntor
    const disjuntores = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100];
    let disjuntorSelecionado = disjuntores.find(d => d >= correnteCorrigida);

    resultado.innerHTML = `
        <strong>Resultados:</strong><br>
        Corrente: ${corrente.toFixed(2)} A<br>
        Bitola do Cabo: ${bitolaSelecionada ? bitolaSelecionada + ' mm²' : 'Não encontrada'}<br>
        Disjuntor: ${disjuntorSelecionado ? disjuntorSelecionado + ' A' : 'Não encontrado'}<br>
        Queda de Tensão: ${quedaTensao.toFixed(2)}% (Máximo permitido: 4%)<br>
        ${quedaTensao > 4 ? '<span style="color: red;">Atenção: Queda de tensão acima do limite!</span>' : ''}
    `;
}

// Função para a roseta de cálculos
function calcularRoseta() {
    const tipoCalculo = document.getElementById('tipoCalculo').value;
    const input1 = parseFloat(document.getElementById('rosetaInput1').value);
    const input2 = parseFloat(document.getElementById('rosetaInput2').value);
    const resultadoRoseta = document.getElementById('resultadoRoseta');

    if (!input1 || !input2) {
        resultadoRoseta.innerHTML = "Por favor, preencha ambos os valores.";
        return;
    }

    let resultado;
    switch (tipoCalculo) {
        case 'corrente':
            resultado = input1 / (Math.sqrt(3) * input2 * 0.9); // Corrente trifásica (P/V*√3*FP)
            resultadoRoseta.innerHTML = `Corrente: ${resultado.toFixed(2)} A`;
            break;
        case 'potencia':
            resultado = Math.sqrt(3) * input1 * input2 * 0.9; // Potência trifásica (√3*V*I*FP)
            resultadoRoseta.innerHTML = `Potência: ${resultado.toFixed(2)} W`;
            break;
        case 'secao':
            resultado = (2 * input1 * input2 * 0.0178) / (0.04 * 220); // Seção com base em I e L
            resultadoRoseta.innerHTML = `Seção do Cabo: ${resultado.toFixed(2)} mm²`;
            break;
        case 'queda':
            resultado = (2 * input1 * input2 * 0.0178) / (10 * 220) * 100; // Queda de tensão (%)
            resultadoRoseta.innerHTML = `Queda de Tensão: ${resultado.toFixed(2)}%`;
            break;
        default:
            resultadoRoseta.innerHTML = "Selecione um tipo de cálculo válido.";
    }
}

// Função para limpar formulários
function resetForm() {
    document.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('resultado').innerHTML = '';
    document.getElementById('resultadoCarga').innerHTML = '';
    document.getElementById('resultadoRoseta').innerHTML = '';
}