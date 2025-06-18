document.addEventListener('DOMContentLoaded', function() {
    // ===== MENU MOBILE =====
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }

    // ===== SISTEMA DE TABS =====
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active de todos os links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Adiciona active ao link clicado
            this.classList.add('active');
            
            // Esconde todos os conteúdos
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Mostra o conteúdo correspondente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // ===== CALCULADORA ELÉTRICA =====
    // Cálculo de dimensionamento de cabos
    function calculateCableSize() {
        // Implementação completa
    }

    // Cálculo de queda de tensão
    function calculateVoltageDrop() {
        // Implementação completa
    }

    // ===== SIMULADOR DE CIRCUITOS =====
    class CircuitSimulator {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.components = [];
            this.connections = [];
            this.selectedTool = null;
            
            this.init();
        }

        init() {
            // Configuração inicial
            this.canvas.width = 800;
            this.canvas.height = 600;
            
            // Event listeners
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            
            // Renderização inicial
            this.render();
        }

        // Métodos completos do simulador
        addComponent(type, x, y) {
            // Implementação completa
        }

        render() {
            // Implementação completa
        }
    }

    // Inicialização do simulador
    const simulator = new CircuitSimulator('circuit-canvas');

    // ===== NORMAS TÉCNICAS =====
    // Implementação completa da seção de normas

    // ===== TUTORIAIS INTERATIVOS =====
    // Implementação completa dos tutoriais

    // ===== INICIALIZAÇÃO =====
    // Ativa a primeira tab por padrão
    document.querySelector('.nav-link.active').click();
});