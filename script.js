// Estados isolados por página
const states = {
    calculadora: { sistema: 'monofasico', potencia: 0, tensao: 220, comprimento: 0 },
    projetoOnline: { comodoCount: 0, tueCounts: [] },
    projetoImagem: { annotations: [], canvas: null, context: null, image: null, isDrawing: false, draggingIndex: null },
    projetoBIM: { annotations: [], canvas: null, context: null, image: null, isDrawing: false, draggingIndex: null },
    cadEditor: { elements: [], canvas: null, context: null, isDrawing: false, startX: 0, startY: 0, currentTool: null }
};

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.id || 'index';
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.setAttribute('aria-selected', 'false'));
            button.setAttribute('aria-selected', 'true');
            document.querySelectorAll('.tab-content').forEach(content => content.setAttribute('aria-hidden', 'true'));
            document.getElementById(button.dataset.tab).setAttribute('aria-hidden', 'false');
        });
    });

    if (document.getElementById('projeto-online')) initProjetoOnline();
    if (document.getElementById('projeto-imagem')) initImageProject();
    if (document.getElementById('projeto-bim-eletrico')) {
        initBIMProject();
        initCADEditor();
    }
});

// Calculadora, Projeto Online, Projeto Imagem - Mantidos como estavam
// (código omitido para brevidade, copie da versão anterior)

// Projeto BIM - Mantido como estava
// (código omitido para brevidade, copie da versão anterior)

// Nova funcionalidade: Editor CAD
function initCADEditor() {
    states.cadEditor.canvas = document.getElementById('cadCanvas');
    states.cadEditor.context = states.cadEditor.canvas.getContext('2d');

    // Vincular eventos aos botões
    document.getElementById('btnLine').addEventListener('click', () => setTool('line'));
    document.getElementById('btnRect').addEventListener('click', () => setTool('rect'));
    document.getElementById('btnPontoLuz').addEventListener('click', () => setTool('pontoLuz'));
    document.getElementById('btnExport').addEventListener('click', exportCAD);
    document.getElementById('btnClear').addEventListener('click', clearCAD);

    states.cadEditor.canvas.addEventListener('mousedown', startDrawing);
    states.cadEditor.canvas.addEventListener('mousemove', draw);
    states.cadEditor.canvas.addEventListener('mouseup', stopDrawing);
    states.cadEditor.canvas.addEventListener('mouseleave', stopDrawing);
    redrawCADCanvas();
}

function setTool(tool) {
    states.cadEditor.currentTool = tool;
    states.cadEditor.isDrawing = false;
    document.getElementById('cadResult').innerHTML = `<p>Ferramenta selecionada: ${tool}</p>`;
}

function loadDXF() {
    const file = document.getElementById('dxfUploadCAD').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const parser = new DXFParser();
            try {
                const dxf = parser.parseSync(e.target.result);
                states.cadEditor.elements = dxf.entities.map(entity => {
                    if (entity.type === 'LINE') {
                        return { type: 'line', x1: entity.vertices[0].x / 10, y1: entity.vertices[0].y / 10, x2: entity.vertices[1].x / 10, y2: entity.vertices[1].y / 10 }; // Ajuste de escala
                    }
                    return null;
                }).filter(e => e);
                // Adicionar elementos elétricos iniciais
                const canvasWidth = states.cadEditor.canvas.width;
                const canvasHeight = states.cadEditor.canvas.height;
                states.cadEditor.elements.push({ type: 'circle', x: canvasWidth / 4, y: canvasHeight / 4, radius: 5, label: 'Ponto de Luz (60W)', power: 60 });
                states.cadEditor.elements.push({ type: 'rect', x: canvasWidth / 2 - 10, y: canvasHeight / 2 - 10, width: 20, height: 20, label: 'Tomada (1000W)', power: 1000 });
                redrawCADCanvas();
                document.getElementById('cadResult').innerHTML = '<p>DXF carregado com sucesso. Elementos elétricos adicionados.</p>';
            } catch (error) {
                document.getElementById('cadResult').innerHTML = `<p class="error">Erro ao carregar DXF: ${error.message}</p>`;
            }
        };
        reader.readAsText(file);
    }
}

function startDrawing(e) {
    if (states.cadEditor.currentTool && ['line', 'rect'].includes(states.cadEditor.currentTool)) {
        const rect = states.cadEditor.canvas.getBoundingClientRect();
        states.cadEditor.startX = e.clientX - rect.left;
        states.cadEditor.startY = e.clientY - rect.top;
        states.cadEditor.isDrawing = true;
    }
}

function draw(e) {
    if (states.cadEditor.isDrawing && states.cadEditor.currentTool) {
        const rect = states.cadEditor.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        redrawCADCanvas();
        states.cadEditor.context.beginPath();
        if (states.cadEditor.currentTool === 'line') {
            states.cadEditor.context.moveTo(states.cadEditor.startX, states.cadEditor.startY);
            states.cadEditor.context.lineTo(currentX, currentY);
        } else if (states.cadEditor.currentTool === 'rect') {
            const width = currentX - states.cadEditor.startX;
            const height = currentY - states.cadEditor.startY;
            states.cadEditor.context.rect(states.cadEditor.startX, states.cadEditor.startY, width, height);
        }
        states.cadEditor.context.strokeStyle = 'blue';
        states.cadEditor.context.stroke();
    }
}

function stopDrawing(e) {
    if (states.cadEditor.isDrawing && states.cadEditor.currentTool) {
        const rect = states.cadEditor.canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        if (states.cadEditor.currentTool === 'line') {
            states.cadEditor.elements.push({ type: 'line', x1: states.cadEditor.startX, y1: states.cadEditor.startY, x2: endX, y2: endY });
        } else if (states.cadEditor.currentTool === 'rect') {
            const width = endX - states.cadEditor.startX;
            const height = endY - states.cadEditor.startY;
            states.cadEditor.elements.push({ type: 'rect', x: states.cadEditor.startX, y: states.cadEditor.startY, width, height });
        }
        states.cadEditor.isDrawing = false;
        redrawCADCanvas();
    } else if (states.cadEditor.currentTool === 'pontoLuz') {
        const rect = states.cadEditor.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        states.cadEditor.elements.push({ type: 'circle', x, y, radius: 5, label: 'Ponto de Luz (60W)', power: 60 });
        redrawCADCanvas();
    }
}

function addElement(type) {
    states.cadEditor.currentTool = type;
    document.getElementById('cadResult').innerHTML = `<p>Ferramenta selecionada: ${type}</p>`;
    if (type === 'pontoLuz') {
        states.cadEditor.canvas.dispatchEvent(new Event('mousedown'));
        states.cadEditor.canvas.dispatchEvent(new Event('mouseup'));
    }
}

function redrawCADCanvas() {
    const ctx = states.cadEditor.context;
    ctx.clearRect(0, 0, states.cadEditor.canvas.width, states.cadEditor.canvas.height);
    states.cadEditor.elements.forEach(element => {
        ctx.beginPath();
        if (element.type === 'line') {
            ctx.moveTo(element.x1, element.y1);
            ctx.lineTo(element.x2, element.y2);
            ctx.strokeStyle = 'black';
            ctx.stroke();
        } else if (element.type === 'rect') {
            ctx.rect(element.x, element.y, element.width, element.height);
            ctx.strokeStyle = 'black';
            ctx.stroke();
        } else if (element.type === 'circle') {
            ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'yellow';
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText(element.label, element.x + 10, element.y - 5);
        }
    });
}

function exportCAD() {
    const canvas = states.cadEditor.canvas;
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `planta_eletrica_${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    document.getElementById('cadResult').innerHTML = '<p>Exportado como PNG.</p>';

    // Cálculo básico
    const tensao = parseFloat(document.getElementById('tensaoBIM').value) || 220;
    const totalPotencia = states.cadEditor.elements.reduce((sum, el) => sum + (el.power || 0), 0);
    const correnteTotal = totalPotencia / tensao;
    const bitolaMinima = Math.ceil(correnteTotal / 10) * 2.5;
    document.getElementById('cadResult').innerHTML += `<p>Demanda: ${(totalPotencia / 1000).toFixed(2)} kVA | Corrente: ${correnteTotal.toFixed(2)} A | Bitola: ${bitolaMinima} mm²</p>`;
}

function clearCAD() {
    states.cadEditor.elements = [];
    states.cadEditor.currentTool = null;
    redrawCADCanvas();
    document.getElementById('cadResult').innerHTML = '<p>Canvas limpo.</p>';
}

// Função de instruções DXF - Mantida como estava
function guideUser() {
    const file = document.getElementById('dxfInput').files[0];
    if (file) {
        document.getElementById('dxfResult').innerHTML = `
            <p>Baixe o repositório <a href="https://github.com/antonioaja/dxf2elmt" target="_blank">dxf2elmt</a>, compile com Rust (cargo build --release) e execute no terminal com: <code>dxf2elmt ${file.name}</code>. O arquivo .elmt gerado pode ser aberto no QElectroTech para edição de plantas elétricas.</p>
        `;
    } else {
        document.getElementById('dxfResult').innerHTML = '<p class="error">Por favor, selecione um arquivo DXF.</p>';
    }
}

// Interatividade - Mantida como estava
['annotationCanvas', 'annotationBIMCanvas'].forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
        canvas.addEventListener('mousedown', (e) => {
            const state = id === 'annotationCanvas' ? states.projetoImagem : states.projetoBIM;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            state.annotations.forEach((ann, index) => {
                if (Math.hypot(x - ann.x, y - ann.y) < 10) {
                    state.isDrawing = true;
                    state.draggingIndex = index;
                }
            });
        });

        canvas.addEventListener('mousemove', (e) => {
            const state = id === 'annotationCanvas' ? states.projetoImagem : states.projetoBIM;
            if (state.isDrawing && state.draggingIndex !== undefined) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                state.annotations[state.draggingIndex].x = x;
                state.annotations[state.draggingIndex].y = y;
                redrawImageCanvas();
                redrawBIMCanvas();
            }
        });

        canvas.addEventListener('mouseup', () => {
            const state = id === 'annotationCanvas' ? states.projetoImagem : states.projetoBIM;
            state.isDrawing = false;
            state.draggingIndex = undefined;
        });

        canvas.addEventListener('mouseleave', () => {
            const state = id === 'annotationCanvas' ? states.projetoImagem : states.projetoBIM;
            state.isDrawing = false;
            state.draggingIndex = undefined;
        });
    }
});