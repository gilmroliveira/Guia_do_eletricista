// js/dimensionamento.js
function calcularDimensionamentoEletrico(tipoDispositivo, potenciaWatts, tensao = 220, distancia = 10) {
    // Constantes baseadas na NBR 5410
    const resistividadeCobre = 0.0172; // Ohm·mm²/m
    const quedaTensaoMaxima = 0.04; // 4% de queda máxima
    const fatorPotencia = 0.8; // Típico para cargas residenciais
    const fatorSeguranca = 1.25; // Margem de segurança de 25%

    // Passo 1: Calcular Corrente (I = P / (V * FP))
    const corrente = potenciaWatts / (tensao * fatorPotencia);

    // Passo 2: Selecionar Bitola do Fio
    const bitolasFios = [
        { tamanho: 1.5, corrente: 16 },
        { tamanho: 2.5, corrente: 22 },
        { tamanho: 4, corrente: 30 },
        { tamanho: 6, corrente: 38 },
        { tamanho: 10, corrente: 52 }
    ];

    let fioSelecionado = bitolasFios.find(fio => fio.corrente >= corrente * fatorSeguranca);
    if (!fioSelecionado) {
        fioSelecionado = { tamanho: 16, corrente: 70 }; // Fallback para alta potência
    }

    // Passo 3: Calcular Queda de Tensão
    const resistencia = (2 * resistividadeCobre * distancia) / fioSelecionado.tamanho;
    const quedaTensao = corrente * resistencia;
    const percentualQuedaTensao = (quedaTensao / tensao) * 100;

    // Passo 4: Selecionar Disjuntor
    const tamanhosDisjuntores = [10, 16, 20, 25, 32, 40, 50, 63];
    const disjuntor = tamanhosDisjuntores.find(tamanho => tamanho >= corrente * fatorSeguranca);

    // Passo 5: Recomendações
    return {
        dispositivo: tipoDispositivo,
        potencia: potenciaWatts,
        tensao: tensao,
        corrente: corrente.toFixed(2) + " A",
        bitolaFio: fioSelecionado.tamanho + " mm²",
        disjuntor: disjuntor ? disjuntor + " A" : "Consultar engenheiro",
        quedaTensao: percentualQuedaTensao.toFixed(2) + "%",
        quedaTensaoAceitavel: percentualQuedaTensao <= quedaTensaoMaxima,
        observacoes: [
            !percentualQuedaTensao <= quedaTensaoMaxima ? "Queda de tensão excede 4%. Considere aumentar a bitola do fio ou reduzir a distância." : null,
            tipoDispositivo === "Chuveiro" ? "Use um circuito dedicado com proteção DR." : null
        ].filter(Boolean)
    };
}