// script.js - Mantendo todos os códigos existentes e adicionando novos

// Menu Mobile
document.addEventListener('DOMContentLoaded', function() {
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
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                content.setAttribute('aria-hidden', 'true');
            });
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.setAttribute('aria-hidden', 'false');
                
                // Animação
                tabContent.style.opacity = 0;
                setTimeout(() => {
                    tabContent.style.opacity = 1;
                }, 10);
            }
        });
    });

    // Inicializa a primeira tab
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    // Calculadora Elétrica (Existente)
    const calculatorForm = document.getElementById('electrical-calculator');
    const btnCalcular = document.getElementById('btn-calcular');
    const btnLimpar = document.getElementById('btn-limpar');
    const resultadoDiv = document.getElementById('resultado');

    if (btnCalcular && btnLimpar) {
        btnCalcular.addEventListener('click', calcularDimensionamento);
        btnLimpar.addEventListener('click', resetForm);
    }

    function calcularDimensionamento() {
        const sistema = document.getElementById('sistema').value;
        const potencia = parseFloat(document.getElementById('potencia').value);
        const tensao = parseFloat(document.getElementById('tensao').value);
        const comprimento = parseFloat(document.getElementById('comprimento').value);

        // Validação
        if (isNaN(potencia) || isNaN(tensao) || isNaN(comprimento)) {
            if (resultadoDiv) {
                resultadoDiv.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Preencha todos os campos com valores válidos</div>';
            }
            return;
        }

        // Cálculos
        let corrente, bitola, quedaTensao;
        
        if (sistema === 'monofasico') {
            corrente = potencia / tensao;
        } else {
            corrente = potencia / (tensao * Math.sqrt(3));
        }
        
        bitola = calcularBitola(corrente);
        quedaTensao = calcularQuedaTensao(corrente, comprimento, bitola, sistema);

        // Exibir resultados
        if (resultadoDiv) {
            resultadoDiv.innerHTML = `
                <h4><i class="fas fa-clipboard-list"></i> Resultados</h4>
                <ul class="result-list">
                    <li><strong>Corrente:</strong> ${corrente.toFixed(2)} A</li>
                    <li><strong>Bitola recomendada:</strong> ${bitola} mm²</li>
                    <li><strong>Queda de tensão:</strong> ${quedaTensao.toFixed(2)} V (${((quedaTensao/tensao)*100).toFixed(2)}%)</li>
                </ul>
                <p class="table-note"><i class="fas fa-info-circle"></i> Baseado na NBR 5410 para condutores de cobre em PVC</p>
            `;
        }
    }

    function calcularBitola(corrente) {
        if (corrente <= 15) return 1.5;
        if (corrente <= 20) return 2.5;
        if (corrente <= 28) return 4.0;
        if (corrente <= 36) return 6.0;
        if (corrente <= 50) return 10.0;
        return 16.0;
    }

    function calcularQuedaTensao(corrente, comprimento, bitola, sistema) {
        const resistividade = 0.0178; // Ohm.mm²/m (cobre)
        let fatorSistema = sistema === 'monofasico' ? 2 : 1.732;
        let resistencia = (resistividade * comprimento * fatorSistema) / bitola;
        return corrente * resistencia;
    }

    function resetForm() {
        if (calculatorForm) calculatorForm.reset();
        if (resultadoDiv) resultadoDiv.innerHTML = '';
    }

    // Animação para cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
});

// Funções adicionais podem ser incluídas aqui sem substituir as existentes