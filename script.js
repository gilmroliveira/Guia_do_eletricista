function calcularDimensionamento() {
    const corrente = parseFloat(document.getElementById('corrente').value) || 0;
    const comprimento = parseFloat(document.getElementById('comprimento').value) || 0;
    const tensao = parseFloat(document.getElementById('tensao').value) || 220;
    const fatorPotencia = parseFloat(document.getElementById('fatorPotencia').value) || 0.9;
    const metodoInstalacao = parseFloat(document.getElementById('metodoInstalacao').value) || 1;
    const fatorGrupamento = parseFloat(document.getElementById('fatorGrupamento').value) || 1.0;
    const resultado = document.getElementById('resultado');

    if (corrente <= 0 || comprimento <= 0 || tensao <= 0) {
        resultado.innerHTML = "Erro: Preencha todos os campos com valores válidos e positivos.";
        return;
    }

    const correnteEfetiva = corrente / fatorPotencia;
    const quedaTensao = (correnteEfetiva * comprimento * 0.017 * 2) / (tensao * 1000);
    const quedaMaxima = 0.04;
    const ampacidadeBase = correnteEfetiva / (metodoInstalacao * fatorGrupamento);
    const bitolaSugerida = Math.ceil(ampacidadeBase * 2);
    const disjuntor = Math.ceil((corrente * 1.25) / 5) * 5;
    const potenciaAparente = corrente * tensao;
    const potenciaAtiva = potenciaAparente * fatorPotencia;
    const correcaoFP = fatorPotencia < 0.9 ? "Considere capacitores para corrigir o FP acima de 0.9." : "Fator de potência adequado.";

    if (quedaTensao <= quedaMaxima) {
        resultado.innerHTML = `
            <strong>Resultados:</strong><br>
            Corrente efetiva: ${correnteEfetiva.toFixed(2)} A<br>
            Queda de tensão: ${quedaTensao.toFixed(2)} (máx. 4%)<br>
            Bitola sugerida: ${bitolaSugerida} mm²<br>
            Disjuntor: ${disjuntor} A<br>
            Potência ativa: ${potenciaAtiva.toFixed(2)} VA<br>
            ${correcaoFP}<br>
            <em>Ajuste por temperatura e tabela NBR 5410.</em>
        `;
    } else {
        resultado.innerHTML = `Erro: Queda de tensão (${quedaTensao.toFixed(2)}) excede 4%. Aumente a bitola.`;
    }
}

function calcularLevantamento() {
    const potIlum = parseFloat(document.getElementById('potIlum').value) || 0;
    const potTUG = parseFloat(document.getElementById('potTUG').value) || 0;
    const potTUE = parseFloat(document.getElementById('potTUE').value) || 0;
    const resultadoCarga = document.getElementById('resultadoCarga');
    const fatorDemanda = potTUE > 0 ? 0.84 : 1; // Fator de demanda para TUE (3 circuitos)

    const potTUEAjustada = potTUE * fatorDemanda;
    const potTotal = potIlum + potTUG + potTUEAjustada;
    const correnteTotal = potTotal / 220; // Supondo 220V

    resultadoCarga.innerHTML = `
        <strong>Resultados do Levantamento:</strong><br>
        Potência Iluminação: ${potIlum} W<br>
        Potência TUG: ${potTUG} W<br>
        Potência TUE (ajustada): ${potTUEAjustada.toFixed(2)} W<br>
        Potência Total: ${potTotal.toFixed(2)} W<br>
        Corrente Total: ${correnteTotal.toFixed(2)} A<br>
        <em>Disjuntor sugerido: ${Math.ceil(correnteTotal * 1.25 / 5) * 5} A</em>
    `;
}

function resetForm() {
    document.querySelectorAll('.calculator input, .calculator select').forEach(input => input.value = '');
    document.getElementById('resultado').innerHTML = '';
    document.getElementById('resultadoCarga').innerHTML = '';
}

// Eventos
document.querySelectorAll('.calculator input, .calculator select').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calcularDimensionamento() || calcularLevantamento();
    });
});