// Interações confortáveis e robustas para o plano operacional
(function(){
  const qs = (s, el=document)=>el.querySelector(s);
  const qsa = (s, el=document)=>Array.from(el.querySelectorAll(s));

  // Scroll progress
  const progress = qs('#progress');
  const onScroll = ()=>{
    const h = document.documentElement;
    const perc = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progress.style.width = `${perc}%`;
  };
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Smooth anchor + scrollspy
  qsa('.nav a').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const id = a.getAttribute('href');
      document.querySelector(id)?.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  const sections = qsa('section[id], aside[id]');
  const spy = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const link = qs(`.nav a[href="#${entry.target.id}"]`);
      if(!link) return;
      if(entry.isIntersecting){
        qsa('.nav a').forEach(x=>x.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, {threshold:.4});
  sections.forEach(s=>spy.observe(s));

  // Reveal on scroll
  const reveal = new IntersectionObserver(ents=>{
    ents.forEach(e=>e.target.classList.toggle('on', e.isIntersecting));
  }, {threshold:.2});
  qsa('.reveal').forEach(el=>reveal.observe(el));

  // Accordions
  qsa('.accord > button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const panel = btn.nextElementSibling;
      const open = panel.style.display === 'block';
      qsa('.accord .panel').forEach(p=>p.style.display='none');
      if(!open) panel.style.display = 'block';
    });
  });

  // KPI counters
  const counters = qsa('[data-counter]');
  const counterObs = new IntersectionObserver(ents=>{
    ents.forEach(e=>{
      if(!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.counter;
      let cur = 0;
      const step = Math.max(1, Math.floor(target/80));
      const t = setInterval(()=>{
        cur += step;
        if(cur >= target){ cur = target; clearInterval(t); }
        el.textContent = cur + (target<=100 && el.parentElement.textContent.includes('%') ? '%' : '');
      }, 16);
      counterObs.unobserve(el);
    });
  }, {threshold:.7});
  counters.forEach(c=>counterObs.observe(c));

  // Checklists with LocalStorage
  const KEY = 'limpeja_plan_checks_v1';
  const load = ()=>{
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  };
  const save = (obj)=>localStorage.setItem(KEY, JSON.stringify(obj));
  const state = load();

  qsa('.checklist').forEach(list=>{
    const name = list.dataset.list;
    const items = qsa('input[type="checkbox"]', list);
    items.forEach((box, i)=>{
      const key = `${name}:${i}`;
      box.checked = !!state[key];
      box.addEventListener('change', ()=>{
        state[key] = box.checked;
        save(state);
        // Adicionado: Feedback visual para o checklist
        const taskLabel = box.closest('.task');
        if (taskLabel) {
          taskLabel.classList.add('task-feedback');
          setTimeout(() => {
            taskLabel.classList.remove('task-feedback');
          }, 300); // Remove a classe após 300ms
        }
      });
    });
  });

  // Export / Import
  const exportData = ()=>{
    const data = localStorage.getItem(KEY) || '{}';
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'limpeja-checklists.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const importData = ()=>{
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = ()=>{
      const file = input.files?.[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        try{
          const data = JSON.parse(reader.result);
          localStorage.setItem(KEY, JSON.stringify(data));
          location.reload();
        }catch(e){ alert('Arquivo inválido.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Print
  const doPrint = ()=>window.print();

  qsa('[data-action="export"]').forEach(b=>b.addEventListener('click', exportData));
  qsa('[data-action="import"]').forEach(b=>b.addEventListener('click', importData));
  qsa('[data-action="print"]').forEach(b=>b.addEventListener('click', doPrint));
  qsa('[data-action="reset-checks"]').forEach(b=>b.addEventListener('click', ()=>{
    if(confirm('Zerar todos os checklists?')){ localStorage.removeItem(KEY); location.reload(); }
  }));

})();