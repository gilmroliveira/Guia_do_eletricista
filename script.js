// Estados isolados por página (mantidos como estavam)
const states = {
    calculadora: { sistema: 'monofasico', potencia: 0, tensao: 220, comprimento: 0 },
    projetoOnline: { comodoCount: 0, tueCounts: [] },
    projetoImagem: { annotations: [], canvas: null, context: null, image: null, isDrawing: false, draggingIndex: null },
    projetoBIM: { annotations: [], canvas: null, context: null, image: null, isDrawing: false, draggingIndex: null }
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
    if (document.getElementById('projeto-bim-eletrico')) initBIMProject();
});

// Calculadora (index.html) - Mantida como estava
function calcularDimensionamento() {
    const { potencia, tensao, comprimento } = states.calculadora;
    const sistema = document.getElementById('sistema').value;
    const resultado = document.getElementById('resultado');

    const p = parseFloat(document.getElementById('potencia').value) || 0;
    const t = parseFloat(document.getElementById('tensao').value) || 220;
    const c = parseFloat(document.getElementById('comprimento').value) || 0;

    if (p <= 0 || t <= 0) {
        document.getElementById('potencia-error').textContent = 'Valores inválidos.';
        resultado.innerHTML = '';
        return;
    }

    const corrente = (sistema === 'monofasico') ? p / t : p / (t * Math.sqrt(3));
    const quedaTensao = (2 * corrente * c * 0.017) / t * 100;
    const bitolaMinima = Math.ceil(corrente / 10) * 2.5;

    resultado.innerHTML = `<p>Corrente: ${corrente.toFixed(2)} A</p><p>Queda: ${quedaTensao.toFixed(2)} %</p><p>Bitola: ${bitolaMinima} mm²</p><p class="error">Consulte NBR 5410.</p>`;
    document.getElementById('potencia-error').textContent = '';
}

function resetForm() {
    document.getElementById('sistema').value = 'monofasico';
    document.getElementById('potencia').value = '';
    document.getElementById('tensao').value = '220';
    document.getElementById('comprimento').value = '';
    document.getElementById('resultado').innerHTML = '';
    document.getElementById('potencia-error').textContent = '';
}

// Projeto Online - Mantido como estava
function initProjetoOnline() {
    states.projetoOnline.comodoCount = 0;
    states.projetoOnline.tueCounts = [];
    addComodoField();
}

function addComodoField() {
    const container = document.getElementById('containerComodos');
    if (!container) return;

    const item = document.createElement('div');
    item.className = 'comodo-item';
    item.dataset.id = states.projetoOnline.comodoCount;
    item.innerHTML = `
        <h3>Cômodo ${states.projetoOnline.comodoCount + 1}</h3>
        <div class="form-group"><label for="nome_${states.projetoOnline.comodoCount}">Nome:</label><input type="text" id="nome_${states.projetoOnline.comodoCount}" value="Cômodo ${states.projetoOnline.comodoCount + 1}" required></div>
        <div class="form-group"><label for="tipo_${states.projetoOnline.comodoCount}">Tipo:</label><select id="tipo_${states.projetoOnline.comodoCount}"><option value="sala">Sala</option><option value="quarto">Quarto</option></select></div>
        <div class="form-group"><label for="area_${states.projetoOnline.comodoCount}">Área (m²):</label><input type="number" id="area_${states.projetoOnline.comodoCount}" min="1" value="15" required></div>
        <div class="tue-container"><button type="button" class="btn btn-add" onclick="addTUEField(${states.projetoOnline.comodoCount})">+ TUE</button><div id="tue_${states.projetoOnline.comodoCount}"></div></div>
        <button type="button" class="btn btn-remove" onclick="removeComodoField(this)">- Remover</button>
    `;
    container.appendChild(item);
    states.projetoOnline.tueCounts[states.projetoOnline.comodoCount] = 0;
    states.projetoOnline.comodoCount++;
}

function addTUEField(comodoId) {
    const tueContainer = document.getElementById(`tue_${comodoId}`);
    if (!tueContainer) return;

    const tueIndex = states.projetoOnline.tueCounts[comodoId]++;
    const tueItem = document.createElement('div');
    tueItem.className = 'tue-item';
    tueItem.innerHTML = `
        <div class="form-group"><label for="tueNome_${comodoId}_${tueIndex}">Nome:</label><input type="text" id="tueNome_${comodoId}_${tueIndex}" placeholder="Ex.: Chuveiro"></div>
        <div class="form-group"><label for="tuePot_${comodoId}_${tueIndex}">Potência (W):</label><input type="number" id="tuePot_${comodoId}_${tueIndex}" min="0" placeholder="Ex.: 5400"></div>
        <button type="button" class="btn btn-remove" onclick="removeTUEField(${comodoId}, this)">- Remover</button>
    `;
    tueContainer.appendChild(tueItem);
}

function removeTUEField(comodoId, button) {
    if (button.parentElement) button.parentElement.remove();
}

function removeComodoField(button) {
    if (button.parentElement) button.parentElement.remove();
    states.projetoOnline.comodoCount--;
}

function resetProjetoOnlineForm() {
    const container = document.getElementById('containerComodos');
    if (container) container.innerHTML = '';
    states.projetoOnline.comodoCount = 0;
    states.projetoOnline.tueCounts = [];
    initProjetoOnline();
    document.getElementById('resultadoProjetoOnline').innerHTML = '';
}

function calcularProjetoOnline() {
    const tensao = parseFloat(document.getElementById('tensaoPrincipal').value);
    const comodos = [];
    const resultado = document.getElementById('resultadoProjetoOnline');

    if (!tensao) {
        resultado.innerHTML = '<p class="error">Selecione uma tensão.</p>';
        return;
    }

    for (let i = 0; i < states.projetoOnline.comodoCount; i++) {
        const nome = document.getElementById(`nome_${i}`)?.value;
        const tipo = document.getElementById(`tipo_${i}`)?.value;
        const area = parseFloat(document.getElementById(`area_${i}`)?.value) || 0;
        const tueContainer = document.getElementById(`tue_${i}`)?.children || [];
        const tue = [];

        if (!nome || area <= 0) continue;

        for (let j = 0; j < tueContainer.length; j++) {
            const tueNome = document.getElementById(`tueNome_${i}_${j}`)?.value;
            const tuePot = parseFloat(document.getElementById(`tuePot_${i}_${j}`)?.value) || 0;
            if (tueNome && tuePot > 0) tue.push({ nome: tueNome, potencia: tuePot });
        }

        comodos.push({ nome, tipo, area, tue });
    }

    if (!comodos.length) {
        resultado.innerHTML = '<p class="error">Adicione um cômodo.</p>';
        return;
    }

    const totalPotencia = comodos.reduce((sum, c) => sum + c.tue.reduce((s, t) => s + t.potencia, 0), 0);
    const correnteTotal = totalPotencia / tensao;
    const bitolaMinima = Math.ceil(correnteTotal / 10) * 2.5;

    resultado.innerHTML = `
        <h3>Relatório</h3>
        <p>Tensão: ${tensao} V</p>
        <p>Demanda Total: ${(totalPotencia / 1000).toFixed(2)} kVA</p>
        <p>Corrente Total: ${correnteTotal.toFixed(2)} A</p>
        <p>Bitola Mínima: ${bitolaMinima} mm²</p>
        <p class="error">Consulte NBR 5410 e um engenheiro.</p>
    `;
}

// Projeto Imagem - Mantido como estava
function initImageProject() {
    states.projetoImagem.canvas = document.getElementById('annotationCanvas');
    states.projetoImagem.context = states.projetoImagem.canvas?.getContext('2d');
}

function loadImage() {
    const file = document.getElementById('plantaUpload').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                states.projetoImagem.image = img;
                const canvas = states.projetoImagem.canvas;
                const container = document.getElementById('canvasContainer');
                canvas.width = container.offsetWidth;
                canvas.height = img.height * (container.offsetWidth / img.width);
                document.getElementById('plantaImagem').src = e.target.result;
                document.getElementById('plantaImagem').style.display = 'block';
                redrawImageCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function addAnnotation() {
    if (states.projetoImagem.canvas && states.projetoImagem.image) {
        const rect = states.projetoImagem.canvas.getBoundingClientRect();
        const x = rect.width / 2;
        const y = rect.height / 2;
        states.projetoImagem.annotations.push({ x, y, type: 'ponto', label: 'Ponto' });
        redrawImageCanvas();
    }
}

function redrawImageCanvas() {
    if (states.projetoImagem.context && states.projetoImagem.image) {
        const ctx = states.projetoImagem.context;
        ctx.clearRect(0, 0, states.projetoImagem.canvas.width, states.projetoImagem.canvas.height);
        ctx.drawImage(states.projetoImagem.image, 0, 0, states.projetoImagem.canvas.width, states.projetoImagem.canvas.height);
        states.projetoImagem.annotations.forEach(ann => {
            ctx.beginPath();
            ctx.arc(ann.x, ann.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText(ann.label, ann.x + 10, ann.y - 5);
        });
    }
}

function generateImageProject() {
    const tensao = parseFloat(document.getElementById('tensaoImagem').value);
    const resultado = document.getElementById('resultadoImagem');

    if (!tensao) {
        resultado.innerHTML = '<p class="error">Selecione uma tensão.</p>';
        return;
    }

    resultado.innerHTML = `<p>Tensão: ${tensao} V</p><p>Anotações: ${states.projetoImagem.annotations.length}</p><p class="error">Consulte NBR 5410.</p>`;
}

function resetImageForm() {
    document.getElementById('plantaUpload').value = '';
    document.getElementById('tensaoImagem').value = '';
    document.getElementById('plantaImagem').style.display = 'none';
    states.projetoImagem.canvas.width = 0;
    states.projetoImagem.annotations = [];
    document.getElementById('resultadoImagem').innerHTML = '';
}

// Projeto BIM - Mantido como estava
function initBIMProject() {
    states.projetoBIM.canvas = document.getElementById('annotationBIMCanvas');
    states.projetoBIM.context = states.projetoBIM.canvas?.getContext('2d');
}

function loadBIMImage() {
    const file = document.getElementById('plantaBIMUpload').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                states.projetoBIM.image = img;
                const canvas = states.projetoBIM.canvas;
                const container = document.getElementById('canvasBIMContainer');
                canvas.width = container.offsetWidth;
                canvas.height = img.height * (container.offsetWidth / img.width);
                document.getElementById('plantaBIMImagem').src = e.target.result;
                document.getElementById('plantaBIMImagem').style.display = 'block';
                redrawBIMCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function updateAnnotationOptions() {
    const type = document.getElementById('annotationType').value;
    document.getElementById('annotationOptions').style.display = ['cabos', 'outro'].includes(type) ? 'none' : 'block';
}

function addBIMAnnotation() {
    if (states.projetoBIM.canvas && states.projetoBIM.image) {
        const type = document.getElementById('annotationType').value;
        const power = parseFloat(document.getElementById('annotationPower').value) || 0;
        const rect = states.projetoBIM.canvas.getBoundingClientRect();
        const x = rect.width / 2;
        const y = rect.height / 2;
        states.projetoBIM.annotations.push({ x, y, type, power, label: `${type} (${power}W)` });
        redrawBIMCanvas();
    }
}

function redrawBIMCanvas() {
    if (states.projetoBIM.context && states.projetoBIM.image) {
        const ctx = states.projetoBIM.context;
        ctx.clearRect(0, 0, states.projetoBIM.canvas.width, states.projetoBIM.canvas.height);
        ctx.drawImage(states.projetoBIM.image, 0, 0, states.projetoBIM.canvas.width, states.projetoBIM.canvas.height);
        states.projetoBIM.annotations.forEach(ann => {
            ctx.beginPath();
            ctx.arc(ann.x, ann.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText(ann.label, ann.x + 10, ann.y - 5);
        });
    }
}

function generateBIMProject() {
    const tensao = parseFloat(document.getElementById('tensaoBIM').value);
    const resultado = document.getElementById('resultadoBIM');

    if (!tensao) {
        resultado.innerHTML = '<p class="error">Selecione uma tensão.</p>';
        return;
    }

    const totalPotencia = states.projetoBIM.annotations.reduce((sum, ann) => sum + (ann.power || 0), 0);
    const correnteTotal = totalPotencia / tensao;
    const bitolaMinima = Math.ceil(correnteTotal / 10) * 2.5;

    resultado.innerHTML = `
        <div class="bim-report">
            <h3>Relatório BIM</h3>
            <p>Tensão: ${tensao} V</p>
            <p>Demanda: ${(totalPotencia / 1000).toFixed(2)} kVA</p>
            <p>Corrente: ${correnteTotal.toFixed(2)} A</p>
            <p>Bitola: ${bitolaMinima} mm²</p>
            <ul>${states.projetoBIM.annotations.map(ann => `<li>${ann.label}</li>`).join('')}</ul>
            <p class="error">Consulte NBR 5410.</p>
        </div>
    `;
}

function exportBIMReport() {
    const resultado = document.getElementById('resultadoBIM').innerHTML;
    if (resultado) {
        const blob = new Blob([resultado], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_bim_${new Date().toISOString().slice(0, 10)}.html`;
        link.click();
    }
}

function resetBIMForm() {
    document.getElementById('plantaBIMUpload').value = '';
    document.getElementById('tensaoBIM').value = '';
    document.getElementById('annotationType').value = 'pontoLuz';
    document.getElementById('annotationPower').value = '';
    document.getElementById('plantaBIMImagem').style.display = 'none';
    states.projetoBIM.canvas.width = 0;
    states.projetoBIM.annotations = [];
    document.getElementById('resultadoBIM').innerHTML = '';
    document.getElementById('annotationOptions').style.display = 'none';
}

// Nova função para instruções de conversão DXF
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