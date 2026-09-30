/* ボディメイク メニューメーカー: メニュー生成（DOM に触れない純粋な関数） */
(function (root) {
  'use strict';
  const Body = root.Body = root.Body || {};

  const LEVELS = ['beginner', 'intermediate'];
  const FREQS = [2, 3, 4, 5];
  const ENVS = ['gym', 'home'];
  const FOCUSES = ['balance', 'upper', 'lower'];

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const pick = (value, allowed, fallback) => (allowed.indexOf(value) >= 0 ? value : fallback);

  function normalizeInput(input) {
    const src = input || {};
    return {
      level: pick(src.level, LEVELS, 'beginner'),
      freq: pick(Number(src.freq), FREQS, 3),
      env: pick(src.env, ENVS, 'gym'),
      focus: pick(src.focus, FOCUSES, 'balance')
    };
  }

  // 重点部位に合わせて、1週間の目標セット数を決める。お腹は重点の影響を受けない。
  function weeklyTargets(level, focus) {
    const D = Body.DATA;
    const base = D.targets[level];
    const group = D.focusGroups[focus];
    const out = {};
    D.muscleOrder.forEach(m => {
      let t = base[m];
      if (group.length && m !== 'abs') {
        t = group.indexOf(m) >= 0 ? Math.round(t * D.focusUp) : Math.max(D.focusMin, Math.round(t * D.focusDown));
      }
      out[m] = t;
    });
    return out;
  }

  // 1回の合計セット数が上限を超えたら、セット数の多い種目から1セットずつ減らす。
  // protect[i] が true の種目（重点部位）は、ほかを最低まで減らしてから減らす。
  // セット数が同じなら、weight[i]（その部位の週の目標）が大きい種目から減らす。
  // 目標が大きい部位は種目の数も多いので、1種目減らしても週の合計への影響が小さい。
  function capSession(sets, cap, min, protect, weight) {
    const s = sets.slice();
    let total = s.reduce((a, b) => a + b, 0);
    const reduce = allowProtected => {
      while (total > cap) {
        let idx = -1;
        for (let i = 0; i < s.length; i++) {
          if (s[i] <= min) continue;
          if (!allowProtected && protect && protect[i]) continue;
          if (idx < 0 || s[i] > s[idx]) { idx = i; continue; }
          if (s[i] === s[idx]) {
            const wi = weight ? weight[i] : 0;
            const wx = weight ? weight[idx] : 0;
            if (wi >= wx) idx = i;
          }
        }
        if (idx < 0) return;
        s[idx] -= 1;
        total -= 1;
      }
    };
    reduce(false);
    reduce(true);
    return s;
  }

  // 1週間全体を見て、各日の合計セット数を上限に収める。
  // 上限を超えた日の中から、「週のセット数 ÷ 目標」が一番大きい部位の種目を1セットずつ減らす。
  // 重点部位（protect）は、ほかを最低まで減らしてから減らす。
  function fitToCaps(days, caps, targets, min) {
    const weekly = {};
    days.forEach(d => d.muscles.forEach((m, i) => { weekly[m] = (weekly[m] || 0) + d.sets[i]; }));
    const total = d => d.sets.reduce((a, b) => a + b, 0);
    [false, true].forEach(allowProtected => {
      let changed = true;
      while (changed) {
        changed = false;
        days.forEach((d, di) => {
          if (total(d) <= caps[di]) return;
          let idx = -1;
          let best = -1;
          d.sets.forEach((v, i) => {
            if (v <= min) return;
            if (!allowProtected && d.protect[i]) return;
            const ratio = weekly[d.muscles[i]] / targets[d.muscles[i]];
            if (idx < 0 || ratio > best || (ratio === best && v >= d.sets[idx])) { idx = i; best = ratio; }
          });
          if (idx < 0) return;
          d.sets[idx] -= 1;
          weekly[d.muscles[idx]] -= 1;
          changed = true;
        });
      }
    });
    return days;
  }

  // 同じ日に同じ種目が重ならないように、候補の中から順番に選ぶ。すべて使用済みなら null。
  function chooseExercise(list, index, used) {
    for (let k = 0; k < list.length; k++) {
      const id = list[(index + k) % list.length];
      if (!used.has(id)) return id;
    }
    return null;
  }

  const UPPER = ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
  const LOWER_MAIN = ['quads', 'hams', 'glutes'];

  // 追加の種目を入れる位置: 同じ部位の直後。なければ、上半身・下半身それぞれの最後の種目の直後。
  function insertExtras(slots, extras) {
    const out = slots.map(([m, i]) => ({ m, i, extra: false }));
    extras.forEach(([m, i]) => {
      let pos = -1;
      out.forEach((s, k) => { if (s.m === m) pos = k; });
      if (pos < 0) {
        const group = UPPER.indexOf(m) >= 0 ? UPPER : LOWER_MAIN;
        out.forEach((s, k) => { if (group.indexOf(s.m) >= 0) pos = k; });
      }
      out.splice(pos + 1, 0, { m, i, extra: true });
    });
    return out;
  }

  function buildBase(input, targets) {
    const D = Body.DATA;
    const template = D.templates[input.freq];
    const focusSet = new Set(D.focusGroups[input.focus]);
    const slotMax = D.slotMax[input.level];

    // 1. 各日の種目を決める（重点部位の追加種目を含む）。
    const days = template.map((day, di) => {
      const extras = (day.extra && day.extra[input.focus]) || [];
      const used = new Set();
      const slots = [];
      insertExtras(day.slots, extras).forEach(s => {
        const list = D.lists[input.env][s.m];
        let id = chooseExercise(list, s.i, used);
        if (!id) {
          if (s.extra) return;
          id = list[s.i % list.length];
        }
        used.add(id);
        slots.push({ muscle: s.m, id, sets: 0, focus: focusSet.has(s.m) });
      });
      return { name: 'Day ' + (di + 1), title: day.title, slots };
    });

    // 2. 部位ごとの週の目標を、その部位の種目数で割ってセット数を決める。
    const occurrences = {};
    days.forEach(d => d.slots.forEach(s => { occurrences[s.muscle] = (occurrences[s.muscle] || 0) + 1; }));
    days.forEach(d => {
      d.slots.forEach(s => { s.sets = clamp(Math.round(targets[s.muscle] / occurrences[s.muscle]), D.slotMin, slotMax); });
      const hasFocus = d.slots.some(s => s.focus);
      d.cap = D.sessionMax[input.level] + (hasFocus ? D.focusSessionBonus[input.level] : 0);
    });

    // 3. 1回の上限を超える日は、週全体のバランスを見ながら減らす。
    const view = days.map(d => ({ sets: d.slots.map(s => s.sets), muscles: d.slots.map(s => s.muscle), protect: d.slots.map(s => s.focus) }));
    fitToCaps(view, days.map(d => d.cap), targets, D.slotMin);
    days.forEach((d, di) => d.slots.forEach((s, i) => { s.sets = view[di].sets[i]; }));
    return days;
  }

  function weeklySets(days) {
    const D = Body.DATA;
    const out = {};
    D.muscleOrder.forEach(m => { out[m] = 0; });
    days.forEach(d => d.slots.forEach(s => { out[s.muscle] += s.sets; }));
    return out;
  }

  function roundTo5(n) { return Math.max(5, Math.round(n / 5) * 5); }

  function buildWeek(spec, wi, baseDays, level, targets) {
    const D = Body.DATA;
    const slotMax = D.slotMax[level];
    const view = baseDays.map(day => ({
      sets: day.slots.map(s => {
        const raw = Math.round(s.sets * spec.vol);
        return spec.deload ? Math.max(1, raw) : clamp(raw, D.slotMin, slotMax);
      }),
      muscles: day.slots.map(s => s.muscle),
      protect: day.slots.map(s => s.focus)
    }));
    // 量を増やす週も、1回が長くなりすぎないように上限をかける。
    if (!spec.deload) {
      fitToCaps(view, baseDays.map(d => Math.round(d.cap * Math.min(spec.vol, D.weekCapFactor))), targets, D.slotMin);
    }
    const days = baseDays.map((day, di) => {
      const exercises = day.slots.map((s, i) => {
        const ex = D.exercises[s.id];
        return {
          id: s.id,
          name: ex.name,
          type: ex.type,
          muscle: s.muscle,
          muscleName: D.muscles[s.muscle].name,
          sets: view[di].sets[i],
          reps: ex.reps,
          rir: ex.type === 'main' ? spec.rirMain : spec.rirIso,
          rest: D.rest[ex.type],
          cue: ex.cue,
          long: !!ex.long
        };
      });
      const minutes = D.warmupMinutes + exercises.reduce((sum, e) => sum + e.sets * D.minutesPerSet[e.type], 0);
      return { name: day.name, title: day.title, minutes: roundTo5(minutes), exercises };
    });
    return { week: wi + 1, deload: !!spec.deload, note: spec.note, days };
  }

  function generateBodyProgram(rawInput) {
    const D = Body.DATA;
    const input = normalizeInput(rawInput);
    const targets = weeklyTargets(input.level, input.focus);
    const baseDays = buildBase(input, targets);
    return {
      level: input.level,
      freq: input.freq,
      env: input.env,
      focus: input.focus,
      targets,
      weeklySets: weeklySets(baseDays),
      weeks: D.weeks.map((spec, wi) => buildWeek(spec, wi, baseDays, input.level, targets))
    };
  }

  Object.assign(Body, { generateBodyProgram, weeklyTargets, capSession, fitToCaps, chooseExercise, insertExtras, normalizeInput });
})(typeof window !== 'undefined' ? window : globalThis);
