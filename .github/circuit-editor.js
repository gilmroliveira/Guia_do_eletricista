// ====== CIRCUIT EDITOR (Web Component) - Versão Melhorada ====== //
class CircuitEditor extends HTMLElement {
  constructor() {
    super();
    this.components = [];
    this.selectedTool = null;
    this.dragging = false;
    this.connectionMode = false;
    this.connectionStart = null;
    
    // Configuração do Shadow DOM
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          overflow: hidden;
          background: var(--editor-bg, #f9f9f9);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        canvas {
          background: var(--canvas-bg, #fff);
          cursor: crosshair;
          display: block;
          width: 100%;
          height: 100%;
        }
        
        .toolbar {
          background: var(--toolbar-bg, #2c3e50);
          padding: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        button {
          background: var(--button-bg, #3498db);
          color: var(--button-text, white);
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }
        
        button:hover {
          background: var(--button-hover, #2980b9);
          transform: translateY(-1px);
        }
        
        button.active {
          background: var(--button-active, #1a5276);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .status-bar {
          background: var(--status-bg, #34495e);
          color: var(--status-text, white);
          padding: 6px 10px;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
        }
      </style>
      
      <div class="toolbar">
        <button data-component="battery" title="Adicionar fonte">
          <i class="icon">🔋</i> Fonte
        </button>
        <button data-component="resistor" title="Adicionar resistor">
          <i class="icon">🔄</i> Resistor
        </button>
        <button data-component="lamp" title="Adicionar lâmpada">
          <i class="icon">💡</i> Lâmpada
        </button>
        <button data-component="wire" title="Modo conexão" id="wire-btn">
          <i class="icon">🔌</i> Conectar
        </button>
        <button data-action="clear" title="Limpar tudo">
          <i class="icon">🗑️</i> Limpar
        </button>
      </div>
      
      <canvas width="800" height="500"></canvas>
      
      <div class="status-bar">
        <span id="status">Pronto</span>
        <span id="coordinates">X: 0, Y: 0</span>
      </div>
    `;
  }

  connectedCallback() {
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.wireBtn = this.shadowRoot.getElementById('wire-btn');
    this.statusElement = this.shadowRoot.getElementById('status');
    this.coordsElement = this.shadowRoot.getElementById('coordinates');
    
    this.setupEventListeners();
    this.render();
    this.adjustCanvasSize();
    
    // Redimensionar quando a janela mudar de tamanho
    window.addEventListener('resize', this.adjustCanvasSize.bind(this));
  }

  adjustCanvasSize() {
    const container = this.getBoundingClientRect();
    this.canvas.width = container.width;
    this.canvas.height = container.height * 0.8; // 80% da altura para o canvas
    this.render();
  }

  setupEventListeners() {
    // Toolbar buttons
    this.shadowRoot.querySelectorAll('.toolbar button[data-component]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedTool = btn.dataset.component;
        this.connectionMode = false;
        this.wireBtn.classList.remove('active');
        this.updateStatus(`Modo: Adicionar ${btn.dataset.component}`);
      });
    });

    // Botão de conexão
    this.wireBtn.addEventListener('click', () => {
      this.connectionMode = !this.connectionMode;
      this.selectedTool = null;
      this.wireBtn.classList.toggle('active', this.connectionMode);
      this.updateStatus(this.connectionMode ? 'Modo: Conexão - Selecione o primeiro componente' : 'Modo: Seleção');
    });

    // Botão limpar
    this.shadowRoot.querySelector('[data-action="clear"]').addEventListener('click', () => {
      if (confirm('Tem certeza que deseja limpar todos os componentes?')) {
        this.components = [];
        this.render();
        this.updateStatus('Área limpa');
      }
    });

    // Canvas interactions
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.connectionMode) {
      const component = this.findComponentAt(x, y);
      if (component) {
        if (!this.connectionStart) {
          this.connectionStart = component;
          this.updateStatus('Modo: Conexão - Selecione o segundo componente');
        } else {
          this.createConnection(this.connectionStart, component);
          this.connectionStart = null;
          this.updateStatus('Modo: Conexão - Conexão criada');
        }
      }
    } else if (this.selectedTool) {
      this.addComponent(this.selectedTool, x, y);
    }
    
    this.render();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.coordsElement.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    
    // Atualiza o cursor
    if (this.connectionMode && this.findComponentAt(x, y)) {
      this.canvas.style.cursor = 'pointer';
    } else if (this.selectedTool) {
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  handleMouseUp() {
    this.dragging = false;
  }

  handleMouseLeave() {
    this.dragging = false;
  }

  findComponentAt(x, y) {
    return this.components.find(comp => {
      // Lógica simples de detecção de clique - pode ser aprimorada
      return x >= comp.x - 20 && x <= comp.x + 20 && 
             y >= comp.y - 20 && y <= comp.y + 20;
    });
  }

  addComponent(type, x, y) {
    const newComponent = {
      id: Date.now().toString(),
      type,
      x,
      y,
      connections: []
    };
    
    this.components.push(newComponent);
    this.updateStatus(`${type} adicionado em (${Math.round(x)}, ${Math.round(y)})`);
  }

  createConnection(from, to) {
    if (from.id === to.id) return;
    
    if (!from.connections.includes(to.id)) {
      from.connections.push(to.id);
    }
    
    if (!to.connections.includes(from.id)) {
      to.connections.push(from.id);
    }
  }

  render() {
    // Limpa o canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Desenha conexões primeiro (para ficarem atrás dos componentes)
    this.components.forEach(comp => {
      comp.connections.forEach(connId => {
        const target = this.components.find(c => c.id === connId);
        if (target) {
          this.drawConnection(comp, target);
        }
      });
    });
    
    // Desenha componentes
    this.components.forEach(comp => {
      switch(comp.type) {
        case 'battery':
          this.drawBattery(comp.x, comp.y);
          break;
        case 'resistor':
          this.drawResistor(comp.x, comp.y);
          break;
        case 'lamp':
          this.drawLamp(comp.x, comp.y);
          break;
      }
      
      // Desenha o ponto de conexão
      this.drawConnectionPoint(comp.x, comp.y);
    });
    
    // Desenha conexão em andamento
    if (this.connectionStart) {
      const rect = this.canvas.getBoundingClientRect();
      const x = this.connectionStart.x;
      const y = this.connectionStart.y;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(rect.width/2, rect.height/2); // Linha temporária
      this.ctx.strokeStyle = '#3498db';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  // Métodos de desenho aprimorados
  drawBattery(x, y) {
    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.fillRect(x - 15, y - 25, 30, 50);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 15, y - 25, 30, 50);
    
    // Terminais da bateria
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - 5, y - 30, 10, 5); // Terminal positivo
    this.ctx.fillRect(x - 5, y + 25, 10, 5); // Terminal negativo
    
    // Símbolos
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('+', x, y - 10);
    this.ctx.fillText('-', x, y + 10);
  }

  drawResistor(x, y) {
    this.ctx.fillStyle = '#a67c52';
    this.ctx.fillRect(x - 25, y - 10, 50, 20);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 25, y - 10, 50, 20);
    
    // Faixas do resistor
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x - 20, y - 10, 8, 20);
    this.ctx.fillRect(x - 5, y - 10, 8, 20);
    this.ctx.fillRect(x + 10, y - 10, 8, 20);
  }

  drawLamp(x, y) {
    // Bulbo
    this.ctx.beginPath();
    this.ctx.arc(x, y, 15, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Base
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - 5, y + 15, 10, 10);
    
    // Filamento (simplificado)
    this.ctx.beginPath();
    this.ctx.moveTo(x - 8, y - 8);
    this.ctx.lineTo(x + 8, y + 8);
    this.ctx.moveTo(x + 8, y - 8);
    this.ctx.lineTo(x - 8, y + 8);
    this.ctx.strokeStyle = '#f00';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawConnection(from, to) {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  drawConnectionPoint(x, y) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#3498db';
    this.ctx.fill();
  }

  updateStatus(message) {
    this.statusElement.textContent = message;
  }
}

// Registra o Web Component
customElements.define('circuit-editor', CircuitEditor);