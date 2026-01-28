// Inject header/footer partials into placeholders
async function injectPartials(){
  try{
    const parts = [ ['header-placeholder','src/partials/header.html'], ['footer-placeholder','src/partials/footer.html'] ];
    await Promise.all(parts.map(async ([id, url])=>{
      const el = document.getElementById(id);
      if(!el) return;
      const res = await fetch(url);
      if(!res.ok) return;
      const html = await res.text();
      el.innerHTML = html;
    }));
  }catch(e){ console.warn('Could not inject partials', e); }
}

// WhatsApp config (used after partials injected)
const phone = '5511985462085';
const defaultMsg = encodeURIComponent('Olá! Tenho interesse em locar o Sítio do Zui. Poderia me informar disponibilidade e valores?');
const wa = `https://api.whatsapp.com/send?phone=${phone}&text=${defaultMsg}`;

// Utilitário para checar imagem (via onload)
function checkImage(src){
  return new Promise(resolve => {
    const img=new Image();
    img.onload=()=>resolve(true);
    img.onerror=()=>resolve(false);
    img.src=src + '?v=' + Date.now();
  });
}
async function checkVideo(src){
  try{ const r = await fetch(src, { method:'HEAD' }); return r.ok; }catch{ return false; }
}

// Monta slides dinamicamente (aceita "buracos" na numeração)
async function buildSlides(){
  const swiperEl = document.querySelector('.swiper');
  const wrap = swiperEl.querySelector('.swiper-wrapper');
  const max = parseInt(swiperEl.dataset.max||'50',10);
  const prefix = swiperEl.dataset.prefix||'assets/imagem';
  const ext = swiperEl.dataset.ext||'.jpg';
  const videoSrc = swiperEl.dataset.video||'';

  let count=0;
  for(let i=1;i<=max;i++){
    const src = `${prefix}${i}${ext}`;
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkImage(src);
    if(ok){
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Foto ${i} do Sítio do Zui`;
      img.loading = 'lazy';
      img.className = 'w-full h-auto object-cover max-h-[420px]';
      slide.appendChild(img);
      wrap.appendChild(slide);
      count++;
    }
  }
  if(videoSrc){
    const vOk = await checkVideo(videoSrc);
    if(vOk){
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      const vid = document.createElement('video');
      vid.className = 'w-full h-auto object-cover max-h-[420px]';
      vid.controls = true; vid.playsInline = true;
      vid.innerHTML = `<source src="${videoSrc}" type="video/mp4" />`;
      slide.appendChild(vid);
      wrap.appendChild(slide);
    }
  }
  if(count===0){
    const placeholder = document.createElement('div');
    placeholder.className='p-4 text-center text-slate-500';
    placeholder.textContent='Adicione fotos em assets/imagem1.jpg, imagem2.jpg, ... para popular a galeria.';
    swiperEl.replaceWith(placeholder);
    return null;
  }
  const mainSwiper = new Swiper('.swiper', {
    loop: true,
    spaceBetween: 16,
    centeredSlides: true,
    slidesPerView: 1,
    autoHeight: true,
    observer: true,
    observeParents: true,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    autoplay: { delay: 4000, disableOnInteraction: false },
    breakpoints: { 768: { autoHeight: false } }
  });
  return mainSwiper;
}

// Modal open/close logic: clona slides do carrossel principal para a modal e inicializa Swiper grande
let modalSwiper = null;
let mainSwiper = null;
async function openGalleryModal(startIndex=0){
  const modal = document.querySelector('.gallery-modal');
  const modalWrapper = modal.querySelector('.gallery-swiper .swiper-wrapper');
  // helper: candidate high-res names
  function highResCandidates(src){
    return [
      src.replace(/(\.[^.]+)$/, '-large$1'),
      src.replace(/(\.[^.]+)$/, '@2x$1'),
      src.replace(/(\.[^.]+)$/, '-hd$1')
    ];
  }

  // populate only once
  if(modalWrapper.children.length === 0){
    const slides = document.querySelectorAll('.swiper .swiper-wrapper .swiper-slide');
    for(const s of slides){
      const clone = s.cloneNode(true);
      // try to upgrade images in the clone to high-res (only here)
      const imgs = clone.querySelectorAll('img');
      for(const img of imgs){
        const orig = img.getAttribute('src') || '';
        const candidates = highResCandidates(orig);
        for(const c of candidates){
          // eslint-disable-next-line no-await-in-loop
          const ok = await checkImage(c);
          if(ok){ img.src = c; break; }
        }
      }
      modalWrapper.appendChild(clone);
    }
  }

  // ensure modal is direct child of body to avoid stacking-context issues
  if(modal.parentNode !== document.body){ document.body.appendChild(modal); }
  // open
  modal.classList.add('active');
  modal.setAttribute('aria-hidden','false');
  // prevent background scroll on both html and body
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');

  // init modal swiper if needed
  if(!modalSwiper){
    modalSwiper = new Swiper('.gallery-swiper', {
      loop:true,
      spaceBetween:20,
      slidesPerView:1,
      centeredSlides:true,
      pagination:{ el: '.gallery-swiper .swiper-pagination', clickable:true },
      navigation:{ nextEl: '.gallery-swiper .swiper-button-next', prevEl: '.gallery-swiper .swiper-button-prev' }
    });

    // attach zoom handlers to images inside modal
    const modalImgs = document.querySelectorAll('.gallery-swiper .swiper-wrapper img');
    modalImgs.forEach(img => {
      let lastTap = 0;
      function toggleZoom(e){
        e.preventDefault && e.preventDefault();
        img.classList.toggle('zoomed');
      }
      img.addEventListener('dblclick', toggleZoom);
      img.addEventListener('click', (ev)=>{
        const now = Date.now();
        if(now - lastTap < 300) toggleZoom(ev);
        lastTap = now;
      });
      img.addEventListener('touchend', (ev)=>{
        const now = Date.now();
        if(now - lastTap < 300){ ev.preventDefault(); toggleZoom(ev); }
        lastTap = now;
      }, {passive:false});
    });
    // if caller requested a particular start index, move there
    if(typeof startIndex === 'number' && !Number.isNaN(startIndex)){
      try{ modalSwiper.slideToLoop(startIndex, 0, false); }catch(e){}
    }
  }
  else{
    // already initialized: just go to requested index
    try{ modalSwiper.slideToLoop(startIndex, 0, false); }catch(e){}
  }
}

function closeGalleryModal(){
  const modal = document.querySelector('.gallery-modal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden','true');
  // destroy modal swiper to free memory (keeps cloned slides though)
  if(modalSwiper){
    try{ modalSwiper.destroy(true,true); }catch(e){}
    modalSwiper = null;
  }
  // remove any zoom state
  const modalImgs = document.querySelectorAll('.gallery-swiper .swiper-wrapper img.zoomed');
  modalImgs.forEach(i=>i.classList.remove('zoomed'));
  // restore scrolling
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
}

window.addEventListener('load', async () => {
  // inject header/footer then initialize interactive bits
  await injectPartials();

  // Ano no rodapé
  const anoEl = document.getElementById('ano');
  if(anoEl) anoEl.textContent = new Date().getFullYear();

  // WhatsApp links (header/footer placeholders may have been added)
  ['linkWhatsApp','fabWhatsApp','ctaWhatsAppTopo','headerWhatsApp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.href = wa;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    }
  });

  // build main carousel and capture instance
  mainSwiper = await buildSlides();
  // attach handlers
  const modal = document.querySelector('.gallery-modal');
  if(modal){
    const closeBtn = modal.querySelector('.close-btn');
    if(closeBtn) closeBtn.addEventListener('click', closeGalleryModal);
    const backdrop = modal.querySelector('.backdrop');
    if(backdrop) backdrop.addEventListener('click', closeGalleryModal);
    document.addEventListener('keydown', (ev)=>{ if(ev.key==='Escape') closeGalleryModal(); });
  }

  // also open modal when clicking any image in the main carousel
  const mainSlides = document.querySelectorAll('.swiper .swiper-wrapper .swiper-slide');
  mainSlides.forEach((s, idx) => {
    const img = s.querySelector('img');
    if(img){
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (ev)=>{
        ev.preventDefault();
        openGalleryModal(idx);
      });
    }
  });
});
