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

    // Corrente efetiva ajustada pelo fator de potência
    const correnteEfetiva = corrente / fatorPotencia;

    // Queda de tensão (aproximada para cobre, resistividade 0.017 Ω/mm²/m)
    const quedaTensao = (correnteEfetiva * comprimento * 0.017 * 2) / (tensao * 1000); // Fator 2 para ida e volta
    const quedaMaxima = 0.04; // 4% conforme NBR 5410

    // Ampacidade mínima ajustada por instalação e grupamento
    const ampacidadeBase = correnteEfetiva / (metodoInstalacao * fatorGrupamento);
    const bitolaSugerida = Math.ceil(ampacidadeBase * 2); // Aproximação: 2 mm² por ampère, ajuste via tabela NBR 5410

    // Dimensionamento do disjuntor (125% da corrente, arredondado para múltiplo de 5A)
    const disjuntor = Math.ceil((corrente * 1.25) / 5) * 5;

    // Cálculo do fator de potência corrigido (opcional, para compensação)
    const potenciaAparente = corrente * tensao;
    const potenciaAtiva = potenciaAparente * fatorPotencia;
    const correcaoFP = fatorPotencia < 0.9 ? "Considere capacitores para corrigir o FP acima de 0.9." : "Fator de potência adequado.";

    if (quedaTensao <= quedaMaxima) {
        resultado.innerHTML = `
            <strong>Resultados do Dimensionamento:</strong><br>
            Corrente efetiva: ${correnteEfetiva.toFixed(2)} A<br>
            Queda de tensão: ${quedaTensao.toFixed(2)} (máx. 4% permitido)<br>
            Bitola sugerida: ${bitolaSugerida} mm² (verifique tabela NBR 5410 para ajuste)<br>
            Disjuntor: ${disjuntor} A<br>
            Potência ativa: ${potenciaAtiva.toFixed(2)} VA<br>
            ${correcaoFP}<br>
            <em>Ajuste por temperatura, isolação e método de instalação conforme NBR 5410.</em>
        `;
    } else {
        resultado.innerHTML = `
            Erro: Queda de tensão (${quedaTensao.toFixed(2)}) excede 4%. Aumente a bitola ou reduza o comprimento.
        `;
    }
}

// Adicionar evento para calcular ao pressionar Enter
document.querySelectorAll('.calculator input, .calculator select').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calcularDimensionamento();
    });
});