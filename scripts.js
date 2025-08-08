// Minimal progressive enhancement: navigation toggle, experience timeline, publications filter.
(function(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  if (toggle && nav){
    toggle.addEventListener('click', ()=> nav.classList.toggle('open'));
  }

  // Theme toggle with persistence
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') root.classList.add('light');
  updateThemeIcon();
  if (themeToggle){
    themeToggle.addEventListener('click', ()=>{
      root.classList.toggle('light');
      const mode = root.classList.contains('light') ? 'light' : 'dark';
      localStorage.setItem('theme', mode);
      updateThemeIcon();
    });
  }
  function updateThemeIcon(){
    if (!themeToggle) return;
    const isLight = root.classList.contains('light');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
  }

  // Publications rendering and live filter
  const pubList = document.getElementById('pub-list');
  const pendingList = document.getElementById('pending-list');
  const pubSearch = document.getElementById('pub-search');
  const data = window.SITE_DATA || { publications: [], pending: [], experience: [] };

  function renderPublications(filter){
    if (!pubList) return;
    const q = (filter || '').trim().toLowerCase();
    pubList.innerHTML = '';
    (data.publications || []).filter(p => {
      if (!q) return true;
      const hay = `${p.title} ${p.year} ${(p.authors||[]).join(' ')}`.toLowerCase();
      return hay.includes(q);
    }).sort((a,b)=> (b.year||0)-(a.year||0)).forEach((p,i)=>{
      const li = document.createElement('li');
      li.innerHTML = `<strong>${p.title}</strong> <span class="meta">(${p.year})</span><br/><span class="muted">${(p.authors||[]).join(', ')}</span>`;
      pubList.appendChild(li);
    });
  }

  function renderPending(){
    if (!pendingList) return;
    pendingList.innerHTML = '';
    (data.pending || []).forEach((line)=>{
      const li = document.createElement('li');
      li.textContent = line;
      pendingList.appendChild(li);
    });
  }

  renderPublications('');
  renderPending();
  if (pubSearch){
    pubSearch.addEventListener('input', (e)=> renderPublications(e.target.value));
  }

  // Simple SVG experience timeline
  const viz = document.getElementById('experience-viz');
  if (viz && data.experience && data.experience.length){
    const padding = 20;
    const width = viz.clientWidth || 800;
    const height = viz.clientHeight || 220;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    const parse = (s)=> s ? new Date(s) : new Date();
    const items = data.experience.map(d=> ({...d, startD: parse(d.start), endD: parse(d.end)}));
    const min = new Date(Math.min.apply(null, items.map(i=> i.startD.getTime())));
    const max = new Date(Math.max.apply(null, items.map(i=> i.endD.getTime())));
    const span = max.getTime() - min.getTime() || 1;
    const yScale = { uni: 60, ind: 110, int: 160 };
    const color = { uni: '#4aa3ff', ind: '#ffd452', int: '#ff9b42' };

    // Axis line
    const axis = document.createElementNS(svgNS,'line');
    axis.setAttribute('x1', padding);
    axis.setAttribute('x2', width - padding);
    axis.setAttribute('y1', height/2);
    axis.setAttribute('y2', height/2);
    axis.setAttribute('stroke', 'rgba(255,255,255,0.2)');
    axis.setAttribute('stroke-width', '1');
    svg.appendChild(axis);

    // Bars
    items.forEach((i)=>{
      const x1 = padding + ((i.startD.getTime() - min.getTime())/span) * (width - padding*2);
      const x2 = padding + ((i.endD.getTime()   - min.getTime())/span) * (width - padding*2);
      const bar = document.createElementNS(svgNS,'rect');
      bar.setAttribute('x', x1);
      bar.setAttribute('y', yScale[i.type] || 130);
      bar.setAttribute('width', Math.max(2, x2 - x1));
      bar.setAttribute('height', 14);
      bar.setAttribute('rx', 6);
      bar.setAttribute('fill', color[i.type] || '#15b887');
      bar.setAttribute('opacity', '0.9');
      bar.appendChild(document.createElementNS(svgNS,'title')).textContent = `${i.role} — ${i.org}`;
      svg.appendChild(bar);
    });

    // Year ticks
    const startYear = min.getFullYear();
    const endYear = max.getFullYear();
    for (let y = startYear; y <= endYear; y++){
      const t = new Date(`${y}-01-01`).getTime();
      const x = padding + ((t - min.getTime())/span) * (width - padding*2);
      const tick = document.createElementNS(svgNS,'line');
      tick.setAttribute('x1', x);
      tick.setAttribute('x2', x);
      tick.setAttribute('y1', height/2 - 6);
      tick.setAttribute('y2', height/2 + 6);
      tick.setAttribute('stroke', 'rgba(255,255,255,0.18)');
      tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);

      const label = document.createElementNS(svgNS,'text');
      label.setAttribute('x', x + 4);
      label.setAttribute('y', height/2 - 10);
      label.setAttribute('fill', 'rgba(255,255,255,0.5)');
      label.setAttribute('font-size', '11');
      label.textContent = y.toString();
      svg.appendChild(label);
    }

    viz.innerHTML = '';
    viz.appendChild(svg);
  }

  // Skills cards with tabs and search
  const skillGrid = document.getElementById('skill-grid');
  if (skillGrid && window.SITE_DATA.skills){
    const skills = window.SITE_DATA.skills;
    const tabs = document.getElementById('skill-tabs');
    const searchEl = document.getElementById('skills-search');
    const info = {
      box: document.getElementById('skill-info'),
      title: document.getElementById('skill-title'),
      note: document.getElementById('skill-note')
    };

    function render(group='all', q=''){
      const term = q.trim().toLowerCase();
      skillGrid.innerHTML = '';
      skills.filter(s => group==='all' ? true : s.group===group)
        .filter(s => !term || s.name.toLowerCase().includes(term))
        .forEach(s =>{
          const card = document.createElement('button');
          card.className = 'skill-card';
          card.innerHTML = `<strong>${s.name}</strong><small>${labelFor(s.group)}</small>`;
          card.addEventListener('click', ()=>{
            info.title.textContent = s.name;
            info.note.textContent = s.note || '';
            info.box.hidden = false;
            info.box.scrollIntoView({behavior:'smooth', block:'nearest'});
          });
          skillGrid.appendChild(card);
        });
    }

    function labelFor(group){
      return ({robotics:'Robotics', ml:'AI', mechanical:'Mechanical', ag:'Agriculture', systems:'Systems'})[group] || 'Skill';
    }

    // Tabs
    if (tabs){
      tabs.addEventListener('click', (e)=>{
        const btn = e.target.closest('.tab');
        if (!btn) return;
        tabs.querySelectorAll('.tab').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
        render(btn.dataset.group, searchEl.value);
      });
    }

    // Search
    if (searchEl){
      searchEl.addEventListener('input', ()=>{
        const active = tabs.querySelector('.tab.active');
        const group = active ? active.dataset.group : 'all';
        render(group, searchEl.value);
      });
    }

    render('all','');
  }
})();


