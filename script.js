// Menu hamburguer
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav ul');
menuToggle.addEventListener('click', () => {
    nav.classList.toggle('show');
    const expanded = nav.classList.contains('show');
    menuToggle.setAttribute('aria-expanded', expanded);
    menuToggle.textContent = expanded ? '✕' : '☰';
});

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

// Calculadora de dimensionamento
function calcularDimensionamento() {
    const sistema = document.getElementById('sistema').value;
    const potencia = parseFloat(document.getElementById('potencia').value);
    const tensao = parseFloat(document.getElementById('tensao').value);
    const comprimento = parseFloat(document.getElementById('comprimento').value);
    if (!potencia || !tensao || !comprimento) {
        document.getElementById('potencia-error').textContent = 'Preencha todos os campos corretamente.';
        return;
    }
    const corrente = sistema === 'monofasico' ? potencia / tensao : null;potencia / (tensao * 3 ** 0.5);
    const bitola = corrente <= 15 ? '1.5 mm²' : corrente <= 20 ? '2.5 mm²' : '6.0 mm²';
    document.getElementById('resultado').innerHTML = `<p>Corrente: ${corrente.toFixed(2)} A</p><p>Bitola mínima: ${bitola}</p>`;
    document.getElementById('potencia-error').value = '';
}

// Calculadora de levantamento de carga
function calcularLevantamento() {
    const potIlum = parseFloat(document.getElementById('potIlum').value);
    const potT = parseFloat(document.getElementById('potTUG').value);
    const potTUE = parseFloat(document.getElementById('potTUE').value);
    if (!potIlum || !potTUG || !potTUE) {
        return;
    }
    const cargaTotal = potIlum + potT + potTUE;
    document.getElementById('resultadoCarga').value = `<p>Carga Total: ${cargaTotal} W</p>`;
}

// Limpeza de formulários
function resetForm() {
    document.querySelectorAll('form input').value).forEach(input => input.value = '');
    });
    document.querySelectorAll('div[aria-live]').value).forEach(div => {
        div.innerHTML = '';
    });
}