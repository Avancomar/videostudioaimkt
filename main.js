// Robustified main.js — inicializa após DOMContentLoaded e expõe funções globalmente
document.addEventListener('DOMContentLoaded', () => {
  // Exponha referências ao DOM no objeto global para compatibilidade com atributos onclick inline
  window.apiKey = document.getElementById('apiKey');
  window.apiStatus = document.getElementById('apiStatus');
  window.textoCena = document.getElementById('textoCena');
  window.storyboard = document.getElementById('storyboard');
  window.canvas = document.getElementById('canvas');

  if (!window.canvas) {
    console.error("Canvas não encontrado. Verifique se o id 'canvas' existe no HTML.");
    // Ainda expomos funções, mas sem canvas muitas funcionalidades ficam indisponíveis
  } else {
    window.ctx = window.canvas.getContext('2d');
  }

  // Estado da aplicação
  window.cenas = JSON.parse(localStorage.getItem('cenas') || '[]');
  window.midiaAtual = null;

  // Funções de API key
  function ativarApi() {
    if (!window.apiKey) return alert('Campo API Key não encontrado.');
    const key = window.apiKey.value;
    if (key && key.length > 10) {
      localStorage.setItem('apiKey', key);
      if (window.apiStatus) window.apiStatus.className = 'status green';
      alert('API ativada');
    } else {
      alert('API Key inválida');
    }
  }

  function limparApi() {
    localStorage.removeItem('apiKey');
    if (window.apiKey) window.apiKey.value = '';
    if (window.apiStatus) window.apiStatus.className = 'status red';
  }

  // Upload de mídia (imagem, vídeo, áudio)
  window.uploadMidia = function (event, tipo) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    window.midiaAtual = {
      tipo,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type
    };

    previewMidia();
  };

  function previewMidia() {
    if (!window.midiaAtual || !window.ctx || !window.canvas) return;

    if (window.midiaAtual.tipo === 'imagem') {
      const img = new Image();
      img.src = window.midiaAtual.url;
      img.onload = () => {
        // Limpa e desenha mantendo proporção centralizada (cobre o canvas)
        const cw = window.canvas.width;
        const ch = window.canvas.height;
        const iw = img.width;
        const ih = img.height;
        const scale = Math.max(cw / iw, ch / ih);
        const nw = iw * scale;
        const nh = ih * scale;
        const dx = (cw - nw) / 2;
        const dy = (ch - nh) / 2;

        window.ctx.clearRect(0, 0, cw, ch);
        window.ctx.drawImage(img, dx, dy, nw, nh);
      };
      img.onerror = (e) => {
        console.error('Erro ao carregar imagem de preview', e);
        alert('Não foi possível exibir a imagem de preview.');
      };
    } else {
      // Para vídeo/áudio podemos desenhar um placeholder ou simplesmente limpar o canvas
      if (window.ctx && window.canvas) {
        window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
        // opcional: desenhar texto informando tipo de mídia
        window.ctx.fillStyle = '#222';
        window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);
        window.ctx.fillStyle = '#fff';
        window.ctx.font = '24px Arial';
        window.ctx.fillText(window.midiaAtual.tipo.toUpperCase(), 20, 40);
      }
    }
  }

  // Adicionar cena ao storyboard
  window.adicionarCena = function () {
    if (!window.midiaAtual) {
      alert('Envie uma mídia antes');
      return;
    }

    const texto = window.textoCena ? window.textoCena.value : '';
    window.cenas.push({
      midia: window.midiaAtual,
      texto: texto
    });

    localStorage.setItem('cenas', JSON.stringify(window.cenas));
    if (window.textoCena) window.textoCena.value = '';
    renderStoryboard();
  };

  function renderStoryboard() {
    if (!window.storyboard) return;
    window.storyboard.innerHTML = '';
    window.cenas.forEach((cena, index) => {
      const div = document.createElement('div');
      div.className = 'scene';
      div.textContent = 'Cena ' + (index + 1);
      // opcional: thumbnail clicável para visualizar
      div.style.cursor = 'pointer';
      div.addEventListener('click', () => {
        if (cena.midia && cena.midia.url && window.ctx && window.canvas) {
          const img = new Image();
          img.src = cena.midia.url;
          img.onload = () => {
            window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
            window.ctx.drawImage(img, 0, 0, window.canvas.width, window.canvas.height);
          };
        }
      });
      window.storyboard.appendChild(div);
    });
  }

  // Gerar vídeo a partir das cenas desenhadas no canvas
  window.gerarVideo = function () {
    if (!window.cenas || !window.cenas.length) {
      alert('Nenhuma cena criada');
      return;
    }

    if (!window.canvas || !('MediaRecorder' in window)) {
      alert('Impossível gerar vídeo: canvas ou MediaRecorder não disponível no seu navegador.');
      return;
    }

    const stream = window.canvas.captureStream(30);
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch (err) {
      console.error('MediaRecorder error:', err);
      alert('Não foi possível iniciar o gravador. Verifique suporte a MediaRecorder ou o mimeType.');
      return;
    }

    const chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'video-trafego.webm';
      link.click();
    };

    recorder.start();
    reproduzirCena(0, recorder);
  };

  function reproduzirCena(index, recorder) {
    if (index >= window.cenas.length) {
      recorder.stop();
      return;
    }

    if (!window.ctx || !window.canvas) {
      recorder.stop();
      return;
    }

    const cena = window.cenas[index];
    if (!cena || !cena.midia || !cena.midia.url) {
      // pula cena inválida
      setTimeout(() => reproduzirCena(index + 1, recorder), 1000);
      return;
    }

    const img = new Image();
    img.src = cena.midia.url;
    img.onload = () => {
      window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
      window.ctx.drawImage(img, 0, 0, window.canvas.width, window.canvas.height);
      // espera 2s (2000 ms) e vai para próxima cena
      setTimeout(() => reproduzirCena(index + 1, recorder), 2000);
    };
    img.onerror = (e) => {
      console.error('Erro ao carregar cena', e);
      setTimeout(() => reproduzirCena(index + 1, recorder), 500);
    };
  }

  window.salvarProjeto = function () {
    localStorage.setItem('cenas', JSON.stringify(window.cenas));
    alert('Projeto salvo');
  };

  window.reabrirProjeto = function () {
    location.reload();
  };

  // Expor ativar/limpar API globalmente (para botões inline)
  window.ativarApi = ativarApi;
  window.limparApi = limparApi;

  // Renderiza o storyboard na inicialização
  renderStoryboard();
});
