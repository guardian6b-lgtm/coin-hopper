const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the shipped inline script, with browser services replaced at the boundary.
function createGame({ html, saved = {}, storageBlocked = false } = {}) {
  html ??= fs.readFileSync(process.env.GAME_HTML || path.join(__dirname, '..', 'index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('The game inline script was not found');
  const listeners = new Map(), frames = [], delayed = [], elements = new Map();
  const storage = new Map(Object.entries(saved)), audio = { gains: [], oscillators: [] };
  const noop = () => {};
  let document;
  const bind = (map, name, callback) => {
    const callbacks = map.get(name) || [];
    callbacks.push(callback);
    map.set(name, callbacks);
  };
  function dispatch(map, name, properties = {}, currentTarget = null) {
    const event = { defaultPrevented: false, target: currentTarget, currentTarget,
      preventDefault() { this.defaultPrevented = true; }, stopPropagation: noop, ...properties };
    for (const callback of map.get(name) || []) callback.call(currentTarget, event);
    const handler = currentTarget?.['on' + name];
    if (typeof handler === 'function') handler.call(currentTarget, event);
    return event;
  }
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null;
      this.style = {}; this.attributes = {}; this.dataset = {}; this.listeners = new Map();
      this.hidden = false; this.disabled = false; this.value = ''; this._text = ''; this._id = '';
      this.classList = {
        add: (...names) => { this.className = [...new Set([...(this.className || '').split(' '), ...names])].filter(Boolean).join(' '); },
        remove: (...names) => { this.className = (this.className || '').split(' ').filter(n => !names.includes(n)).join(' '); },
        contains: name => (this.className || '').split(' ').includes(name),
        toggle: (name, force) => {
          const enabled = force ?? !this.classList.contains(name);
          enabled ? this.classList.add(name) : this.classList.remove(name);
          return enabled;
        },
      };
    }
    set id(value) { this._id = String(value); elements.set(this._id, this); }
    get id() { return this._id; }
    set textContent(value) { this._text = String(value ?? ''); this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set innerHTML(value) { this.replaceChildren(); parseMarkup(String(value), this); }
    get innerHTML() { return this.textContent; }
    get firstElementChild() { return this.children[0] || null; }
    get firstChild() { return this.children[0] || null; }
    get childNodes() { return this.children; }
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'id') this.id = value;
      else if (name === 'class') this.className = String(value);
      else if (name === 'hidden') this.hidden = true;
      else if (name === 'disabled') this.disabled = true;
      else if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
      else if (['type', 'value', 'min', 'max', 'step', 'role'].includes(name)) this[name] = String(value);
    }
    getAttribute(name) { return name === 'id' ? this.id : this.attributes[name] ?? null; }
    removeAttribute(name) { delete this.attributes[name]; if (name === 'hidden') this.hidden = false; }
    append(...children) {
      for (let child of children) {
        if (typeof child !== 'object') { const text = new Element('#text'); text._text = String(child); child = text; }
        child.parentElement = this; this.children.push(child);
      }
    }
    appendChild(child) { this.append(child); return child; }
    replaceChildren(...children) {
      for (const child of this.children) child.parentElement = null;
      this.children = []; this._text = ''; this.append(...children);
    }
    addEventListener(name, callback) { bind(this.listeners, name, callback); }
    removeEventListener(name, callback) { this.listeners.set(name, (this.listeners.get(name) || []).filter(item => item !== callback)); }
    matches(selector) {
      return selector.split(',').some(part => {
        part = part.trim();
        if (part.includes(':not([disabled])') && this.disabled) return false;
        part = part.replace(':not([disabled])', '');
        if (part.startsWith('#')) return this.id === part.slice(1);
        const tag = part.match(/^[a-z-]+/i)?.[0];
        if (tag && this.tagName !== tag.toUpperCase()) return false;
        for (const match of part.matchAll(/\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]/g)) {
          const actual = match[1] === 'disabled' ? (this.disabled ? '' : null) :
            match[1] === 'hidden' ? (this.hidden ? '' : null) :
            match[1].startsWith('data-') ? this.dataset[match[1].slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] :
            this.getAttribute(match[1]) ?? this[match[1]];
          if (actual == null || (match[2] !== undefined && String(actual) !== match[2])) return false;
        }
        return Boolean(tag || part.startsWith('[') || part === '*');
      });
    }
    closest(selector) { for (let item = this; item; item = item.parentElement) if (item.matches(selector)) return item; return null; }
    querySelectorAll(selector) {
      const result = [];
      for (const child of this.children) { if (child.matches(selector)) result.push(child); result.push(...child.querySelectorAll(selector)); }
      return result;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() { document.activeElement = this; }
    blur() { if (document.activeElement === this) document.activeElement = document.body; }
    click() { if (!this.disabled) dispatch(this.listeners, 'click', {}, this); }
    contains(target) { return target === this || this.children.some(child => child.contains(target)); }
    getContext() { return context2d; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 540 }; }
  }
  function parseMarkup(markup, root) {
    const stack = [root];
    for (const token of markup.matchAll(/<\/?([a-z][\w-]*)([^>]*)>|([^<]+)/gi)) {
      if (token[3]) { stack.at(-1)._text += token[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); continue; }
      if (token[0].startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
      const element = new Element(token[1]);
      for (const attr of token[2].matchAll(/([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
        element.setAttribute(attr[1], attr[2] ?? attr[3] ?? attr[4] ?? '');
      stack.at(-1).append(element);
      if (!['INPUT', 'META', 'LINK', 'BR', 'HR', 'IMG'].includes(element.tagName) && !token[0].endsWith('/>')) stack.push(element);
    }
  }
  const body = new Element('body');
  document = {
    body, activeElement: body,
    getElementById: id => elements.get(id) || null,
    createElement: tag => new Element(tag),
    querySelector: selector => body.querySelector(selector),
    querySelectorAll: selector => body.querySelectorAll(selector),
    addEventListener: (name, callback) => bind(listeners, name, callback),
  };
  parseMarkup(html.split('<script>')[0], body);
  const canvas = document.getElementById('c');
  const context2d = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }) }, {
    get(target, property) { return property in target ? target[property] : noop; },
  });
  canvas.getContext = () => context2d;
  const audioParam = value => ({
    value, values: [],
    setValueAtTime(next) { this.value = next; this.values.push(next); },
    exponentialRampToValueAtTime(next) { this.value = next; this.values.push(next); },
    linearRampToValueAtTime(next) { this.value = next; this.values.push(next); },
    setTargetAtTime(next) { this.value = next; this.values.push(next); },
    cancelScheduledValues: noop,
  });
  class AudioContext {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    createGain() { const gain = { gain: audioParam(1), connections: [], connect(target) { this.connections.push(target); return target; }, disconnect: noop }; audio.gains.push(gain); return gain; }
    createOscillator() {
      const oscillator = { frequency: audioParam(0), connections: [], connect(target) { this.connections.push(target); return target; }, start: noop, stops: [], stop(time) { this.stops.push(time); }, disconnect: noop };
      audio.oscillators.push(oscillator); return oscillator;
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
  }
  const context = vm.createContext({
    console, window: { AudioContext }, document,
    innerWidth: 960, innerHeight: 540,
    addEventListener: (name, callback) => bind(listeners, name, callback),
    performance: { now: () => 0 },
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: callback => { delayed.push(callback); return delayed.length; },
    clearTimeout: noop,
    localStorage: {
      getItem: key => { if (storageBlocked) throw new Error('Storage unavailable'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (storageBlocked) throw new Error('Storage unavailable'); storage.set(key, String(value)); },
    },
  });
  vm.runInContext(script, context, { filename: 'index.html' });
  const visible = element => { for (let item = element; item; item = item.parentElement) if (item.hidden) return false; return true; };
  const findButton = label => document.querySelectorAll('button').find(element => visible(element) &&
    (label instanceof RegExp ? label.test(element.textContent.trim()) : element.textContent.trim() === label));
  return {
    eval: code => vm.runInContext(code, context),
    snapshot: expression => JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context)),
    step(count = 1) { for (let i = 0; i < count; i++) vm.runInContext('update()', context); },
    event(name, properties = {}) { return dispatch(listeners, name, properties); },
    canvasEvent(name, properties = {}) { return dispatch(canvas.listeners, name, properties, canvas); },
    element: id => document.getElementById(id), findButton,
    domEvent(id, name, properties = {}) { const element = document.getElementById(id); return dispatch(element.listeners, name, properties, element); },
    click(label) {
      const button = document.getElementById(label) || findButton(label);
      if (!button || !visible(button)) throw new Error('Visible button not found: ' + label);
      button.click(); return button;
    },
    input(id, value) {
      const element = document.getElementById(id);
      if (!element) throw new Error('Input not found: ' + id);
      element.value = String(value); dispatch(element.listeners, 'input', {}, element);
    },
    frame(timestamp) {
      const callback = frames.shift();
      if (!callback) throw new Error('No animation frame is queued');
      callback(timestamp);
    },
    flushTimeouts() { for (const callback of delayed.splice(0)) callback(); },
    document, audio, storage,
  };
}

// A plain floor makes individual movement/collision tests independent of scenery.
function onFlatGround(game) {
  game.eval(`newGame();
    grid=Array.from({length:ROWS},(_,y)=>Array(LW).fill(y===13?'#':' '));
    coins=[];enemies=[];flag={x:(LW-2)*T,y:12*T};
    pl.x=4*T;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true;pl.inv=0;`);
  return game;
}

module.exports = { createGame, onFlatGround };
