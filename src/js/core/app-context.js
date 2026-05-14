const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');

    const els = {
      drawColor: document.getElementById('drawColor'),
      brushSize: document.getElementById('brushSize'),
      bgColor: document.getElementById('bgColor'),
      gridColor: document.getElementById('gridColor'),
      showGrid: document.getElementById('showGrid'),
      previewZoom: document.getElementById('previewZoom'),
      previewZoomValue: document.getElementById('previewZoomValue'),
      previewToggle: document.getElementById('previewToggle'),
      previewBody: document.getElementById('previewBody'),
      fitPreview: document.getElementById('fitPreview'),
      textValue: document.getElementById('textValue'),
      textX: document.getElementById('textX'),
      textY: document.getElementById('textY'),
      textScale: document.getElementById('textScale'),
      pixelDensity: document.getElementById('pixelDensity'),
      textAlign: document.getElementById('textAlign'),
      autoFitText: document.getElementById('autoFitText'),
      textPadding: document.getElementById('textPadding'),
      lineGap: document.getElementById('lineGap'),
      rainbowText: document.getElementById('rainbowText'),
      sample: document.getElementById('sample'),
      imageFile: document.getElementById('imageFile'),
      imageUrl: document.getElementById('imageUrl'),
      loadImageUrl: document.getElementById('loadImageUrl'),
      pasteImageClipboard: document.getElementById('pasteImageClipboard'),
      imagePixelSize: document.getElementById('imagePixelSize'),
      imagePixelSizeValue: document.getElementById('imagePixelSizeValue'),
      imageDetail: document.getElementById('imageDetail'),
      imageDetailValue: document.getElementById('imageDetailValue'),
      imageQuality: document.getElementById('imageQuality'),
      imageQualityValue: document.getElementById('imageQualityValue'),
      imagePalette: document.getElementById('imagePalette'),
      imageFitMode: document.getElementById('imageFitMode'),
      undo: document.getElementById('undo'),
      redo: document.getElementById('redo'),
      clear: document.getElementById('clear'),
      exportPng: document.getElementById('exportPng'),
      exportAlgodoo: document.getElementById('exportAlgodoo'),
      algodooPixelSize: document.getElementById('algodooPixelSize'),
      algodooGap: document.getElementById('algodooGap'),
      algodooOriginX: document.getElementById('algodooOriginX'),
      algodooOriginY: document.getElementById('algodooOriginY'),
      algodooObjectType: document.getElementById('algodooObjectType'),
      algodooMode: document.getElementById('algodooMode'),
      algodooMaterial: document.getElementById('algodooMaterial'),
      algodooDensity: document.getElementById('algodooDensity'),
      algodooFriction: document.getElementById('algodooFriction'),
      algodooRestitution: document.getElementById('algodooRestitution'),
      algodooAttraction: document.getElementById('algodooAttraction'),
      algodooAdhesion: document.getElementById('algodooAdhesion'),
      algodooLayer: document.getElementById('algodooLayer'),
      algodooZDepth: document.getElementById('algodooZDepth'),
      algodooEdgeBlur: document.getElementById('algodooEdgeBlur'),
      algodooFixed: document.getElementById('algodooFixed'),
      algodooCollide: document.getElementById('algodooCollide'),
      algodooDrawBorder: document.getElementById('algodooDrawBorder'),
      algodooKiller: document.getElementById('algodooKiller'),
      algodooImmortal: document.getElementById('algodooImmortal'),
      algodooRuler: document.getElementById('algodooRuler'),
      algodooShowForceArrows: document.getElementById('algodooShowForceArrows'),
      algodooShowMomentum: document.getElementById('algodooShowMomentum'),
      algodooShowVelocity: document.getElementById('algodooShowVelocity'),
      algodooCollideWater: document.getElementById('algodooCollideWater'),
      algodooExtraScript: document.getElementById('algodooExtraScript'),
      stats: document.getElementById('stats'),
      stageWrap: document.querySelector('.stage-wrap')
    };

    const state = {
      cols: 80,
      rows: 32,
      cell: 14,
      pixels: [],
      liveTextPixels: [],
      tool: 'draw',
      color: '#ff00ff',
      bg: '#000000',
      grid: '#484848',
      showGrid: true,
      brushSize: 1,
      viewZoom: 1,
      history: [],
      historyIndex: -1,
      historyLimit: 80,
      isDown: false,
      lastCellKey: '',
      textHistoryTimer: null,
      lastMousePoint: null,
      imageImportReady: false,
      imageImportUrl: '',
      waitingClipboardPaste: false,
      imageBaseCols: 80,
      imageBaseRows: 32
    };

    const RAINBOW = [
      '#ff0000', '#ff8c00', '#ffff00', '#00ff00',
      '#00d5ff', '#004cff', '#7a00ff', '#ff00ff'
    ];

    const TOOL_CURSOR_ICONS = {
      draw: 'fa-pencil',
      erase: 'fa-eraser',
      fill: 'fa-fill-drip',
      picker: 'fa-eye-dropper'
    };

    const BRUSH_MIN = 1;
    const BRUSH_MAX = 12;

    const importedImage = new Image();

    const ALGODOO_MATERIALS = {
      default: { name: '', density: 1.00, friction: 0.50, restitution: 0.00, attraction: 0.00, adhesion: 0.00 },
      glass:   { name: 'Glass', density: 2.50, friction: 0.10, restitution: 0.20, attraction: 0.00, adhesion: 0.00 },
      gold:    { name: 'Gold', density: 19.30, friction: 0.50, restitution: 0.00, attraction: 0.00, adhesion: 0.00 },
      helium:  { name: 'Helium', density: 0.05, friction: 0.10, restitution: 0.20, attraction: 0.00, adhesion: 0.00 },
      ice:     { name: 'Ice', density: 0.92, friction: 0.02, restitution: 0.00, attraction: 0.00, adhesion: 0.00 },
      rubber:  { name: 'Rubber', density: 1.20, friction: 1.00, restitution: 0.85, attraction: 0.00, adhesion: 0.00 },
      steel:   { name: 'Steel', density: 7.80, friction: 0.40, restitution: 0.10, attraction: 0.00, adhesion: 0.00 },
      stone:   { name: 'Stone', density: 2.50, friction: 0.70, restitution: 0.00, attraction: 0.00, adhesion: 0.00 },
      wood:    { name: 'Wood', density: 0.70, friction: 0.50, restitution: 0.20, attraction: 0.00, adhesion: 0.00 },
      custom:  { name: '', density: 1.00, friction: 0.50, restitution: 0.00, attraction: 0.00, adhesion: 0.00 }
    };

    const FONT_HEIGHT = 7;

    const glyphCache = new Map();

    const FONT = {
      'A': ['01110','10001','10001','11111','10001','10001','10001'],
      'B': ['11110','10001','10001','11110','10001','10001','11110'],
      'C': ['01111','10000','10000','10000','10000','10000','01111'],
      'D': ['11110','10001','10001','10001','10001','10001','11110'],
      'E': ['11111','10000','10000','11110','10000','10000','11111'],
      'F': ['11111','10000','10000','11110','10000','10000','10000'],
      'G': ['01111','10000','10000','10011','10001','10001','01110'],
      'H': ['10001','10001','10001','11111','10001','10001','10001'],
      'I': ['11111','00100','00100','00100','00100','00100','11111'],
      'J': ['00111','00010','00010','00010','10010','10010','01100'],
      'K': ['10001','10010','10100','11000','10100','10010','10001'],
      'L': ['10000','10000','10000','10000','10000','10000','11111'],
      'M': ['10001','11011','10101','10101','10001','10001','10001'],
      'N': ['10001','11001','10101','10011','10001','10001','10001'],
      'O': ['01110','10001','10001','10001','10001','10001','01110'],
      'P': ['11110','10001','10001','11110','10000','10000','10000'],
      'Q': ['01110','10001','10001','10001','10101','10010','01101'],
      'R': ['11110','10001','10001','11110','10100','10010','10001'],
      'S': ['01111','10000','10000','01110','00001','00001','11110'],
      'T': ['11111','00100','00100','00100','00100','00100','00100'],
      'U': ['10001','10001','10001','10001','10001','10001','01110'],
      'V': ['10001','10001','10001','10001','10001','01010','00100'],
      'W': ['10001','10001','10001','10101','10101','10101','01010'],
      'X': ['10001','01010','00100','00100','00100','01010','10001'],
      'Y': ['10001','01010','00100','00100','00100','00100','00100'],
      'Z': ['11111','00001','00010','00100','01000','10000','11111'],
      '0': ['01110','10001','10011','10101','11001','10001','01110'],
      '1': ['00100','01100','00100','00100','00100','00100','01110'],
      '2': ['01110','10001','00001','00010','00100','01000','11111'],
      '3': ['11110','00001','00001','01110','00001','00001','11110'],
      '4': ['00010','00110','01010','10010','11111','00010','00010'],
      '5': ['11111','10000','10000','11110','00001','00001','11110'],
      '6': ['01110','10000','10000','11110','10001','10001','01110'],
      '7': ['11111','00001','00010','00100','01000','01000','01000'],
      '8': ['01110','10001','10001','01110','10001','10001','01110'],
      '9': ['01110','10001','10001','01111','00001','00001','01110'],
      ' ': ['00000','00000','00000','00000','00000','00000','00000'],
      '!': ['00100','00100','00100','00100','00100','00000','00100'],
      '?': ['01110','10001','00001','00010','00100','00000','00100'],
      '.': ['00000','00000','00000','00000','00000','00000','00100'],
      ',': ['00000','00000','00000','00000','00000','00100','01000'],
      ':': ['00000','00100','00100','00000','00100','00100','00000'],
      '-': ['00000','00000','00000','11111','00000','00000','00000'],
      '+': ['00000','00100','00100','11111','00100','00100','00000'],
      '/': ['00001','00010','00100','01000','10000','00000','00000'],
      '&': ['01100','10010','10100','01000','10101','10010','01101'],
      '*': ['00000','10101','01110','11111','01110','10101','00000'],
      '?default': ['11111','00001','00010','00100','00100','00000','00100']
    };

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function indexOf(x, y) {
      return y * state.cols + x;
    }

    function inBounds(x, y) {
      return x >= 0 && x < state.cols && y >= 0 && y < state.rows;
    }

    function makeBlankPixels() {
      state.pixels = new Array(state.cols * state.rows).fill(null);
    }

    function makeBlankTextLayer() {
      state.liveTextPixels = new Array(state.cols * state.rows).fill(null);
    }

    function setPixel(x, y, color) {
      if (!inBounds(x, y)) return;
      state.pixels[indexOf(x, y)] = color;
    }

    function setLiveTextPixel(x, y, color) {
      if (!inBounds(x, y)) return;
      state.liveTextPixels[indexOf(x, y)] = color;
    }

    function getPixel(x, y) {
      if (!inBounds(x, y)) return null;
      return state.pixels[indexOf(x, y)];
    }

    function getLiveTextPixel(x, y) {
      if (!inBounds(x, y)) return null;
      return state.liveTextPixels[indexOf(x, y)];
    }

    function getVisiblePixel(x, y) {
      return getPixel(x, y) || getLiveTextPixel(x, y) || null;
    }

    function hasAnyPixel() {
      return state.pixels.some(Boolean) || state.liveTextPixels.some(Boolean);
    }

    function getNumberInput(el, fallback, min, max) {
      const parsed = parseInt(el.value, 10);
      const value = Number.isFinite(parsed) ? parsed : fallback;
      return clamp(value, min, max);
    }

    function getIntRaw(el, fallback = 0) {
      const parsed = parseInt(el.value, 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

