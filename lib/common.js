'use strict';
var common = module.exports = {},
    ClassList = require('class-list'),
    $ = window.jQuery,
    punycode = require('punycode');

common.removeNode = function(el) {
  if (!el || !el.parentNode) return;
  el.parentNode.removeChild(el);
};

common.find = function(query, ctx) {
  if ($) return $(query, ctx).toArray();
  ctx = ctx || document;
  return Array.prototype.map.call(ctx.querySelectorAll(query), function(el) { return el; });
};

common.css = function(el, property, value) {
  if (el && !el.style.setProperty) { // Once again IE8
    if (!$) throw new Error('jQuery is needed for legacy browsers');
    return value ? $(el).css(property, value) : $(el).css(property);
  }
  if (typeof property === 'object') {
    return Object.keys(property).forEach(function(key) {
      common.css(el, key, property[key]);
    });
  }
  if (typeof value !== 'undefined') {
    if (value === '') return el ? el.style.removeProperty(property)  : undefined;
    return el ? el.style.setProperty(property, value) : undefined;
  }
  return el ? window.getComputedStyle(el, null).getPropertyValue(property) : undefined;
};

common.createElement = function(tag, attributes, innerHTML) {
  try {
    var el = document.createElement(tag);
    for (var key in attributes) {
      if (!attributes.hasOwnProperty(key)) continue;
      if (key === 'css') {
        common.css(el, attributes[key]);
      } else {
        common.attr(el, key, attributes[key]);
      }
    }
    el.innerHTML = innerHTML || '';
    return el;
  } catch (e) {
    if (!$) throw e;
    return $('<' + tag + '>' + innerHTML + '</' + tag + '>').attr(attributes)[0];
  }
};

common.toggleClass = function(el, cls, flag) {
  if (!el) return;
  var classes = ClassList(el);
  if (typeof flag === 'undefined') classes.toggle(cls);
  else if (flag) classes.add(cls);
  else if (!flag) classes.remove(cls);
};

common.addClass = function(el, cls) {
  return common.toggleClass(el, cls, true);
};

common.removeClass = function(el, cls) {
  return common.toggleClass(el, cls, false);
};

common.append = function(par, child) {
  par.appendChild(child);
  return par;
};

common.appendTo = function(child, par) {
  common.append(par, child);
  return child;
};

common.prepend = function(par, child) {
  par.insertBefore(child, par.firstChild);
};


// Inserts `el` after `child` that is child of `par`
common.insertAfter = function(par, child, el) {
  if (child == common.lastChild(par)) par.appendChild(el);
  var childIndex = Array.prototype.indexOf.call(par.children, child);
  par.insertBefore(el, par.children[childIndex + 1]);
};

common.html = function(elms, val) {
  elms = elms.length ? elms : [elms];
  elms.forEach(function(elm) {
    elm.innerHTML = val;
  });
};


common.attr = function(el, key, val) {
  if (key === 'class') key = 'className';
  if (common.hasOwnOrPrototypeProperty(el, key)) {
    try {
      el[key] = val;
    } catch (e) { // Most likely IE not letting set property
      if ($) {
        $(el).attr(key, val);
      } else {
        throw e;
      }
    }
  } else {
    el.setAttribute(key, val);
  }
  return el;
};

common.prop = function(el, key, val) {
  if (typeof val === 'undefined') {
    return el && el[key];
  }
  el[key] = val;
};

common.offset = function(el) {
  var ret = el.getBoundingClientRect();
  if (el.offsetWidth / el.offsetHeight > el.clientWidth / el.clientHeight) { // https://github.com/flowplayer/flowplayer/issues/757
    ret = {
      left: ret.left * 100,
      right: ret.right * 100,
      top: ret.top * 100,
      bottom: ret.bottom * 100,
      width: ret.width * 100,
      height: ret.height * 100
    };
  }
  return ret;
};

common.width = function(el, val) {
  /*jshint -W093 */
  if (val) return el.style.width = (''+val).replace(/px$/, '') + 'px';
  return common.offset(el).width;
};

common.height = function(el, val) {
  /*jshint -W093 */
  if (val) return el.style.height = (''+val).replace(/px$/, '') + 'px';
  return common.offset(el).height;
};

common.lastChild = function(el) {
  return el.children[el.children.length - 1];
};

common.hasParent = function(el, parentSelector) {
  var parent = el.parentElement;
  while (parent) {
    if (common.matches(parent, parentSelector)) return true;
    parent = parent.parentElement;
  }
  return false;
};

common.createAbsoluteUrl = function(url) {
  return common.createElement('a', {href: url}).href; // This won't work on IE7
};

common.xhrGet = function(url, successCb, errorCb) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState !== 4) return;
    if (this.status >= 400) return errorCb();
    successCb(this.responseText);
  };
  xhr.open('get', url, true);
  xhr.send();
};

common.pick = function(obj, props) {
  var ret = {};
  props.forEach(function(prop) {
    if (obj.hasOwnProperty(prop)) ret[prop] = obj[prop];
  });
  return ret;
};

common.hostname = function(host) {
  return punycode.toUnicode(host || window.location.hostname);
};

//Hacks
common.browser = {
  webkit: 'WebkitAppearance' in document.documentElement.style
};

common.getPrototype = function(el) {
  /* jshint proto:true */
  if (!Object.getPrototypeOf) return el.__proto__;
  return Object.getPrototypeOf(el);
};

common.hasOwnOrPrototypeProperty = function(obj, prop) {
  var o = obj;
  while (o) {
    if (Object.prototype.hasOwnProperty.call(o, prop)) return true;
    o = common.getPrototype(o);
  }
  return false;
};


// Polyfill for Element.matches
// adapted from https://developer.mozilla.org/en/docs/Web/API/Element/matches
common.matches = function(elem, selector) {
  var proto = Element.prototype,
      fn = proto.matches ||
          proto.matchesSelector ||
          proto.mozMatchesSelector ||
          proto.msMatchesSelector ||
          proto.oMatchesSelector ||
          proto.webkitMatchesSelector ||
          function (selector) {
            var element = this,
                matches = (element.document || element.ownerDocument).querySelectorAll(selector),
                i = 0;
            while (matches[i] && matches[i] !== element) {
              i++;
            }

            return matches[i] ? true : false;
      };
  return fn.call(elem, selector);
};
