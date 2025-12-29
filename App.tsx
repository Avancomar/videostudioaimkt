
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Sparkles, Film, Mic2, 
  Key, Play, Loader2, History, Download, 
  Trash2, Image as ImageIcon, Video as VideoIcon,
  Maximize2, Plus, ChevronRight, Settings,
  Save, FileText, Volume2, Wand2, Copy, Check, ShieldCheck, ShieldAlert,
  Upload, X, Music, FileVideo, HardDriveDownload,
  FolderOpen, Clock, Tally5, AlignCenter
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface Asset {
  id: string;
  url: string;
  prompt: string;
  type: 'image' | 'video' | 'voice' | 'audio';
  timestamp: number;
  aspect?: string;
  subtitles?: Subtitle[];
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [gallery, setGallery] = useState<Asset[]>([]);
  const [status, setStatus] = useState('');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'image' | 'video' | 'voice' | 'audio'>('all');

  // Subtitle State
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

  // Media Upload States
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // API Key Management State
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('avanc_api_key') || '');
  const [isKeyActive, setIsKeyActive] = useState(!!localStorage.getItem('avanc_api_key'));

  // Storyboard state
  const [script, setScript] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');

  useEffect(() => {
    const saved = localStorage.getItem('avanc_assets');
    if (saved) setGallery(JSON.parse(saved));
  }, []);

  const saveToGallery = (asset: Asset) => {
    const newGallery = [asset, ...gallery];
    setGallery(newGallery);
    localStorage.setItem('avanc_assets', JSON.stringify(newGallery));
  };

  const deleteAsset = (id: string) => {
    const newGallery = gallery.filter(a => a.id !== id);
    setGallery(newGallery);
    localStorage.setItem('avanc_assets', JSON.stringify(newGallery));
  };

  const downloadAsset = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert("Erro ao baixar asset.");
    }
  };

  const handleActivateKey = () => {
    if (apiKeyInput.trim().length > 10) {
      localStorage.setItem('avanc_api_key', apiKeyInput);
      setIsKeyActive(true);
      alert("Chave API Validada e Ativada com Sucesso!");
    } else {
      alert("Por favor, insira uma chave API válida do Google AI Studio.");
    }
  };

  const handleClearKey = () => {
    setApiKeyInput('');
    localStorage.removeItem('avanc_api_key');
    setIsKeyActive(false);
  };

  const addSubtitleField = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const newStart = lastSub ? lastSub.endTime : 0;
    const newSub: Subtitle = {
      id: Date.now().toString() + Math.random(),
      text: '',
      startTime: newStart,
      endTime: newStart + 3
    };
    setSubtitles([...subtitles, newSub]);
  };

  const updateSubtitle = (id: string, field: keyof Subtitle, value: string | number) => {
    setSubtitles(subtitles.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSubtitle = (id: string) => {
    setSubtitles(subtitles.filter(s => s.id !== id));
  };

  const processFile = (file: File, type: 'image' | 'audio' | 'video') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'image') setUploadedImage(base64);
      else if (type === 'audio') {
        setUploadedAudio(base64);
        saveToGallery({
          id: Date.now().toString(),
          url: base64,
          prompt: `Upload Audio: ${file.name}`,
          type: 'audio',
          timestamp: Date.now()
        });
      } else if (type === 'video') {
        setUploadedVideo(base64);
        saveToGallery({
          id: Date.now().toString(),
          url: base64,
          prompt: `Upload Vídeo: ${file.name}`,
          type: 'video',
          timestamp: Date.now(),
          subtitles: [...subtitles]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'video') => {
    const file = e.target.files?.[0];
    if (file) processFile(file, type);
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'audio' | 'video') => {
    e.preventDefault();
    if (type === 'image') setIsDraggingImage(false);
    else if (type === 'audio') setIsDraggingAudio(false);
    else setIsDraggingVideo(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (type === 'image' && file.type.startsWith('image/')) processFile(file, type);
      else if (type === 'audio' && file.type.startsWith('audio/')) processFile(file, type);
      else if (type === 'video' && file.type.startsWith('video/')) processFile(file, type);
      else alert(`Formato de arquivo inválido para ${type === 'image' ? 'Imagem' : type === 'audio' ? 'Áudio' : 'Vídeo'}.`);
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'image' | 'audio' | 'video') => {
    e.preventDefault();
    if (type === 'image') setIsDraggingImage(true);
    else if (type === 'audio') setIsDraggingAudio(true);
    else if (type === 'video') setIsDraggingVideo(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: 'image' | 'audio' | 'video') => {
    e.preventDefault();
    if (type === 'image') setIsDraggingImage(false);
    else if (type === 'audio') setIsDraggingAudio(false);
    else if (type === 'video') setIsDraggingVideo(false);
  };

  const handleAddToStoryboard = (content: string) => {
    setScript(prev => prev ? `${prev}\n\nCena: ${content}` : `Cena: ${content}`);
    alert("Adicionado ao Storyboard!");
    setActiveView('storyboard');
  };

  const handleAddNewScene = () => {
    setScript(prev => prev ? `${prev}\n\nCena: ` : `Cena: `);
  };

  const ensureApiKey = async () => {
    const localKey = localStorage.getItem('avanc_api_key');
    if (!localKey && window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleGenerateVoice = async () => {
    if (!voiceText) return alert("Digite o texto para a narração.");
    setIsGenerating(true);
    setStatus("Sintetizando voz cinematográfica...");
    
    try {
      const currentKey = localStorage.getItem('avanc_api_key') || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: currentKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: voiceText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const url = `data:audio/pcm;base64,${base64Audio}`;
        saveToGallery({
          id: Date.now().toString(),
          url,
          prompt: voiceText,
          type: 'voice',
          timestamp: Date.now()
        });
        setIsGenerating(false);
        setActiveView('gallery');
      }
    } catch (e: any) {
      alert("Erro na sintetização: " + e.message);
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return alert("Por favor, descreva sua criação.");
    
    await ensureApiKey();
    setIsGenerating(true);
    setStatus(mediaType === 'video' ? 'Conectando ao Veo 3.1...' : 'Processando com Gemini 3 Pro...');

    try {
      const currentKey = localStorage.getItem('avanc_api_key') || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: currentKey });

      if (mediaType === 'image') {
        const parts: any[] = [];
        if (uploadedImage) {
          parts.push({
            inlineData: {
              data: uploadedImage.split(',')[1],
              mimeType: 'image/png'
            }
          });
        }
        parts.push({ text: uploadedImage ? `Baseado na imagem enviada: ${prompt}` : prompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts },
          config: { 
            imageConfig: { 
              aspectRatio: aspectRatio as any, 
              imageSize: "1K" 
            } 
          }
        });
        
        if (!response.candidates?.[0]?.content?.parts) throw new Error("A IA não conseguiu gerar esta imagem. Tente mudar o prompt.");
        
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part) {
          saveToGallery({
            id: Date.now().toString(),
            url: `data:image/png;base64,${part.inlineData.data}`,
            prompt,
            type: 'image',
            timestamp: Date.now(),
            aspect: aspectRatio
          });
          setActiveView('gallery');
        }
      } else {
        setStatus(uploadedImage ? 'Transformando Imagem em Vídeo...' : 'Renderizando frames de vídeo...');
        const fullPrompt = script ? `Contexto do Storyboard: ${script}. Cena atual: ${prompt}` : prompt;
        
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: fullPrompt,
          image: uploadedImage ? {
            imageBytes: uploadedImage.split(',')[1],
            mimeType: 'image/png'
          } : undefined,
          config: {
            numberOfVideos: 1,
            resolution: resolution as any,
            aspectRatio: aspectRatio as any
          }
        });

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          setStatus('Refinando detalhes cinematográficos...');
          operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Falha ao obter link de download do vídeo.");
        
        const videoResponse = await fetch(`${downloadLink}&key=${currentKey}`);
        const blob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(blob);

        saveToGallery({
          id: Date.now().toString(),
          url: videoUrl,
          prompt,
          type: 'video',
          timestamp: Date.now(),
          aspect: aspectRatio,
          subtitles: [...subtitles]
        });
        setActiveView('gallery');
      }
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        alert("Erro no Studio: " + e.message);
      }
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  const filteredGallery = gallery.filter(item => galleryFilter === 'all' || item.type === galleryFilter);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-brandBlue">
      <aside className="w-72 border-r border-white/5 flex flex-col p-8 bg-brandSidebar z-30 shrink-0">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">V</div>
          <div>
            <h1 className="text-xl font-black text-white leading-none">AVANC</h1>
            <p className="text-[10px] text-white font-bold tracking-[3px] uppercase mt-1">Video Studio Pro</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={18}/>} label="Dashboard" />
          <div className="pt-4 pb-2 border-b border-white/5 mb-2">
            <p className="text-[9px] font-bold text-white uppercase tracking-widest px-4">Estúdios de Criação</p>
          </div>
          <NavItem active={activeView === 'creator' && mediaType === 'video'} onClick={() => { setActiveView('creator'); setMediaType('video'); }} icon={<Film size={18}/>} label="Vídeo Studio (Veo)" />
          <NavItem active={activeView === 'creator' && mediaType === 'image'} onClick={() => { setActiveView('creator'); setMediaType('image'); }} icon={<ImageIcon size={18}/>} label="Image Studio (Pro)" />
          
          <div className="pt-4 pb-2 border-b border-white/5 mb-2">
            <p className="text-[9px] font-bold text-white uppercase tracking-widest px-4">Pipeline Tools</p>
          </div>
          <NavItem active={activeView === 'storyboard'} onClick={() => setActiveView('storyboard')} icon={<FileText size={18}/>} label="Storyboard (Roteiro)" />
          <NavItem active={activeView === 'voicelab'} onClick={() => setActiveView('voicelab')} icon={<Mic2 size={18}/>} label="Voice Lab (Voz)" />
          <NavItem active={activeView === 'gallery'} onClick={() => setActiveView('gallery')} icon={<History size={18}/>} label="Minha Galeria" />
        </nav>

        {/* Gerenciador de API Key */}
        <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
          <label className="text-[9px] font-black text-white uppercase tracking-widest px-1">Configurações de Acesso</label>
          <div className="relative">
            <input 
              type="password"
              placeholder="Cole sua API Key aqui..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:border-red-600/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {/* CORREÇÃO: Botões de API com cores vermelhas explícitas solicitadas */}
            <button 
              onClick={handleActivateKey} 
              className="flex-1 py-3 text-[10px] font-black rounded-xl uppercase shadow-lg bg-red-600 hover:bg-red-700 transition-all active:scale-95 border-none"
            >
              ATIVAR
            </button>
            <button 
              onClick={handleClearKey} 
              className="px-4 py-3 text-[10px] font-black rounded-xl uppercase shadow-lg bg-red-800/40 hover:bg-red-600 border border-red-600/30 transition-all active:scale-95"
            >
              LIMPAR
            </button>
          </div>
          <div className="flex items-center justify-between px-1 pt-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shadow-sm ${isKeyActive ? 'bg-green-500 animate-pulse' : 'bg-white'}`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${isKeyActive ? 'text-green-500' : 'text-white'}`}>
                {isKeyActive ? 'Status: Ativa' : 'Status: Aguardando'}
              </span>
            </div>
            {isKeyActive && <ShieldCheck size={14} className="text-green-500" />}
            {!isKeyActive && <ShieldAlert size={14} className="text-white" />}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative p-6 md:p-12 bg-transparent text-white">
        {activeView === 'dashboard' && (
          <div className="animate-fade space-y-12 max-w-6xl">
            <div className="glass-card p-10 md:p-16 relative overflow-hidden group">
               <div className="relative z-10 max-w-2xl">
                <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black tracking-widest mb-6 inline-block uppercase">SISTEMA INTEGRADO</span>
                <h1 className="text-4xl md:text-5xl font-black mb-6 text-white leading-tight">O futuro da produção audiovisual.</h1>
                <p className="text-white text-lg mb-8 leading-relaxed">Crie vídeos cinematográficos, imagens ultra-realistas e narrações com tecnologia de ponta.</p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => { setMediaType('video'); setActiveView('creator'); }} className="px-8 py-4 text-sm rounded-xl font-bold uppercase tracking-widest shadow-lg">NOVO VÍDEO</button>
                  <button onClick={() => { setMediaType('image'); setActiveView('creator'); }} className="px-8 py-4 text-sm rounded-xl font-bold uppercase tracking-widest shadow-lg">NOVA IMAGEM</button>
                </div>
               </div>
            </div>
          </div>
        )}

        {activeView === 'creator' && (
          <div className="max-w-6xl mx-auto animate-fade pb-20">
            <div className="glass-card p-8 md:p-10 space-y-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Estúdio de Criação</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload de Imagem */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14}/> Referência de Imagem
                  </label>
                  <div 
                    onClick={() => imageInputRef.current?.click()} 
                    onDragOver={(e) => handleDragOver(e, 'image')}
                    onDragLeave={(e) => handleDragLeave(e, 'image')}
                    onDrop={(e) => handleDrop(e, 'image')}
                    className={`relative border-2 border-dashed rounded-3xl h-56 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 group ${isDraggingImage ? 'border-red-600 bg-red-600/20 scale-[1.02] shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'border-white/20 bg-black/40 hover:border-red-600/50 hover:bg-black/60'}`}
                  >
                    {isDraggingImage && (
                      <div className="absolute inset-0 bg-red-600/10 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-pulse">
                         <HardDriveDownload size={48} className="text-white mb-2" />
                         <span className="text-sm font-black uppercase tracking-widest text-white">Solte para Enviar</span>
                      </div>
                    )}
                    
                    {uploadedImage ? (
                      <div className="w-full h-full relative group/img">
                        <img src={uploadedImage} className="w-full h-full object-contain p-4 transition-transform group-hover/img:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                           <button 
                            onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }} 
                            className="p-3 rounded-full bg-red-600 text-white shadow-xl hover:scale-110 transition-transform"
                          >
                            <X size={20}/>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center px-4">
                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-red-600/10 transition-colors">
                          <Upload size={32} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Arraste a imagem</p>
                          <p className="text-[9px] text-white opacity-60 uppercase">Ou clique para navegar</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={imageInputRef} type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                </div>

                {/* Upload de Vídeo */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <VideoIcon size={14}/> Referência de Vídeo
                  </label>
                  <div 
                    onClick={() => videoInputRef.current?.click()} 
                    onDragOver={(e) => handleDragOver(e, 'video')}
                    onDragLeave={(e) => handleDragLeave(e, 'video')}
                    onDrop={(e) => handleDrop(e, 'video')}
                    className={`relative border-2 border-dashed rounded-3xl h-56 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 group ${isDraggingVideo ? 'border-red-600 bg-red-600/20 scale-[1.02] shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'border-white/20 bg-black/40 hover:border-red-600/50 hover:bg-black/60'}`}
                  >
                    {isDraggingVideo && (
                      <div className="absolute inset-0 bg-red-600/10 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-pulse">
                         <HardDriveDownload size={48} className="text-white mb-2" />
                         <span className="text-sm font-black uppercase tracking-widest text-white">Solte o Vídeo</span>
                      </div>
                    )}
                    
                    {uploadedVideo ? (
                      <div className="w-full h-full relative group/vid">
                        <video src={uploadedVideo} className="w-full h-full object-contain p-4" muted autoPlay loop />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center">
                           <button 
                            onClick={(e) => { e.stopPropagation(); setUploadedVideo(null); }} 
                            className="p-3 rounded-full bg-red-600 text-white shadow-xl hover:scale-110 transition-transform"
                          >
                            <X size={20}/>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center px-4">
                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-red-600/10 transition-colors">
                          <FileVideo size={32} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Arraste o vídeo</p>
                          <p className="text-[9px] text-white opacity-60 uppercase">Ou clique para navegar</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <FolderOpen size={14}/> Selecionar Vídeo
                  </button>
                  <input ref={videoInputRef} type="file" hidden accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
                </div>

                {/* Upload de Áudio */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Music size={14}/> Referência de Áudio
                  </label>
                  <div 
                    onClick={() => audioInputRef.current?.click()} 
                    onDragOver={(e) => handleDragOver(e, 'audio')}
                    onDragLeave={(e) => handleDragLeave(e, 'audio')}
                    onDrop={(e) => handleDrop(e, 'audio')}
                    className={`relative border-2 border-dashed rounded-3xl h-56 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group ${isDraggingAudio ? 'border-red-600 bg-red-600/20 scale-[1.02] shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'border-white/20 bg-black/40 hover:border-red-600/50 hover:bg-black/60'}`}
                  >
                    {isDraggingAudio && (
                      <div className="absolute inset-0 bg-red-600/10 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-pulse">
                         <HardDriveDownload size={48} className="text-white mb-2" />
                         <span className="text-sm font-black uppercase tracking-widest text-white">Solte o Áudio</span>
                      </div>
                    )}

                    {uploadedAudio ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-red-600/20 shadow-inner">
                          <Music size={40} className="text-red-500 animate-bounce" />
                        </div>
                        <span className="text-xs font-black uppercase text-white tracking-widest">Áudio Processado</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setUploadedAudio(null); }} 
                          className="absolute top-4 right-4 p-2 rounded-full bg-red-600 text-white shadow-lg hover:scale-110 transition-transform"
                        >
                          <X size={16}/>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center px-4">
                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-red-600/10 transition-colors">
                          <Music size={32} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Arraste trilha/voz</p>
                          <p className="text-[9px] text-white opacity-60 uppercase">Ou clique para navegar</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={audioInputRef} type="file" hidden accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} />
                </div>
              </div>

              {/* Subtitle Editor Section */}
              <div className="space-y-4 border-t border-white/5 pt-8">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <AlignCenter size={14}/> Subtitle Studio (Sincronização)
                  </label>
                  <button 
                    onClick={addSubtitleField}
                    className="px-4 py-2 text-[10px] font-black uppercase rounded-lg bg-red-600 hover:bg-red-700 transition-all shadow-lg flex items-center gap-2 border-none"
                  >
                    <Plus size={14}/> Adicionar Legenda
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {subtitles.length === 0 && (
                    <div className="py-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/5">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Nenhuma legenda adicionada</p>
                    </div>
                  )}
                  {subtitles.map((sub, idx) => (
                    <div key={sub.id} className="flex flex-col md:flex-row gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 animate-fade">
                      <div className="flex-1">
                        <input 
                          type="text"
                          placeholder="Texto da legenda..."
                          value={sub.text}
                          onChange={(e) => updateSubtitle(sub.id, 'text', e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                          <Clock size={10} className="text-white/40"/>
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            value={sub.startTime}
                            onChange={(e) => updateSubtitle(sub.id, 'startTime', parseFloat(e.target.value))}
                            className="bg-transparent border-none p-0 w-12 text-[10px] text-center focus:ring-0 text-white"
                          />
                        </div>
                        <span className="text-white/20 text-[10px]">até</span>
                        <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                          <Clock size={10} className="text-white/40"/>
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            value={sub.endTime}
                            onChange={(e) => updateSubtitle(sub.id, 'endTime', parseFloat(e.target.value))}
                            className="bg-transparent border-none p-0 w-12 text-[10px] text-center focus:ring-0 text-white"
                          />
                        </div>
                        <button 
                          onClick={() => removeSubtitle(sub.id)}
                          className="p-2 text-white hover:text-red-500 transition-colors bg-transparent border-none"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white uppercase tracking-widest">Prompt Criativo</label>
                <textarea 
                  className="w-full h-40 text-lg p-5 bg-black/30 text-white"
                  placeholder="Descreva aqui o que deseja criar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Maximize2 size={12}/> Aspect Ratio</label>
                  <select className="w-full h-12 text-sm text-white bg-black/40 border border-white/10" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                    <option value="16:9">Horizontal Cinema (16:9)</option>
                    <option value="9:16">Vertical Social (9:16)</option>
                    <option value="1:1">Quadrado (1:1)</option>
                    <option value="4:3">Clássico (4:3)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><VideoIcon size={12}/> Resolução</label>
                  <select className="w-full h-12 text-sm text-white bg-black/40 border border-white/10" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                    <option value="1080p">High Definition (1080p)</option>
                    <option value="720p">Standard HD (720p)</option>
                  </select>
                </div>
              </div>

              <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-5 text-xl font-black uppercase tracking-widest shadow-lg bg-red-600 hover:bg-red-700 transition-all">
                {isGenerating ? status : 'GERAR AGORA'}
              </button>
            </div>
          </div>
        )}

        {activeView === 'gallery' && (
          <div className="animate-fade space-y-8">
             <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
                {['all', 'video', 'image', 'voice', 'audio'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setGalleryFilter(f as any)} 
                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md transition-all border-none ${galleryFilter === f ? 'bg-red-600 text-white' : 'bg-red-800/40 text-white hover:bg-red-600'}`}
                  >
                    {f}
                  </button>
                ))}
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGallery.map(item => (
                  <AssetCard key={item.id} asset={item} onDelete={deleteAsset} onDownload={downloadAsset} onAddToStoryboard={handleAddToStoryboard} />
                ))}
             </div>
          </div>
        )}

        {activeView === 'storyboard' && (
          <div className="max-w-4xl mx-auto animate-fade">
             <div className="glass-card p-8 md:p-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Storyboard & Scripts</h3>
                  <button 
                    onClick={handleAddNewScene} 
                    className="px-4 py-2 text-[10px] font-black uppercase flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 shadow-lg border-none"
                  >
                    <Plus size={14}/> Nova Cena em Branco
                  </button>
                </div>
                <textarea 
                  className="w-full h-64 p-5 text-base bg-black/30 text-white border border-white/10"
                  placeholder="Estruture seu roteiro aqui... Ex: Cena: Um robô patinando em Marte."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                />
                <button onClick={() => setActiveView('creator')} className="w-full py-4 text-sm font-black uppercase shadow-lg bg-red-600 hover:bg-red-700 transition-all border-none">SALVAR E VOLTAR</button>
             </div>
          </div>
        )}

        {activeView === 'voicelab' && (
          <div className="max-w-4xl mx-auto animate-fade">
             <div className="glass-card p-8 md:p-10 space-y-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Voice Lab (TTS)</h3>
                <textarea 
                  className="w-full h-40 p-5 text-base bg-black/30 text-white border border-white/10"
                  placeholder="Texto para voz..."
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                />
                <button onClick={handleGenerateVoice} disabled={isGenerating} className="w-full py-5 text-lg font-black uppercase shadow-lg bg-red-600 hover:bg-red-700 border-none">SINTETIZAR VOZ</button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const VideoPlayer = ({ url, subtitles }: { url: string; subtitles?: Subtitle[] }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeSubtitle = subtitles?.find(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="relative w-full h-full">
      <video 
        ref={videoRef}
        src={url} 
        className="w-full h-full object-cover" 
        controls 
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
      {activeSubtitle && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none transition-all duration-300 transform translate-y-0">
          <div className="bg-black/70 backdrop-blur-md px-6 py-2 rounded-xl border border-white/10 shadow-2xl">
            <p className="text-white text-sm md:text-base font-bold text-center leading-tight drop-shadow-lg">
              {activeSubtitle.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const AssetCard = ({ asset, onDelete, onDownload, onAddToStoryboard }: any) => {
  return (
    <div className="glass-card p-3 group relative animate-fade flex flex-col h-full">
      <div className="relative overflow-hidden rounded-xl aspect-video bg-black/40 flex items-center justify-center shrink-0">
        {asset.type === 'image' ? <img src={asset.url} className="w-full h-full object-cover" /> : 
         asset.type === 'video' ? <VideoPlayer url={asset.url} subtitles={asset.subtitles} /> : 
         <audio src={asset.url} controls className="w-full px-2" />}
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button onClick={() => onDelete(asset.id)} className="p-2 rounded-full bg-red-600 text-white shadow-lg border-none hover:scale-110 transition-transform" title="Excluir"><Trash2 size={14}/></button>
          <button onClick={() => onDownload(asset.url, `asset_${asset.id}`)} className="p-2 rounded-full bg-red-600 text-white shadow-lg border-none hover:scale-110 transition-transform" title="Download"><Download size={14}/></button>
        </div>
      </div>
      <div className="mt-3 flex-grow">
        <p className="text-[11px] font-semibold text-white line-clamp-2">{asset.prompt}</p>
        {asset.subtitles && asset.subtitles.length > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <AlignCenter size={10} className="text-red-500"/>
            <span className="text-[9px] uppercase font-black text-white/40 tracking-widest">{asset.subtitles.length} Legendas Sincronizadas</span>
          </div>
        )}
      </div>
      {asset.type === 'image' && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <button 
            onClick={() => onAddToStoryboard(asset.prompt)} 
            className="w-full py-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 rounded-lg bg-red-600/40 hover:bg-red-600 border-none transition-all"
          >
            <Plus size={12}/> Adicionar ao Roteiro
          </button>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all border ${active ? 'bg-red-600 text-white border-red-600 shadow-xl translate-x-1' : 'text-white hover:bg-white/5 border-transparent'}`}>
    <span>{icon}</span>
    <span className="text-[11px] uppercase font-bold">{label}</span>
  </div>
);

export default App;
