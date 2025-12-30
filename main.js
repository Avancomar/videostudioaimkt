let cenas = JSON.parse(localStorage.getItem("cenas") || "[]");
let midiaAtual = null;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function ativarApi() {
  const key = apiKey.value;
  if (key && key.length > 10) {
    localStorage.setItem("apiKey", key);
    apiStatus.className = "status green";
  } else {
    alert("API Key inválida");
  }
}

function limparApi() {
  localStorage.removeItem("apiKey");
  apiKey.value = "";
  apiStatus.className = "status red";
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
  if (!midiaAtual) return;

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
    texto: textoCena.value
  });

  localStorage.setItem("cenas", JSON.stringify(cenas));
  textoCena.value = "";
  renderStoryboard();
}

function renderStoryboard() {
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

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
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
