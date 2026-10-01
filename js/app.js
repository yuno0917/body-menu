/* ボディメイク メニューメーカー: 画面の処理（フォーム・描画・保存・共有） */
(function () {
  'use strict';
  const B = window.Body;
  const D = B.DATA;

  const STORAGE_KEY = 'bodymenu:v1';
  const CODES = {
    level: { beginner: 'b', intermediate: 'i' },
    env: { gym: 'g', home: 'h' },
    focus: { balance: 'b', upper: 'u', lower: 'l' }
  };
  const LABELS = {
    level: { beginner: '初心者', intermediate: '中級者' },
    env: { gym: 'ジム', home: '自宅' },
    focus: { balance: '全身バランス', upper: '上半身重視', lower: '下半身重視' }
  };

  const form = document.getElementById('menu-form');
  const resultSection = document.getElementById('result');
  const summaryMeta = document.getElementById('summary-meta');
  const setsBody = document.querySelector('#sets-table tbody');
  const setsNote = document.getElementById('sets-note');
  const tabsEl = document.getElementById('week-tabs');
  const panelsEl = document.getElementById('week-panels');
  const shareBtn = document.getElementById('share-btn');
  const printBtn = document.getElementById('print-btn');
  const shareBox = document.getElementById('share-box');
  const shareInput = document.getElementById('share-url');
  const shareStatus = document.getElementById('share-status');

  let currentInput = null;

  // ---- 小さな DOM ヘルパー（文字列は必ず textContent として入れる） ----
  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(k => {
        const v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    children.flat(Infinity).forEach(c => {
      if (c == null || c === false) return;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return node;
  }

  function rirText(rir) {
    return rir === 0 ? '最後のセットだけ限界まで（ほかはあと1回）' : 'あと' + rir + '回';
  }

  // ---- フォームの状態 ----
  function readForm() {
    return {
      level: form.elements.level.value,
      freq: Number(form.elements.freq.value),
      env: form.elements.env.value,
      focus: form.elements.focus.value
    };
  }

  function setRadio(name, value) {
    const match = Array.from(form.querySelectorAll('input[name="' + name + '"]')).find(i => i.value === String(value));
    if (match) match.checked = true;
  }

  function applyState(s) {
    if (!s || typeof s !== 'object') return;
    ['level', 'freq', 'env', 'focus'].forEach(k => setRadio(k, s[k]));
  }

  // ---- 保存（使えないブラウザでも動くように try/catch で囲む） ----
  function save(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* 保存できなくても続行 */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // ---- URL での共有 ----
  function toParams(s) {
    const p = new URLSearchParams();
    p.set('lv', CODES.level[s.level]);
    p.set('f', String(s.freq));
    p.set('env', CODES.env[s.env]);
    p.set('fo', CODES.focus[s.focus]);
    return p;
  }
  function decode(map, code) {
    return Object.keys(map).find(k => map[k] === code);
  }
  function fromParams(search) {
    const p = new URLSearchParams(search);
    if (!p.has('lv') || !p.has('f')) return null;
    return {
      level: decode(CODES.level, p.get('lv')) || 'beginner',
      freq: Number(p.get('f')) || 3,
      env: decode(CODES.env, p.get('env')) || 'gym',
      focus: decode(CODES.focus, p.get('fo')) || 'balance'
    };
  }
  const baseUrl = () => location.href.split(/[?#]/)[0];
  function updateUrl(s) {
    try { history.replaceState(null, '', '?' + toParams(s).toString()); } catch (e) { /* file:// などで失敗しても続行 */ }
  }

  // ---- 描画 ----
  function renderSummary(p) {
    summaryMeta.textContent = [LABELS.level[p.level], '週' + p.freq + '回', LABELS.env[p.env], LABELS.focus[p.focus]].join('・');
    let low = false;
    setsBody.replaceChildren(...D.muscleOrder.map(m => {
      const sets = p.weeklySets[m];
      const target = p.targets[m];
      const ratio = Math.min(1, sets / target);
      const isLow = ratio < 0.8;
      if (isLow) low = true;
      return h('tr', null,
        h('th', { scope: 'row', text: D.muscles[m].name }),
        h('td', { class: 'cell-num' + (isLow ? ' is-low' : ''), text: sets + 'セット' }),
        h('td', { class: 'cell-num', text: target + 'セット' }),
        h('td', null, h('div', { class: 'sets-bar' + (isLow ? ' is-low' : '') }, h('span', { style: 'width:' + Math.round(ratio * 100) + '%' })))
      );
    }));
    const notes = ['2週目の量です。1週目は少なめ、4・7・8週目は多めになります。'];
    if (p.focus !== 'balance') notes.push('重点以外の部位は、今の筋肉を保つくらいの量にしています。');
    if (low) notes.push('1回のトレーニングが長くなりすぎないように、目標より少ない部位があります。週の回数を増やすと目標に近づきます。');
    setsNote.textContent = notes.join(' ');
  }

  function renderExercise(e) {
    return h('li', { class: 'ex ' + (e.type === 'main' ? 'ex-main' : 'ex-iso') },
      h('div', { class: 'ex-top' },
        h('span', { class: 'ex-name', text: e.name }),
        h('span', { class: 'ex-part', text: e.muscleName })
      ),
      h('div', { class: 'ex-load' },
        h('span', { class: 'ex-sets-big', text: String(e.reps).replace(/^([0-9〜]+)/, '$1rep') + ' ' + e.sets + 'set' })
      ),
      h('div', { class: 'ex-meta' },
        h('span', { text: '余力 ' + rirText(e.rir) }),
        h('span', { text: '休憩 ' + e.rest })
      ),
      h('p', { class: 'ex-cue', text: e.cue })
    );
  }

  function renderDay(d) {
    return h('article', { class: 'day' },
      h('h4', { class: 'day-title' }, d.name + '　' + d.title, h('span', { class: 'day-minutes', text: '約' + d.minutes + '分' })),
      h('ul', { class: 'ex-list' }, d.exercises.map(renderExercise))
    );
  }

  function renderWeek(w, i) {
    const panel = h('section', {
      class: 'week-panel',
      role: 'tabpanel',
      id: 'panel-w' + w.week,
      'aria-labelledby': 'tab-w' + w.week,
      tabindex: '0',
      hidden: i !== 0
    });
    panel.append(
      h('div', { class: 'week-head' },
        h('h3', null, '第' + w.week + '週', w.deload ? h('span', { class: 'badge badge-light', text: '軽め週' }) : null),
        h('p', { class: 'week-note', text: w.note })
      ),
      h('div', { class: 'days' }, w.days.map(renderDay))
    );
    return panel;
  }

  function render(p) {
    renderSummary(p);
    tabsEl.replaceChildren(...p.weeks.map((w, i) =>
      h('button', {
        type: 'button',
        role: 'tab',
        id: 'tab-w' + w.week,
        'aria-controls': 'panel-w' + w.week,
        'aria-selected': i === 0 ? 'true' : 'false',
        tabindex: i === 0 ? '0' : '-1',
        class: 'tab' + (w.deload ? ' is-light' : ''),
        onclick: () => selectWeek(i, false)
      },
      h('span', { text: w.week + '週' }),
      w.deload ? h('span', { class: 'tab-tag', text: '軽め' }) : null)
    ));
    panelsEl.replaceChildren(...p.weeks.map(renderWeek));
  }

  function selectWeek(index, focus) {
    const tabs = Array.from(tabsEl.children);
    const panels = Array.from(panelsEl.children);
    tabs.forEach((t, i) => {
      const on = i === index;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, i) => { p.hidden = i !== index; });
    const tab = tabs[index];
    if (tab) {
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  tabsEl.addEventListener('keydown', e => {
    const tabs = Array.from(tabsEl.children);
    const cur = tabs.indexOf(document.activeElement);
    if (cur < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = (cur + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (cur - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next == null) return;
    e.preventDefault();
    selectWeek(next, true);
  });

  // ---- 生成 ----
  function generate(scroll) {
    const s = readForm();
    const p = B.generateBodyProgram(s);
    currentInput = { level: p.level, freq: p.freq, env: p.env, focus: p.focus };
    render(p);
    resultSection.hidden = false;
    shareBox.hidden = true;
    save(currentInput);
    updateUrl(currentInput);
    if (scroll) resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    generate(true);
  });

  shareBtn.addEventListener('click', async () => {
    if (!currentInput) return;
    const url = baseUrl() + '?' + toParams(currentInput).toString();
    shareInput.value = url;
    shareBox.hidden = false;
    try {
      await navigator.clipboard.writeText(url);
      shareStatus.textContent = 'リンクをコピーしました。開くと同じメニューが表示されます。';
    } catch (e) {
      shareInput.focus();
      shareInput.select();
      shareStatus.textContent = 'リンクを選択しました。コピーして共有してください。';
    }
  });

  printBtn.addEventListener('click', () => window.print());

  // ---- 起動時: URL のパラメータ → 前回の入力 の順で復元 ----
  const initial = fromParams(location.search) || load();
  if (initial) {
    applyState(initial);
    generate(false);
  }
})();
