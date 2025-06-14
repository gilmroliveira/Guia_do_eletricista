function calcularRoseta() {
    const tipo = document.getElementById('tipoCalculo').value;
    const valor1 = parseFloat(document.getElementById('rosetaInput1').value);
    const valor2 = parseFloat(document.getElementById('rosetaInput2').value);
    const resultado = document.getElementById('resultadoRoseta');

    if (!valor1 || !valor2 || valor1 <= 0 || valor2 <= 0) {
        resultado.innerHTML = '<p class="error">Preencha ambos os campos com valores válidos.</p>';
        return;
    }

    let res;
    switch (tipo) {
        case 'corrente':
            res = valor1 / valor2; // I = P / V
            break;
        case 'potencia':
            res = valor1 * valor2; // P = V * I
            break;
        case 'secao':
            res = (2 * valor1 * valor2 * 0.0176) / (0.04 * 220); // Simplificado: S ≈ (2*I*L*ρ)/(ΔV*V)
            break;
        case 'queda':
            res = (2 * valor1 * valor2 * 0.0176 * 100) / (6 * valor1); // ΔV% = (2*I*L*ρ*100)/(S*V)
            break;
    }

    resultado.innerHTML = `<p>Resultado: ${res.toFixed(2)} ${tipo === 'corrente' ? 'A' : tipo === 'potencia' ? 'W' : tipo === 'secao' ? 'mm²' : '%'}</p>`;
}