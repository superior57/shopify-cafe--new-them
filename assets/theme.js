/*
@license
  Motion by Archetype Themes (https://archetypethemes.co)
  Access unminified JS in assets/theme.js

  Use this event listener to run your own JS outside of this file.
  Documentation - https://archetypethemes.co/blogs/motion/javascript-events-for-developers

  document.addEventListener('page:loaded', function() {
    // Page has loaded and theme assets are ready
  });
*/

window.theme = window.theme || {};

theme.config = {
  bpSmall: false,
  bpSmallValue: 589,
  hasSessionStorage: true,
  mediaQuerySmall: 'screen and (max-width: 589px)',
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
  rtl: document.documentElement.getAttribute('dir') == 'rtl' ? true : false
};

if (theme.config.isTouch) {
  document.documentElement.className += ' supports-touch';
}

if (console && console.log) {
  console.log('Motion theme ('+theme.settings.themeVersion+') by ARCHΞTYPE | Learn more at https://archetypethemes.co');
}

window.lazySizesConfig = window.lazySizesConfig || {};
lazySizesConfig.expFactor = 2.2;

(function(){
  'use strict';

  theme.delegate = {
    on: function(event, callback, options){
      if( !this.namespaces ) // save the namespaces on the DOM element itself
        this.namespaces = {};
  
      this.namespaces[event] = callback;
      options = options || false;
  
      this.addEventListener(event.split('.')[0], callback, options);
      return this;
    },
    off: function(event) {
      if (!this.namespaces) { return }
      this.removeEventListener(event.split('.')[0], this.namespaces[event]);
      delete this.namespaces[event];
      return this;
    }
  };
  
  // Extend the DOM with these above custom methods
  window.on = Element.prototype.on = theme.delegate.on;
  window.off = Element.prototype.off = theme.delegate.off;
  
  theme.utils = {
    defaultTo: function(value, defaultValue) {
      return (value == null || value !== value) ? defaultValue : value
    },
  
    wrap: function(el, wrapper) {
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    },
  
    debounce: function(wait, callback, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) callback.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) callback.apply(context, args);
      }
    },
  
    throttle: function(limit, callback) {
      var waiting = false;
      return function () {
        if (!waiting) {
          callback.apply(this, arguments);
          waiting = true;
          setTimeout(function () {
            waiting = false;
          }, limit);
        }
      }
    },
  
    prepareTransition: function(el, callback) {
      el.addEventListener('transitionend', removeClass);
  
      function removeClass(evt) {
        el.classList.remove('is-transitioning');
        el.removeEventListener('transitionend', removeClass);
      }
  
      el.classList.add('is-transitioning');
      el.offsetWidth; // check offsetWidth to force the style rendering
  
      if (typeof callback === 'function') {
        callback();
      }
    },
  
    // _.compact from lodash
    // Creates an array with all falsey values removed. The values `false`, `null`,
    // `0`, `""`, `undefined`, and `NaN` are falsey.
    // _.compact([0, 1, false, 2, '', 3]);
    // => [1, 2, 3]
    compact: function(array) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];
  
      while (++index < length) {
        var value = array[index];
        if (value) {
          result[resIndex++] = value;
        }
      }
      return result;
    },
  
    serialize: function(form) {
      var arr = [];
      Array.prototype.slice.call(form.elements).forEach(function(field) {
        if (
          !field.name ||
          field.disabled ||
          ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1
        )
          return;
        if (field.type === 'select-multiple') {
          Array.prototype.slice.call(field.options).forEach(function(option) {
            if (!option.selected) return;
            arr.push(
              encodeURIComponent(field.name) +
                '=' +
                encodeURIComponent(option.value)
            );
          });
          return;
        }
        if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked)
          return;
        arr.push(
          encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value)
        );
      });
      return arr.join('&');
    }
  };
  
  theme.a11y = {
    trapFocus: function(options) {
      var eventsName = {
        focusin: options.namespace ? 'focusin.' + options.namespace : 'focusin',
        focusout: options.namespace
          ? 'focusout.' + options.namespace
          : 'focusout',
        keydown: options.namespace
          ? 'keydown.' + options.namespace
          : 'keydown.handleFocus'
      };
  
      // Get every possible visible focusable element
      var focusableEls = options.container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])');
      var elArray = [].slice.call(focusableEls);
      var focusableElements = elArray.filter(el => el.offsetParent !== null);
  
      var firstFocusable = focusableElements[0];
      var lastFocusable = focusableElements[focusableElements.length - 1];
  
      if (!options.elementToFocus) {
        options.elementToFocus = options.container;
      }
  
      options.container.setAttribute('tabindex', '-1');
      options.elementToFocus.focus();
  
      document.documentElement.off('focusin');
      document.documentElement.on(eventsName.focusout, function() {
        document.documentElement.off(eventsName.keydown);
      });
  
      document.documentElement.on(eventsName.focusin, function(evt) {
        if (evt.target !== lastFocusable && evt.target !== firstFocusable) return;
  
        document.documentElement.on(eventsName.keydown, function(evt) {
          _manageFocus(evt);
        });
      });
  
      function _manageFocus(evt) {
        if (evt.keyCode !== 9) return;
        /**
         * On the first focusable element and tab backward,
         * focus the last element
         */
        if (evt.target === firstFocusable && evt.shiftKey) {
          evt.preventDefault();
          lastFocusable.focus();
        }
      }
    },
    removeTrapFocus: function(options) {
      var eventName = options.namespace
        ? 'focusin.' + options.namespace
        : 'focusin';
  
      if (options.container) {
        options.container.removeAttribute('tabindex');
      }
  
      document.documentElement.off(eventName);
    },
  
    lockMobileScrolling: function(namespace, element) {
      var el = element ? element : document.documentElement;
      document.documentElement.classList.add('lock-scroll');
      el.on('touchmove' + namespace, function() {
        return true;
      });
    },
  
    unlockMobileScrolling: function(namespace, element) {
      document.documentElement.classList.remove('lock-scroll');
      var el = element ? element : document.documentElement;
      el.off('touchmove' + namespace);
    }
  };
  
  // Add class when tab key starts being used to show outlines
  document.documentElement.on('keyup.tab', function(evt) {
    if (evt.keyCode === 9) {
      document.documentElement.classList.add('tab-outline');
      document.documentElement.off('keyup.tab');
    }
  });
  
  /**
   * Currency Helpers
   * -----------------------------------------------------------------------------
   * A collection of useful functions that help with currency formatting
   *
   * Current contents
   * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
   *   - When theme.settings.superScriptPrice is enabled, format cents in <sup> tag
   * - getBaseUnit - Splits unit price apart to get value + unit
   *
   */
  
  theme.Currency = (function() {
    var moneyFormat = '${{amount}}';
    var superScript = theme && theme.settings && theme.settings.superScriptPrice;
  
    function formatMoney(cents, format) {
      if (!format) {
        format = theme.settings.moneyFormat;
      }
  
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      var value = '';
      var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      var formatString = (format || moneyFormat);
  
      function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = theme.utils.defaultTo(precision, 2);
        thousands = theme.utils.defaultTo(thousands, ',');
        decimal = theme.utils.defaultTo(decimal, '.');
  
        if (isNaN(number) || number == null) {
          return 0;
        }
  
        number = (number / 100.0).toFixed(precision);
  
        var parts = number.split('.');
        var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        var centsAmount = parts[1] ? (decimal + parts[1]) : '';
  
        return dollarsAmount + centsAmount;
      }
  
      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
  
          if (superScript && value && value.includes('.')) {
            value = value.replace('.', '<sup>') + '</sup>';
          }
  
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
  
          if (superScript && value && value.includes('.')) {
            value = value.replace(',', '<sup>') + '</sup>';
          }
  
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ');
          break;
      }
  
      return formatString.replace(placeholderRegex, value);
    }
  
    function getBaseUnit(variant) {
      if (!variant) {
        return;
      }
  
      if (!variant.unit_price_measurement || !variant.unit_price_measurement.reference_value) {
        return;
      }
  
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    }
  
    return {
      formatMoney: formatMoney,
      getBaseUnit: getBaseUnit
    }
  })();
  
  theme.Images = (function() {
  
    /**
     * Find the Shopify image attribute size
     */
    function imageSize(src) {
      if (!src) {
        return '620x'; // default based on theme
      }
  
      var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);
  
      if (match !== null) {
        return match[1];
      } else {
        return null;
      }
    }
  
    /**
     * Adds a Shopify size attribute to a URL
     */
    function getSizedImageUrl(src, size) {
      if (!src) {
        return src;
      }
  
      if (size == null) {
        return src;
      }
  
      if (size === 'master') {
        return this.removeProtocol(src);
      }
  
      var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);
  
      if (match != null) {
        var prefix = src.split(match[0]);
        var suffix = match[0];
  
        return this.removeProtocol(prefix[0] + '_' + size + suffix);
      }
  
      return null;
    }
  
    function removeProtocol(path) {
      return path.replace(/http(s)?:/, '');
    }
  
    function lazyloadImagePath(string) {
      var image;
  
      if (string !== null) {
        image = string.replace(/(\.[^.]*)$/, "_{width}x$1");
      }
  
      return image;
    }
  
    return {
      imageSize: imageSize,
      getSizedImageUrl: getSizedImageUrl,
      removeProtocol: removeProtocol,
      lazyloadImagePath: lazyloadImagePath
    };
  })();
  
  theme.loadImageSection = function(container) {
    // Wait until images inside container have lazyloaded class
    function setAsLoaded() {
      container.classList.remove('loading', 'loading--delayed');
      container.classList.add('loaded');
    }
  
    function checkForLazyloadedImage() {
      return container.querySelector('.lazyloaded');
    }
  
    // If it has SVGs it's in the onboarding state so set as loaded
    if (container.querySelector('svg')) {
      setAsLoaded();
      return;
    };
  
    if (checkForLazyloadedImage()) {
      setAsLoaded();
      return;
    }
  
    var interval = setInterval(function() {
      if (checkForLazyloadedImage()) {
        clearInterval(interval);
        setAsLoaded();
      }
    }, 80);
  };
  
  // Init section function when it's visible, then disable observer
  theme.initWhenVisible = function(options) {
    var threshold = options.threshold ? options.threshold : 0;
  
    var observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (typeof options.callback === 'function') {
            options.callback();
            observer.unobserve(entry.target);
          }
        }
      });
    }, {rootMargin: '0px 0px '+ threshold +'px 0px'});
  
    observer.observe(options.element);
  };
  
  theme.LibraryLoader = (function() {
    var types = {
      link: 'link',
      script: 'script'
    };
  
    var status = {
      requested: 'requested',
      loaded: 'loaded'
    };
  
    var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';
  
    var libraries = {
      youtubeSdk: {
        tagId: 'youtube-sdk',
        src: 'https://www.youtube.com/iframe_api',
        type: types.script
      },
      vimeo: {
        tagId: 'vimeo-api',
        src: 'https://player.vimeo.com/api/player.js',
        type: types.script
      },
      shopifyXr: {
        tagId: 'shopify-model-viewer-xr',
        src: cloudCdn + 'shopify-xr-js/assets/v1.0/shopify-xr.en.js',
        type: types.script
      },
      modelViewerUi: {
        tagId: 'shopify-model-viewer-ui',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.en.js',
        type: types.script
      },
      modelViewerUiStyles: {
        tagId: 'shopify-model-viewer-ui-styles',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
        type: types.link
      }
    };
  
    function load(libraryName, callback) {
      var library = libraries[libraryName];
  
      if (!library) return;
      if (library.status === status.requested) return;
  
      callback = callback || function() {};
      if (library.status === status.loaded) {
        callback();
        return;
      }
  
      library.status = status.requested;
  
      var tag;
  
      switch (library.type) {
        case types.script:
          tag = createScriptTag(library, callback);
          break;
        case types.link:
          tag = createLinkTag(library, callback);
          break;
      }
  
      tag.id = library.tagId;
      library.element = tag;
  
      var firstScriptTag = document.getElementsByTagName(library.type)[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  
    function createScriptTag(library, callback) {
      var tag = document.createElement('script');
      tag.src = library.src;
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }
  
    function createLinkTag(library, callback) {
      var tag = document.createElement('link');
      tag.href = library.src;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }
  
    return {
      load: load
    };
  })();
  
  theme.rteInit = function() {
    // Wrap tables so they become scrollable on small screens
    document.querySelectorAll('.rte table').forEach(table => {
      var wrapWith = document.createElement('div');
      wrapWith.classList.add('table-wrapper');
      theme.utils.wrap(table, wrapWith);
    });
  
    // Wrap video iframe embeds so they are responsive
    document.querySelectorAll('.rte iframe[src*="youtube.com/embed"]').forEach(iframe => {
      wrapVideo(iframe);
    });
    document.querySelectorAll('.rte iframe[src*="player.vimeo"]').forEach(iframe => {
      wrapVideo(iframe);
    });
  
    function wrapVideo(iframe) {
      // Reset the src attribute on each iframe after page load
      // for Chrome's "incorrect iFrame content on 'back'" bug.
      // https://code.google.com/p/chromium/issues/detail?id=395791
      iframe.src = iframe.src;
      var wrapWith = document.createElement('div');
      wrapWith.classList.add('video-wrapper');
      theme.utils.wrap(iframe, wrapWith);
    }
  
    // Remove CSS that adds animated underline under image links
    document.querySelectorAll('.rte a img').forEach(img => {
      img.parentNode.classList.add('rte__image');
    });
  }
  
  theme.Sections = function Sections() {
    this.constructors = {};
    this.instances = [];
  
    document.addEventListener('shopify:section:load', this._onSectionLoad.bind(this));
    document.addEventListener('shopify:section:unload', this._onSectionUnload.bind(this));
    document.addEventListener('shopify:section:select', this._onSelect.bind(this));
    document.addEventListener('shopify:section:deselect', this._onDeselect.bind(this));
    document.addEventListener('shopify:block:select', this._onBlockSelect.bind(this));
    document.addEventListener('shopify:block:deselect', this._onBlockDeselect.bind(this));
  };
  
  theme.Sections.prototype = Object.assign({}, theme.Sections.prototype, {
    _createInstance: function(container, constructor, scope) {
      var id = container.getAttribute('data-section-id');
      var type = container.getAttribute('data-section-type');
  
      constructor = constructor || this.constructors[type];
  
      if (typeof constructor === 'undefined') {
        return;
      }
  
      // If custom scope passed, check to see if instance
      // is already initialized so we don't double up
      if (scope) {
        var instanceExists = this._findInstance(id);
        if (instanceExists) {
          this._removeInstance(id);
        }
      }
  
      var instance = Object.assign(new constructor(container), {
        id: id,
        type: type,
        container: container
      });
  
      this.instances.push(instance);
    },
  
    _findInstance: function(id) {
      for (var i = 0; i < this.instances.length; i++) {
        if (this.instances[i].id === id) {
          return this.instances[i];
        }
      }
    },
  
    _removeInstance: function(id) {
      var i = this.instances.length;
      var instance;
  
      while(i--) {
        if (this.instances[i].id === id) {
          instance = this.instances[i];
          this.instances.splice(i, 1);
          break;
        }
      }
  
      return instance;
    },
  
    _onSectionLoad: function(evt, subSection, subSectionId) {
      if (window.AOS) { AOS.refreshHard() }
      if (theme && theme.initGlobals) {
        theme.initGlobals();
      }
  
      var container = subSection ? subSection : evt.target;
      var section = subSection ? subSection : evt.target.querySelector('[data-section-id]');
  
      if (!section) {
        return;
      }
  
      this._createInstance(section);
  
      var instance = subSection ? subSectionId : this._findInstance(evt.detail.sectionId);
  
      // Check if we have subsections to load
      var haveSubSections = container.querySelectorAll('[data-subsection]');
      if (haveSubSections.length) {
        this.loadSubSections(container);
      }
  
      // Run JS only in case of the section being selected in the editor
      // before merchant clicks "Add"
      if (instance && typeof instance.onLoad === 'function') {
        instance.onLoad(evt);
      }
  
      // Force editor to trigger scroll event when loading a section
      setTimeout(function() {
        window.dispatchEvent(new Event('scroll'));
      }, 200);
    },
  
    _onSectionUnload: function(evt) {
      this.instances = this.instances.filter(function(instance) {
        var isEventInstance = instance.id === evt.detail.sectionId;
  
        if (isEventInstance) {
          if (typeof instance.onUnload === 'function') {
            instance.onUnload(evt);
          }
        }
  
        return !isEventInstance;
      });
    },
  
    loadSubSections: function(scope) {
      var sections = scope
                     ? scope.querySelectorAll('[data-subsection]')
                     : document.querySelectorAll('[data-subsection]');
  
      sections.forEach(el => {
        this._onSectionLoad(null, el, el.dataset.sectionId);
      });
  
      if (window.AOS) { AOS.refreshHard() }
    },
  
    _onSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onSelect === 'function'
      ) {
        instance.onSelect(evt);
      }
    },
  
    _onDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onDeselect === 'function'
      ) {
        instance.onDeselect(evt);
      }
    },
  
    _onBlockSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onBlockSelect === 'function'
      ) {
        instance.onBlockSelect(evt);
      }
    },
  
    _onBlockDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onBlockDeselect === 'function'
      ) {
        instance.onBlockDeselect(evt);
      }
    },
  
    register: function(type, constructor, scope) {
      this.constructors[type] = constructor;
  
      var sections = document.querySelectorAll('[data-section-type="' + type + '"]');
  
      if (scope) {
        sections = scope.querySelectorAll('[data-section-type="' + type + '"]');
      }
  
      sections.forEach(
        function(container) {
          this._createInstance(container, constructor, scope);
        }.bind(this)
      );
    },
  
    reinit: function(section) {
      for (var i = 0; i < this.instances.length; i++) {
        var instance = this.instances[i];
        if (instance['type'] === section) {
          if (typeof instance.forceReload === 'function') {
            instance.forceReload();
          }
        }
      }
    }
  });
  
  theme.Variants = (function() {
  
    function Variants(options) {
      this.container = options.container;
      this.variants = options.variants;
      this.singleOptionSelector = options.singleOptionSelector;
      this.originalSelectorId = options.originalSelectorId;
      this.enableHistoryState = options.enableHistoryState;
      this.currentVariant = this._getVariantFromOptions();
  
      this.container.querySelectorAll(this.singleOptionSelector).forEach(el => {
        el.addEventListener('change', this._onSelectChange.bind(this));
      });
    }
  
    Variants.prototype = Object.assign({}, Variants.prototype, {
  
      _getCurrentOptions: function() {
        var result = [];
  
        this.container.querySelectorAll(this.singleOptionSelector).forEach(el => {
          var type = el.getAttribute('type');
  
          if (type === 'radio' || type === 'checkbox') {
            if (el.checked) {
              result.push({
                value: el.value,
                index: el.dataset.index
              });
            }
          } else {
            result.push({
              value: el.value,
              index: el.dataset.index
            });
          }
        });
  
        // remove any unchecked input values if using radio buttons or checkboxes
        result = theme.utils.compact(result);
  
        return result;
      },
  
      _getVariantFromOptions: function() {
        var selectedValues = this._getCurrentOptions();
        var variants = this.variants;
        var found = false;
  
        variants.forEach(function(variant) {
          var match = true;
          var options = variant.options;
  
          selectedValues.forEach(function(option) {
            if (match) {
              match = (variant[option.index] === option.value);
            }
          });
  
          if (match) {
            found = variant;
          }
        });
  
        return found || null;
      },
  
      _onSelectChange: function() {
        var variant = this._getVariantFromOptions();
  
        this.container.dispatchEvent(new CustomEvent('variantChange', {
          detail: {
            variant: variant
          }
        }));
  
        document.dispatchEvent(new CustomEvent('variant:change', {
          detail: {
            variant: variant
          }
        }));
  
        if (!variant) {
          return;
        }
  
        this._updateMasterSelect(variant);
        this._updateImages(variant);
        this._updatePrice(variant);
        this._updateUnitPrice(variant);
        this._updateSKU(variant);
        this.currentVariant = variant;
  
        if (this.enableHistoryState) {
          this._updateHistoryState(variant);
        }
      },
  
      _updateImages: function(variant) {
        var variantImage = variant.featured_image || {};
        var currentVariantImage = this.currentVariant.featured_image || {};
  
        if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
          return;
        }
  
        this.container.dispatchEvent(new CustomEvent('variantImageChange', {
          detail: {
            variant: variant
          }
        }));
      },
  
      _updatePrice: function(variant) {
        if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
          return;
        }
  
        this.container.dispatchEvent(new CustomEvent('variantPriceChange', {
          detail: {
            variant: variant
          }
        }));
      },
  
      _updateUnitPrice: function(variant) {
        if (variant.unit_price === this.currentVariant.unit_price) {
          return;
        }
  
        this.container.dispatchEvent(new CustomEvent('variantUnitPriceChange', {
          detail: {
            variant: variant
          }
        }));
      },
  
      _updateSKU: function(variant) {
        if (variant.sku === this.currentVariant.sku) {
          return;
        }
  
        this.container.dispatchEvent(new CustomEvent('variantSKUChange', {
          detail: {
            variant: variant
          }
        }));
      },
  
      _updateHistoryState: function(variant) {
        if (!history.replaceState || !variant) {
          return;
        }
  
        var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({path: newurl}, '', newurl);
      },
  
      _updateMasterSelect: function(variant) {
        this.container.querySelector(this.originalSelectorId).value = variant.id;
      }
    });
  
    return Variants;
  })();
  
  window.vimeoApiReady = function() {
    theme.config.vimeoLoading = true;
  
    // Because there's no way to check for the Vimeo API being loaded
    // asynchronously, we use this terrible timeout to wait for it being ready
    checkIfVimeoIsReady()
      .then(function() {
        theme.config.vimeoReady = true;
        theme.config.vimeoLoading = false;
        document.dispatchEvent(new CustomEvent('vimeoReady'));
      });
  }
  
  function checkIfVimeoIsReady() {
    var wait;
    var timeout;
  
    var deferred = new Promise((resolve, reject) => {
      wait = setInterval(function() {
        if (!Vimeo) {
          return;
        }
  
        clearInterval(wait);
        clearTimeout(timeout);
        resolve();
      }, 500);
  
      timeout = setTimeout(function() {
        clearInterval(wait);
        reject();
      }, 4000); // subjective. test up to 8 times over 4 seconds
    });
  
    return deferred;
  }
  
  theme.VimeoPlayer = (function() {
    var classes = {
      loading: 'loading',
      loaded: 'loaded',
      interactable: 'video-interactable'
    }
  
    var defaults = {
      background: true,
      byline: false,
      controls: false,
      loop: true,
      muted: true,
      playsinline: true,
      portrait: false,
      title: false
    };
  
    function VimeoPlayer(divId, videoId, options) {
      this.divId = divId;
      this.el = document.getElementById(divId);
      this.videoId = videoId;
      this.iframe = null;
      this.options = options;
  
      if (this.options && this.options.videoParent) {
        this.parent = this.el.closest(this.options.videoParent);
      }
  
      this.setAsLoading();
  
      if (theme.config.vimeoReady) {
        this.init();
      } else {
        theme.LibraryLoader.load('vimeo', window.vimeoApiReady);
        document.addEventListener('vimeoReady', this.init.bind(this));
      }
    }
  
    VimeoPlayer.prototype = Object.assign({}, VimeoPlayer.prototype, {
      init: function() {
        var args = defaults;
        args.id = this.videoId;
  
        this.videoPlayer = new Vimeo.Player(this.el, args);
  
        this.videoPlayer.ready().then(this.playerReady.bind(this));
      },
  
      playerReady: function() {
        this.iframe = this.el.querySelector('iframe');
        this.iframe.setAttribute('tabindex', '-1');
  
        this.videoPlayer.setMuted(true);
  
        this.setAsLoaded();
  
        // pause when out of view
        var observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.play();
            } else {
              this.pause();
            }
          });
        }, {rootMargin: '0px 0px 50px 0px'});
  
        observer.observe(this.iframe);
      },
  
      setAsLoading: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.loading);
      },
  
      setAsLoaded: function() {
        if (!this.parent) return;
        this.parent.classList.remove(classes.loading);
        this.parent.classList.add(classes.loaded);
        if (Shopify && Shopify.designMode) {
          if (window.AOS) {AOS.refreshHard()}
        }
      },
  
      enableInteraction: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.interactable);
      },
  
      play: function() {
        if (this.videoPlayer && typeof this.videoPlayer.play === 'function') {
          this.videoPlayer.play();
        }
      },
  
      pause: function() {
        if (this.videoPlayer && typeof this.videoPlayer.pause === 'function') {
          this.videoPlayer.pause();
        }
      },
  
      destroy: function() {
        if (this.videoPlayer && typeof this.videoPlayer.destroy === 'function') {
          this.videoPlayer.destroy();
        }
      }
    });
  
    return VimeoPlayer;
  })();
  
  window.onYouTubeIframeAPIReady = function() {
    theme.config.youTubeReady = true;
    document.dispatchEvent(new CustomEvent('youTubeReady'));
  }
  
  /*============================================================================
    YouTube SDK method
    Parameters:
      - player div id (required)
      - arguments
        - videoId (required)
        - videoParent (selector, optional for section loading state)
        - events (object, optional)
  ==============================================================================*/
  theme.YouTube = (function() {
    var classes = {
      loading: 'loading',
      loaded: 'loaded',
      interactable: 'video-interactable'
    }
  
    var defaults = {
      width: 1280,
      height: 720,
      playerVars: {
        autohide: 0,
        autoplay: 1,
        cc_load_policy: 0,
        controls: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      }
    };
  
    function YouTube(divId, options) {
      this.divId = divId;
      this.iframe = null;
  
      this.attemptedToPlay = false;
  
      // API callback events
      defaults.events = {
        onReady: this.onVideoPlayerReady.bind(this),
        onStateChange: this.onVideoStateChange.bind(this)
      };
  
      this.options = Object.assign({}, defaults, options);
  
      if (this.options) {
        if (this.options.videoParent) {
          this.parent = document.getElementById(this.divId).closest(this.options.videoParent);
        }
  
        // Most YT videos will autoplay. If in product media,
        // will handle in theme.Product instead
        if (!this.options.autoplay) {
          this.options.playerVars.autoplay = this.options.autoplay;
        }
  
        if (this.options.style === 'sound') {
          this.options.playerVars.controls = 1;
          this.options.playerVars.autoplay = 0;
        }
  
      }
  
      this.setAsLoading();
  
      if (theme.config.youTubeReady) {
        this.init();
      } else {
        theme.LibraryLoader.load('youtubeSdk');
        document.addEventListener('youTubeReady', this.init.bind(this));
      }
    }
  
    YouTube.prototype = Object.assign({}, YouTube.prototype, {
      init: function() {
        this.videoPlayer = new YT.Player(this.divId, this.options);
      },
  
      onVideoPlayerReady: function(evt) {
        this.iframe = document.getElementById(this.divId); // iframe once YT loads
        this.iframe.setAttribute('tabindex', '-1');
  
        if (this.options.style !== 'sound') {
          evt.target.mute();
        }
  
        // pause when out of view
        var observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.play();
            } else {
              this.pause();
            }
          });
        }, {rootMargin: '0px 0px 50px 0px'});
  
        observer.observe(this.iframe);
      },
  
      onVideoStateChange: function(evt) {
        switch (evt.data) {
          case -1: // unstarted
            // Handle low power state on iOS by checking if
            // video is reset to unplayed after attempting to buffer
            if (this.attemptedToPlay) {
              this.setAsLoaded();
              this.enableInteraction();
            }
            break;
          case 0: // ended, loop it
            this.play(evt);
            break;
          case 1: // playing
            this.setAsLoaded();
            break;
          case 3: // buffering
            this.attemptedToPlay = true;
            break;
        }
      },
  
      setAsLoading: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.loading);
      },
  
      setAsLoaded: function() {
        if (!this.parent) return;
        this.parent.classList.remove(classes.loading);
        this.parent.classList.add(classes.loaded);
        if (Shopify && Shopify.designMode) {
          if (window.AOS) {AOS.refreshHard()}
        }
      },
  
      enableInteraction: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.interactable);
      },
  
      play: function() {
        if (this.videoPlayer && typeof this.videoPlayer.playVideo === 'function') {
          this.videoPlayer.playVideo();
        }
      },
  
      pause: function() {
        if (this.videoPlayer && typeof this.videoPlayer.pauseVideo === 'function') {
          this.videoPlayer.pauseVideo();
        }
      },
  
      destroy: function() {
        if (this.videoPlayer && typeof this.videoPlayer.destroy === 'function') {
          this.videoPlayer.destroy();
        }
      }
    });
  
    return YouTube;
  })();
  

  theme.cart = {
    getCart: function() {
      var url = ''.concat(theme.routes.cart, '?t=').concat(Date.now());
      return fetch(url, {
        credentials: 'same-origin',
        method: 'GET'
      }).then(response => response.json());
    },
  
    getCartProductMarkup: function() {
      var url = ''.concat(theme.routes.cartPage, '?t=').concat(Date.now());
  
      url = url.indexOf('?') === -1 ? (url + '?view=ajax') : (url + '&view=ajax');
  
      return fetch(url, {
        credentials: 'same-origin',
        method: 'GET'
      })
      .then(function(response) {return response.text()});
    },
  
    changeItem: function(key, qty) {
      return this._updateCart({
        url: ''.concat(theme.routes.cartChange, '?t=').concat(Date.now()),
        data: JSON.stringify({
          id: key,
          quantity: qty
        })
      })
    },
  
    _updateCart: function(params) {
      return fetch(params.url, {
        method: 'POST',
        body: params.data,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.json())
      .then(function(cart) {
        return cart;
      });
    },
  
    updateAttribute: function(key, value) {
      return this._updateCart({
        url: '/cart/update.js',
        data: JSON.stringify({
          attributes: {
            [key]: theme.cart.attributeToString(value)
          }
        })
      });
    },
  
    updateNote: function(note) {
      return this._updateCart({
        url: '/cart/update.js',
        data: JSON.stringify({
          note: theme.cart.attributeToString(note)
        })
      });
    },
  
    attributeToString: function(attribute) {
      if ((typeof attribute) !== 'string') {
        attribute += '';
        if (attribute === 'undefined') {
          attribute = '';
        }
      }
      return attribute.trim();
    }
  }
  
  /*============================================================================
    CartForm
    - Prevent checkout when terms checkbox exists
    - Listen to quantity changes, rebuild cart (both widget and page)
  ==============================================================================*/
  theme.CartForm = (function() {
    var selectors = {
      products: '[data-products]',
      qtySelector: '.js-qty__wrapper',
      discounts: '[data-discounts]',
      savings: '[data-savings]',
      subTotal: '[data-subtotal]',
  
      cartBubble: '#CartBubble',
      cartNote: '[name="note"]',
      termsCheckbox: '.cart__terms-checkbox',
      checkoutBtn: '.cart__checkout'
    };
  
    var classes = {
      btnLoading: 'btn--loading'
    };
  
    var config = {
      requiresTerms: false
    };
  
    function CartForm(form) {
      if (!form) {
        return;
      }
  
      this.form = form;
      this.wrapper = form.parentNode;
      this.location = form.dataset.location;
      this.namespace = '.cart-' + this.location;
      this.products = form.querySelector(selectors.products)
      this.submitBtn = form.querySelector(selectors.checkoutBtn);
  
      this.discounts = form.querySelector(selectors.discounts);
      this.savings = form.querySelector(selectors.savings);
      this.subtotal = form.querySelector(selectors.subTotal);
      this.termsCheckbox = form.querySelector(selectors.termsCheckbox);
      this.noteInput = form.querySelector(selectors.cartNote);
  
      if (this.termsCheckbox) {
        config.requiresTerms = true;
      }
  
      this.init();
    }
  
    CartForm.prototype = Object.assign({}, CartForm.prototype, {
      init: function() {
        this.initQtySelectors();
  
        document.addEventListener('cart:quantity' + this.namespace, this.quantityChanged.bind(this));
  
        this.form.on('submit' + this.namespace, this.onSubmit.bind(this));
  
        if (this.noteInput) {
          this.noteInput.addEventListener('change', function() {
            var newNote = this.value;
            theme.cart.updateNote(newNote);
          });
        }
  
        // Dev-friendly way to build the cart
        document.addEventListener('cart:build', function() {
          this.buildCart();
        }.bind(this));
      },
  
      reInit: function() {
        this.initQtySelectors();
      },
  
      onSubmit: function(evt) {
        this.submitBtn.classList.add(classes.btnLoading);
  
        if (config.requiresTerms) {
          if (this.termsCheckbox.checked) {
            // continue to checkout
          } else {
            alert(theme.strings.cartTermsConfirmation);
            this.submitBtn.classList.remove(classes.btnLoading)
            evt.preventDefault();
            return false;
          }
        }
      },
  
      /*============================================================================
        Query cart page to get markup
      ==============================================================================*/
      _parseProductHTML: function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        return {
          items: doc.querySelector('.cart__items'),
          discounts: doc.querySelector('.cart__discounts')
        }
      },
  
      buildCart: function() {
        theme.cart.getCartProductMarkup().then(this.cartMarkup.bind(this));
      },
  
      cartMarkup: function(html) {
        var markup = this._parseProductHTML(html);
        var items = markup.items;
        var count = parseInt(items.dataset.count);
        var subtotal = items.dataset.cartSubtotal;
        var savings = items.dataset.cartSavings;
  
        this.updateCartDiscounts(markup.discounts);
        this.updateSavings(savings);
  
        if (count > 0) {
          this.wrapper.classList.remove('is-empty');
        } else {
          this.wrapper.classList.add('is-empty');
        }
  
        this.updateCount(count);
  
        // Append item markup
        this.products.innerHTML = '';
        this.products.append(items);
  
        // Update subtotal
        this.subtotal.innerHTML = theme.Currency.formatMoney(subtotal, theme.settings.moneyFormat);
  
        this.reInit();
  
        if (window.AOS) { AOS.refreshHard() }
  
        if (Shopify && Shopify.StorefrontExpressButtons) {
          Shopify.StorefrontExpressButtons.initialize();
        }
      },
  
      updateCartDiscounts: function(markup) {
        if (!this.discounts) {
          return;
        }
        this.discounts.innerHTML = '';
        this.discounts.append(markup);
      },
  
      /*============================================================================
        Quantity handling
      ==============================================================================*/
      initQtySelectors: function() {
        this.form.querySelectorAll(selectors.qtySelector).forEach(el => {
          var selector = new theme.QtySelector(el, {
            namespace: this.namespace,
            isCart: true
          });
        });
      },
  
      quantityChanged: function(evt) {
        var key = evt.detail[0];
        var qty = evt.detail[1];
        var el = evt.detail[2];
  
        if (!key || !qty) {
          return;
        }
  
        // Disable qty selector so multiple clicks can't happen while loading
        if (el) {
          el.classList.add('is-loading');
        }
  
        theme.cart.changeItem(key, qty)
          .then(function(cart) {
            if (cart.item_count > 0) {
              this.wrapper.classList.remove('is-empty');
            } else {
              this.wrapper.classList.add('is-empty');
            }
  
            this.buildCart();
  
            document.dispatchEvent(new CustomEvent('cart:updated', {
              detail: {
                cart: cart
              }
            }));
          }.bind(this))
          .catch(function(XMLHttpRequest){});
      },
  
      /*============================================================================
        Update elements of the cart
      ==============================================================================*/
      updateSubtotal: function(subtotal) {
        this.form.querySelector(selectors.subTotal).innerHTML = theme.Currency.formatMoney(subtotal, theme.settings.moneyFormat);
      },
  
      updateSavings: function(savings) {
        if (!this.savings) {
          return;
        }
  
        if (savings > 0) {
          var amount = theme.Currency.formatMoney(savings, theme.settings.moneyFormat);
          this.savings.classList.remove('hide');
          this.savings.innerHTML = theme.strings.cartSavings.replace('[savings]', amount);
        } else {
          this.savings.classList.add('hide');
        }
      },
  
      updateCount: function(count) {
        var countEl = document.querySelector('.cart-link__bubble-num');
  
        if (countEl) {
          countEl.innerText = count;
        }
  
        // show/hide bubble
        if (count > 0) {
          document.querySelector(selectors.cartBubble).classList.add('cart-link__bubble--visible');
        } else {
          document.querySelector(selectors.cartBubble).classList.remove('cart-link__bubble--visible');
        }
      }
    });
  
    return CartForm;
  })();
  
  theme.collapsibles = (function() {
    var selectors = {
      trigger: '.collapsible-trigger',
      module: '.collapsible-content',
      moduleInner: '.collapsible-content__inner'
    };
  
    var classes = {
      hide: 'hide',
      open: 'is-open',
      autoHeight: 'collapsible--auto-height'
    };
  
    var namespace = '.collapsible';
  
    var isTransitioning = false;
  
    function init(scope) {
      var el = scope ? scope : document;
      el.querySelectorAll(selectors.trigger).forEach(trigger => {
        var state = trigger.classList.contains(classes.open);
        trigger.setAttribute('aria-expanded', state);
  
        trigger.off('click' + namespace);
        trigger.on('click' + namespace, toggle);
      });
    }
  
    function toggle(evt) {
      if (isTransitioning) {
        return;
      }
  
      isTransitioning = true;
  
      var el = evt.currentTarget;
      var isOpen = el.classList.contains(classes.open);
      var moduleId = el.getAttribute('aria-controls');
      var container = document.getElementById(moduleId);
  
      // If container=null, there isn't a matching ID.
      // Check if data-id is set instead. Could be multiple.
      // Select based on being in the same parent div.
      if (!container) {
        var multipleMatches = document.querySelectorAll('[data-id="' + moduleId + '"]');
        if (multipleMatches.length > 0) {
          container = el.parentNode.querySelector('[data-id="' + moduleId + '"]');
        }
      }
  
      if (!container) {
        isTransitioning = false;
        return;
      }
  
      var height = container.querySelector(selectors.moduleInner).offsetHeight;
      var isAutoHeight = container.classList.contains(classes.autoHeight);
      var parentCollapsibleEl = container.parentNode.closest(selectors.module);
      var childHeight = height;
  
      // If isAutoHeight, set the height to 0 just after setting the actual height
      // so the closing animation works nicely
      if (isOpen && isAutoHeight) {
        setTimeout(function() {
          height = 0;
          setTransitionHeight(container, height, isOpen, isAutoHeight);
        }, 0);
      }
  
      if (isOpen && !isAutoHeight) {
        height = 0;
      }
  
      el.setAttribute('aria-expanded', !isOpen);
      if (isOpen) {
        el.classList.remove(classes.open);
      } else {
        el.classList.add(classes.open);
      }
  
      setTransitionHeight(container, height, isOpen, isAutoHeight);
  
      // If we are in a nested collapsible element like the mobile nav,
      // also set the parent element's height
      if (parentCollapsibleEl) {
        var totalHeight = isOpen
                          ? parentCollapsibleEl.offsetHeight - childHeight
                          : height + parentCollapsibleEl.offsetHeight;
  
        setTransitionHeight(parentCollapsibleEl, totalHeight, false, false);
      }
  
      // If Shopify Product Reviews app installed,
      // resize container on 'Write review' click
      // that shows form
      if (window.SPR) {
        var btn = container.querySelector('.spr-summary-actions-newreview');
        if (!btn) { return }
        btn.off('click' + namespace);
        btn.on('click' + namespace, function() {
          height = container.querySelector(selectors.moduleInner).offsetHeight;
          setTransitionHeight(container, height, isOpen, isAutoHeight);
        });
      }
    }
  
    function setTransitionHeight(container, height, isOpen, isAutoHeight) {
      container.classList.remove(classes.hide);
      theme.utils.prepareTransition(container, function() {
        container.style.height = height+'px';
        if (isOpen) {
          container.classList.remove(classes.open);
        } else {
          container.classList.add(classes.open);
        }
      });
  
      if (!isOpen && isAutoHeight) {
        var o = container;
        window.setTimeout(function() {
          o.css('height','auto');
          isTransitioning = false;
        }, 500);
      } else {
        isTransitioning = false;
      }
    }
  
    return {
      init: init
    };
  })();
  
  // Shopify-built select-like popovers for currency and language selection
  theme.Disclosure = (function() {
    var selectors = {
      disclosureForm: '[data-disclosure-form]',
      disclosureList: '[data-disclosure-list]',
      disclosureToggle: '[data-disclosure-toggle]',
      disclosureInput: '[data-disclosure-input]',
      disclosureOptions: '[data-disclosure-option]'
    };
  
    var classes = {
      listVisible: 'disclosure-list--visible'
    };
  
    function Disclosure(disclosure) {
      this.container = disclosure;
      this._cacheSelectors();
      this._setupListeners();
    }
  
    Disclosure.prototype = Object.assign({}, Disclosure.prototype, {
      _cacheSelectors: function() {
        this.cache = {
          disclosureForm: this.container.closest(selectors.disclosureForm),
          disclosureList: this.container.querySelector(selectors.disclosureList),
          disclosureToggle: this.container.querySelector(
            selectors.disclosureToggle
          ),
          disclosureInput: this.container.querySelector(
            selectors.disclosureInput
          ),
          disclosureOptions: this.container.querySelectorAll(
            selectors.disclosureOptions
          )
        };
      },
  
      _setupListeners: function() {
        this.eventHandlers = this._setupEventHandlers();
  
        this.cache.disclosureToggle.addEventListener(
          'click',
          this.eventHandlers.toggleList
        );
  
        this.cache.disclosureOptions.forEach(function(disclosureOption) {
          disclosureOption.addEventListener(
            'click',
            this.eventHandlers.connectOptions
          );
        }, this);
  
        this.container.addEventListener(
          'keyup',
          this.eventHandlers.onDisclosureKeyUp
        );
  
        this.cache.disclosureList.addEventListener(
          'focusout',
          this.eventHandlers.onDisclosureListFocusOut
        );
  
        this.cache.disclosureToggle.addEventListener(
          'focusout',
          this.eventHandlers.onDisclosureToggleFocusOut
        );
  
        document.body.addEventListener('click', this.eventHandlers.onBodyClick);
      },
  
      _setupEventHandlers: function() {
        return {
          connectOptions: this._connectOptions.bind(this),
          toggleList: this._toggleList.bind(this),
          onBodyClick: this._onBodyClick.bind(this),
          onDisclosureKeyUp: this._onDisclosureKeyUp.bind(this),
          onDisclosureListFocusOut: this._onDisclosureListFocusOut.bind(this),
          onDisclosureToggleFocusOut: this._onDisclosureToggleFocusOut.bind(this)
        };
      },
  
      _connectOptions: function(event) {
        event.preventDefault();
  
        this._submitForm(event.currentTarget.dataset.value);
      },
  
      _onDisclosureToggleFocusOut: function(event) {
        var disclosureLostFocus =
          this.container.contains(event.relatedTarget) === false;
  
        if (disclosureLostFocus) {
          this._hideList();
        }
      },
  
      _onDisclosureListFocusOut: function(event) {
        var childInFocus = event.currentTarget.contains(event.relatedTarget);
  
        var isVisible = this.cache.disclosureList.classList.contains(
          classes.listVisible
        );
  
        if (isVisible && !childInFocus) {
          this._hideList();
        }
      },
  
      _onDisclosureKeyUp: function(event) {
        if (event.which !== 27) return;
        this._hideList();
        this.cache.disclosureToggle.focus();
      },
  
      _onBodyClick: function(event) {
        var isOption = this.container.contains(event.target);
        var isVisible = this.cache.disclosureList.classList.contains(
          classes.listVisible
        );
  
        if (isVisible && !isOption) {
          this._hideList();
        }
      },
  
      _submitForm: function(value) {
        this.cache.disclosureInput.value = value;
        this.cache.disclosureForm.submit();
      },
  
      _hideList: function() {
        this.cache.disclosureList.classList.remove(classes.listVisible);
        this.cache.disclosureToggle.setAttribute('aria-expanded', false);
      },
  
      _toggleList: function() {
        var ariaExpanded =
          this.cache.disclosureToggle.getAttribute('aria-expanded') === 'true';
        this.cache.disclosureList.classList.toggle(classes.listVisible);
        this.cache.disclosureToggle.setAttribute('aria-expanded', !ariaExpanded);
      },
  
      destroy: function() {
        this.cache.disclosureToggle.removeEventListener(
          'click',
          this.eventHandlers.toggleList
        );
  
        this.cache.disclosureOptions.forEach(function(disclosureOption) {
          disclosureOption.removeEventListener(
            'click',
            this.eventHandlers.connectOptions
          );
        }, this);
  
        this.container.removeEventListener(
          'keyup',
          this.eventHandlers.onDisclosureKeyUp
        );
  
        this.cache.disclosureList.removeEventListener(
          'focusout',
          this.eventHandlers.onDisclosureListFocusOut
        );
  
        this.cache.disclosureToggle.removeEventListener(
          'focusout',
          this.eventHandlers.onDisclosureToggleFocusOut
        );
  
        document.body.removeEventListener(
          'click',
          this.eventHandlers.onBodyClick
        );
      }
    });
  
    return Disclosure;
  })();
  
  theme.Drawers = (function() {
    function Drawers(id, name) {
      this.config = {
        id: id,
        close: '.js-drawer-close',
        open: '.js-drawer-open-' + name,
        openClass: 'js-drawer-open',
        closingClass: 'js-drawer-closing',
        activeDrawer: 'drawer--is-open',
        namespace: '.drawer-' + name
      };
  
      this.nodes = {
        page: document.querySelector('#MainContent')
      };
  
      this.drawer = document.querySelector('#' + id);
      this.isOpen = false;
  
      if (!this.drawer) {
        return;
      }
  
      this.init();
    }
  
    Drawers.prototype = Object.assign({}, Drawers.prototype, {
      init: function() {
        // Setup open button(s)
        document.querySelectorAll(this.config.open).forEach(openBtn => {
          openBtn.setAttribute('aria-expanded', 'false');
          openBtn.addEventListener('click', this.open.bind(this));
        });
  
        this.drawer.querySelector(this.config.close).addEventListener('click', this.close.bind(this));
  
        // Close modal if a drawer is opened
        document.addEventListener('modalOpen', function() {
          this.close();
        }.bind(this));
      },
  
      open: function(evt, returnFocusEl) {
        if (evt) {
          evt.preventDefault();
        }
  
        if (this.isOpen) {
          return;
        }
  
        // Without this the drawer opens, the click event bubbles up to $nodes.page which closes the drawer.
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
          // save the source of the click, we'll focus to this on close
          evt.currentTarget.setAttribute('aria-expanded', 'true');
          this.activeSource = evt.currentTarget;
        } else if (returnFocusEl) {
          returnFocusEl.setAttribute('aria-expanded', 'true');
          this.activeSource = returnFocusEl;
        }
  
        theme.utils.prepareTransition(this.drawer, function() {
          this.drawer.classList.add(this.config.activeDrawer);
        }.bind(this));
  
        document.documentElement.classList.add(this.config.openClass);
        this.isOpen = true;
  
        theme.a11y.trapFocus({
          container: this.drawer,
          namespace: 'drawer_focus'
        });
  
        document.dispatchEvent(new CustomEvent('drawerOpen'));
        document.dispatchEvent(new CustomEvent('drawerOpen.' + this.config.id));
  
        this.bindEvents();
      },
  
      close: function(evt) {
        if (!this.isOpen) {
          return;
        }
  
        // Do not close if click event came from inside drawer
        if (evt) {
          if (evt.target.closest('.js-drawer-close')) {
            // Do not close if using the drawer close button
          } else if (evt.target.closest('.drawer')) {
            return;
          }
        }
  
        // deselect any focused form elements
        document.activeElement.blur();
  
        theme.utils.prepareTransition(this.drawer, function() {
          this.drawer.classList.remove(this.config.activeDrawer);
        }.bind(this));
  
        document.documentElement.classList.remove(this.config.openClass);
        document.documentElement.classList.add(this.config.closingClass);
  
        window.setTimeout(function() {
          document.documentElement.classList.remove(this.config.closingClass);
          if (this.activeSource && this.activeSource.getAttribute('aria-expanded')) {
            this.activeSource.setAttribute('aria-expanded', 'false');
            this.activeSource.focus();
          }
        }.bind(this), 500);
  
        this.isOpen = false;
  
        theme.a11y.removeTrapFocus({
          container: this.drawer,
          namespace: 'drawer_focus'
        });
  
        this.unbindEvents();
      },
  
      bindEvents: function() {
        // Clicking out of drawer closes it
        window.on('click' + this.config.namespace, function(evt) {
          this.close(evt)
          return;
        }.bind(this));
  
        // Pressing escape closes drawer
        window.on('keyup' + this.config.namespace, function(evt) {
          if (evt.keyCode === 27) {
            this.close();
          }
        }.bind(this));
  
        theme.a11y.lockMobileScrolling(this.config.namespace, this.nodes.page);
      },
  
      unbindEvents: function() {
        window.off('click' + this.config.namespace);
        window.off('keyup' + this.config.namespace);
  
        theme.a11y.unlockMobileScrolling(this.config.namespace, this.nodes.page);
      }
    });
  
    return Drawers;
  })();
  
  theme.Modals = (function() {
    function Modal(id, name, options) {
      var defaults = {
        close: '.js-modal-close',
        open: '.js-modal-open-' + name,
        openClass: 'modal--is-active',
        closingClass: 'modal--is-closing',
        bodyOpenClass: 'modal-open',
        bodyOpenSolidClass: 'modal-open--solid',
        bodyClosingClass: 'modal-closing',
        closeOffContentClick: true
      };
  
      this.id = id;
      this.modal = document.getElementById(id);
  
      if (!this.modal) {
        return false;
      }
  
      this.modalContent = this.modal.querySelector('.modal__inner');
  
      this.config = Object.assign(defaults, options);
      this.modalIsOpen = false;
      this.focusOnOpen = this.config.focusIdOnOpen ? document.getElementById(this.config.focusIdOnOpen) : this.modal;
      this.isSolid = this.config.solid;
  
      this.init();
    }
  
    Modal.prototype.init = function() {
      document.querySelectorAll(this.config.open).forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', this.open.bind(this));
      });
  
      this.modal.querySelectorAll(this.config.close).forEach(btn => {
        btn.addEventListener('click', this.close.bind(this));
      });
  
      // Close modal if a drawer is opened
      document.addEventListener('drawerOpen', function() {
        this.close();
      }.bind(this));
    };
  
    Modal.prototype.open = function(evt) {
      // Keep track if modal was opened from a click, or called by another function
      var externalCall = false;
  
      // don't open an opened modal
      if (this.modalIsOpen) {
        return;
      }
  
      // Prevent following href if link is clicked
      if (evt) {
        evt.preventDefault();
      } else {
        externalCall = true;
      }
  
      // Without this, the modal opens, the click event bubbles up to $nodes.page
      // which closes the modal.
      if (evt && evt.stopPropagation) {
        evt.stopPropagation();
        // save the source of the click, we'll focus to this on close
        this.activeSource = evt.currentTarget.setAttribute('aria-expanded', 'true');
      }
  
      if (this.modalIsOpen && !externalCall) {
        this.close();
      }
  
      this.modal.classList.add(this.config.openClass);
  
      document.documentElement.classList.add(this.config.bodyOpenClass);
  
      if (this.isSolid) {
        document.documentElement.classList.add(this.config.bodyOpenSolidClass);
      }
  
      this.modalIsOpen = true;
  
      theme.a11y.trapFocus({
        container: this.modal,
        elementToFocus: this.focusOnOpen,
        namespace: 'modal_focus'
      });
  
      document.dispatchEvent(new CustomEvent('modalOpen'));
      document.dispatchEvent(new CustomEvent('modalOpen.' + this.id));
  
      this.bindEvents();
    };
  
    Modal.prototype.close = function(evt) {
      // don't close a closed modal
      if (!this.modalIsOpen) {
        return;
      }
  
      // Do not close modal if click happens inside modal content
      if (evt) {
        if (evt.target.closest('.js-modal-close')) {
          // Do not close if using the modal close button
        } else if (evt.target.closest('.modal__inner')) {
          return;
        }
      }
  
      // deselect any focused form elements
      document.activeElement.blur();
  
      this.modal.classList.remove(this.config.openClass);
      this.modal.classList.add(this.config.closingClass);
  
      document.documentElement.classList.remove(this.config.bodyOpenClass);
      document.documentElement.classList.add(this.config.bodyClosingClass);
  
      window.setTimeout(function() {
        document.documentElement.classList.remove(this.config.bodyClosingClass);
        this.modal.classList.remove(this.config.closingClass);
        if (this.activeSource && this.activeSource.getAttribute('aria-expanded')) {
          this.activeSource.setAttribute('aria-expanded', 'false').focus();
        }
      }.bind(this), 500); // modal close css transition
  
      if (this.isSolid) {
        document.documentElement.classList.remove(this.config.bodyOpenSolidClass);
      }
  
      this.modalIsOpen = false;
  
      theme.a11y.removeTrapFocus({
        container: this.modal,
        namespace: 'modal_focus'
      });
  
      document.dispatchEvent(new CustomEvent('modalClose.' + this.id));
  
      this.unbindEvents();
    };
  
    Modal.prototype.bindEvents = function() {
      window.on('keyup.modal', function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }.bind(this));
  
      if (this.config.closeOffContentClick) {
        // Clicking outside of the modal content also closes it
        this.modal.on('click.modal', this.close.bind(this));
      }
    };
  
    Modal.prototype.unbindEvents = function() {
      document.documentElement.off('.modal');
  
      if (this.config.closeOffContentClick) {
        this.modal.off('.modal');
      }
    };
  
    return Modal;
  })();
  
  theme.parallaxSections = {};
  
  theme.Parallax = (function() {
    var speed = 0.85;
    var reset = false;
  
    function parallax(container, args) {
      this.isInit = false;
      this.isVisible = false;
      this.container = container;
      this.image = container.querySelector('.parallax-image');
      this.namespace = args.namespace;
      this.desktopOnly = args.desktopOnly;
  
      if (!this.container || !this.image) {
        return;
      }
  
      // If set for desktop only, setup listeners for disabling
      // on mobile and re-enabling on desktop
      if (this.desktopOnly) {
        document.addEventListener('matchSmall', function() {
          this.destroy();
        }.bind(this));
  
        document.addEventListener('unmatchSmall', function() {
          this.init(true);
        }.bind(this));
      }
  
      this.init(this.desktopOnly);
    }
  
    parallax.prototype = Object.assign({}, parallax.prototype, {
      init: function(desktopOnly) {
        // Reset in case initialized again
        if (this.isInit) {
          this.destroy();
        }
  
        this.isInit = true;
  
        // Do not setup scroll event if on mobile
        if (desktopOnly && theme.config.bpSmall) {
          return;
        }
  
        // Set position on page load
        this.setSizes();
        this.scrollHandler();
  
        var observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
              window.on('scroll' + this.namespace, this.onScroll.bind(this));
            } else {
              window.off('scroll' + this.namespace);
            }
          });
        }, {rootMargin: '200px 0px 200px 0px'});
  
        observer.observe(this.container);
  
        window.on('resize' + this.namespace, theme.utils.debounce(250, this.setSizes.bind(this)));
  
        document.addEventListener('shopify:section:reorder', theme.utils.debounce(250, this.onReorder.bind(this)));
      },
  
      onScroll: function() {
        if (!this.isVisible) {
          return;
        }
  
        // If a scroll event finds Shopify's review app,
        // update parallax scroll positions because of page reflows
        if (window.SPR && !reset) {
          this.setSizes();
          reset = true;
        }
  
        requestAnimationFrame(this.scrollHandler.bind(this));
      },
  
      scrollHandler: function() {
        var shiftDistance = (window.scrollY - this.elTop) * speed;
        this.image.style.transform = 'translate3d(0, ' + shiftDistance + 'px, 0)';
      },
  
      setSizes: function() {
        var rect = this.container.getBoundingClientRect();
        this.elTop = rect.top + window.scrollY;
      },
  
      onReorder: function() {
        this.setSizes();
        this.onScroll();
      },
  
      destroy: function() {
        this.image.style.transform = 'none';
        window.off('scroll' + this.namespace);
        window.off('resize' + this.namespace);
      }
    });
  
    return parallax;
  })();
  
  theme.AjaxProduct = (function() {
    var status = {
      loading: false
    };
  
    function ProductForm(form, submit) {
      this.form = form;
  
      var submitSelector = submit ? submit : '.add-to-cart';
  
      if (this.form) {
        this.addToCart = form.querySelector(submitSelector);
        this.form.addEventListener('submit', this.addItemFromForm.bind(this));
      }
    };
  
    ProductForm.prototype = Object.assign({}, ProductForm.prototype, {
      addItemFromForm: function(evt, callback){
        evt.preventDefault();
  
        if (status.loading) {
          return;
        }
  
        // Loading indicator on add to cart button
        this.addToCart.classList.add('btn--loading');
  
        status.loading = true;
  
        var data = theme.utils.serialize(this.form);
  
        fetch(theme.routes.cartAdd, {
          method: 'POST',
          body: data,
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        .then(response => response.json())
        .then(function(data) {
          if (data.status === 422) {
            this.error(data);
          } else {
            var product = data;
            this.success(product);
          }
  
          status.loading = false;
          this.addToCart.classList.remove('btn--loading');
        }.bind(this));
      },
  
      success: function(product) {
        var errors = this.form.querySelector('.errors');
        if (errors) {
          errors.remove();
        }
  
        document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
          detail: {
            product: product,
            addToCartBtn: this.addToCart
          }
        }));
      },
  
      error: function(error) {
        if (!error.description) {
          console.warn(error);
          return;
        }
  
        var errors = this.form.querySelector('.errors');
        if (errors) {
          errors.remove();
        }
  
        var errorDiv = document.createElement('div');
        errorDiv.classList.add('errors', 'text-center');
        errorDiv.textContent = error.description;
        this.form.append(errorDiv);
  
        document.dispatchEvent(new CustomEvent('ajaxProduct:error', {
          detail: {
            errorMessage: error.description
          }
        }));
      }
    });
  
    return ProductForm;
  })();
  
  theme.ProductMedia = (function() {
    var modelJsonSections = {};
    var models = {};
    var xrButtons = {};
  
    var selectors = {
      mediaGroup: '[data-product-single-media-group]',
      xrButton: '[data-shopify-xr]'
    };
  
    function init(modelViewerContainers, sectionId) {
      modelJsonSections[sectionId] = {
        loaded: false
      };
  
      modelViewerContainers.forEach(function(container, index) {
        var mediaId = container.dataset.mediaId;
        var modelViewerElement = container.querySelector('model-viewer');
        var modelId = modelViewerElement.dataset.modelId;
  
        if (index === 0) {
          var mediaGroup = container.closest(selectors.mediaGroup);
          var xrButton = mediaGroup.querySelector(selectors.xrButton);
          xrButtons[sectionId] = {
            element: xrButton,
            defaultId: modelId
          };
        }
  
        models[mediaId] = {
          modelId: modelId,
          sectionId: sectionId,
          container: container,
          element: modelViewerElement
        };
  
      });
  
      window.Shopify.loadFeatures([
        {
          name: 'shopify-xr',
          version: '1.0',
          onLoad: setupShopifyXr
        },
        {
          name: 'model-viewer-ui',
          version: '1.0',
          onLoad: setupModelViewerUi
        }
      ]);
  
      theme.LibraryLoader.load('modelViewerUiStyles');
    }
  
    function setupShopifyXr(errors) {
      if (errors) return;
  
      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function() {
          setupShopifyXr();
        });
        return;
      }
  
      for (var sectionId in modelJsonSections) {
        if (modelJsonSections.hasOwnProperty(sectionId)) {
          var modelSection = modelJsonSections[sectionId];
  
          if (modelSection.loaded) continue;
  
          var modelJson = document.querySelector('#ModelJson-' + sectionId);
  
          window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML));
          modelSection.loaded = true;
        }
      }
      window.ShopifyXR.setupXRElements();
    }
  
    function setupModelViewerUi(errors) {
      if (errors) return;
  
      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (!model.modelViewerUi && Shopify) {
            model.modelViewerUi = new Shopify.ModelViewerUI(model.element);
          }
          setupModelViewerListeners(model);
        }
      }
    }
  
    function setupModelViewerListeners(model) {
      var xrButton = xrButtons[model.sectionId];
  
      model.container.addEventListener('mediaVisible', function() {
        xrButton.element.setAttribute('data-shopify-model3d-id', model.modelId);
        if (theme.config.isTouch) return;
        model.modelViewerUi.play();
      });
  
      model.container.addEventListener('mediaHidden', function() {
        xrButton.element.setAttribute('data-shopify-model3d-id', xrButton.defaultId);
        model.modelViewerUi.pause();
      });
  
      model.container.addEventListener('xrLaunch', function() {
        model.modelViewerUi.pause();
      });
    }
  
    function removeSectionModels(sectionId) {
      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (model.sectionId === sectionId) {
            delete models[key];
          }
        }
      }
      delete modelJsonSections[sectionId];
    }
  
    return {
      init: init,
      removeSectionModels: removeSectionModels
    };
  })();
  
  theme.QtySelector = (function() {
    var selectors = {
      input: '.js-qty__num',
      plus: '.js-qty__adjust--plus',
      minus: '.js-qty__adjust--minus'
    };
  
    function QtySelector(el, options) {
      this.wrapper = el;
      this.plus = el.querySelector(selectors.plus);
      this.minus = el.querySelector(selectors.minus);
      this.input = el.querySelector(selectors.input);
      this.minValue = this.input.getAttribute('min') || 1;
  
      var defaults = {
        namespace: null,
        isCart: false,
        key: this.input.dataset.id
      };
  
      this.options = Object.assign({}, defaults, options);
  
      this.init();
    }
  
    QtySelector.prototype = Object.assign({}, QtySelector.prototype, {
      init: function() {
        this.plus.addEventListener('click', function() {
          var qty = this._getQty();
          this._change(qty + 1);
        }.bind(this));
  
        this.minus.addEventListener('click', function() {
          var qty = this._getQty();
          this._change(qty - 1);
        }.bind(this));
  
        this.input.addEventListener('change', function(evt) {
          this._change(this._getQty());
        }.bind(this));
      },
  
      _getQty: function() {
        var qty = this.input.value;
        if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
          // We have a valid number!
        } else {
          // Not a number. Default to 1.
          qty = 1;
        }
        return parseInt(qty);
      },
  
      _change: function(qty) {
        if (qty <= this.minValue) {
          qty = this.minValue;
        }
  
        this.input.value = qty;
  
        if (this.options.isCart) {
          document.dispatchEvent(new CustomEvent('cart:quantity' + this.options.namespace, {
              detail: [this.options.key, qty, this.wrapper]
          }));
        }
      }
    });
  
    return QtySelector;
  })();
  
  theme.initQuickShop = function() {
    var ids = [];
    var products = document.querySelectorAll('.grid-product');
  
    if (!products.length || !theme.settings.quickView) {
      return;
    }
  
    products.forEach(product => {
      product.addEventListener('mouseover', productMouseover);
    });
  
    function productMouseover(evt) {
      var el = evt.currentTarget;
      // No quick view on mobile breakpoint
      if (!theme.config.bpSmall) {
        el.removeEventListener('mouseover', productMouseover);
        if (!el || !el.dataset.productId) {
          // Onboarding product, no real data
          return;
        }
        var productId = el.dataset.productId;
        var handle = el.dataset.productHandle;
        var btn = el.querySelector('.quick-product__btn');
        theme.preloadProductModal(handle, productId, btn);
      }
    }
  };
  
  theme.preloadProductModal = function(handle, productId, btn) {
    var holder = document.getElementById('QuickShopHolder-' + handle);
    var url = theme.routes.home + '/products/' + handle + '?view=modal';
  
    // remove double `/` in case shop might have /en or language in URL
    url = url.replace('//', '/');
  
    fetch(url).then(function(response) {
      return response.text();
    }).then(function(html) {
      // Convert the HTML string into a document object
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var div = doc.querySelector('.product-section[data-product-handle="'+handle+'"]');
  
      if (!holder) {
        return;
      }
  
      holder.append(div);
  
      // Setup quick view modal
      var modalId = 'QuickShopModal-' + productId;
      var name = 'quick-modal-' + productId;
      new theme.Modals(modalId, name);
  
      // Register product template inside quick view
      theme.sections.register('product', theme.Product, holder);
  
      // Register collapsible elements
      theme.collapsibles.init();
  
      // Register potential video modal links (when video has sound)
      theme.videoModal();
  
      if (btn) {
        btn.classList.remove('quick-product__btn--not-ready');
      }
    });
  }
  
  
  // theme.Slideshow handles all flickity based sliders
  // Child navigation is only setup to work on product images
  theme.Slideshow = (function() {
    var classes = {
      animateOut: 'animate-out',
      isPaused: 'is-paused',
      isActive: 'is-active'
    };
  
    var selectors = {
      allSlides: '.slideshow__slide',
      currentSlide: '.is-selected',
      wrapper: '.slideshow-wrapper',
      pauseButton: '.slideshow__pause'
    };
  
    var productSelectors = {
      thumb: '.product__thumb-item:not(.hide)',
      links: '.product__thumb-item:not(.hide) a',
      arrow: '.product__thumb-arrow'
    };
  
    var defaults = {
      adaptiveHeight: false,
      autoPlay: false,
      avoidReflow: false, // custom by Archetype
      childNav: null, // element. Custom by Archetype instead of asNavFor
      childNavScroller: null, // element
      childVertical: false,
      fade: false,
      initialIndex: 0,
      pageDots: false,
      pauseAutoPlayOnHover: false,
      prevNextButtons: false,
      rightToLeft: theme.config.rtl,
      setGallerySize: true,
      wrapAround: true
    };
  
    function slideshow(el, args) {
      this.el = el;
      this.args = Object.assign({}, defaults, args);
  
      // Setup listeners as part of arguments
      this.args.on = {
        ready: this.init.bind(this),
        change: this.slideChange.bind(this),
        settle: this.afterChange.bind(this)
      };
  
      if (this.args.childNav) {
        this.childNavEls = this.args.childNav.querySelectorAll(productSelectors.thumb);
        this.childNavLinks = this.args.childNav.querySelectorAll(productSelectors.links);
        this.arrows = this.args.childNav.querySelectorAll(productSelectors.arrow);
        if (this.childNavLinks.length) {
          this.initChildNav();
        }
      }
  
      if (this.args.avoidReflow) {
        avoidReflow(el);
      }
  
      this.slideshow = new Flickity(el, this.args);
  
      if (this.args.autoPlay) {
        var wrapper = el.closest(selectors.wrapper);
        this.pauseBtn = wrapper.querySelector(selectors.pauseButton);
        if (this.pauseBtn) {
          this.pauseBtn.addEventListener('click', this._togglePause.bind(this));
        }
      }
  
      // Reset dimensions on resize
      window.on('resize', theme.utils.debounce(300, function() {
        this.resize();
      }.bind(this)));
  
      // Set flickity-viewport height to first element to
      // avoid awkward page reflows while initializing.
      // Must be added in a `style` tag because element does not exist yet.
      // Slideshow element must have an ID
      function avoidReflow(el) {
        if (!el.id) return;
        var firstChild = el.firstChild;
        while(firstChild != null && firstChild.nodeType == 3){ // skip TextNodes
          firstChild = firstChild.nextSibling;
        }
        var style = document.createElement('style');
        style.innerHTML = `#${el.id} .flickity-viewport{height:${firstChild.offsetHeight}px}`;
        document.head.appendChild(style);
      }
    }
  
    slideshow.prototype = Object.assign({}, slideshow.prototype, {
      init: function(el) {
        this.currentSlide = this.el.querySelector(selectors.currentSlide);
  
        // Optional onInit callback
        if (this.args.callbacks && this.args.callbacks.onInit) {
          if (typeof this.args.callbacks.onInit === 'function') {
            this.args.callbacks.onInit();
          }
        }
  
        if (window.AOS) { AOS.refresh() }
      },
  
      slideChange: function(index) {
        // Outgoing fade styles
        if (this.args.fade) {
          this.currentSlide.classList.add(classes.animateOut);
          this.currentSlide.addEventListener('transitionend', function() {
            this.currentSlide.classList.remove(classes.animateOut);
          }.bind(this));
        }
  
        // Match index with child nav
        if (this.args.childNav) {
          this.childNavGoTo(index);
        }
  
        // Optional onChange callback
        if (this.args.callbacks && this.args.callbacks.onChange) {
          if (typeof this.args.callbacks.onChange === 'function') {
            this.args.callbacks.onChange(index);
          }
        }
  
        // Show/hide arrows depending on selected index
        if (this.arrows && this.arrows.length) {
          this.arrows[0].classList.toggle('hide', index === 0);
          this.arrows[1].classList.toggle('hide', index === (this.childNavLinks.length - 1));
        }
      },
      afterChange: function(index) {
        // Remove all fade animation classes after slide is done
        if (this.args.fade) {
          this.el.querySelectorAll(selectors.allSlides).forEach(slide => {
            slide.classList.remove(classes.animateOut);
          });
        }
  
        this.currentSlide = this.el.querySelector(selectors.currentSlide);
  
        // Match index with child nav (in case slider height changed first)
        if (this.args.childNav) {
          this.childNavGoTo(this.slideshow.selectedIndex);
        }
      },
      destroy: function() {
        this.slideshow.destroy();
      },
      _togglePause: function() {
        if (this.pauseBtn.classList.contains(classes.isPaused)) {
          this.pauseBtn.classList.remove(classes.isPaused);
          this.slideshow.playPlayer();
        } else {
          this.pauseBtn.classList.add(classes.isPaused);
          this.slideshow.pausePlayer();
        }
      },
      resize: function() {
        this.slideshow.resize();
      },
      play: function() {
        this.slideshow.playPlayer();
      },
      pause: function() {
        this.slideshow.pausePlayer();
      },
      goToSlide: function(i) {
        this.slideshow.select(i);
      },
      setDraggable: function(enable) {
        this.slideshow.options.draggable = enable;
        this.slideshow.updateDraggable();
      },
  
      initChildNav: function() {
        this.childNavLinks[this.args.initialIndex].classList.add('is-active');
  
        // Setup events
        this.childNavLinks.forEach((link, i) => {
          // update data-index because image-set feature may be enabled
          link.setAttribute('data-index', i);
  
          link.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.goToSlide(this.getChildIndex(evt.currentTarget))
          }.bind(this));
          link.addEventListener('focus', function(evt) {
            this.goToSlide(this.getChildIndex(evt.currentTarget))
          }.bind(this));
          link.addEventListener('keydown', function(evt) {
            if (evt.keyCode === 13) {
              this.goToSlide(this.getChildIndex(evt.currentTarget))
            }
          }.bind(this));
        });
  
        // Setup optional arrows
        if (this.arrows.length) {
          this.arrows.forEach(arrow => {
            arrow.addEventListener('click', this.arrowClick.bind(this));
          });;
        }
      },
  
      getChildIndex: function(target) {
        return parseInt(target.dataset.index);
      },
  
      childNavGoTo: function(index) {
        this.childNavLinks.forEach(a => {
          a.classList.remove(classes.isActive);
        });
  
        var el = this.childNavLinks[index];
        el.classList.add(classes.isActive);
  
        if (this.args.childVertical) {
          var elTop = el.offsetTop;
          this.args.childNavScroller.scrollTop = elTop - 100;
        } else {
          var elLeft = el.offsetLeft;
          this.args.childNavScroller.scrollLeft = elLeft - 100;
        }
      },
  
      arrowClick: function(evt) {
        if (evt.currentTarget.classList.contains('product__thumb-arrow--prev')) {
          this.slideshow.previous();
        } else {
          this.slideshow.next();
        }
      }
    });
  
    return slideshow;
  })();
  
  /*============================================================================
    VariantAvailability
    - Cross out sold out variants and disable unavailable
    - To disable, set dynamicVariantsEnable to false in theme.liquid
    - Required markup:
      - class=variant-input-wrap to wrap select or button group
      - class=variant-input to wrap button/label
  ==============================================================================*/
  
  theme.VariantAvailability = (function() {
    var classes = {
      disabled: 'disabled',
      hidden: 'hide'
    };
  
    function availability(args) {
      this.type = args.type;
      this.variantSelectors = args.variantSelectors;
      this.variantsObject = args.variantsObject;
      this.currentVariantObject = args.currentVariantObject;
      this.form = args.form;
  
      this.init();
    }
  
    availability.prototype = Object.assign({}, availability.prototype, {
      init: function() {
        this.variantSelectors.forEach(el => {
          el.on('change', this.setAvailability.bind(this))
        });
  
        // Set default state based on current selected variant
        this.setAvailability(null, this.currentVariantObject);
      },
  
      setAvailability: function(evt, variant) {
        // Object to hold all options by value.
        // This will be what sets a button/dropdown as
        // sold out or unavailable (not a combo set as purchasable)
        var valuesToManage = {
          option1: [],
          option2: [],
          option3: []
        };
  
        var ignoreIndex = null;
        var variants;
        // If working with an event, get variants to loop through
        // based on the group index of recently selected option.
        // If variant object passed explicitly (on load), get variants
        // that overlap with all potential combinations
        if (evt) {
          var el = evt.currentTarget;
          var val = el.value;
          var index = el.dataset.index;
          variants = this.variantsObject.filter(function(el) {
            return el[index] === val;
          });
        } else {
          var availableVariants = this.variantsObject.filter(function(el) {
            if (variant.id === el.id) {
              return false;
            }
  
            if (variant.option2 === el.option2 && variant.option3 === el.option3) {
              return true;
            }
  
            if (variant.option1 === el.option1 && variant.option3 === el.option3) {
              return true;
            }
  
            if (variant.option1 === el.option1 && variant.option2 === el.option2) {
              return true;
            }
          });
  
          // IE11 can't handle shortform of {variant} so extra step is needed
          var variantObject = {
            variant: variant
          };
  
          variants = Object.assign({}, variantObject, availableVariants);
        }
  
        // Disable all options to start.
        // If coming from a variant change event, do not disable
        // options inside current index group
        this.form.querySelectorAll('.variant-input-wrap').forEach(group => {
          var groupIndex = group.dataset.index;
          if (evt && groupIndex === index) {
            ignoreIndex = index;
            return;
          }
  
          this.disableVariantGroup(group);
        });
  
        // Loop through each available variant to gather variant values
        for (var property in variants) {
          if (variants.hasOwnProperty(property)) {
            var item = variants[property];
            var value1 = item.option1;
            var value2 = item.option2;
            var value3 = item.option3;
            var soldOut = item.available === false;
  
            if (value1 && ignoreIndex !== 'option1') {
              valuesToManage.option1.push({
                value: value1,
                soldOut: soldOut
              });
            }
            if (value2 && ignoreIndex !== 'option2') {
              valuesToManage.option2.push({
                value: value2,
                soldOut: soldOut
              });
            }
            if (value3 && ignoreIndex !== 'option3') {
              valuesToManage.option3.push({
                value: value3,
                soldOut: soldOut
              });
            }
          }
        }
  
        // Loop through all option levels and send each
        // value w/ args to function that determines to show/hide/enable/disable
        for (var [option, values] of Object.entries(valuesToManage)) {
          this.manageOptionState(option, values);
        }
      },
  
      manageOptionState: function(option, values) {
        var group = this.form.querySelector('.variant-input-wrap[data-index="'+ option +'"]');
  
        // Loop through each option value
        values.forEach(obj => {
          this.enableVariantOption(group, obj);
        });
      },
  
      enableVariantOptionByValue: function(array, index) {
        var group = this.form.querySelector('.variant-input-wrap[data-index="'+ index +'"]');
  
        for (var i = 0; i < array.length; i++) {
          this.enableVariantOption(group, array[i]);
        }
      },
  
      enableVariantOption: function(group, obj) {
        // Selecting by value so escape it
        var value = obj.value.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');
  
        if (this.type === 'dropdown') {
          group.querySelector('option[value="'+ value +'"]').disabled = false;
        } else {
          var buttonGroup = group.querySelector('.variant-input[data-value="'+ value +'"]');
          var input = buttonGroup.querySelector('input');
          var label = buttonGroup.querySelector('label');
  
          // Variant exists - enable & show variant
          input.disabled = false;
          input.classList.remove(classes.hidden, classes.disabled);
          label.classList.remove(classes.hidden, classes.disabled);
  
          // Variant sold out - cross out option (remains selectable)
          if (obj.soldOut) {
            input.classList.add(classes.disabled);
            label.classList.add(classes.disabled);
          }
        }
      },
  
      disableVariantGroup: function(group) {
        if (this.type === 'dropdown') {
          group.querySelectorAll('option').forEach(option => {
            option.disabled = true;
          });
        } else {
          group.querySelectorAll('input').forEach(input => {
            input.disabled = true;
            input.classList.add(classes.hidden);
            input.classList.remove(classes.disabled);
          });
          group.querySelectorAll('label').forEach(label => {
            label.classList.add(classes.hidden);
            label.classList.remove(classes.disabled);
          });
        }
      }
  
    });
  
    return availability;
  })();
  
  // Video modal will auto-initialize for any anchor link that points to YouTube
  // MP4 videos must manually be enabled with:
  //   - .product-video-trigger--mp4 (trigger button)
  //   - .product-video-mp4-sound video player element (cloned into modal)
  //     - see media.liquid for example of this
  theme.videoModal = function() {
    var youtubePlayer;
  
    var videoHolderId = 'VideoHolder';
    var selectors = {
      youtube: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]',
      mp4Trigger: '.product-video-trigger--mp4',
      mp4Player: '.product-video-mp4-sound'
    };
  
    var youtubeTriggers = document.querySelectorAll(selectors.youtube);
    var mp4Triggers = document.querySelectorAll(selectors.mp4Trigger);
  
    if (!youtubeTriggers.length && !mp4Triggers.length) {
      return;
    }
  
    var videoHolderDiv = document.getElementById(videoHolderId);
  
    if (youtubeTriggers.length) {
      theme.LibraryLoader.load('youtubeSdk');
    }
  
    var modal = new theme.Modals('VideoModal', 'video-modal', {
      closeOffContentClick: true,
      solid: true
    });
  
    youtubeTriggers.forEach(btn => {
      btn.addEventListener('click', triggerYouTubeModal);
    });
  
    mp4Triggers.forEach(btn => {
      btn.addEventListener('click', triggerMp4Modal);
    });
  
    document.addEventListener('modalClose.VideoModal', closeVideoModal);
  
    function triggerYouTubeModal(evt) {
      // If not already loaded, treat as normal link
      if (!theme.config.youTubeReady) {
        return;
      }
  
      evt.preventDefault();
      emptyVideoHolder();
  
      modal.open(evt);
  
      var videoId = getYoutubeVideoId(evt.currentTarget.getAttribute('href'));
      youtubePlayer = new theme.YouTube(
        videoHolderId,
        {
          videoId: videoId,
          style: 'sound',
          events: {
            onReady: onYoutubeReady
          }
        }
      );
    }
  
    function triggerMp4Modal(evt) {
      emptyVideoHolder();
  
      var el = evt.currentTarget;
      var player = el.parentNode.querySelector(selectors.mp4Player);
  
      // Clone video element and place it in the modal
      var playerClone = player.cloneNode(true);
      playerClone.classList.remove('hide');
  
      videoHolderDiv.append(playerClone);
      modal.open(evt);
  
      // Play new video element
      videoHolderDiv.querySelector('video').play();
    }
  
    function onYoutubeReady(evt) {
      evt.target.unMute();
      evt.target.playVideo();
    }
  
    function getYoutubeVideoId(url) {
      var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      var match = url.match(regExp);
      return (match&&match[7].length==11)? match[7] : false;
    }
  
    function emptyVideoHolder() {
      videoHolderDiv.innerHTML = '';
    }
  
    function closeVideoModal() {
      if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
        youtubePlayer.destroy();
      } else {
        emptyVideoHolder();
      }
    }
  };
  
  

  theme.buildProductGridItem = function(items, gridWidth) {
    var output = '';
  
    items.forEach(product => {
      var image = theme.buildPredictiveImage(product);
      var markup = `
        <div class="grid__item ${gridWidth}">
          <a href="${product.url}" class="predictive__result">
            <div class="predictive__result-image">
              ${image}
            </div>
            <div class="predictive__result-meta">
              <div class="grid-product__title">
                ${product.title}
              </div>
            </div>
          </a>
        </div>
      `;
  
      output += markup;
    });
  
    return output;
  }
  
  theme.buildCollectionItem = function(items) {
    var output = '';
  
    items.forEach(collection => {
      var image = theme.buildPredictiveImage(collection);
      var markup = `
        <div class="grid__item medium-up--one-third">
          <a href="${collection.url}" class="predictive__result">
            <div class="predictive__result-image">
              ${image}
            </div>
            <div class="predictive__result-meta">
              <div class="grid-product__title">
                ${collection.title}
              </div>
            </div>
          </a>
        </div>
      `;
  
      output += markup;
    });
  
    return output;
  }
  
  theme.buildPageItem = function(items) {
    var output = '';
  
    items.forEach(page => {
      var markup = `
        <div>
          <a href="${page.url}">
            ${page.title}
          </a>
        </div>
      `;
  
      output += markup;
    });
  
    return output;
  }
  
  theme.buildArticleItem = function(items) {
    var output = '';
  
    items.forEach(article => {
      var image = theme.buildPredictiveImage(article);
      var markup = `
        <div class="grid__item medium-up--one-third">
          <a href="${article.url}" class="predictive__result">
            <div class="predictive__result-image">
              ${image}
            </div>
            <div class="predictive__result-meta">
              ${article.title}
            </div>
          </a>
        </div>
      `;
  
      output += markup;
    });
  
    return output;
  }
  
  theme.buildPredictiveImage = function(obj) {
    var imageMarkup = '';
    if (obj.image) {
      imageMarkup = `<img src="${obj.image}" alt="${obj.title}">`;
    }
    return imageMarkup;
  }
  
  theme.announcementBar = (function() {
    var selectors = {
      bar: '.announcement',
      text: '.announcement__text',
      closeBtn: '.announcement__close'
    };
  
    var classes = {
      opening: 'announcement--opening',
      closed: 'announcement--closed'
    };
  
    var config = {
      namespace: '.announcementBar'
    };
  
    function init() {
      // If no close button, no JS needed
      if (!document.querySelector(selectors.closeBtn)) {
        return;
      }
  
      if (theme.config.hasSessionStorage && sessionStorage[announcementBarText()] !== 'hidden') {
        window.setTimeout(function() {
          announcementBarShow();
        }, 2000);
      }
  
      // Probably in the editor, so show it anyway
      if (!theme.config.hasSessionStorage) {
        window.setTimeout(function() {
          announcementBarShow();
        }, 2000);
      }
  
      document.querySelector(selectors.closeBtn).addEventListener('click', announcementBarClose);
  
      window.on('resize' + config.namespace, theme.utils.debounce(500, announcementBarHeight));
    }
  
    function unload() {
      window.off('resize' + config.namespace);
    }
  
    function announcementBarShow() {
      document.querySelector(selectors.bar).classList.remove(classes.closed);
      announcementBarHeight();
    }
  
    function announcementBarHeight() {
      var barHeight = document.querySelector(selectors.text).clientHeight;
      document.querySelector(selectors.bar).classList.add(classes.opening);
      document.querySelector(selectors.bar).style.maxHeight = barHeight + 'px';
    }
  
    function announcementBarClose() {
      if (theme.config.hasSessionStorage) {
        sessionStorage.setItem(announcementBarText(), 'hidden');
      }
  
      document.querySelector(selectors.bar).classList.add(classes.closed);
    }
  
    function announcementBarText() {
      return document.querySelector(selectors.text).dataset.text;
    }
  
    return {
      init: init,
      unload: unload
    };
  })();
  
  theme.articleImages = function() {
    var wrappers = document.querySelectorAll('.rte--indented-images');
  
    if (!wrappers.length) {
      return;
    }
  
    wrappers.forEach(wrapper => {
      wrapper.querySelectorAll('img').forEach(image => {
        var attr = image.getAttribute('style');
        // Check if undefined for float: none
        if (!attr || attr == 'float: none;') {
          // Remove grid-breaking styles if image is not wider than parent
          if (image.width < wrapper.offsetWidth) {
            image.classList.add('rte__no-indent');
          }
        }
      });
    });
  };
  
  theme.CartDrawer = (function() {
    var selectors = {
      drawer: '#CartDrawer',
      form: '#CartDrawerForm'
    };
  
    function CartDrawer() {
      this.form = document.querySelector(selectors.form);
      this.drawer = new theme.Drawers('CartDrawer', 'cart');
  
      this.init();
    }
  
    CartDrawer.prototype = Object.assign({}, CartDrawer.prototype, {
      init: function() {
        this.cartForm = new theme.CartForm(this.form);
        this.cartForm.buildCart();
  
        document.addEventListener('ajaxProduct:added', function(evt) {
          this.cartForm.buildCart();
          this.open();
        }.bind(this));
  
        // Dev-friendly way to open cart
        document.addEventListener('cart:open', this.open.bind(this));
        document.addEventListener('cart:close', this.close.bind(this));
      },
  
      open: function() {
        this.drawer.open();
      },
  
      close: function() {
        this.drawer.close();
      }
    });
  
    return CartDrawer;
  })();
  
  theme.customerTemplates = function() {
    checkUrlHash();
    initEventListeners();
    resetPasswordSuccess();
    customerAddressForm();
  
    function checkUrlHash() {
      var hash = window.location.hash;
  
      // Allow deep linking to recover password form
      if (hash === '#recover') {
        toggleRecoverPasswordForm();
      }
    }
  
    function toggleRecoverPasswordForm() {
      var passwordForm = document.getElementById('RecoverPasswordForm').classList.toggle('hide');
      var loginForm = document.getElementById('CustomerLoginForm').classList.toggle('hide');
    }
  
    function initEventListeners() {
      // Show reset password form
      var recoverForm = document.getElementById('RecoverPassword');
      if (recoverForm) {
        recoverForm.addEventListener('click', function(evt) {
          evt.preventDefault();
          toggleRecoverPasswordForm();
        });
      }
  
      // Hide reset password form
      var hideRecoverPassword = document.getElementById('HideRecoverPasswordLink');
      if (hideRecoverPassword) {
        hideRecoverPassword.addEventListener('click', function(evt) {
          evt.preventDefault();
          toggleRecoverPasswordForm();
        });
      }
    }
  
    function resetPasswordSuccess() {
      var formState = document.querySelector('.reset-password-success');
  
      // check if reset password form was successfully submitted
      if (!formState) {
        return;
      }
  
      // show success message
      document.getElementById('ResetSuccess').classList.remove('hide');
    }
  
    function customerAddressForm() {
      var newAddressForm = document.getElementById('AddressNewForm');
      var addressForms = document.querySelectorAll('.js-address-form');
  
      if (!newAddressForm || !addressForms.length) {
        return;
      }
  
      // Country/province selector can take a short time to load
      setTimeout(function() {
        document.querySelectorAll('.js-address-country').forEach(el => {
          var countryId = el.dataset.countryId;
          var provinceId = el.dataset.provinceId;
          var provinceContainerId = el.dataset.provinceContainerId;
  
          new Shopify.CountryProvinceSelector(
            countryId,
            provinceId,
            {
              hideElement: provinceContainerId
            }
          );
        });
      }, 1000);
  
      // Toggle new/edit address forms
      document.querySelector('.address-new-toggle').addEventListener('click', function() {
        newAddressForm.classList.toggle('hide');
      });
  
      document.querySelectorAll('.address-edit-toggle').forEach(el => {
        el.addEventListener('click', function(evt) {
          var formId = evt.currentTarget.dataset.formId;
          document.getElementById('EditAddress_' + formId).classList.toggle('hide');
        });
      });
  
      document.querySelectorAll('.address-delete').forEach(el => {
        el.addEventListener('click', function(evt) {
          var formId = evt.currentTarget.dataset.formId;
          var confirmMessage = evt.currentTarget.dataset.confirmMessage;
  
          if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
            if (Shopify) {
              Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
            }
          }
        })
      });
    }
  };
  
  theme.headerNav = (function() {
    var selectors = {
      wrapper: '#HeaderWrapper',
      siteHeader: '#SiteHeader',
      searchBtn: '.js-search-header',
      closeSearch: '#SearchClose',
      searchContainer: '.site-header__search-container',
      logo: '#LogoContainer img',
      navItems: '.site-nav__item',
      navLinks: '.site-nav__link',
      navLinksWithDropdown: '.site-nav__link--has-dropdown',
      navDropdownLinks: '.site-nav__dropdown-link--second-level'
    };
  
    var classes = {
      hasDropdownClass: 'site-nav--has-dropdown',
      hasSubDropdownClass: 'site-nav__deep-dropdown-trigger',
      dropdownActive: 'is-focused'
    };
  
    var config = {
      namespace: '.siteNav',
      wrapperOverlayed: false,
      overlayedClass: 'is-light',
      overlayEnabledClass: 'header-wrapper--overlay',
      stickyEnabled: false,
      stickyActive: false,
      stickyClass: 'site-header--stuck',
      stickyHeaderWrapper: 'StickyHeaderWrap',
      openTransitionClass: 'site-header--opening',
      lastScroll: 0
    };
  
    // Elements used in resize functions, defined in init
    var wrapper;
    var siteHeader;
  
    function init() {
      wrapper = document.querySelector(selectors.wrapper);
      siteHeader = document.querySelector(selectors.siteHeader);
  
      config.stickyEnabled = (siteHeader.dataset.sticky === 'true');
      if (config.stickyEnabled) {
        config.wrapperOverlayed = wrapper.classList.contains(config.overlayedClass);
        stickyHeader();
      }
  
      theme.settings.overlayHeader = (siteHeader.dataset.overlay === 'true');
      // Disable overlay header if on collection template with no collection image
      if (theme.settings.overlayHeader && Shopify && Shopify.designMode) {
        if (document.body.classList.contains('template-collection') && !document.querySelector('.collection-hero')) {
          this.disableOverlayHeader();
        }
      }
  
      accessibleDropdowns();
      searchDrawer();
  
      window.on('load' + config.namespace, resizeLogo);
      window.on('resize' + config.namespace, theme.utils.debounce(150, resizeLogo));
    }
  
    // If the header setting to overlay the menu on the collection image
    // is enabled but the collection setting is disabled, we need to undo
    // the init of the sticky nav
    function disableOverlayHeader() {
      wrapper.classList.remove(config.overlayEnabledClass);
      wrapper.classList.remove(config.overlayedClass);
      config.wrapperOverlayed = false;
    }
  
    function stickyHeader() {
      config.lastScroll = 0;
  
      var wrapWith = document.createElement('div');
      wrapWith.id = config.stickyHeaderWrapper;
      theme.utils.wrap(siteHeader, wrapWith);
  
      stickyHeaderHeight();
  
      window.on('resize' + config.namespace, theme.utils.debounce(50, stickyHeaderHeight));
      window.on('scroll' + config.namespace, theme.utils.throttle(20, stickyHeaderScroll));
  
      // This gets messed up in the editor, so here's a fix
      if (Shopify && Shopify.designMode) {
        setTimeout(function() {
          stickyHeaderHeight();
        }, 250);
      }
    }
  
    function stickyHeaderHeight() {
      if (!config.stickyEnabled) {
        return;
      }
  
      var h = siteHeader.offsetHeight;
      var stickyHeader = document.querySelector('#' + config.stickyHeaderWrapper);
      stickyHeader.style.height = h + 'px';
    }
  
    function stickyHeaderScroll() {
      if (!config.stickyEnabled) {
        return;
      }
  
      requestAnimationFrame(scrollHandler);
  
      config.lastScroll = window.scrollY;
    }
  
    function scrollHandler() {
      if (window.scrollY > 250) {
        if (config.stickyActive) {
          return;
        }
  
        config.stickyActive = true;
  
        siteHeader.classList.add(config.stickyClass);
        if (config.wrapperOverlayed) {
          wrapper.classList.remove(config.overlayedClass);
        }
  
        // Add open transition class after element is set to fixed
        // so CSS animation is applied correctly
        setTimeout(function() {
          siteHeader.classList.add(config.openTransitionClass);
        }, 100);
      } else {
        if (!config.stickyActive) {
          return;
        }
  
        config.stickyActive = false;
  
        siteHeader.classList.remove(config.openTransitionClass);
        siteHeader.classList.remove(config.stickyClass);
        if (config.wrapperOverlayed) {
          wrapper.classList.add(config.overlayedClass);
        }
      }
    }
  
    function accessibleDropdowns() {
      var hasActiveDropdown = false;
      var hasActiveSubDropdown = false;
      var closeOnClickActive = false;
  
      // Touch devices open dropdown on first click, navigate to link on second
      if (theme.config.isTouch) {
        document.querySelectorAll(selectors.navLinksWithDropdown).forEach(el => {
          el.on('touchend' + config.namespace, function(evt) {
            var parent = evt.currentTarget.parentNode;
            if (!parent.classList.contains(classes.dropdownActive)) {
              evt.preventDefault();
              closeDropdowns();
              openFirstLevelDropdown(evt.currentTarget);
            } else {
              window.location.replace(evt.currentTarget.getAttribute('href'));
            }
          });
        });
      }
  
      // Open/hide top level dropdowns
      document.querySelectorAll(selectors.navLinks).forEach(el => {
        el.on('focusin' + config.namespace, accessibleMouseEvent);
        el.on('mouseover' + config.namespace, accessibleMouseEvent);
        el.on('mouseleave' + config.namespace, closeDropdowns);
      });
  
      document.querySelectorAll(selectors.navDropdownLinks).forEach(el => {
        if (theme.config.isTouch) {
          el.on('touchend' + config.namespace, function(evt) {
            var parent = evt.currentTarget.parentNode;
  
            // Open third level menu or go to link based on active state
            if (parent.classList.contains(classes.hasSubDropdownClass)) {
              if (!parent.classList.contains(classes.dropdownActive)) {
                evt.preventDefault();
                closeThirdLevelDropdown();
                openSecondLevelDropdown(evt.currentTarget);
              } else {
                window.location.replace(evt.currentTarget.getAttribute('href'));
              }
            } else {
              // No third level nav, go to link
              window.location.replace(evt.currentTarget.getAttribute('href'));
            }
          });
        }
  
        // Open/hide sub level dropdowns
        el.on('focusin' + config.namespace, function(evt) {
          closeThirdLevelDropdown();
          openSecondLevelDropdown(evt.currentTarget, true);
        })
      });
  
      function accessibleMouseEvent(evt) {
        if (hasActiveDropdown) {
          closeSecondLevelDropdown();
        }
  
        if (hasActiveSubDropdown) {
          closeThirdLevelDropdown();
        }
  
        openFirstLevelDropdown(evt.currentTarget);
      }
  
      // Private dropdown functions
      function openFirstLevelDropdown(el) {
        var parent = el.parentNode;
        if (parent.classList.contains(classes.hasDropdownClass)) {
          parent.classList.add(classes.dropdownActive);
          hasActiveDropdown = true;
        }
  
        if (!theme.config.isTouch) {
          if (!closeOnClickActive) {
            var eventType = theme.config.isTouch ? 'touchend' : 'click';
            closeOnClickActive = true;
            document.documentElement.on(eventType + config.namespace, function() {
              closeDropdowns();
              document.documentElement.off(eventType + config.namespace);
              closeOnClickActive = false;
            }.bind(this));
          }
        }
      }
  
      function openSecondLevelDropdown(el, skipCheck) {
        var parent = el.parentNode;
        if (parent.classList.contains(classes.hasSubDropdownClass) || skipCheck) {
          parent.classList.add(classes.dropdownActive);
          hasActiveSubDropdown = true;
        }
      }
  
      function closeDropdowns() {
        closeSecondLevelDropdown();
        closeThirdLevelDropdown();
      }
  
      function closeSecondLevelDropdown() {
        document.querySelectorAll(selectors.navItems).forEach(el => {
          el.classList.remove(classes.dropdownActive)
        });
      }
  
      function closeThirdLevelDropdown() {
        document.querySelectorAll(selectors.navDropdownLinks).forEach(el => {
          el.parentNode.classList.remove(classes.dropdownActive);
        });
      }
    }
  
    function searchDrawer() {
      document.querySelectorAll(selectors.searchBtn).forEach(btn => {
        btn.addEventListener('click', openSearchDrawer);
      });
  
      document.querySelector(selectors.closeSearch).addEventListener('click', closeSearchDrawer);
    }
  
    function openSearchDrawer(evt) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
      var container = document.querySelector(selectors.searchContainer);
      theme.utils.prepareTransition(container, function() {
        container.classList.add('is-active');
      }.bind(this));
  
      document.documentElement.classList.add('js-drawer-open', 'js-drawer-open--search');
  
      setTimeout(function() {
        theme.a11y.trapFocus({
          container: container,
          namespace: 'header_search',
          elementToFocus: container.querySelector('.site-header__search-input')
        });
      }, 100);
  
      // If sticky is enabled, scroll to top on mobile when close to it
      // so you don't get an invisible search box
      if (theme.config.bpSmall && config.stickyEnabled && config.lastScroll < 300) {
        window.scrollTo(0,0);
      }
  
      // Bind events
      theme.a11y.lockMobileScrolling(config.namespace);
  
      bindSearchEvents();
    }
  
    function closeSearchDrawer(evt) {
      // Do not close if click event came from inside drawer
      if (evt) {
        // evt.path is non-standard, so have fallback
        var path = evt.path || (evt.composedPath && evt.composedPath());
        for (var i = 0; i < path.length; i++) {
          if (path[i].classList) {
            if (path[i].classList.contains('site-header__search-btn')) {
              break;
            }
  
            if (path[i].classList.contains('site-header__search-container')) {
              return;
            }
          }
        }
      }
  
      // deselect any focused form elements
      document.activeElement.blur();
  
      document.documentElement.classList.add('js-drawer-closing');
      document.documentElement.classList.remove('js-drawer-open', 'js-drawer-open--search');
  
      window.setTimeout(function() {
        document.documentElement.classList.remove('js-drawer-closing');
      }.bind(this), 500);
  
      var container = document.querySelector(selectors.searchContainer);
      theme.utils.prepareTransition(container, function() {
        container.classList.remove('is-active');
      }.bind(this));
  
      theme.a11y.removeTrapFocus({
        container: container,
        namespace: 'header_search'
      });
  
      theme.a11y.unlockMobileScrolling(config.namespace);
  
      unbindSearchEvents();
    }
  
    function bindSearchEvents() {
      window.on('keyup' + config.namespace, function(evt) {
        if (evt.keyCode === 27) {
          closeSearchDrawer();
        }
      }.bind(this));
  
      // Clicking out of container closes it
      document.documentElement.on('click' + config.namespace, function(evt) {
        closeSearchDrawer(evt);
      }.bind(this));
    }
  
    function unbindSearchEvents() {
      window.off('keyup' + config.namespace);
      document.documentElement.off('click' + config.namespace);
    }
  
    function resizeLogo(evt) {
      document.querySelectorAll(selectors.logo).forEach(logo => {
        var logoWidthOnScreen = logo.clientWidth;
        var containerWidth = logo.closest('.header-item').clientWidth;
  
        // If image exceeds container, let's make it smaller
        if (logoWidthOnScreen > containerWidth) {
          logo.style.maxWidth = containerWidth;
        }
        else {
          logo.removeAttribute('style')
        }
      });
    }
  
    return {
      init: init,
      disableOverlayHeader: disableOverlayHeader
    };
  })();
  
  window.onpageshow = function(evt) {
    // Removes unload class when returning to page via history
    if (evt.persisted) {
      document.body.classList.remove('unloading');
      document.querySelectorAll('.cart__checkout').forEach(el => {
        el.classList.remove('btn--loading');
      });
    }
  };
  
  theme.pageTransitions = function() {
    if (document.body.dataset.transitions === 'true') {
  
      // Hack test to fix Safari page cache issue.
      // window.onpageshow doesn't always run when navigating
      // back to the page, so the unloading class remains, leaving
      // a white page. Setting a timeout to remove that class when leaving
      // the page actually finishes running when they come back.
      if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) {
        document.querySelectorAll('a').forEach(a => {
          window.setTimeout(function() {
            document.body.classList.remove('unloading');
          }, 1200);
        });
      }
  
      // Add disable transition class to various link types
      document.querySelectorAll('a[href^="mailto:"], a[href^="#"], a[target="_blank"], a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[download]').forEach(el => {
        el.classList.add('js-no-transition');
      });
  
      document.querySelectorAll('a:not(.js-no-transition)').forEach(el => {
        el.addEventListener('click', function(evt) {
          if (evt.metaKey) return true;
          evt.preventDefault();
          document.body.classList.add('unloading');
          var src = el.getAttribute('href');
          window.setTimeout(function() {
            location.href = src;
          }, 50);
        });
      });
  
      document.querySelectorAll('a.mobile-nav__link').forEach(el => {
        el.addEventListener('click', function() {
          theme.NavDrawer.close();
        })
      });
    }
  };
  
  theme.predictiveSearch = (function() {
    var currentString = '';
    var isLoading = false;
    var searchTimeout;
    var namespace = '.predictive';
  
    var selectors = {
      form: '#HeaderSearchForm',
      input: 'input[type="search"]',
      wrapper: '#PredictiveWrapper',
      resultDiv: '#PredictiveResults',
      searchButton: '[data-predictive-search-button]'
    };
  
    var cache = {};
  
    var classes = {
      isActive: 'predicitive-active'
    };
  
    var keys = {
      up_arrow: 38,
      down_arrow: 40,
      tab: 9
    };
  
    function init() {
      // Only some languages support predictive search
      if (document.getElementById('shopify-features')) {
        var supportedShopifyFeatures = JSON.parse(document.getElementById('shopify-features').innerHTML);
        if (!supportedShopifyFeatures.predictiveSearch) {
          return;
        }
      }
  
      cache.wrapper = document.querySelector(selectors.wrapper);
  
      if (!cache.wrapper) {
        return;
      }
  
      cache.form = document.querySelector(selectors.form);
      cache.form.setAttribute('autocomplete', 'off');
      cache.form.on('submit' + namespace, submitSearch);
  
      cache.input = cache.form.querySelector(selectors.input);
      cache.input.on('keyup' + namespace, handleKeyup);
  
      cache.submit = cache.wrapper.querySelector(selectors.searchButton);
      cache.submit.on('click' + namespace, triggerSearch);
  
      cache.results = document.querySelector(selectors.resultDiv);
    }
  
    function reset() {
      cache.wrapper.classList.add('hide');
      cache.results.innerHTML = '';
      clearTimeout(searchTimeout);
    }
  
    function triggerSearch() {
      cache.form.submit();
    }
  
    // Append * wildcard to search
    function submitSearch(evt) {
      evt.preventDefault ? evt.preventDefault() : evt.returnValue = false;
  
      var obj = {};
      var formData = new FormData(evt.target);
      for (var key of formData.keys()) {
        obj[key] = formData.get(key);
      }
  
      if (obj.q) {
        obj.q += '*';
      }
  
      var params = paramUrl(obj);
  
      window.location.href = '/search?' + params;
      return false;
    }
  
    function handleKeyup(evt) {
      if (evt.keyCode === keys.up_arrow) {
        return;
      }
  
      if (evt.keyCode === keys.down_arrow) {
        return;
      }
  
      if (evt.keyCode === keys.tab) {
        return;
      }
  
      search();
    }
  
    function search() {
      var keyword = cache.input.value;
  
      if (keyword === '') {
        reset();
        return;
      }
  
      var q = _normalizeQuery(keyword);
  
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(
        function () {
          predictQuery(q);
        }.bind(this),
        500
      );
    }
  
    function predictQuery(q) {
      if (isLoading) {
        return;
      }
  
      // Do not re-search the same thing
      if (currentString === q) {
        return;
      }
  
      currentString = q;
      isLoading = true;
  
      var searchObj = {
        'q': q,
        'resources[type]': theme.settings.predictiveSearchType,
        'resources[limit]': 3,
        'resources[options][unavailable_products]': 'last',
        'resources[options][fields]': 'title,product_type,variants.title,vendor'
      };
  
      var params = paramUrl(searchObj);
  
      fetch('/search/suggest.json?' + params)
      .then(response => response.json())
      .then(suggestions => {
        isLoading = false;
        var data = {};
        var resultCount = 0;
  
        cache.wrapper.classList.remove('hide');
        var resultTypes = Object.entries(suggestions.resources.results);
  
        Object.keys(resultTypes).forEach(function (i) {
          var obj = resultTypes[i];
          var type = obj[0];
          var results = obj[1];
          resultCount += results.length;
  
          switch(type) {
            case 'products':
              data[type] = buildProducts(results);
              break;
            case 'collections':
              data[type] = buildCollections(results);
              break;
            case 'pages':
              data[type] = buildPages(results);
              break;
            case 'articles':
              data[type] = buildArticles(results);
              break;
          }
        });
  
        if (resultCount === 0) {
          reset();
          return;
        }
  
        // Build and append result markup
        var output = buildOutput(data);
        cache.results.innerHTML = '';
        cache.results.innerHTML = output;
      });
    }
  
    function buildProducts(results) {
      var output = '';
      var products = [];
  
      results.forEach(product => {
        var new_product = {
          title: product.title,
          url: product.url,
          image: theme.Images.getSizedImageUrl(product.image, '200x200_crop_center')
        };
  
        products.push(new_product);
      });
  
      if (products.length) {
        var markup = theme.buildProductGridItem(products, 'medium-up--one-third');
  
        output = `
          <div data-type-products>
            <div class="grid grid--small">
              ${markup}
            </div>
          </div>
        `;
      }
  
      return output;
    }
  
    function buildCollections(results) {
      var output = '';
      var collections = [];
  
      results.forEach(collection => {
        var new_collection = {
          title: collection.title,
          url: collection.url
        };
  
        if (collection.featured_image.url) {
          new_collection.image = theme.Images.getSizedImageUrl(collection.featured_image.url, '200x200_crop_center');
        }
  
        collections.push(new_collection);
      });
  
      if (collections.length) {
        var markup = theme.buildCollectionItem(collections);
  
        output = `
          <div data-type-collections>
            <p class="h6 predictive__label">${theme.strings.searchCollections}</p>
            <div class="grid grid--small">
              ${markup}
            </div>
          </div>
        `;
      }
  
      return output;
    }
  
    function buildPages(pages) {
      var output = '';
  
      if (pages.length) {
        var markup = theme.buildPageItem(pages);
  
        output = `
          <div data-type-pages>
            <p class="h6 predictive__label">${theme.strings.searchPages}</p>
            ${markup}
          </div>
        `;
      }
  
      return output;
    }
  
    // Overwrite full sized image returned form API
    // with lazyloading-friendly path
    function buildArticles(articles) {
      var output = '';
  
      articles.forEach(article => {
        if (article.image) {
          article.image = theme.Images.getSizedImageUrl(article.image, '200x200_crop_center');
        }
      });
  
      if (articles.length) {
        var markup = theme.buildArticleItem(articles);
  
        output = `
          <div data-type-articles>
            <p class="h6 predictive__label">${theme.strings.searchArticles}</p>
            <div class="grid grid--uniform">
              ${markup}
            </div>
          </div>
        `;
      }
  
      return output;
    }
  
    // Combine all search result markup and print to page
    function buildOutput(data) {
      var output = '';
  
      if (data.products && data.products !== '') {
        output += data.products;
      }
  
      if (data.collections && data.collections !== '') {
        output += data.collections;
      }
  
      if (data.pages && data.pages !== '') {
        output += data.pages;
      }
  
      if (data.articles && data.articles !== '') {
        output += data.articles;
      }
  
      return output;
    }
  
    function _normalizeQuery(string) {
      if (typeof string !== 'string') {
        return null;
      }
  
      return string
        .trim()
        .replace(/\ /g, '-')
        .toLowerCase();
    }
  
    function paramUrl(obj) {
      return Object.keys(obj).map(function(key) {
        return key + '=' + encodeURIComponent(obj[key]);
      }).join('&')
    }
  
    return {
      init: init
    };
  })();
  

  theme.Maps = (function() {
    var config = {
      zoom: 14
    };
    var apiStatus = null;
    var mapsToLoad = [];
  
    var errors = {};
  
    var selectors = {
      section: '[data-section-type="map"]',
      map: '[data-map]',
      mapOverlay: '.map-section__overlay'
    };
  
    // Global function called by Google on auth errors.
    // Show an auto error message on all map instances.
    window.gm_authFailure = function() {
      if (!Shopify.designMode) {
        return;
      }
  
      document.querySelectorAll(selectors.section).forEach(section => {
        section.classList.add('map-section--load-error');
      });
  
      document.querySelectorAll(selectors.map).forEach(map => {
        map.parentNode.removeChild(map);
      });
  
      window.mapError(theme.strings.authError);
    };
  
    window.mapError = function(error) {
      var message = document.createElement('div');
      message.classList.add('map-section__error', 'errors', 'text-center');
      message.innerHTML = error;
      document.querySelectorAll(selectors.mapOverlay).forEach(overlay => {
        overlay.parentNode.prepend(message);
      });
      document.querySelectorAll('.map-section__link').forEach(link => {
        link.classList.add('hide');
      });
    };
  
    function Map(container) {
      this.container = container;
      this.sectionId = this.container.getAttribute('data-section-id');
      this.namespace = '.map-' + this.sectionId;
      this.map = container.querySelector(selectors.map);
      this.key = this.map.dataset.apiKey;
  
      errors = {
        addressNoResults: theme.strings.addressNoResults,
        addressQueryLimit: theme.strings.addressQueryLimit,
        addressError: theme.strings.addressError,
        authError: theme.strings.authError
      };
  
      if (!this.key) {
        return;
      }
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.prepMapApi.bind(this),
        threshold: 20
      });
    }
  
    // API has loaded, load all Map instances in queue
    function initAllMaps() {
      mapsToLoad.forEach(instance => {
        instance.createMap();
      });
    }
  
    function geolocate(map) {
      var geocoder = new google.maps.Geocoder();
  
      if (!map) {
        return;
      }
  
      var address = map.dataset.addressSetting;
  
      var deferred = new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, function(results, status) {
          if (status !== google.maps.GeocoderStatus.OK) {
            reject(status);
          }
          resolve(results);
        });
      });
  
      return deferred;
    }
  
    Map.prototype = Object.assign({}, Map.prototype, {
      prepMapApi: function() {
        if (apiStatus === 'loaded') {
          this.createMap();
        } else {
          mapsToLoad.push(this);
  
          if (apiStatus !== 'loading') {
            apiStatus = 'loading';
            if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined' ) {
  
              var script = document.createElement('script');
              script.onload = function () {
                apiStatus = 'loaded';
                initAllMaps();
              };
              script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.key;
              document.head.appendChild(script);
            }
          }
        }
      },
  
      createMap: function() {
        var mapDiv = this.map;
  
        return geolocate(mapDiv)
          .then(
            function(results) {
              var mapOptions = {
                zoom: config.zoom,
                backgroundColor: 'none',
                center: results[0].geometry.location,
                draggable: false,
                clickableIcons: false,
                scrollwheel: false,
                disableDoubleClickZoom: true,
                disableDefaultUI: true
              };
  
              var map = (this.map = new google.maps.Map(mapDiv, mapOptions));
              var center = (this.center = map.getCenter());
  
              var marker = new google.maps.Marker({
                map: map,
                position: map.getCenter()
              });
  
              google.maps.event.addDomListener(
                window,
                'resize',
                theme.utils.debounce(250, function() {
                  google.maps.event.trigger(map, 'resize');
                  map.setCenter(center);
                  mapDiv.removeAttribute('style');
                })
              );
  
              if (Shopify.designMode) {
                if (window.AOS) { AOS.refreshHard() }
              }
            }.bind(this)
          )
          .catch(function(status) {
            var errorMessage;
  
            switch (status) {
              case 'ZERO_RESULTS':
                errorMessage = errors.addressNoResults;
                break;
              case 'OVER_QUERY_LIMIT':
                errorMessage = errors.addressQueryLimit;
                break;
              case 'REQUEST_DENIED':
                errorMessage = errors.authError;
                break;
              default:
                errorMessage = errors.addressError;
                break;
            }
  
            // Show errors only to merchant in the editor.
            if (Shopify.designMode) {
              window.mapError(errorMessage);
            }
          });
      },
  
      onUnload: function() {
        if (this.map.length === 0) {
          return;
        }
        // Causes a harmless JS error when a section without an active map is reloaded
        if (google && google.maps && google.maps.event) {
          google.maps.event.clearListeners(this.map, 'resize');
        }
      }
    });
  
    return Map;
  })();
  
  theme.NewsletterPopup = (function() {
    function NewsletterPopup(container) {
      this.container = container;
      var sectionId = this.container.getAttribute('data-section-id');
      this.cookieName = 'newsletter-' + sectionId;
  
      if (!container) {
        return;
      }
  
      // Prevent popup on Shopify robot challenge page
      if (window.location.pathname === '/challenge') {
        return;
      }
  
      this.data = {
        secondsBeforeShow: container.dataset.delaySeconds,
        daysBeforeReappear: container.dataset.delayDays,
        cookie: Cookies.get(this.cookieName),
        testMode: container.dataset.testMode
      };
  
      this.modal = new theme.Modals('NewsletterPopup-' + sectionId, 'newsletter-popup-modal');
  
      // Open modal if errors or success message exist
      if (container.querySelector('.errors') || container.querySelector('.note--success')) {
        this.modal.open();
      }
  
      // Set cookie as opened if success message
      if (container.querySelector('.note--success')) {
        this.closePopup(true);
        return;
      }
  
      document.addEventListener('modalClose.' + container.id, this.closePopup.bind(this));
  
      if (!this.data.cookie || this.data.testMode === 'true') {
        this.initPopupDelay();
      }
    }
  
    NewsletterPopup.prototype = Object.assign({}, NewsletterPopup.prototype, {
      initPopupDelay: function() {
        if (Shopify && Shopify.designMode) {
          return;
        }
        setTimeout(function() {
          this.modal.open();
        }.bind(this), this.data.secondsBeforeShow * 1000);
      },
  
      closePopup: function(success) {
        // Remove a cookie in case it was set in test mode
        if (this.data.testMode === 'true') {
          Cookies.remove(this.cookieName, { path: '/' });
          return;
        }
  
        var expiry = success ? 200 : this.data.daysBeforeReappear;
        Cookies.set(this.cookieName, 'opened', { path: '/', expires: expiry });
      },
  
      onLoad: function() {
        this.modal.open();
      },
  
      onSelect: function() {
        this.modal.open();
      },
  
      onDeselect: function() {
        this.modal.close();
      }
    });
  
    return NewsletterPopup;
  })();
  
  theme.PasswordHeader = (function() {
    function PasswordHeader() {
      this.init();
    }
  
    PasswordHeader.prototype = Object.assign({}, PasswordHeader.prototype, {
      init: function() {
        if (!document.querySelector('#LoginModal')) {
          return;
        }
  
        var passwordModal = new theme.Modals('LoginModal', 'login-modal', {
          focusIdOnOpen: 'password',
          solid: true
        });
  
        // Open modal if errors exist
        if (document.querySelectorAll('.errors').length) {
          passwordModal.open();
        }
      }
    });
  
    return PasswordHeader;
  })();
  
  theme.Photoswipe = (function() {
    var selectors = {
      trigger: '.js-photoswipe__zoom',
      images: '.photoswipe__image',
      slideshowTrack: '.flickity-viewport ',
      activeImage: '.is-selected'
    };
  
    function Photoswipe(container, sectionId) {
      this.container = container;
      this.sectionId = sectionId;
      this.namespace = '.photoswipe-' + this.sectionId;
      this.gallery;
      this.images;
      this.items;
      this.inSlideshow = false;
  
      if (!container || container.dataset.zoom === 'false') {
        return;
      }
  
      if (container.dataset.hasSlideshow === 'true') {
        this.inSlideshow = true;
      }
  
      this.init();
    }
  
    Photoswipe.prototype = Object.assign({}, Photoswipe.prototype, {
      init: function() {
        this.container.querySelectorAll(selectors.trigger).forEach(trigger => {
          trigger.on('click' + this.namespace, this.triggerClick.bind(this));
        });
      },
  
      triggerClick: function(evt) {
        this.items = this.getImageData();
  
        var image = this.inSlideshow ? this.container.querySelector(selectors.activeImage) : evt.currentTarget;
  
        var index = this.inSlideshow ? this.getChildIndex(image) : image.dataset.index;
  
        this.initGallery(this.items, index);
      },
  
      // Because of image set feature, need to get index based on location in parent
      getChildIndex: function(el) {
        var i = 0;
        while( (el = el.previousSibling) != null ) {
          i++;
        }
  
        // 1-based index required
        return i + 1;
      },
  
      getImageData: function() {
        this.images = this.inSlideshow
                        ? this.container.querySelectorAll(selectors.slideshowTrack + selectors.images)
                        : this.container.querySelectorAll(selectors.images);
  
        var items = [];
        var options = {};
  
        this.images.forEach(el => {
          var item = {
            msrc: el.currentSrc || el.src,
            src: el.getAttribute('data-photoswipe-src'),
            w: el.getAttribute('data-photoswipe-width'),
            h: el.getAttribute('data-photoswipe-height'),
            el: el,
            initialZoomLevel: 0.5
          }
  
          items.push(item);
        });
  
        return items;
      },
  
      initGallery: function(items, index) {
        var pswpElement = document.querySelectorAll('.pswp')[0];
  
        var options = {
          allowPanToNext: false,
          captionEl: false,
          closeOnScroll: false,
          counterEl: false,
          history: false,
          index: index - 1,
          pinchToClose: false,
          preloaderEl: false,
          scaleMode: 'zoom',
          shareEl: false,
          tapToToggleControls: false,
          getThumbBoundsFn: function(index) {
            var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
            var thumbnail = items[index].el;
            var rect = thumbnail.getBoundingClientRect();
            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
          }
        }
  
        this.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
  
        this.gallery.init();
        this.gallery.listen('afterChange', this.afterChange.bind(this));
      },
  
      afterChange: function() {
        var index = this.gallery.getCurrentIndex();
        this.container.dispatchEvent(new CustomEvent('photoswipe:afterChange', {
          detail: {
            index: index
          }
        }));
      }
    });
  
    return Photoswipe;
  })();
  
  
  theme.Recommendations = (function() {
    var selectors = {
      placeholder: '.product-recommendations-placeholder',
      sectionClass: ' .product-recommendations',
      productResults: '.grid-product'
    }
  
    function Recommendations(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id');
      this.url = container.dataset.url;
  
      selectors.recommendations = 'Recommendations-' + this.sectionId;
  
      theme.initWhenVisible({
        element: container,
        callback: this.init.bind(this),
        threshold: 500
      });
    }
  
    Recommendations.prototype = Object.assign({}, Recommendations.prototype, {
      init: function() {
        var section = document.getElementById(selectors.recommendations);
  
        if (!section || section.dataset.enable === 'false') {
          return;
        }
  
        var id = section.dataset.productId;
        var limit = section.dataset.limit;
  
        var url = this.url + '?section_id=product-recommendations&limit='+ limit +'&product_id=' + id;
  
        fetch(url).then(function(response) {
          return response.text();
        }).then(function(html) {
          // Convert the HTML string into a document object
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var div = doc.querySelector(selectors.sectionClass);
          var placeholder = section.querySelector(selectors.placeholder);
          if (!placeholder) {
            return;
          }
  
          placeholder.innerHTML = '';
  
          if (!div) {
            this.container.classList.add('hide');
            return;
          }
  
          placeholder.appendChild(div);
  
          theme.reinitProductGridItem(section);
  
          document.dispatchEvent(new CustomEvent('recommendations:loaded', {
            detail: {
              section: section
            }
          }));
  
          // If no results, hide the entire section
          var results = div.querySelectorAll(selectors.productResults);
          if (results.length === 0) {
            this.container.classList.add('hide');
          }
        }.bind(this));
      }
    });
  
    return Recommendations;
  })();
  
  theme.SlideshowSection = (function() {
  
    var selectors = {
      parallaxContainer: '.parallax-container'
    };
  
    function SlideshowSection(container) {
      this.container = container;
      var sectionId = container.getAttribute('data-section-id');
      this.slideshow = container.querySelector('#Slideshow-' + sectionId);
      this.namespace = '.' + sectionId;
  
      if (!this.slideshow) { return }
  
      // Get shopify-created div that section markup lives in,
      // then get index of it inside its parent
      var sectionEl = container.parentElement;
      var sectionIndex = [].indexOf.call(sectionEl.parentElement.children, sectionEl);
  
      if (sectionIndex === 0) {
        this.init();
      } else {
        theme.initWhenVisible({
          element: this.container,
          callback: this.init.bind(this)
        });
      }
  
    }
  
    SlideshowSection.prototype = Object.assign({}, SlideshowSection.prototype, {
      init: function() {
        var slides = this.slideshow.querySelectorAll('.slideshow__slide');
  
        theme.loadImageSection(this.slideshow);
  
        if (slides.length > 1) {
          var sliderArgs = {
            prevNextButtons: this.slideshow.hasAttribute('data-arrows'),
            pageDots: this.slideshow.hasAttribute('data-dots'),
            fade: true,
            setGallerySize: false,
            autoPlay: this.slideshow.dataset.autoplay === 'true'
              ? parseInt(this.slideshow.dataset.speed)
              : false
          };
  
          this.flickity = new theme.Slideshow(this.slideshow, sliderArgs);
        } else {
          // Add loaded class to first slide
          slides[0].classList.add('is-selected');
        }
  
        if (this.container.hasAttribute('data-parallax')) {
          // Create new parallax for each slideshow image
          this.container.querySelectorAll(selectors.parallaxContainer).forEach(function(el, i) {
            new theme.Parallax(el, {
              namespace: this.namespace + '-parallax-' + i
            });
          }.bind(this));
        }
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      onUnload: function() {
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
      },
  
      onDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          this.flickity.play();
        }
      },
  
      onBlockSelect: function(evt) {
        var slide = this.slideshow.querySelector('.slideshow__slide--' + evt.detail.blockId)
        var index = parseInt(slide.dataset.index);
  
        if (this.flickity && typeof this.flickity.pause === 'function') {
          this.flickity.goToSlide(index);
          this.flickity.pause();
        }
      },
  
      onBlockDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          this.flickity.play();
        }
      }
    });
  
    return SlideshowSection;
  })();
  
  theme.StoreAvailability = (function() {
    var selectors = {
      drawerOpenBtn: '.js-drawer-open-availability',
      modalOpenBtn: '.js-modal-open-availability',
      productTitle: '[data-availability-product-title]'
    };
  
    function StoreAvailability(container) {
      this.container = container;
      this.baseUrl = container.dataset.baseUrl;
      this.productTitle = container.dataset.productName;
    }
  
    StoreAvailability.prototype = Object.assign({}, StoreAvailability.prototype, {
      updateContent: function(variantId) {
        var variantSectionUrl =
          this.baseUrl +
          '/variants/' +
          variantId +
          '/?section_id=store-availability';
  
        var self = this;
  
        fetch(variantSectionUrl)
          .then(function(response) {
            return response.text();
          })
          .then(function(html) {
            if (html.trim() === '') {
              this.container.innerHTML = '';
              return;
            }
  
            self.container.innerHTML = html;
            self.container.innerHTML = self.container.firstElementChild.innerHTML;
  
            // Setup drawer if have open button
            if (self.container.querySelector(selectors.drawerOpenBtn)) {
              self.drawer = new theme.Drawers('StoreAvailabilityDrawer', 'availability');
            }
  
            // Setup drawer if have open button
            if (self.container.querySelector(selectors.modalOpenBtn)) {
              self.modal = new theme.Modals('StoreAvailabilityModal', 'availability');
            }
  
            var title = self.container.querySelector(selectors.productTitle);
            if (title) {
              title.textContent = self.productTitle;
            }
          });
      }
    });
  
    return StoreAvailability;
  })();
  
  theme.VideoSection = (function() {
    var selectors = {
      videoParent: '.video-parent-section'
    };
  
    function videoSection(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id');
      this.namespace = '.video-' + this.sectionId;
      this.videoObject;
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.init.bind(this),
        threshold: 500
      });
    }
  
    videoSection.prototype = Object.assign({}, videoSection.prototype, {
      init: function() {
        var dataDiv = this.container.querySelector('.video-div');
        if (!dataDiv) {
          return;
        }
        var type = dataDiv.dataset.type;
  
        switch(type) {
          case 'youtube':
            var videoId = dataDiv.dataset.videoId;
            this.initYoutubeVideo(videoId);
            break;
          case 'vimeo':
            var videoId = dataDiv.dataset.videoId;
            this.initVimeoVideo(videoId);
            break;
          case 'mp4':
            this.initMp4Video();
            break;
        }
      },
  
      initYoutubeVideo: function(videoId) {
        this.videoObject = new theme.YouTube(
          'YouTubeVideo-' + this.sectionId,
          {
            videoId: videoId,
            videoParent: selectors.videoParent
          }
        );
      },
  
      initVimeoVideo: function(videoId) {
        this.videoObject = new theme.VimeoPlayer(
          'Vimeo-' + this.sectionId,
          videoId,
          {
            videoParent: selectors.videoParent
          }
        );
      },
  
      initMp4Video: function() {
        var mp4Video = 'Mp4Video-' + this.sectionId;
        var mp4Div = document.getElementById(mp4Video);
        var parent = mp4Div.closest(selectors.videoParent);
  
        if (mp4Div) {
          parent.classList.add('loaded');
  
          var playPromise = document.querySelector('#' + mp4Video).play();
  
          // Edge does not return a promise (video still plays)
          if (playPromise !== undefined) {
            playPromise.then(function() {
                // playback normal
              }).catch(function() {
                mp4Div.setAttribute('controls', '');
                parent.classList.add('video-interactable');
              });
          }
        }
      },
  
      onUnload: function(evt) {
        var sectionId = evt.target.id.replace('shopify-section-', '');
        if (this.videoObject && typeof this.videoObject.destroy === 'function') {
          this.videoObject.destroy();
        }
      }
    });
  
    return videoSection;
  })();
  

  theme.BackgroundImage = (function() {
  
    var selectors = {
      parallaxContainer: '.parallax-container'
    };
  
    function backgroundImage(container) {
      this.container = container;
      if (!container) {
        return;
      }
  
      var sectionId = container.getAttribute('data-section-id');
      this.namespace = '.' + sectionId;
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.init.bind(this)
      });
    }
  
    backgroundImage.prototype = Object.assign({}, backgroundImage.prototype, {
      init: function() {
        if (this.container.dataset && this.container.dataset.parallax) {
          var parallaxContainer = this.container.querySelector(selectors.parallaxContainer);
          var args = {
            namespace: this.namespace,
            desktopOnly: true
          };
  
          theme.parallaxSections[this.namespace] = new theme.Parallax(parallaxContainer, args);
        }
      },
  
      onUnload: function(evt) {
        if (!this.container) { return }
        if (theme.parallaxSections[this.namespace] && typeof theme.parallaxSections[this.namespace].destroy === 'function') {
          theme.parallaxSections[this.namespace].destroy();
        }
        delete theme.parallaxSections[this.namespace];
      }
    });
  
    return backgroundImage;
  })();
  
  theme.Blog = (function() {
  
    function Blog(container) {
      this.tagFilters();
    }
  
    Blog.prototype = Object.assign({}, Blog.prototype, {
      tagFilters: function() {
        var filterBy = document.getElementById('BlogTagFilter');
  
        if (!filterBy) {
          return;
        }
  
        filterBy.addEventListener('change', function() {
          location.href = filterBy.value;
        });
      }
    });
  
    return Blog;
  })();
  
  theme.CollectionSwitcher = (function() {
    var selectors = {
      trigger: '.collection-switcher__trigger',
      collection: '.collection-switcher__collection',
      slider: '.collection-switcher__collection-grid'
    };
  
    var sliderArgs = {
      adaptiveHeight: true,
      avoidReflow: true,
      autoPlay: false,
      cellAlign: 'left',
      fade: false,
      prevNextButtons: true,
      setGallerySize: true,
      wrapAround: false
    };
  
    function CollectionSwitcher(container) {
      this.container = container;
      this.sectionId = this.container.getAttribute('data-section-id');
      this.slideshows = container.querySelectorAll(selectors.slider);
      this.namespace = '.switcher-' + this.sectionId;
      this.flickity = {};
      this.activeIndex = 0;
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.init.bind(this),
        threshold: 300
      });
    }
  
    CollectionSwitcher.prototype = Object.assign({}, CollectionSwitcher.prototype, {
      init: function() {
        this.container.querySelectorAll(selectors.trigger)
        this.container.querySelectorAll(selectors.trigger).forEach(trigger => {
          trigger.on('click', this.switch.bind(this));
        });
  
        if (!this.slideshows.length) { return }
  
        this.config = {
          perRow: this.container.getAttribute('data-per-row'),
          perRowMobile: 2 // fixed always
        };
  
        this.initSliders();
  
        document.addEventListener('matchSmall', function() {
          this.initSliders();
        }.bind(this));
  
        document.addEventListener('unmatchSmall', function() {
          this.initSliders();
        }.bind(this));
      },
  
      initSliders: function() {
        // Make sure both sliders are visible so flickity inits properly
        this.container.querySelectorAll(selectors.collection).forEach(collection => {
          collection.classList.remove('hide');
        });
  
        sliderArgs.groupCells = theme.config.bpSmall ? this.config.perRowMobile : this.config.perRow;
  
        this.slideshows.forEach(function(slideshow, i) {
          if (this.flickity[i] && typeof this.flickity[i].destroy === 'function') {
            this.flickity[i].destroy();
          }
  
          this.flickity[i] = new theme.Slideshow(slideshow, sliderArgs);
  
          // Hide non-active collection after flickity setup
          if (i !== this.activeIndex) {
            slideshow.closest(selectors.collection).classList.add('hide');
          }
  
        }.bind(this));
  
        if (AOS) {
          AOS.refresh();
        }
      },
  
      switch: function(evt) {
        evt.preventDefault();
  
        var containerId = evt.currentTarget.getAttribute('aria-controls');
        var newContainer = document.getElementById(containerId);
        this.activeIndex = parseInt(newContainer.dataset.index);
  
        this.container.querySelectorAll(selectors.trigger).forEach(trigger => {
          trigger.classList.remove('is-active');
        });
  
        evt.currentTarget.classList.add('is-active');
  
        // Hide collections, show new one
        this.container.querySelectorAll(selectors.collection).forEach(collection => {
          collection.classList.add('hide');
        });
  
        newContainer.classList.remove('hide');
  
  
        if (this.flickity[this.activeIndex] && typeof this.flickity[this.activeIndex].resize === 'function') {
          this.flickity[this.activeIndex].resize();
        }
      },
  
      destroy: function() {
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
      },
  
      onUnload: function() {
        this.destroy();
      }
  
    });
  
    return CollectionSwitcher;
  })();
  
  theme.Collection = (function() {
    var isAnimating = false;
    var hasLoadedBefore = false;
  
    var selectors = {
      sortSelect: '#SortBy',
      tags: '.tags',
      hero: '.collection-hero',
      title: '.collection-title',
      parallaxContainer: '.parallax-container'
    };
  
    var classes = {
      activeTag: 'tag--active'
    };
  
    function Collection(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id');
      this.namespace = '.collection-' + this.sectionId;
  
      var heroImageContainer = container.querySelector('.collection-hero');
      if (heroImageContainer) {
        if (hasLoadedBefore) {
          this.checkIfNeedReload();
        }
        theme.loadImageSection(heroImageContainer);
  
        if (container.dataset && container.dataset.parallax) {
          var parallaxContainer = container.querySelector(selectors.parallaxContainer);
          var args = {
            namespace: this.namespace
          };
          theme.parallaxSections[this.namespace] = new theme.Parallax(parallaxContainer, args);
        }
      } else if (theme.settings.overlayHeader) {
        theme.headerNav.disableOverlayHeader();
      }
  
      // Ajax pagination
      window.addEventListener('popstate', function(state) {
        if (state) {
          this.getNewCollectionContent(location.href);
        }
      }.bind(this));
  
      this.init();
    }
  
    Collection.prototype = Object.assign({}, Collection.prototype, {
      init: function() {
        this.sortSelect = this.container.querySelector(selectors.sortSelect);
  
        if (this.sortSelect) {
          this.defaultSort = this.getDefaultSortValue();
          this.sortSelect.addEventListener('change', this.onSortChange.bind(this));
          this.initParams();
          this.sortTags();
        }
  
        if (this.container.querySelector('.tags a')) {
          this.initTagAjax();
        }
  
        hasLoadedBefore = true;
      },
  
      initTagAjax: function() {
        this.container.querySelectorAll('.tags a').forEach(tag => {
          tag.on('click' + this.namespace, function(evt) {
            if (tag.classList.contains('no-ajax')) {
              return;
            }
  
            evt.preventDefault();
  
            if (isAnimating) {
              return;
            }
  
            isAnimating = true;
  
            var newUrl = tag.getAttribute('href');
  
            // Remove current active tag
            this.container.querySelectorAll('.' + classes.activeTag).forEach(el => {
              el.classList.remove(classes.activeTag);
            });
  
            tag.parentNode.classList.add(classes.activeTag);
  
            history.pushState({}, '', newUrl);
  
            this.container.querySelectorAll('.grid-product').forEach(item => {
              item.classList.add('unload');
            });
  
            this.getNewCollectionContent(newUrl);
          }.bind(this));
        });
      },
  
      getNewCollectionContent: function(url) {
        url = url.indexOf('?') === -1 ? (url + '?view=ajax') : (url + '&view=ajax');
  
        var resultDiv = document.getElementById('CollectionAjaxResult');
  
        fetch(url).then(function(response) {
          return response.text();
        }).then(function(html) {
          // Convert the HTML string into a document object
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var div = doc.querySelector('#CollectionAjaxContent');
  
          resultDiv.innerHTML = '';
          resultDiv.append(div);
  
          isAnimating = false;
          this.reInit(doc);
        }.bind(this));
      },
  
      initParams: function() {
        this.queryParams = {};
  
        if (location.search.length) {
          var aKeyValue;
          var aCouples = location.search.substr(1).split('&');
          for (var i = 0; i < aCouples.length; i++) {
            aKeyValue = aCouples[i].split('=');
            if (aKeyValue.length > 1) {
              this.queryParams[
                decodeURIComponent(aKeyValue[0])
              ] = decodeURIComponent(aKeyValue[1]);
            }
          }
        }
      },
  
      getSortValue: function() {
        return this.sortSelect.value || this.defaultSort;
      },
  
      getDefaultSortValue: function() {
        return this.sortSelect.getAttribute('data-default-sortby');
      },
  
      onSortChange: function() {
        this.queryParams.sort_by = this.getSortValue();
  
        if (this.queryParams.page) {
          delete this.queryParams.page;
        }
  
        window.location.search = new URLSearchParams(Object.entries(this.queryParams));
      },
  
      sortTags: function() {
        var sortTags = document.getElementById('SortTags');
  
        if (!sortTags) {
          return;
        }
  
        sortTags.addEventListener('change', function(evt) {
          location.href = evt.currentTarget.value;
        });
      },
  
      reInit: function(doc) {
        // Reload collection template (it can be anywhere in the sections.instance array)
        for (var i = 0; i < theme.sections.instances.length; i++) {
          var instance = theme.sections.instances[i];
          if (instance['type'] === 'collection-template') {
            instance.forceReload();
          }
        }
  
        // Update collection title
        if (doc) {
          var title = doc.querySelector(selectors.title).innerText;
          document.querySelector(selectors.title).innerText = title;
        }
  
        theme.reinitProductGridItem();
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      // A liquid variable in the header needs a full page refresh
      // if the collection header hero image setting is enabled
      // and the header is set to sticky. Only necessary in the editor.
      checkIfNeedReload: function() {
        if (!Shopify.designMode) {
          return;
        }
  
        if (theme.settings.overlayHeader) {
          var header = document.querySelector('.header-wrapper');
          if (!header.classList.contains('header-wrapper--overlay')) {
            location.reload();
          }
        }
      },
  
      onUnload: function() {
        if (theme.parallaxSections[this.namespace]) {
          theme.parallaxSections[this.namespace].destroy();
          delete theme.parallaxSections[this.namespace];
        }
      }
    });
  
    return Collection;
  })();
  
  theme.FadingImages = (function() {
  
    var classes = {
      activeImage: 'active-image',
      finishedImage: 'finished-image',
      activeTitles: 'active-titles',
      finishedTitles: 'finished-titles',
      compensation: 'compensation'
    };
  
    function FadingImages(container) {
      this.container = container;
      var sectionId = container.getAttribute('data-section-id');
      var namespace = this.namespace = '.fading-images-' + sectionId;
  
      if (!container) {
        return;
      }
  
      this.imageInterval;
      this.titleInterval;
  
      this.data = {
        interval: container.dataset.interval,
        block_count: container.dataset.count,
        finish_interval: 1000,
        timer_offset: 400,
        active_image: 1,
        active_title: 1,
        removed_compensation: false
      };
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.init.bind(this)
      });
    }
  
    FadingImages.prototype = Object.assign({}, FadingImages.prototype, {
      init: function() {
        var imageContainer = this.container.querySelector('.fading-images');
        theme.loadImageSection(imageContainer);
  
        this.allTitles = this.container.querySelectorAll('.fading-images-overlay__titles');
  
        // pause when out of view
        var observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.startImages();
              this.startTitles();
            } else {
              clearInterval(this.imageInterval);
              clearInterval(this.titleInterval);
            }
          });
        }, {rootMargin: '0px 0px 0px 0px'});
  
        observer.observe(this.container);
      },
  
      nextImage: function() {
        var activeImage = this.container.querySelector('.fading-images__item[data-slide-index="' + this.data.active_image + '"]');
  
        if (!this.data.removed_compensation) {
          activeImage.classList.remove(classes.compensation);
          this.data.removed_compensation = true;
        }
  
        activeImage.classList.remove(classes.activeImage);
        activeImage.classList.add(classes.finishedImage);
  
        var target_image = this.data.active_image;
        window.setTimeout(function() {
          activeImage.classList.remove(classes.finishedImage);
        }, this.data.finish_interval);
  
        this.data.active_image++;
        if (this.data.active_image > this.data.block_count) {
          this.data.active_image = 1;
        }
  
        var nextImage = this.container.querySelector('.fading-images__item[data-slide-index="' + this.data.active_image + '"]');
  
        nextImage.classList.add(classes.activeImage);
      },
  
      nextTitle: function() {
        this.allTitles.forEach(title => {
          title.classList.remove(classes.activeTitles);
          title.classList.add(classes.finishedTitles);
        });
  
        this.data.active_title++;
        if (this.data.active_title > this.data.block_count) {
          this.data.active_title = 1;
        }
  
        var target_title = this.data.active_title;
        window.setTimeout(function() {
          var slide = this.container.querySelector('.fading-images__item[data-slide-index="' + target_title + '"]');
          var newText1 = slide.getAttribute('data-slide-title1');
          var newText2 = slide.getAttribute('data-slide-title2');
  
          this.container.querySelector('.fading-images-overlay__title--1').textContent = newText1;
          var textTwoContainer = this.container.querySelector('.fading-images-overlay__title--2');
          if (textTwoContainer) {
            textTwoContainer.textContent = newText2;
          }
  
          this.allTitles.forEach(title => {
            title.classList.remove(classes.finishedTitles);
            title.classList.add(classes.activeTitles);
          });
  
        }.bind(this), this.data.finish_interval - 200);
      },
  
      startImages: function() {
        // Prep and show first image
        var firstImage = this.container.querySelector('.fading-images__item[data-slide-index="' + this.data.active_image + '"]');
        firstImage.classList.add(classes.activeImage);
        firstImage.classList.add(classes.compensation);
  
        // Begin timer
        window.setTimeout(function() {
          this.imageInterval = setInterval(this.nextImage.bind(this), this.data.interval);
        }.bind(this), this.data.timer_offset);
      },
  
      startTitles: function() {
        // Prep and show first titles
        var target_title = this.data.active_title;
  
        window.setTimeout(function() {
          var slide = this.container.querySelector('.fading-images__item[data-slide-index="' + target_title + '"]');
          var newText1 = slide.getAttribute('data-slide-title1');
          var newText2 = slide.getAttribute('data-slide-title2');
  
          this.container.querySelector('.fading-images-overlay__title--1').textContent = newText1;
          var textTwoContainer = this.container.querySelector('.fading-images-overlay__title--2');
          if (textTwoContainer) {
            textTwoContainer.textContent = newText2;
          }
  
          this.allTitles.forEach(title => {
            title.classList.add(classes.activeTitles);
          });
        }.bind(this), 750);
  
        // Begin timer
        this.titleInterval = setInterval(this.nextTitle.bind(this), this.data.interval);
      }
    });
  
    return FadingImages;
  })();
  
  theme.FooterSection = (function() {
    var selectors = {
      locale: 'FooterLocale',
      currency: 'FooterCurrency'
    };
  
    function FooterSection(container) {
      this.container = container;
  
      this.container = container;
      this.localeDisclosure = null;
      this.currencyDisclosure = null;
  
      this.init();
    }
  
    FooterSection.prototype = Object.assign({}, FooterSection.prototype, {
      init: function() {
        var localeEl = document.getElementById(selectors.locale);
        var currencyEl = document.getElementById(selectors.currency);
  
        if (localeEl) {
          this.localeDisclosure = new theme.Disclosure(localeEl);
        }
  
        if (currencyEl) {
          this.currencyDisclosure = new theme.Disclosure(currencyEl);
        }
  
        // Re-hook up collapsible box triggers
        theme.collapsibles.init(this.container);
      },
  
      onUnload: function() {
        if (this.localeDisclosure) {
          this.localeDisclosure.destroy();
        }
  
        if (this.currencyDisclosure) {
          this.currencyDisclosure.destroy();
        }
      }
    });
  
    return FooterSection;
  })();
  
  theme.HeaderSection = (function() {
    function HeaderSection(container) {
      this.container = container;
      this.sectionId = this.container.getAttribute('data-section-id');
  
      this.init();
    }
  
    HeaderSection.prototype = Object.assign({}, HeaderSection.prototype, {
      init: function() {
        // Reload any slideshow if header is reloaded to make sure
        // sticky header works as expected
        // (can be anywhere in sections.instance array)
        if (Shopify && Shopify.designMode) {
          for (var i = 0; i < theme.sections.instances.length; i++) {
            var instance = theme.sections.instances[i];
            if (instance['type'] === 'slideshow-section') {
              instance.forceReload();
            }
          }
        }
  
        theme.headerNav.init();
        theme.announcementBar.init();
        this.initDrawers();
      },
  
      initDrawers: function() {
        theme.NavDrawer = new theme.Drawers('NavDrawer', 'nav');
        if (theme.settings.cartType === 'drawer') {
          if (!document.body.classList.contains('template-cart')) {
            new theme.CartDrawer();
          }
        }
  
        theme.collapsibles.init(document.getElementById('NavDrawer'));
      },
  
      onUnload: function() {
        theme.NavDrawer.close();
        theme.announcementBar.unload();
      }
    });
  
    return HeaderSection;
  })();
  
  theme.Product = (function() {
    var videoObjects = {};
  
    var classes = {
      onSale: 'sale-price',
      disabled: 'disabled',
      isModal: 'is-modal',
      loading: 'loading',
      loaded: 'loaded',
      hidden: 'hide',
      interactable: 'video-interactable',
      visuallyHide: 'visually-invisible'
    };
  
    var selectors = {
      productVideo: '.product__video',
      videoParent: '.product__video-wrapper',
      slide: '.product-main-slide',
      currentSlide: '.is-selected',
      startingSlide: '.starting-slide'
    };
  
    function Product(container) {
      this.container = container;
      var sectionId = this.sectionId = container.getAttribute('data-section-id');
  
      this.inModal = (container.dataset.modal === 'true');
      this.modal;
  
      this.settings = {
        enableHistoryState: container.dataset.history || false,
        namespace: '.product-' + sectionId,
        inventory: container.dataset.inventory || false,
        incomingInventory: container.dataset.incomingInventory || false,
        modalInit: false,
        hasImages: true,
        imageSetName: null,
        imageSetIndex: null,
        currentImageSet: null,
        imageSize: '620x',
        currentSlideIndex: 0,
        videoLooping: container.dataset.videoLooping
      };
  
      // Overwrite some settings when loaded in modal
      if (this.inModal) {
        this.settings.enableHistoryState = false;
        this.settings.namespace = '.product-' + sectionId + '-modal';
        this.modal = document.getElementById('QuickShopModal-' + sectionId);
      }
  
      this.selectors = {
        variantsJson: 'VariantsJson-' + sectionId,
        currentVariantJson: 'CurrentVariantJson-' + sectionId,
        form: '#AddToCartForm-' + sectionId,
  
        media: '[data-product-media-type-model]',
        closeMedia: '.product-single__close-media',
        photoThumbs: '.product__thumb-' + sectionId,
        thumbSlider: '#ProductThumbs-' + sectionId,
        thumbScroller: '.product__thumbs--scroller',
        mainSlider: '#ProductPhotos-' + sectionId,
        imageContainer: '[data-product-images]',
        productImageMain: '.product-image-main--' + sectionId,
  
        priceWrapper: '.product__price-wrap-' + sectionId,
        price: '#ProductPrice-' + sectionId,
        comparePrice: '#ComparePrice-' + sectionId,
        priceA11y: '#PriceA11y-' + sectionId,
        comparePriceA11y: '#ComparePriceA11y-' + sectionId,
        unitWrapper: '.product__unit-price-wrapper--' + sectionId,
        unitPrice: '.product__unit-price--' + sectionId,
        unitPriceBaseUnit: '.product__unit-base--' + sectionId,
        sku: 'Sku-' + sectionId,
        inventory: 'ProductInventory-' + sectionId,
        incomingInventory: 'ProductIncomingInventory-' + sectionId,
  
        addToCart: 'AddToCart-' + sectionId,
        addToCartText: 'AddToCartText-' + sectionId,
  
        originalSelectorId: '#ProductSelect-' + sectionId,
        singleOptionSelector: '.variant__input-' + sectionId,
        variantColorSwatch: '.variant__input--color-swatch-' + sectionId,
  
        modalFormHolder: '#ProductFormHolder-' + sectionId,
        availabilityContainer: '#StoreAvailabilityHolder-' + sectionId
      };
  
      this.cache = {
        form: container.querySelector(this.selectors.form),
        mainSlider: container.querySelector(this.selectors.mainSlider),
        thumbSlider: container.querySelector(this.selectors.thumbSlider),
        thumbScroller: container.querySelector(this.selectors.thumbScroller),
        productImageMain: container.querySelector(this.selectors.productImageMain),
  
        // Price-related
        priceWrapper: container.querySelector(this.selectors.priceWrapper),
        comparePriceA11y: container.querySelector(this.selectors.comparePriceA11y),
        comparePrice: container.querySelector(this.selectors.comparePrice),
        price: container.querySelector(this.selectors.price),
        priceA11y: container.querySelector(this.selectors.priceA11y)
      };
  
      this.firstProductImage = this.cache.mainSlider.querySelector('img');
  
      if (!this.firstProductImage) {
        this.settings.hasImages = false;
      }
  
      var dataSetEl = this.cache.mainSlider.querySelector('[data-set-name]');
      if (dataSetEl) {
        this.settings.imageSetName = dataSetEl.dataset.setName;
      }
  
      this.init();
    }
  
    Product.prototype = Object.assign({}, Product.prototype, {
      init: function() {
        if (this.inModal) {
          this.container.classList.add(classes.isModal);
          document.addEventListener('modalOpen.QuickShopModal-' + this.sectionId, this.openModalProduct.bind(this));
          document.addEventListener('modalClose.QuickShopModal-' + this.sectionId, this.closeModalProduct.bind(this));
        }
  
        if (!this.inModal) {
          this.formSetup();
          this.productSetup();
          this.videoSetup();
          this.initProductSlider();
          this.customMediaListners();
        }
      },
  
      onUnload: function() {
        theme.ProductMedia.removeSectionModels(this.sectionId);
  
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
      },
  
      formSetup: function() {
        this.initQtySelector();
        this.initAjaxProductForm();
        this.availabilitySetup();
        this.initVariants();
      },
  
      availabilitySetup: function() {
        var container = this.container.querySelector(this.selectors.availabilityContainer);
        if (container) {
          this.storeAvailability = new theme.StoreAvailability(container);
        }
      },
  
      productSetup: function() {
        this.setImageSizes();
        this.initImageZoom();
        this.initModelViewerLibraries();
        this.initShopifyXrLaunch();
        theme.collapsibles.init(this.container);
      },
  
      setImageSizes: function() {
        if (!this.settings.hasImages) {
          return;
        }
  
        // Get srcset image src, works on most modern browsers
        // otherwise defaults to settings.imageSize
        var currentImage = this.firstProductImage.currentSrc;
  
        if (currentImage) {
          this.settings.imageSize = theme.Images.imageSize(currentImage);
        }
      },
  
      initVariants: function() {
        var variantJson = document.getElementById(this.selectors.variantsJson);
  
        if (!variantJson) {
          return;
        }
  
        this.variantsObject = JSON.parse(variantJson.innerHTML);
  
        var options = {
          container: this.container,
          enableHistoryState: this.settings.enableHistoryState,
          singleOptionSelector: this.selectors.singleOptionSelector,
          originalSelectorId: this.selectors.originalSelectorId,
          variants: this.variantsObject
        };
  
        this.variants = new theme.Variants(options);
  
        this.container.querySelectorAll(this.selectors.variantColorSwatch).forEach(swatch => {
          swatch.addEventListener('change', function(evt) {
            var el = evt.currentTarget;
            var color = el.dataset.colorName;
            var index = el.dataset.colorIndex;
            this.updateColorName(color, index);
          }.bind(this));
        });
  
        // Product availability on page load
        if (this.storeAvailability) {
          var variant_id = this.variants.currentVariant ? this.variants.currentVariant.id : this.variants.variants[0].id;
  
          this.storeAvailability.updateContent(variant_id);
          this.container.on('variantChange' + this.settings.namespace, this.updateAvailability.bind(this));
        }
  
        this.container.on('variantChange' + this.settings.namespace, this.updateCartButton.bind(this));
        this.container.on('variantImageChange' + this.settings.namespace, this.updateVariantImage.bind(this));
        this.container.on('variantPriceChange' + this.settings.namespace, this.updatePrice.bind(this));
        this.container.on('variantUnitPriceChange' + this.settings.namespace, this.updateUnitPrice.bind(this));
  
        if (document.getElementById(this.selectors.sku)) {
          this.container.on('variantSKUChange' + this.settings.namespace, this.updateSku.bind(this));
        }
  
        if (this.settings.inventory || this.settings.incomingInventory) {
          this.container.on('variantChange' + this.settings.namespace, this.updateInventory.bind(this));
        }
  
        // Update individual variant availability on each selection
        if (theme.settings.dynamicVariantsEnable) {
          var currentVariantJson = document.getElementById(this.selectors.currentVariantJson);
  
          if (currentVariantJson) {
            new theme.VariantAvailability({
              type: theme.settings.dynamicVariantType,
              variantSelectors: this.cache.form.querySelectorAll(this.selectors.singleOptionSelector),
              variantsObject: this.variantsObject,
              currentVariantObject: JSON.parse(currentVariantJson.innerHTML),
              form: this.cache.form
            });
          }
        }
  
        // image set names variant change listeners
        if (this.settings.imageSetName) {
          this.settings.imageSetIndex = this.cache.form.querySelector('.variant-input-wrap[data-handle="'+this.settings.imageSetName+'"]').dataset.index;
          this.container.on('variantChange' + this.settings.namespace, this.updateImageSet.bind(this))
        }
      },
  
      /*============================================================================
        Variant change methods
      ==============================================================================*/
      updateColorName: function(color, index) {
        // Updates on radio button change, not variant.js
        this.container.querySelector('#VariantColorLabel-' + this.sectionId + '-' + index).textContent = color;
      },
  
      initQtySelector: function() {
        this.container.querySelectorAll('.js-qty__wrapper').forEach(el => {
          new theme.QtySelector(el, {
            namespace: '.product'
          });
        });
      },
  
      initAjaxProductForm: function() {
        if (theme.settings.cartType === 'drawer') {
          new theme.AjaxProduct(this.cache.form);
        }
      },
  
      updateCartButton: function(evt) {
        var variant = evt.detail.variant;
        var cartBtn = document.getElementById(this.selectors.addToCart);
        var cartBtnText = document.getElementById(this.selectors.addToCartText);
  
        if (variant) {
          if (variant.available) {
            // Available, enable the submit button and change text
            cartBtn.classList.remove(classes.disabled);
            cartBtn.disabled = false;
            var defaultText = cartBtnText.dataset.defaultText;
            cartBtnText.textContent = defaultText;
          } else {
            // Sold out, disable the submit button and change text
            cartBtn.classList.add(classes.disabled);
            cartBtn.disabled = true;
            cartBtnText.textContent = theme.strings.soldOut;
          }
        } else {
          // The variant doesn't exist, disable submit button
          cartBtn.classList.add(classes.disabled);
          cartBtn.disabled = true;
          cartBtnText.textContent = theme.strings.unavailable;
        }
      },
  
      updatePrice: function(evt) {
        var variant = evt.detail.variant;
  
        if (variant) {
          // Regular price
          this.cache.price.innerHTML = theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat);
  
          // Sale price, if necessary
          if (variant.compare_at_price > variant.price) {
            this.cache.comparePrice.innerHTML = theme.Currency.formatMoney(variant.compare_at_price, theme.settings.moneyFormat);
            this.cache.priceWrapper.classList.remove(classes.hidden);
            this.cache.price.classList.add(classes.onSale);
            this.cache.comparePriceA11y.setAttribute('aria-hidden', 'false');
            this.cache.priceA11y.setAttribute('aria-hidden', 'false');
          } else {
            if (this.cache.priceWrapper) {
              this.cache.priceWrapper.classList.add(classes.hidden);
            }
            this.cache.price.classList.remove(classes.onSale);
            if (this.cache.comparePriceA11y) {
              this.cache.comparePriceA11y.setAttribute('aria-hidden', 'true');
            }
            this.cache.priceA11y.setAttribute('aria-hidden', 'true');
          }
        }
      },
  
      updateUnitPrice: function(evt) {
        var variant = evt.detail.variant;
  
        if (variant && variant.unit_price) {
          this.container.querySelector(this.selectors.unitPrice).innerHTML = theme.Currency.formatMoney(variant.unit_price, theme.settings.moneyFormat);
          this.container.querySelector(this.selectors.unitPriceBaseUnit).innerHTML = theme.Currency.getBaseUnit(variant);
          this.container.querySelector(this.selectors.unitWrapper).classList.remove(classes.visuallyHide);
        } else {
          this.container.querySelector(this.selectors.unitWrapper).classList.add(classes.visuallyHide);
        }
      },
  
      imageSetArguments: function(variant) {
        var variant = variant ? variant : (this.variants ? this.variants.currentVariant : null);
        if (!variant) return;
  
        var setValue = this.settings.currentImageSet = this.getImageSetName(variant[this.settings.imageSetIndex]);
        var set = this.settings.imageSetName + '_' + setValue;
  
        // Always start on index 0
        this.settings.currentSlideIndex = 0;
  
        // Return object that adds cellSelector to mainSliderArgs
        return {
          cellSelector: '[data-group="'+set+'"]',
          imageSet: set,
          initialIndex: this.settings.currentSlideIndex
        }
      },
  
      updateImageSet: function(evt) {
        // If called directly, use current variant
        var variant = evt ? evt.detail.variant : (this.variants ? this.variants.currentVariant : null);
        if (!variant) {
          return;
        }
  
        var setValue = this.getImageSetName(variant[this.settings.imageSetIndex]);
  
        // Already on the current image group
        if (this.settings.currentImageSet === setValue) {
          return;
        }
  
        this.initProductSlider(variant);
      },
  
      // Show/hide thumbnails based on current image set
      updateImageSetThumbs: function(set) {
        this.cache.thumbSlider.querySelectorAll('.product__thumb-item').forEach(thumb => {
          thumb.classList.toggle(classes.hidden, thumb.dataset.group !== set);
        });
      },
  
      getImageSetName: function(string) {
        return string.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
      },
  
      updateSku: function(evt) {
        var variant = evt.detail.variant;
        var newSku = '';
  
        if (variant) {
          if (variant.sku) {
            newSku = variant.sku;
          }
  
          document.getElementById(this.selectors.sku).textContent = newSku;
        }
      },
  
      updateInventory: function(evt) {
        var variant = evt.detail.variant;
  
        // Hide stock if no inventory management or policy is continue
        if (!variant || !variant.inventory_management || variant.inventory_policy === 'continue') {
          this.toggleInventoryQuantity(false);
          this.toggleIncomingInventory(false);
          return;
        }
  
        if (variant.inventory_management === 'shopify' && window.inventories && window.inventories[this.sectionId]) {
          var variantInventoryObject = window.inventories[this.sectionId][variant.id];
          var quantity = variantInventoryObject.quantity;
          var showInventory = true;
          var showIncomingInventory = false;
  
          if (quantity <= 0 || quantity > theme.settings.inventoryThreshold) {
            showInventory = false;
          }
  
          this.toggleInventoryQuantity(showInventory, quantity);
  
          // Only show incoming inventory when:
          // - inventory notice itself is hidden
          // - have incoming inventory
          // - current quantity is below theme setting threshold
          if (!showInventory && variantInventoryObject.incoming === 'true' && quantity <= theme.settings.inventoryThreshold) {
            showIncomingInventory = true;
          }
  
          this.toggleIncomingInventory(showIncomingInventory, variant.available, variantInventoryObject.next_incoming_date);
        }
      },
  
      updateAvailability: function(evt) {
        var variant = evt.detail.variant;
        if (!variant) {
          return;
        }
  
        this.storeAvailability.updateContent(variant.id);
      },
  
      toggleInventoryQuantity: function(show, qty) {
        if (!this.settings.inventory) {
          show = false;
        }
  
        var el = document.getElementById(this.selectors.inventory);
  
        if (show) {
          el.classList.remove(classes.hidden);
          el.textContent = theme.strings.stockLabel.replace('[count]', qty);
        } else {
          el.classList.add(classes.hidden);
        }
      },
  
      toggleIncomingInventory: function(show, available, date) {
        if (!this.settings.incomingInventory) {
          show = false;
        }
  
        var el = document.getElementById(this.selectors.incomingInventory);
  
        if (!el) {
          return;
        }
  
        if (show) {
          var string = available ?
                       theme.strings.willNotShipUntil.replace('[date]', date) :
                       theme.strings.willBeInStockAfter.replace('[date]', date);
  
          if (!date) {
            string = theme.strings.waitingForStock;
          }
  
          el.classList.remove(classes.hidden);
          el.textContent = string;
        } else {
          el.classList.add(classes.hidden);
        }
      },
  
      /*============================================================================
        Product videos
      ==============================================================================*/
      videoSetup: function() {
        var productVideos = this.cache.mainSlider.querySelectorAll(selectors.productVideo);
  
        if (!productVideos.length) {
          return false;
        }
  
        productVideos.forEach(vid => {
          var type = vid.dataset.videoType;
          if (type === 'youtube') {
            this.initYoutubeVideo(vid);
          } else if (type === 'mp4') {
            this.initMp4Video(vid);
          }
        });
      },
  
      initYoutubeVideo: function(div) {
        videoObjects[div.id] = new theme.YouTube(
          div.id,
          {
            videoId: div.dataset.youtubeId,
            videoParent: selectors.videoParent,
            autoplay: false, // will handle this in callback
            style: div.dataset.videoStyle,
            loop: div.dataset.videoLoop,
            events: {
              onReady: this.youtubePlayerReady.bind(this),
              onStateChange: this.youtubePlayerStateChange.bind(this)
            }
          }
        );
      },
  
      // Comes from YouTube SDK
      // Get iframe ID with evt.target.getIframe().id
      // Then access product video players with videoObjects[id]
      youtubePlayerReady: function(evt) {
        var iframeId = evt.target.getIframe().id;
  
        if (!videoObjects[iframeId]) {
          // No youtube player data
          return;
        }
  
        var obj = videoObjects[iframeId];
        var player = obj.videoPlayer;
  
        if (obj.options.style !== 'sound') {
          player.mute();
        }
  
        obj.parent.classList.remove('loading');
        obj.parent.classList.add('loaded');
  
        // If we have an element, it is in the visible/first slide,
        // and is muted, play it
        if (this._isFirstSlide(iframeId) && obj.options.style !== 'sound') {
          player.playVideo();
        }
      },
  
      _isFirstSlide: function(id) {
        return this.cache.mainSlider.querySelector(selectors.startingSlide + ' ' + '#' + id);
      },
  
      youtubePlayerStateChange: function(evt) {
        var iframeId = evt.target.getIframe().id;
        var obj = videoObjects[iframeId];
  
        switch (evt.data) {
          case -1: // unstarted
            // Handle low power state on iOS by checking if
            // video is reset to unplayed after attempting to buffer
            if (obj.attemptedToPlay) {
              obj.parent.classList.add('video-interactable');
            }
            break;
          case 0: // ended
            if (obj && obj.options.loop === 'true') {
              obj.videoPlayer.playVideo();
            }
            break;
          case 3: // buffering
            obj.attemptedToPlay = true;
            break;
        }
      },
  
      initMp4Video: function(div) {
        videoObjects[div.id] = {
          id: div.id,
          type: 'mp4'
        };
  
        if (this._isFirstSlide(div.id)) {
          this.playMp4Video(div.id);
        }
      },
  
      stopVideos: function() {
        for (var [id, vid] of Object.entries(videoObjects)) {
          if (vid.videoPlayer) {
            if (typeof vid.videoPlayer.stopVideo === 'function') {
              vid.videoPlayer.stopVideo(); // YouTube player
            }
          } else if (vid.type === 'mp4') {
            this.stopMp4Video(vid.id); // MP4 player
          }
        }
      },
  
      _getVideoType: function(video) {
        return video.getAttribute('data-video-type');
      },
  
      _getVideoDivId: function(video) {
        return video.id;
      },
  
      playMp4Video: function(id) {
        var player = this.container.querySelector('#' + id);
        var playPromise = player.play();
  
        if (playPromise !== undefined) {
          playPromise.then(function() {
            // Playing as expected
          })
          .catch(function(error) {
            // Likely low power mode on iOS, show controls
            player.setAttribute('controls', '');
            player.closest(selectors.videoParent).setAttribute('data-video-style', 'unmuted');
          });
        }
      },
  
      stopMp4Video: function(id) {
        var player = this.container.querySelector('#' + id);
        if (player && typeof player.pause === 'function') {
          player.pause();
        }
      },
  
      /*============================================================================
        Product images
      ==============================================================================*/
      initImageZoom: function() {
        var container = this.container.querySelector(this.selectors.imageContainer);
        if (!container) {
          return;
        }
        var imageZoom = new theme.Photoswipe(container, this.sectionId);
        container.addEventListener('photoswipe:afterChange', function(evt) {
          if (this.flickity) {
            this.flickity.goToSlide(evt.detail.index);
          }
        }.bind(this));
      },
  
      getThumbIndex: function(target) {
        return target.dataset.index;
      },
  
      updateVariantImage: function(evt) {
        var variant = evt.detail.variant;
        var sizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_media.preview_image.src, this.settings.imageSize);
  
        var newImage = this.container.querySelector('.product__thumb[data-id="' + variant.featured_media.id + '"]');
        var imageIndex = this.getThumbIndex(newImage);
  
        // If there is no index, slider is not initalized
        if (typeof imageIndex === 'undefined') {
          return;
        }
  
        // Go to that variant image's slide
        if (this.flickity) {
          this.flickity.goToSlide(imageIndex);
        }
      },
  
      initProductSlider: function(variant) {
        // Stop if only a single image
        if (this.cache.mainSlider.querySelectorAll(selectors.slide).length <= 1) {
          return;
        }
  
        // Destroy slider in preparation of new initialization
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
  
        // If variant argument exists, slideshow is reinitializing because of the
        // image set feature enabled and switching to a new group.
        // currentSlideIndex
        if (!variant) {
          var activeSlide = this.cache.mainSlider.querySelector(selectors.startingSlide);
          this.settings.currentSlideIndex = this._slideIndex(activeSlide);
        }
  
        var mainSliderArgs = {
          adaptiveHeight: true,
          avoidReflow: true,
          initialIndex: this.settings.currentSlideIndex,
          childNav: this.cache.thumbSlider,
          childNavScroller: this.cache.thumbScroller,
          childVertical: this.cache.thumbSlider.dataset.position === 'beside',
          wrapAround: false,
          callbacks: {
            onChange: this.onSlideChange.bind(this)
          }
        };
  
        // Override default settings if image set feature enabled
        if (this.settings.imageSetName) {
          var imageSetArgs = this.imageSetArguments(variant);
          mainSliderArgs = Object.assign({}, mainSliderArgs, imageSetArgs);
          this.updateImageSetThumbs(mainSliderArgs.imageSet);
        }
  
        this.flickity = new theme.Slideshow(this.cache.mainSlider, mainSliderArgs);
      },
  
      onSlideChange: function(index) {
        if (!this.flickity) return;
  
        var allSlides = this.cache.mainSlider.querySelectorAll(selectors.slide);
        var prevSlide = allSlides[this.settings.currentSlideIndex];
        var nextSlide = allSlides[index];
  
        prevSlide.setAttribute('tabindex', '-1');
        nextSlide.setAttribute('tabindex', 0);
  
        // Pause any existing slide video/media
        this.stopMediaOnSlide(prevSlide);
  
        // Prep next slide video/media
        this.prepMediaOnSlide(nextSlide);
  
        // Update current slider index
        this.settings.currentSlideIndex = index;
      },
  
      stopMediaOnSlide(slide) {
        // Stop existing video
        var video = slide.querySelector(selectors.productVideo);
        if (video) {
          var videoType = this._getVideoType(video);
          var videoId = this._getVideoDivId(video);
          if (videoType === 'youtube') {
            if (videoObjects[videoId].videoPlayer) {
              videoObjects[videoId].videoPlayer.stopVideo();
              return;
            }
          } else if (videoType === 'mp4') {
            this.stopMp4Video(videoId);
            return;
          }
        }
  
        // Stop existing media
        var currentMedia = slide.querySelector(this.selectors.media);
        if (currentMedia) {
          currentMedia.dispatchEvent(
            new CustomEvent('mediaHidden', {
              bubbles: true,
              cancelable: true
            })
          );
        }
      },
  
      prepMediaOnSlide(slide) {
        var video = slide.querySelector(selectors.productVideo);
        if (video) {
          var videoType = this._getVideoType(video);
          var videoId = this._getVideoDivId(video);
          if (videoType === 'youtube') {
            if (videoObjects[videoId].videoPlayer && videoObjects[videoId].options.style !== 'sound') {
              videoObjects[videoId].videoPlayer.playVideo();
              return;
            }
          } else if (videoType === 'mp4') {
            this.playMp4Video(videoId);
          }
        }
  
        var nextMedia = slide.querySelector(this.selectors.media);
        if (nextMedia) {
          nextMedia.dispatchEvent(
            new CustomEvent('mediaVisible', {
              bubbles: true,
              cancelable: true
            })
          );
          slide.querySelector('.shopify-model-viewer-ui__button').setAttribute('tabindex', 0);
          slide.querySelector('.product-single__close-media').setAttribute('tabindex', 0);
        }
      },
  
      _slideIndex: function(el) {
        return el.getAttribute('data-index');
      },
  
      /*============================================================================
        Products when in quick view modal
      ==============================================================================*/
      openModalProduct: function() {
        var initialized = false;
  
        if (!this.settings.modalInit) {
          var formHolder = this.container.querySelector(this.selectors.modalFormHolder);
          var url = formHolder.dataset.url;
          var template = formHolder.dataset.template;
  
          // If no alt template, use stripped down ajax version
          if (template !== 'preorder') {
            url = url + '?view=ajax';
          }
  
          fetch(url).then(function(response) {
            return response.text();
          }).then(function(html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            this.cache.form = doc.querySelector('#AddToCartForm-' + this.sectionId);
  
            formHolder.innerHTML = '';
            formHolder.append(this.cache.form);
            formHolder.classList.add('product-form-holder--loaded');
  
            this.formSetup();
  
            if (Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
  
            document.dispatchEvent(new CustomEvent('quickview:loaded', {
              detail: {
                productId: this.sectionId
              }
            }));
          }.bind(this));
  
          this.productSetup();
          this.videoSetup();
  
          // Setup product inventory data
          this.updateModalProductInventory();
  
          // Enable product slider in quick view
          // 1. with image sets enabled, make sure we have this.variants before initializing
          // 2. initialize normally, form data not required
          if (this.settings.imageSetName) {
            if (this.variants) {
              this.initProductSlider();
            } else {
              document.addEventListener('quickview:loaded', function(evt) {
                if (evt.detail.productId === this.sectionId) {
                  this.initProductSlider();
                }
              }.bind(this));
            }
          } else {
            this.initProductSlider();
          }
          this.customMediaListners();
          this.settings.modalInit = true;
        } else {
          initialized = true;
        }
  
        AOS.refreshHard();
  
        document.dispatchEvent(new CustomEvent('quickview:open', {
          detail: {
            initialized: initialized,
            productId: this.sectionId
          }
        }));
      },
  
      // Recommended products load via JS and don't add variant inventory to the
      // global variable that we later check. This function scrapes a data div
      // to get that info and manually add the values.
      updateModalProductInventory: function() {
        window.inventories = window.inventories || {};
        this.container.querySelectorAll('.js-product-inventory-data').forEach(el => {
          var sectionId = el.dataset.sectionId;
          window.inventories[sectionId] = {};
  
          el.querySelectorAll('.js-variant-inventory-data').forEach(el => {
            window.inventories[sectionId][el.dataset.id] = {
              'quantity': el.dataset.quantity,
              'incoming': el.dataset.incoming,
              'next_incoming_date': el.dataset.date
            }
          });
        });
      },
  
      closeModalProduct: function() {
        this.stopVideos();
      },
  
      /*============================================================================
        Product media (3D)
      ==============================================================================*/
      initModelViewerLibraries: function() {
        var modelViewerElements = this.container.querySelectorAll(this.selectors.media);
        if (modelViewerElements.length < 1) return;
  
        theme.ProductMedia.init(modelViewerElements, this.sectionId);
      },
  
      initShopifyXrLaunch: function() {
        document.addEventListener(
          'shopify_xr_launch',
          function() {
            var currentMedia = this.container.querySelector(
              this.selectors.productMediaWrapper +
                ':not(.' +
                self.classes.hidden +
                ')'
            );
            currentMedia.dispatchEvent(
              new CustomEvent('xrLaunch', {
                bubbles: true,
                cancelable: true
              })
            );
          }.bind(this)
        );
      },
  
      customMediaListners: function() {
        document.querySelectorAll(this.selectors.closeMedia).forEach(el => {
          el.addEventListener('click', function() {
            var slide = this.cache.mainSlider.querySelector(selectors.currentSlide);
            var media = slide.querySelector(this.selectors.media);
            if (media) {
              media.dispatchEvent(
                new CustomEvent('mediaHidden', {
                  bubbles: true,
                  cancelable: true
                })
              );
            }
          }.bind(this))
        });
  
        var modelViewer = this.container.querySelector('model-viewer');
        if (modelViewer) {
          modelViewer.addEventListener('shopify_model_viewer_ui_toggle_play', function(evt) {
            this.mediaLoaded(evt);
          }.bind(this));
  
          modelViewer.addEventListener('shopify_model_viewer_ui_toggle_pause', function(evt) {
            this.mediaUnloaded(evt);
          }.bind(this));
        }
      },
  
      mediaLoaded: function(evt) {
        this.container.querySelectorAll(this.selectors.closeMedia).forEach(el => {
          el.classList.remove(classes.hidden);
        });
  
        if (this.flickity) {
          this.flickity.setDraggable(false);
        }
      },
  
      mediaUnloaded: function(evt) {
        this.container.querySelectorAll(this.selectors.closeMedia).forEach(el => {
          el.classList.add(classes.hidden);
        });
  
        if (this.flickity) {
          this.flickity.setDraggable(true);
        }
      }
    });
  
    return Product;
  })();
  
  theme.Testimonials = (function() {
    var defaults = {
      adaptiveHeight: true,
      avoidReflow: true,
      pageDots: true,
      prevNextButtons: false
    };
  
    function Testimonials(container) {
      this.container = container;
      var sectionId = container.getAttribute('data-section-id');
      this.slideshow = container.querySelector('#Testimonials-' + sectionId);
      this.namespace = '.testimonial-' + sectionId;
  
      if (!this.slideshow) { return }
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.init.bind(this),
        threshold: 600
      });
    }
  
    Testimonials.prototype = Object.assign({}, Testimonials.prototype, {
      init: function() {
        // Do not wrap when only a few blocks
        if (this.slideshow.dataset.count <= 3) {
          defaults.wrapAround = false;
        }
  
        this.flickity = new theme.Slideshow(this.slideshow, defaults);
  
        // Autoscroll to next slide on load to indicate more blocks
        if (this.slideshow.dataset.count > 3) {
          setTimeout(function() {
            this.flickity.goToSlide(1);
          }.bind(this), 1000);
        }
      },
  
      onUnload: function() {
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
      },
  
      onDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          this.flickity.play();
        }
      },
  
      onBlockSelect: function(evt) {
        var slide = this.slideshow.querySelector('.testimonials-slide--' + evt.detail.blockId)
        var index = parseInt(slide.dataset.index);
  
        if (this.flickity && typeof this.flickity.pause === 'function') {
          this.flickity.goToSlide(index);
          this.flickity.pause();
        }
      },
  
      onBlockDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          this.flickity.play();
        }
      }
    });
  
    return Testimonials;
  })();
  

  theme.isSessionStorageSupported = function() {
    // Return false if we are in an iframe without access to sessionStorage
    if (window.self !== window.top) {
      return false;
    }

    var testKey = 'test';
    var storage = window.sessionStorage;
    try {
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };

  theme.reinitProductGridItem = function(scope) {
    if (AOS) {AOS.refreshHard()}

    theme.initQuickShop();

    // Refresh reviews app
    if (window.SPR) {SPR.initDomEls();SPR.loadBadges()}

    // Re-hook up collapsible box triggers
    theme.collapsibles.init();
  };

  /*============================================================================
    Things that don't require DOM to be ready
  ==============================================================================*/
  theme.config.hasSessionStorage = theme.isSessionStorageSupported();
  AOS.init({
    easing: 'ease-out-quad',
    once: true,
    offset: 60,
    disableMutationObserver: true
  });

  // Trigger events when going between breakpoints
  theme.config.bpSmall = matchMedia(theme.config.mediaQuerySmall).matches;
  matchMedia(theme.config.mediaQuerySmall).addListener(function(mql) {
    if (mql.matches) {
      theme.config.bpSmall = true;
      document.dispatchEvent(new CustomEvent('matchSmall'));
    }
    else {
      theme.config.bpSmall = false;
      document.dispatchEvent(new CustomEvent('unmatchSmall'));
    }
  });

  /*============================================================================
    Things that require DOM to be ready
  ==============================================================================*/
  function DOMready(callback) {
    if (document.readyState != 'loading') callback();
    else document.addEventListener('DOMContentLoaded', callback);
  }

  // Load generic JS. Also reinitializes when sections are
  // added, edited, or removed in Shopify's editor
  theme.initGlobals = function() {
    theme.collapsibles.init();
    theme.videoModal();
  }

  DOMready(function(){
    theme.sections = new theme.Sections();

    theme.sections.register('header', theme.HeaderSection);
    theme.sections.register('footer', theme.FooterSection);
    theme.sections.register('product', theme.Product);
    theme.sections.register('slideshow-section', theme.SlideshowSection);
    theme.sections.register('password-header', theme.PasswordHeader);
    theme.sections.register('collection-switcher', theme.CollectionSwitcher);
    theme.sections.register('map', theme.Maps);
    theme.sections.register('blog', theme.Blog);
    theme.sections.register('newsletter-popup', theme.NewsletterPopup);
    theme.sections.register('product-recommendations', theme.Recommendations);
    theme.sections.register('video-section', theme.VideoSection);
    theme.sections.register('photoswipe', theme.Photoswipe);
    theme.sections.register('store-availability', theme.StoreAvailability);
    theme.sections.register('fading-images', theme.FadingImages);
    theme.sections.register('testimonials', theme.Testimonials);
    theme.sections.register('background-image', theme.BackgroundImage);
    theme.sections.register('collection-template', theme.Collection);

    theme.initGlobals();
    theme.initQuickShop();
    theme.rteInit();
    theme.articleImages();

    if (document.body.classList.contains('template-cart')) {
      var cartPageForm = document.getElementById('CartPageForm');
      if (cartPageForm) {
        new theme.CartForm(cartPageForm);
      }
    }

    if (theme.settings.predictiveSearch) {
      theme.predictiveSearch.init();
    }
    if (theme.settings.isCustomerTemplate) {
      theme.customerTemplates();
    }

    theme.pageTransitions();

    document.dispatchEvent(new CustomEvent('page:loaded'));
  });
})();
