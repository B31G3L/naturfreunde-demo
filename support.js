/*
 * Mini-Laufzeit für die Demo-Seiten.
 * Rendert <x-dc>-Vorlagen mit {{platzhaltern}}, <template data-sc="if|for">
 * und einer Logik-Klasse (class Component extends DCLogic) als statische Seite.
 */
(function () {
  'use strict';

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interpolate(text, scope) {
    return text.replace(HOLE, function (_, p) {
      var v = lookup(p, scope);
      return v == null ? '' : String(v);
    });
  }

  var BOOL_PROPS = { checked: 1, disabled: 1, selected: 1, readonly: 1 };

  function applyAttrs(src, el, scope) {
    for (var i = 0; i < src.attributes.length; i++) {
      var a = src.attributes[i];
      var name = a.name;
      var val = a.value;
      if (name.indexOf('hint-') === 0) continue;
      var m = val.match(WHOLE);
      if (m) {
        var v = lookup(m[1], scope);
        if (/^on[a-z]+$/i.test(name) && typeof v === 'function') {
          el.addEventListener(name.slice(2).toLowerCase(), v);
          continue;
        }
        if (BOOL_PROPS[name.toLowerCase()]) {
          el[name.toLowerCase()] = !!v;
          if (v) el.setAttribute(name, '');
          continue;
        }
        if (v === false || v == null) {
          if (name.indexOf('aria-') === 0) el.setAttribute(name, String(!!v));
          continue;
        }
        el.setAttribute(name, String(v));
      } else if (val.indexOf('{{') !== -1) {
        el.setAttribute(name, interpolate(val, scope));
      } else {
        el.setAttribute(name, val);
      }
    }
  }

  function processChildren(nodes, scope, out) {
    for (var i = 0; i < nodes.length; i++) processNode(nodes[i], scope, out);
  }

  function processNode(node, scope, out) {
    if (node.nodeType === 3) {
      out.push(document.createTextNode(interpolate(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'template' && node.hasAttribute('data-sc')) {
      var kind = node.getAttribute('data-sc');
      var kids = node.content.childNodes;
      if (kind === 'if') {
        var m = (node.getAttribute('value') || '').match(WHOLE);
        if (m && lookup(m[1], scope)) processChildren(kids, scope, out);
      } else if (kind === 'for') {
        var lm = (node.getAttribute('list') || '').match(WHOLE);
        var list = lm ? lookup(lm[1], scope) : null;
        var as = node.getAttribute('as') || 'item';
        if (Array.isArray(list)) {
          list.forEach(function (item, idx) {
            var sub = Object.create(scope);
            sub[as] = item;
            sub.$index = idx;
            processChildren(kids, sub, out);
          });
        }
      }
      return;
    }
    if (tag === 'helmet') return;
    var el = node.namespaceURI === 'http://www.w3.org/2000/svg'
      ? document.createElementNS(node.namespaceURI, node.tagName)
      : document.createElement(node.tagName);
    applyAttrs(node, el, scope);
    var inner = [];
    processChildren(tag === 'template' ? node.content.childNodes : node.childNodes, scope, inner);
    inner.forEach(function (c) { el.appendChild(c); });
    out.push(el);
  }

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    if (this.__render) this.__render();
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__render) this.__render(); };
  DCLogic.prototype.renderVals = function () { return {}; };

  function addBanner() {
    var b = document.createElement('a');
    b.href = 'index.html';
    b.textContent = 'Demo · Beispieldaten · Übersicht';
    b.setAttribute('style', 'position:fixed;right:12px;bottom:12px;z-index:9999;background:#1C2A22;color:#fff;' +
      'font:600 13px/1 system-ui,sans-serif;padding:10px 14px;border-radius:999px;text-decoration:none;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.25)');
    document.body.appendChild(b);
  }

  function boot() {
    if (!document.querySelector('meta[name="viewport"]')) {
      var mv = document.createElement('meta');
      mv.name = 'viewport';
      mv.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(mv);
    }
    var host = document.querySelector('x-dc');
    if (!host) return;
    var helmet = host.querySelector('helmet');
    if (helmet) {
      Array.prototype.slice.call(helmet.children).forEach(function (c) { document.head.appendChild(c); });
    }
    var tpl = Array.prototype.slice.call(host.childNodes).filter(function (n) {
      return !(n.nodeType === 1 && n.tagName.toLowerCase() === 'helmet');
    });

    var script = document.querySelector('script[type="text/x-dc"]');
    var comp = new DCLogic({});
    if (script) {
      var Ctor = new Function('DCLogic', script.textContent + '\n;return typeof Component !== "undefined" ? Component : null;')(DCLogic);
      if (Ctor) {
        comp = new Ctor({});
        if (!comp.state) comp.state = {};
      }
    }

    var mount = document.createElement('div');
    mount.id = 'dc-root';
    host.parentNode.insertBefore(mount, host);
    host.style.display = 'none';

    function render() {
      var vals = comp.renderVals() || {};
      var out = [];
      processChildren(tpl, vals, out);
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      out.forEach(function (n) { mount.appendChild(n); });
      var root = mount.firstElementChild;
      var fixed = root && /(^|;)\s*width:\s*\d+px/.test(root.getAttribute('style') || '');
      if (fixed) {
        mount.setAttribute('style', 'display:flex;justify-content:center;padding:24px;box-sizing:border-box;min-height:100vh');
        document.body.style.background = '#E3E9DF';
        root.style.boxShadow = '0 8px 30px rgba(28,42,34,.18)';
        root.style.borderRadius = root.style.width === '390px' ? '28px' : '18px';
      }
    }
    comp.__render = render;
    render();
    addBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
