document.addEventListener('DOMContentLoaded', function() {
    // Menu Mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    menuToggle.addEventListener('click', function() {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !expanded);
        mainNav.classList.toggle('active');
    });

    // Sistema de Tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Calculadora Elétrica
    const calculatorForm = document.getElementById('electrical-calculator');
    const btnCalcular = document.getElementById('btn-calcular');
    const btnLimpar = document.getElementById('btn-limpar');
    const resultadoDiv = document.getElementById('resultado');

    btnCalcular.addEventListener('click', calcularDimensionamento);
    btnLimpar.addEventListener('click', resetForm);

    function calcularDimensionamento() {
        const sistema = document.getElementById('sistema').value;
        const potencia = parseFloat(document.getElementById('potencia').value);
        const tensao = parseFloat(document.getElementById('tensao').value);
        const comprimento = parseFloat(document.getElementById('comprimento').value);

        // Validação básica
        if (isNaN(potencia) || isNaN(tensao) || isNaN(comprimento)) {
            resultadoDiv.innerHTML = '<div class="error">Por favor, preencha todos os campos com valores válidos</div>';
            return;
        }

        // Cálculos
        let corrente, bitola, quedaTensao;
        
        if (sistema === 'monofasico') {
            corrente = potencia / tensao;
            bitola = calcularBitola(corrente);
            quedaTensao = calcularQuedaTensao(corrente, comprimento, bitola);
        } else {
            corrente = potencia / (tensao * Math.sqrt(3));
            bitola = calcularBitola(corrente);
            quedaTensao = calcularQuedaTensao(corrente, comprimento, bitola);
        }

        // Exibir resultados
        resultadoDiv.innerHTML = `
            <h4>Resultados do Dimensionamento</h4>
            <ul>
                <li><strong>Corrente:</strong> ${corrente.toFixed(2)} A</li>
                <li><strong>Bitola recomendada:</strong> ${bitola} mm²</li>
                <li><strong>Queda de tensão:</strong> ${quedaTensao.toFixed(2)} V (${((quedaTensao/tensao)*100).toFixed(2)}%)</li>
            </ul>
            <p class="table-note">* Baseado na NBR 5410 para condutores de cobre em PVC</p>
        `;
    }

    function calcularBitola(corrente) {
        // Tabela simplificada de bitolas
        if (corrente <= 15) return 1.5;
        if (corrente <= 20) return 2.5;
        if (corrente <= 28) return 4.0;
        if (corrente <= 36) return 6.0;
        if (corrente <= 50) return 10.0;
        return 16.0;
    }

    function calcularQuedaTensao(corrente, comprimento, bitola) {
        // Resistividade do cobre: 0.0178 ohm.mm²/m
        const resistividade = 0.0178;
        let resistencia = (resistividade * comprimento * 2) / bitola; // Ida e volta
        return corrente * resistencia;
    }

    function resetForm() {
        calculatorForm.reset();
        resultadoDiv.innerHTML = '';
    }

    // Inicialização
    document.querySelector('.tab-button').click(); // Ativar primeira tab
});