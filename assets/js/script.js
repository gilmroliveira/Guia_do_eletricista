document.addEventListener('DOMContentLoaded', () => {
  // Barra de pesquisa
  const searchInput = document.querySelector('.search-bar');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const articles = document.querySelectorAll('article');
      articles.forEach(article => {
        const text = article.textContent.toLowerCase();
        article.style.display = text.includes(term) ? 'block' : 'none';
      });
    });
  }

  // Interatividade nos diagramas SVG
  document.querySelectorAll('.interactive').forEach(element => {
    element.addEventListener('click', () => {
      const info = element.getAttribute('data-info');
      alert(info);
    });
    element.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const info = element.getAttribute('data-info');
        alert(info);
      }
    });
  });
});