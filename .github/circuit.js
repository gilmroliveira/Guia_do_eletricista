// circuit.js - Simulador de Circuitos Avançado
class CircuitSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.components = [];
        this.connections = [];
        this.selectedTool = null;
        this.dragging = false;
        this.selectedComponent = null;
        
        // Dimensões do canvas
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Inicialização
        this.initEventListeners();
        this.setupDefaultCircuit();
        this.render();
    }

    initEventListeners() {
        // Eventos do canvas
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Eventos de botões (conectados ao HTML)
        document.querySelectorAll('[data-component]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedTool = btn.dataset.component;
                this.updateStatus(`Modo: Adicionar ${btn.dataset.component}`);
            });
        });
        
        document.getElementById('simulate-btn').addEventListener('click', this.simulateCircuit.bind(this));
        document.getElementById('clear-btn').addEventListener('click', this.clearCircuit.bind(this));
    }

    setupDefaultCircuit() {
        // Adiciona alguns componentes iniciais para demonstração
        this.addComponent('battery', this.canvas.width * 0.25, this.canvas.height * 0.5);
        this.addComponent('lamp', this.canvas.width * 0.75, this.canvas.height * 0.5);
    }

    addComponent(type, x, y) {
        const component = {
            id: Date.now().toString(36),
            type,
            x,
            y,
            rotation: 0,
            properties: this.getDefaultProperties(type),
            connections: []
        };
        
        this.components.push(component);
        this.updateStatus(`Componente ${type} adicionado`);
        this.render();
        return component;
    }

    getDefaultProperties(type) {
        const defaults = {
            battery: { voltage: 12, internalResistance: 0.1 },
            resistor: { resistance: 100, tolerance: 5 },
            lamp: { resistance: 60, nominalVoltage: 12 },
            switch: { isClosed: false }
        };
        return defaults[type] || {};
    }

    // ... (implementar outros métodos necessários)

    render() {
        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha conexões primeiro
        this.drawConnections();
        
        // Desenha componentes
        this.components.forEach(component => {
            this.drawComponent(component);
        });
        
        // Desenha componente sendo arrastado
        if (this.dragging && this.selectedComponent) {
            this.drawComponent(this.selectedComponent, true);
        }
    }

    drawComponent(component, isDragging = false) {
        this.ctx.save();
        this.ctx.translate(component.x, component.y);
        this.ctx.rotate(component.rotation);
        
        switch(component.type) {
            case 'battery':
                this.drawBattery(component, isDragging);
                break;
            case 'resistor':
                this.drawResistor(component, isDragging);
                break;
            case 'lamp':
                this.drawLamp(component, isDragging);
                break;
            case 'switch':
                this.drawSwitch(component, isDragging);
                break;
        }
        
        this.ctx.restore();
    }

    drawBattery(component, isDragging) {
        // Implementação do desenho da bateria
        this.ctx.fillStyle = isDragging ? 'rgba(255, 235, 59, 0.7)' : '#ffeb3b';
        this.ctx.fillRect(-20, -30, 40, 60);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-20, -30, 40, 60);
        
        // Terminais
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-5, -40, 10, 10); // Terminal positivo
        this.ctx.fillRect(-5, 30, 10, 10);  // Terminal negativo
        
        // Símbolos
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('+', 0, -10);
        this.ctx.fillText('-', 0, 10);
        
        // Valor da tensão
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${component.properties.voltage}V`, 0, 25);
    }

    // ... (implementar outros métodos de desenho)

    simulateCircuit() {
        // Lógica de simulação do circuito
        this.updateStatus("Simulando circuito...");
        
        // Cálculos básicos de circuito
        let totalResistance = 0;
        let totalVoltage = 0;
        
        this.components.forEach(comp => {
            if (comp.type === 'battery') {
                totalVoltage += comp.properties.voltage;
            } else if (comp.type === 'resistor' || comp.type === 'lamp') {
                totalResistance += comp.properties.resistance;
            }
        });
        
        const current = totalVoltage / totalResistance;
        
        // Atualiza medições
        document.getElementById('voltage-value').textContent = `${totalVoltage.toFixed(2)} V`;
        document.getElementById('current-value').textContent = `${current.toFixed(2)} A`;
        document.getElementById('power-value').textContent = `${(totalVoltage * current).toFixed(2)} W`;
        
        this.updateStatus("Simulação concluída");
    }

    updateStatus(message) {
        console.log(`[Circuit Simulator] ${message}`);
        // Pode ser implementado para mostrar na UI
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const circuitSimulator = new CircuitSimulator('circuit-canvas');
});