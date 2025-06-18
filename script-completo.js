document.addEventListener('DOMContentLoaded', function() {
  // ====== CÓDIGOS EXISTENTES (MANTIDOS) ====== //
  
  // 1. Menu Mobile (original)
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.getElementById('main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      mainNav.classList.toggle('active');
    });
  }

  // 2. Sistema de Tabs (original)
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button, .tab-content').forEach(el => {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
        el.setAttribute('aria-hidden', 'true');
      });

      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      const tabContent = document.getElementById(button.getAttribute('data-tab'));
      if (tabContent) {
        tabContent.classList.add('active');
        tabContent.setAttribute('aria-hidden', 'false');
        tabContent.style.opacity = 0;
        setTimeout(() => tabContent.style.opacity = 1, 10);
      }
    });
  });

  // 3. Calculadora Elétrica (original)
  const calculatorForm = document.getElementById('electrical-calculator');
  if (calculatorForm) {
    calculatorForm.addEventListener('submit', function(e) {
      e.preventDefault();
      calcularDimensionamento();
    });
  }

  function calcularDimensionamento() {
    // ... (código original da calculadora)
  }

  // 4. Animações de Cards (original)
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

  // ====== NOVO SISTEMA 3D ====== //
  
  // 5. Botão de Alternância 3D
  const toggle3DButton = document.getElementById('toggle-3d');
  if (toggle3DButton) {
    toggle3DButton.addEventListener('click', toggle3DView);
  }

  // 6. Circuito 3D
  let circuit3D;
  function init3DView() {
    const container = document.getElementById('circuit-3d-container');
    if (!container) return;

    // Configuração básica
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('circuit-3d'), antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;

    // Iluminação
    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(1, 1, 1);
    scene.add(light1);
    scene.add(new THREE.AmbientLight(0x404040));

    // Grid
    scene.add(new THREE.GridHelper(10, 10));

    // Componentes iniciais
    add3DComponent(scene, 'battery');
    add3DComponent(scene, 'wire');

    // Animação
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Event Listeners
    document.getElementById('rotate-toggle').addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
    });

    document.getElementById('add-component').addEventListener('click', () => {
      const types = ['battery', 'resistor', 'switch', 'lamp'];
      add3DComponent(scene, types[Math.floor(Math.random() * types.length)]);
    });

    document.getElementById('export-3d').addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = renderer.domElement.toDataURL('image/png');
      link.download = 'circuito-3d.png';
      link.click();
    });

    return { scene, camera, renderer, controls };
  }

  function add3DComponent(scene, type) {
    let component;
    switch(type) {
      case 'battery':
        const batteryGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
        const batteryMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
        component = new THREE.Mesh(batteryGeometry, batteryMaterial);
        break;
      // ... outros componentes
    }
    component.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0);
    scene.add(component);
  }

  function toggle3DView() {
    const container = document.getElementById('circuit-3d-container');
    if (!container) return;

    if (container.style.display === 'none') {
      container.style.display = 'block';
      if (!circuit3D) {
        circuit3D = init3DView();
      }
    } else {
      container.style.display = 'none';
    }
  }
});