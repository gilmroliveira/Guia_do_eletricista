// js/formHandler.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dimensioning-form');
    const resultDiv = document.getElementById('dimensioning-result');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipoDispositivo = document.getElementById('device-type').value;
        const potencia = parseFloat(document.getElementById('power').value);
        const tensao = parseFloat(document.getElementById('voltage').value);
        const distancia = parseFloat(document.getElementById('distance').value);

        try {
            const resultado = calcularDimensionamentoEletrico(tipoDispositivo, potencia, tensao, distancia);
            resultDiv.innerHTML = `
                <h3>Resultado do Dimensionamento</h3>
                <p><strong>Dispositivo:</strong> ${resultado.dispositivo}</p>
                <p><strong>Potência:</strong> ${resultado.potencia} W</p>
                <p><strong>Corrente:</strong> ${resultado.corrente}</p>
                <p><strong>Bitola do Fio:</strong> ${resultado.bitolaFio}</p>
                <p><strong>Disjuntor:</strong> ${resultado.disjuntor}</p>
                <p><strong>Queda de Tensão:</strong> ${resultado.quedaTensao} (${resultado.quedaTensaoAceitavel ? 'Aceitável' : 'Não Aceitável'})</p>
                ${resultado.observacoes.length ? `<p><strong>Observações:</strong> ${resultado.observacoes.join(', ')}</p>` : ''}
            `;
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
        }
    });
});