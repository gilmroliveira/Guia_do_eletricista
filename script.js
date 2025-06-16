// Estados isolados por página
const states = {
    calculadora: { sistema: 'monofasico', potencia: 0, tensao: 220, comprimento: 0 },
    projetoOnline: { comodoCount: 0, tueCounts: [] },
    projetoImagem: { annotations: [], canvas: null, context: null, image: null, isDrawing: false, draggingIndex: null },
    projetoBIM: { annotations: [], canvas: null, context: null, image: null, isDrawing: false, draggingIndex: null },
    cadEditor: { elements: [], canvas: null, context: null, isDrawing: false, startX: 0, startY: 0 }
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
    states.cadEditor.canvas.addEventListener('mousedown', startDrawing);
    states.cadEditor.canvas.addEventListener('mousemove', draw);
    states.cadEditor.canvas.addEventListener('mouseup', stopDrawing);
    states.cadEditor.canvas.addEventListener('mouseleave', stopDrawing);
    redrawCADCanvas();
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
                        return { type: 'line', x1: entity.vertices[0].x, y1: entity.vertices[0].y, x2: entity.vertices[1].x, y2: entity.vertices[1].y };
                    }
                    return null;
                }).filter(e => e);
                redrawCADCanvas();
            } catch (error) {
                document.getElementById('cadResult').innerHTML = `<p class="error">Erro ao carregar DXF: ${error.message}</p>`;
            }
        };
        reader.readAsText(file);
    }
}

function startDrawing(e) {
    if (!states.cadEditor.isDrawing) {
        const rect = states.cadEditor.canvas.getBoundingClientRect();
        states.cadEditor.startX = e.clientX - rect.left;
        states.cadEditor.startY = e.clientY - rect.top;
        states.cadEditor.isDrawing = true;
    }
}

function draw(e) {
    if (states.cadEditor.isDrawing) {
        const rect = states.cadEditor.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        redrawCADCanvas();
        states.cadEditor.context.beginPath();
        states.cadEditor.context.moveTo(states.cadEditor.startX, states.cadEditor.startY);
        states.cadEditor.context.lineTo(currentX, currentY);
        states.cadEditor.context.strokeStyle = 'blue';
        states.cadEditor.context.stroke();
    }
}

function stopDrawing(e) {
    if (states.cadEditor.isDrawing) {
        const rect = states.cadEditor.canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        states.cadEditor.elements.push({ type: 'line', x1: states.cadEditor.startX, y1: states.cadEditor.startY, x2: endX, y2: endY });
        states.cadEditor.isDrawing = false;
        redrawCADCanvas();
    }
}

function addElement(type) {
    const canvas = states.cadEditor.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    if (type === 'rect') {
        states.cadEditor.elements.push({ type: 'rect', x: x - 25, y: y - 25, width: 50, height: 50 });
    } else if (type === 'pontoLuz') {
        states.cadEditor.elements.push({ type: 'circle', x, y, radius: 5, label: 'Ponto de Luz' });
    }
    redrawCADCanvas();
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
}

function clearCAD() {
    states.cadEditor.elements = [];
    redrawCADCanvas();
    document.getElementById('cadResult').innerHTML = '';
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