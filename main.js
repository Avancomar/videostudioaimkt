// Inicializa referências do DOM
const apiKey = document.getElementById("apiKey");
const apiStatus = document.getElementById("apiStatus");
const textoCena = document.getElementById("textoCena");
const storyboard = document.getElementById("storyboard");
const canvas = document.getElementById("canvas");

if (!canvas) {
  console.error("Canvas não encontrado. Verifique se o id 'canvas' existe no HTML.");
}
const ctx = canvas ? canvas.getContext("2d") : null;

let cenas = JSON.parse(localStorage.getItem("cenas") || "[]");
let midiaAtual = null;

function ativarApi() {
  if (!apiKey) return alert("Campo API Key não encontrado.");
  const key = apiKey.value;
  if (key && key.length > 10) {
    localStorage.setItem("apiKey", key);
    if (apiStatus) apiStatus.className = "status green";
  } else {
    alert("API Key inválida");
  }
}

function limparApi() {
  localStorage.removeItem("apiKey");
  if (apiKey) apiKey.value = "";
  if (apiStatus) apiStatus.className = "status red";
}

function uploadMidia(event, tipo) {
  const file = event.target.files[0];
  if (!file) return;

  midiaAtual = {
    tipo,
    url: URL.createObjectURL(file)
  };

  previewMidia();
}

function previewMidia() {
  if (!midiaAtual || !ctx) return;

  if (midiaAtual.tipo === "imagem") {
    const img = new Image();
    img.src = midiaAtual.url;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }
}

function adicionarCena() {
  if (!midiaAtual) {
    alert("Envie uma mídia antes");
    return;
  }

  cenas.push({
    midia: midiaAtual,
    texto: textoCena ? textoCena.value : ""
  });

  localStorage.setItem("cenas", JSON.stringify(cenas));
  if (textoCena) textoCena.value = "";
  renderStoryboard();
}

function renderStoryboard() {
  if (!storyboard) return;
  storyboard.innerHTML = "";
  cenas.forEach((cena, index) => {
    const div = document.createElement("div");
    div.className = "scene";
    div.textContent = "Cena " + (index + 1);
    storyboard.appendChild(div);
  });
}

function gerarVideo() {
  if (!cenas.length) {
    alert("Nenhuma cena criada");
    return;
  }

  if (!canvas || !window.MediaRecorder) {
    alert("Impossível gerar vídeo: canvas ou MediaRecorder não disponível no seu navegador.");
    return;
  }

  const stream = canvas.captureStream(30);
  let recorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  } catch (err) {
    console.error("MediaRecorder error:", err);
    alert("Não foi possível iniciar o gravador. Verifique suporte a MediaRecorder ou o mimeType.");
    return;
  }

  const chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "video-trafego.webm";
    link.click();
  };

  recorder.start();
  reproduzirCena(0, recorder);
}

function reproduzirCena(index, recorder) {
  if (index >= cenas.length) {
    recorder.stop();
    return;
  }

  if (!ctx) {
    recorder.stop();
    return;
  }

  const img = new Image();
  img.src = cenas[index].midia.url;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    setTimeout(() => reproduzirCena(index + 1, recorder), 2000);
  };
}

function salvarProjeto() {
  localStorage.setItem("cenas", JSON.stringify(cenas));
  alert("Projeto salvo");
}

function reabrirProjeto() {
  location.reload();
}

renderStoryboard();
