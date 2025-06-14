// Menu hamburguer
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav ul');
if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('show');
        const expanded = nav.classList.contains('show');
        menuToggle.setAttribute('aria-expanded', expanded);
        menuToggle.textContent = expanded ? '✕' : '☰';
    });
}

// Abas para normas
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.setAttribute('aria-selected', 'false'));
        tabContents.forEach(content => content.setAttribute('aria-hidden', 'true'));
        button.setAttribute('aria-selected', 'true');
        document.getElementById(button.dataset.tab).setAttribute('aria-hidden', 'false');
    });
});

// Atualizar labels da roseta
function updateRosetaLabels() {
    const tipo = document.getElementById('tipoCalculo').value;
    const labelValor1 = document.getElementById('labelValor1');
    const labelValor2 = document.getElementById('labelValor2');

    switch (tipo) {
        case 'corrente':
            labelValor1.textContent = 'Potência (W):';
            labelValor2.textContent = 'Tensão (V):';
            break;
        case 'potencia':
            labelValor1.textContent = 'Tensão (V):';
            labelValor2.textContent = 'Corrente (A):';
            break;
        case 'secao':
            labelValor1.textContent = 'Corrente (A):';
            labelValor2.textContent = 'Comprimento (m):';
            break;
        case 'queda':
            labelValor1.textContent = 'Corrente (A):';
            labelValor2.textContent = 'Comprimento (m):';
            break;
    }
}

// Calculadora de dimensionamento
function calcularDimensionamento() {
    const sistema = document.getElementById('sistema').value;
    const potencia = parseFloat(document.getElementById('potencia').value);
    const tensao = parseFloat(document.getElementById('tensao').value);
    const comprimento = parseFloat(document.getElementById('comprimento').value);
    const erro = document.getElementById('potencia-error');
    const resultado = document.getElementById('resultado');

    if (!potencia || !tensao || !comprimento || potencia <= 0 || tensao <= 0 || comprimento <= 0) {
        erro.textContent = 'Preencha todos os campos com valores válidos.';
        resultado.innerHTML = '';
        return;
    }

    const corrente = sistema === 'monofasico' ? potencia / tensao : potencia / (tensao * Math.sqrt(3));
    let bitola;
    if (corrente <= 15) bitola = '1.5 mm²';
    else if (corrente <= 20) bitola = '2.5 mm²';
    else if (corrente <= 36) bitola = '6.0 mm²';
    else bitola = 'Consulte NBR 5410';

    resultado.innerHTML = `<p>Corrente: ${corrente.toFixed(2)} A</p><p>Bitola mínima: ${bitola}</p>`;
    erro.textContent = '';
}

// Calculadora de levantamento de carga
function calcularLevantamento() {
    const potIlum = parseFloat(document.getElementById('potIlum').value);
    const potTUG = parseFloat(document.getElementById('potTUG').value);
    const potTUE = parseFloat(document.getElementById('potTUE').value);
    const resultado = document.getElementById('resultadoCarga');

    if (!potIlum || !potTUG || !potTUE || potIlum <= 0 || potTUG <= 0 || potTUE <= 0) {
        resultado.innerHTML = '<p class="error">Preencha todos os valores com números válidos.</p>';
        return;
    }

    const cargaTotal = potIlum + potIlum + potTUG + potTUE;
    resultado.innerHTML = `<p>Carga Total: ${cargaTotal.toFixed(2)} W</p>`;
}

// Calculadora da roseta
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
            res = (2 * valor1 * valor2 * 0.0176) / (0.04 * 220); // Simplificado: S ≈ (2*I*L*ρ)/(ΔV*V), ΔV=4%
            break;
        case 'queda':
            res = (2 * valor1 * valor2 * 0.0176 * 100) / (6 * valor1); // ΔV% = (2*I*L*ρ*100)/(S*V), S=6mm²
            break;
    }

    resultado.innerHTML = `<p>Resultado: ${res.toFixed(2)} ${tipo === 'corrente' ? 'A' : tipo === 'potencia' ? 'W' : tipo === 'secao' ? 'mm²' : '%'}</p>`;
}

// Limpeza de formulários
function resetForm() {
    document.querySelectorAll('form input, form select').forEach(input => {
        if (input.type !== 'button') input.value = '';
    });
    document.querySelectorAll('.error, div[aria-live]').forEach(div => {
        div.innerHTML = '';
    });
}

// Inicializar labels da roseta
document.addEventListener('DOMContentLoaded', updateRosetaLabels);