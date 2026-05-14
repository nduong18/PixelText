function splitTextLines(text) {
      return (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    }

    function glyphFor(char) {
      return FONT[char] || FONT['?default'];
    }

    function getPixelDensity() {
      return clamp(getNumberInput(els.pixelDensity, 100, 50, 300), 50, 300) / 100;
    }

    function buildDensityGlyph(baseGlyph, density) {
      const safeDensity = Math.max(0.5, Math.min(3, density || 1));
      const sourceH = baseGlyph.length;
      const sourceW = baseGlyph[0].length;
      const targetW = Math.max(1, Math.round(sourceW * safeDensity));
      const targetH = Math.max(1, Math.round(sourceH * safeDensity));
      const rows = [];

      for (let ty = 0; ty < targetH; ty++) {
        let row = '';
        for (let tx = 0; tx < targetW; tx++) {
          const sx = Math.min(sourceW - 1, Math.max(0, Math.floor((tx + 0.5) / safeDensity)));
          const sy = Math.min(sourceH - 1, Math.max(0, Math.floor((ty + 0.5) / safeDensity)));
          row += baseGlyph[sy][sx] === '1' ? '1' : '0';
        }
        rows.push(row);
      }
      return rows;
    }

    function glyphForDensity(char, density) {
      const base = glyphFor(char);
      const safeDensity = Math.max(0.5, Math.min(3, density || 1));
      const key = char + '|' + safeDensity.toFixed(2);
      if (glyphCache.has(key)) return glyphCache.get(key);
      const g = safeDensity === 1 ? base : buildDensityGlyph(base, safeDensity);
      glyphCache.set(key, g);
      return g;
    }

    function measureTextCells(text, scale, lineGapCells, density = 1) {
      const safeScale = clamp(parseInt(scale, 10) || 1, 1, 20);
      const safeDensity = Math.max(0.5, Math.min(3, density || 1));
      const normalized = (text || '').toUpperCase();
      const lines = splitTextLines(normalized);

      if (!normalized.length) {
        return { width: 0, height: 0, lineCount: 0, glyphHeight: 0 };
      }

      let maxWidth = 0;
      let maxGlyphHeight = 0;
      const gapUnits = Math.max(1, Math.round(safeDensity));
      for (const line of lines) {
        let width = 0;
        for (const char of line) {
          const glyph = glyphForDensity(char, safeDensity);
          maxGlyphHeight = Math.max(maxGlyphHeight, glyph.length);
          width += (glyph[0].length + gapUnits) * safeScale;
        }
        if (line.length > 0) width = Math.max(0, width - gapUnits * safeScale);
        maxWidth = Math.max(maxWidth, width);
      }

      const glyphHeight = Math.max(1, maxGlyphHeight || Math.round(FONT_HEIGHT * safeDensity));
      const height = (lines.length * glyphHeight * safeScale) + Math.max(0, lines.length - 1) * lineGapCells;
      return { width: maxWidth, height, lineCount: lines.length, glyphHeight };
    }
    function measureLineWidth(line, scale, density = 1) {
      const safeScale = clamp(parseInt(scale, 10) || 1, 1, 20);
      const safeDensity = Math.max(0.5, Math.min(3, density || 1));
      const gapUnits = Math.max(1, Math.round(safeDensity));
      let width = 0;
      for (const char of (line || '')) {
        const glyph = glyphForDensity(char, safeDensity);
        width += (glyph[0].length + gapUnits) * safeScale;
      }
      if ((line || '').length > 0) width = Math.max(0, width - gapUnits * safeScale);
      return width;
    }


    function getTextFitSize() {
      const text = els.textValue.value || '';
      if (!text.length) return null;

      const scale = getNumberInput(els.textScale, 1, 1, 12);
      const density = getPixelDensity();
      const padding = getNumberInput(els.textPadding, 1, 0, 100);
      const lineGapCells = getNumberInput(els.lineGap, 2, 0, 80);
      const measured = measureTextCells(text, scale, lineGapCells, density);
      const offsetX = Math.max(0, getIntRaw(els.textX, 0));
      const offsetY = Math.max(0, getIntRaw(els.textY, 0));
      const align = els.textAlign.value;
      const alignExtra = align === 'left' ? 0 : padding * 2;

      const cols = clamp(Math.ceil(measured.width + padding * 2 + alignExtra + offsetX), 1, 300);
      const rows = clamp(Math.ceil(measured.height + padding * 2 + offsetY), 1, 200);
      return { cols, rows, measured };
    }

    function computeTextStart(measured) {
      const padding = getNumberInput(els.textPadding, 1, 0, 100);
      const offsetX = getIntRaw(els.textX, 0);
      const offsetY = getIntRaw(els.textY, 0);
      const align = els.textAlign.value;

      let x = padding + offsetX;
      if (align === 'center') {
        x = Math.floor((state.cols - measured.width) / 2) + offsetX;
      } else if (align === 'right') {
        x = state.cols - padding - measured.width - offsetX;
      }
      x = clamp(x, 0, Math.max(0, state.cols - measured.width));

      let y = padding + offsetY;
      y = clamp(y, 0, Math.max(0, state.rows - measured.height));

      return { x, y };
    }

    function resizeGrid(newCols, newRows, newCell, preservePixels = true, rebuildText = true) {
      const oldPixels = state.pixels.slice();
      const oldCols = state.cols;
      const oldRows = state.rows;

      state.cols = clamp(parseInt(newCols, 10) || state.cols, 1, 300);
      state.rows = clamp(parseInt(newRows, 10) || state.rows, 1, 200);
      state.cell = clamp(parseInt(newCell, 10) || state.cell, 2, 60);

      const next = new Array(state.cols * state.rows).fill(null);
      if (preservePixels) {
        for (let y = 0; y < Math.min(oldRows, state.rows); y++) {
          for (let x = 0; x < Math.min(oldCols, state.cols); x++) {
            next[y * state.cols + x] = oldPixels[y * oldCols + x];
          }
        }
      }
      state.pixels = next;
      makeBlankTextLayer();

      resizeCanvas();
      if (rebuildText) rebuildLiveTextLayer();
      else render();
    }

    function createSnapshot() {
      return {
        cols: state.cols,
        rows: state.rows,
        cell: state.cell,
        pixels: state.pixels.slice(),
        bg: state.bg,
        grid: state.grid,
        showGrid: state.showGrid,
        algodooPixelSize: els.algodooPixelSize.value,
        algodooGap: els.algodooGap.value,
        algodooOriginX: els.algodooOriginX.value,
        algodooOriginY: els.algodooOriginY.value,
        algodooObjectType: els.algodooObjectType.value,
        algodooMode: els.algodooMode.value,
        algodooMaterial: els.algodooMaterial.value,
        algodooAdvanced: getAlgodooAdvancedState(),
        algodooFixed: els.algodooFixed.checked,
        algodooCollide: els.algodooCollide.checked,
        textValue: els.textValue.value,
        textX: els.textX.value,
        textY: els.textY.value,
        textScale: els.textScale.value,
        pixelDensity: els.pixelDensity.value,
        textAlign: els.textAlign.value,
        textPadding: els.textPadding.value,
        lineGap: els.lineGap.value,
        autoFitText: els.autoFitText.checked,
        rainbowText: els.rainbowText.checked,
        drawColor: els.drawColor.value
      };
    }

    function snapshotsEqual(a, b) {
      if (!a || !b) return false;
      const sameMeta =
        a.cols === b.cols &&
        a.rows === b.rows &&
        a.cell === b.cell &&
        a.bg === b.bg &&
        a.grid === b.grid &&
        a.showGrid === b.showGrid &&
        a.algodooPixelSize === b.algodooPixelSize &&
        a.algodooGap === b.algodooGap &&
        a.algodooOriginX === b.algodooOriginX &&
        a.algodooOriginY === b.algodooOriginY &&
        a.algodooObjectType === b.algodooObjectType &&
        a.algodooMode === b.algodooMode &&
        a.algodooMaterial === b.algodooMaterial &&
        JSON.stringify(a.algodooAdvanced || {}) === JSON.stringify(b.algodooAdvanced || {}) &&
        a.algodooFixed === b.algodooFixed &&
        a.algodooCollide === b.algodooCollide &&
        a.textValue === b.textValue &&
        a.textX === b.textX &&
        a.textY === b.textY &&
        a.textScale === b.textScale &&
        a.pixelDensity === b.pixelDensity &&
        a.textAlign === b.textAlign &&
        a.textPadding === b.textPadding &&
        a.lineGap === b.lineGap &&
        a.autoFitText === b.autoFitText &&
        a.rainbowText === b.rainbowText &&
        a.drawColor === b.drawColor &&
        a.pixels.length === b.pixels.length;

      if (!sameMeta) return false;
      for (let i = 0; i < a.pixels.length; i++) {
        if (a.pixels[i] !== b.pixels[i]) return false;
      }
      return true;
    }

    function updateHistoryButtons() {
      els.undo.disabled = state.historyIndex <= 0;
      els.redo.disabled = state.historyIndex >= state.history.length - 1;
    }

    function pushHistory() {
      const snap = createSnapshot();
      const current = state.history[state.historyIndex];
      if (snapshotsEqual(current, snap)) {
        updateHistoryButtons();
        return;
      }

      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(snap);

      if (state.history.length > state.historyLimit) {
        const overflow = state.history.length - state.historyLimit;
        state.history.splice(0, overflow);
      }

      state.historyIndex = state.history.length - 1;
      updateHistoryButtons();
    }

    function restoreSnapshot(snap) {
      if (!snap) return;
      state.cols = snap.cols;
      state.rows = snap.rows;
      state.cell = snap.cell;
      state.pixels = snap.pixels.slice();
      state.bg = snap.bg;
      state.grid = snap.grid;
      state.showGrid = snap.showGrid;
      state.color = snap.drawColor;

      els.bgColor.value = state.bg;
      els.gridColor.value = state.grid;
      els.showGrid.checked = state.showGrid;
      els.algodooPixelSize.value = snap.algodooPixelSize || '0.08';
      els.algodooGap.value = snap.algodooGap || '0.01';
      els.algodooOriginX.value = snap.algodooOriginX || '0';
      els.algodooOriginY.value = snap.algodooOriginY || '0';
      els.algodooObjectType.value = snap.algodooObjectType || 'box';
      els.algodooMode.value = snap.algodooMode || 'pixel';
      els.algodooMaterial.value = snap.algodooMaterial || 'default';
      restoreAlgodooAdvancedState(snap.algodooAdvanced || {});
      syncAlgodooObjectTypeUI();
      els.algodooFixed.checked = snap.algodooFixed ?? true;
      els.algodooCollide.checked = snap.algodooCollide ?? false;
      els.drawColor.value = state.color;
      els.textValue.value = snap.textValue;
      els.textX.value = snap.textX;
      els.textY.value = snap.textY;
      els.textScale.value = snap.textScale;
      els.pixelDensity.value = snap.pixelDensity || '100';
      els.textAlign.value = snap.textAlign;
      els.textPadding.value = snap.textPadding;
      els.lineGap.value = snap.lineGap;
      els.autoFitText.checked = snap.autoFitText;
      els.rainbowText.checked = snap.rainbowText;

      makeBlankTextLayer();
      resizeCanvas();
      rebuildLiveTextLayer();
      updateHistoryButtons();
    }

    function undo() {
      if (state.historyIndex <= 0) return;
      state.historyIndex -= 1;
      restoreSnapshot(state.history[state.historyIndex]);
    }

    function redo() {
      if (state.historyIndex >= state.history.length - 1) return;
      state.historyIndex += 1;
      restoreSnapshot(state.history[state.historyIndex]);
    }

    function scheduleTextHistory() {
      clearTimeout(state.textHistoryTimer);
      state.textHistoryTimer = setTimeout(() => pushHistory(), 250);
    }

    function applyPreviewZoom() {
      const percent = Math.round(state.viewZoom * 100);
      canvas.style.width = Math.max(1, Math.round(canvas.width * state.viewZoom)) + 'px';
      canvas.style.height = Math.max(1, Math.round(canvas.height * state.viewZoom)) + 'px';
      els.previewZoom.value = percent;
      els.previewZoomValue.textContent = percent + '%';
      const exportW = canvas.width;
      const exportH = canvas.height;
      els.stats.textContent = state.cols + ' x ' + state.rows + ' cells | editor ' + canvas.width + ' x ' + canvas.height + ' px | export ' + exportW + ' x ' + exportH + ' px | preview ' + percent + '%';
      refreshWorkspaceCursor();
    }

    function setPreviewZoom(percent) {
      const safePercent = clamp(parseInt(percent, 10) || 100, 10, 300);
      state.viewZoom = safePercent / 100;
      applyPreviewZoom();
    }

    function fitPreviewToWidth() {
      const availableWidth = Math.max(120, els.stageWrap.clientWidth - 36);
      const availableHeight = Math.max(120, els.stageWrap.clientHeight - 36);
      const fitByHeight = Math.floor((availableHeight / canvas.height) * 100);
      const fitByWidth = Math.floor((availableWidth / canvas.width) * 100);

      let percent = fitByHeight;
      if (canvas.width * (percent / 100) > availableWidth) {
        percent = fitByWidth;
      }

      setPreviewZoom(clamp(percent, 10, 300));
    }

    function setPreviewCollapsed(collapsed) {
      const section = document.querySelector('.workspace-preview');
      if (!section || !els.previewToggle) return;
      section.classList.toggle('collapsed', collapsed);
      els.previewToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    function resizeCanvas() {
      canvas.width = state.cols * state.cell;
      canvas.height = state.rows * state.cell;
      applyPreviewZoom();
    }

    function getEditorObjectShape(options = {}) {
      if (options.objectShape) return options.objectShape;
      return els.algodooObjectType && els.algodooObjectType.value === 'circle' ? 'circle' : 'box';
    }

    function drawPixelLayer(targetCtx, layer, pixelGap = 0, objectShape = 'box') {
      const safeGap = clamp(parseInt(pixelGap, 10) || 0, 0, Math.max(0, state.cell - 1));
      const insetA = Math.floor(safeGap / 2);
      const insetB = Math.ceil(safeGap / 2);
      const drawSize = Math.max(1, state.cell - insetA - insetB);
      const radius = drawSize / 2;

      for (let y = 0; y < state.rows; y++) {
        for (let x = 0; x < state.cols; x++) {
          const color = layer[indexOf(x, y)];
          if (!color) continue;
          targetCtx.fillStyle = color;
          const px = x * state.cell + insetA;
          const py = y * state.cell + insetA;
          if (objectShape === 'circle') {
            targetCtx.beginPath();
            targetCtx.arc(px + radius, py + radius, radius, 0, Math.PI * 2);
            targetCtx.fill();
          } else {
            targetCtx.fillRect(px, py, drawSize, drawSize);
          }
        }
      }
    }

    function render(targetCtx = ctx, options = {}) {
      const includeGrid = options.includeGrid ?? state.showGrid;
      const transparentBg = options.transparentBg ?? false;
      const pixelGap = options.pixelGap ?? 0;
      const objectShape = getEditorObjectShape(options);
      const c = targetCtx.canvas;
      targetCtx.clearRect(0, 0, c.width, c.height);

      if (!transparentBg) {
        targetCtx.fillStyle = state.bg;
        targetCtx.fillRect(0, 0, c.width, c.height);
      }

      drawPixelLayer(targetCtx, state.liveTextPixels, pixelGap, objectShape);
      drawPixelLayer(targetCtx, state.pixels, pixelGap, objectShape);

      if (includeGrid) drawGrid(targetCtx);
    }

    function drawGrid(targetCtx) {
      targetCtx.save();
      targetCtx.strokeStyle = state.grid;
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      for (let x = 0; x <= state.cols; x++) {
        const px = x * state.cell + 0.5;
        targetCtx.moveTo(px, 0);
        targetCtx.lineTo(px, state.rows * state.cell);
      }
      for (let y = 0; y <= state.rows; y++) {
        const py = y * state.cell + 0.5;
        targetCtx.moveTo(0, py);
        targetCtx.lineTo(state.cols * state.cell, py);
      }
      targetCtx.stroke();
      targetCtx.restore();
    }

    function cellFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((event.clientX - rect.left) * scaleX) / state.cell);
      const y = Math.floor(((event.clientY - rect.top) * scaleY) / state.cell);
      return { x, y };
    }

    function floodFill(startX, startY, replacement) {
      if (!inBounds(startX, startY)) return;
      const target = getVisiblePixel(startX, startY);
      if (target === replacement) return;

      const stack = [[startX, startY]];
      while (stack.length) {
        const [x, y] = stack.pop();
        if (!inBounds(x, y)) continue;
        if (getVisiblePixel(x, y) !== target) continue;
        setPixel(x, y, replacement);
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    function commitLiveTextToPixels(clearTextInput = true) {
      if (!state.liveTextPixels.some(Boolean)) return false;
      for (let i = 0; i < state.liveTextPixels.length; i++) {
        if (state.liveTextPixels[i]) state.pixels[i] = state.liveTextPixels[i];
      }
      makeBlankTextLayer();
      if (clearTextInput) els.textValue.value = '';
      return true;
    }

    function paintAt(x, y, firstClick = false) {
      if (!inBounds(x, y)) return;

      if (state.tool === 'draw') {
        applyBrush(x, y, state.color);
        render();
      }

      if (state.tool === 'erase') {
        if (firstClick) commitLiveTextToPixels(true);
        applyBrush(x, y, null);
        render();
      }

      if (state.tool === 'fill' && firstClick) {
        floodFill(x, y, state.color);
        render();
      }

      if (state.tool === 'picker' && firstClick) {
        const sampled = getVisiblePixel(x, y) || state.bg;
        state.color = sampled;
        els.drawColor.value = sampled;
        setTool('draw');
      }
    }

    function setTool(tool) {
      state.tool = tool;
      document.querySelectorAll('.tool').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
      });
      setWorkspaceCursorTool(tool);
    }

    function createWorkspaceCursor() {
      const cursor = document.createElement('div');
      cursor.className = 'workspace-cursor icon-mode';
      cursor.innerHTML = '<i class="fa-solid fa-pencil"></i>';
      document.body.appendChild(cursor);
      return cursor;
    }

    const workspaceCursor = createWorkspaceCursor();

    function setWorkspaceCursorTool(tool) {
      const icon = workspaceCursor.querySelector('i');
      const iconClass = TOOL_CURSOR_ICONS[tool] || TOOL_CURSOR_ICONS.draw;
      icon.className = 'fa-solid ' + iconClass;
      const isBrushTool = tool === 'draw' || tool === 'erase';
      workspaceCursor.classList.toggle('brush-mode', isBrushTool);
      workspaceCursor.classList.toggle('icon-mode', !isBrushTool);
      refreshWorkspaceCursor();
    }

    function getBrushCursorRect(cellX, cellY) {
      const size = getBrushSize();
      const origin = getBrushOrigin(cellX, cellY, size);
      const startX = Math.max(0, origin.x);
      const startY = Math.max(0, origin.y);
      const endX = Math.min(state.cols - 1, origin.x + size - 1);
      const endY = Math.min(state.rows - 1, origin.y + size - 1);
      if (startX > endX || startY > endY) return null;

      const zoomedCell = state.cell * state.viewZoom;
      const rect = canvas.getBoundingClientRect();
      return {
        left: rect.left + startX * zoomedCell,
        top: rect.top + startY * zoomedCell,
        width: (endX - startX + 1) * zoomedCell,
        height: (endY - startY + 1) * zoomedCell
      };
    }

    function refreshWorkspaceCursor() {
      if (!state.lastMousePoint) return;
      updateWorkspaceCursor(state.lastMousePoint);
    }

    function updateWorkspaceCursor(event) {
      if (!event || event.pointerType !== 'mouse') return;
      const x = event.clientX;
      const y = event.clientY;
      state.lastMousePoint = { clientX: x, clientY: y, pointerType: 'mouse' };
      const rect = els.stageWrap.getBoundingClientRect();
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (!inside) {
        hideWorkspaceCursor();
        return;
      }

      if (state.tool === 'draw' || state.tool === 'erase') {
        const cell = cellFromEvent(event);
        const brushRect = getBrushCursorRect(cell.x, cell.y);
        if (!brushRect) {
          hideWorkspaceCursor();
          return;
        }

        workspaceCursor.style.left = brushRect.left + 'px';
        workspaceCursor.style.top = brushRect.top + 'px';
        workspaceCursor.style.width = brushRect.width + 'px';
        workspaceCursor.style.height = brushRect.height + 'px';
      } else {
        workspaceCursor.style.left = x + 'px';
        workspaceCursor.style.top = y + 'px';
        workspaceCursor.style.width = '30px';
        workspaceCursor.style.height = '30px';
      }

      workspaceCursor.classList.add('active');
    }

    function hideWorkspaceCursor() {
      workspaceCursor.classList.remove('active');
    }

    function drawTextToLiveLayer(text, startX, startY, scale, color, rainbow, lineGapCells = 0, density = 1) {
      const safeScale = clamp(parseInt(scale, 10) || 1, 1, 20);
      const safeDensity = Math.max(0.5, Math.min(3, density || 1));
      const normalizedLines = splitTextLines((text || '').toUpperCase());
      const measuredBlock = measureTextCells(text, safeScale, lineGapCells, safeDensity);
      const blockWidth = measuredBlock.width;
      const glyphHeight = measuredBlock.glyphHeight || Math.round(FONT_HEIGHT * safeDensity);
      const align = els.textAlign.value;
      const gapUnits = Math.max(1, Math.round(safeDensity));

      normalizedLines.forEach((line, lineIndex) => {
        const lineWidth = measureLineWidth(line, safeScale, safeDensity);
        let cursor = 0;
        let lineStartX = startX;
        if (align === 'center') {
          lineStartX = startX + Math.floor((blockWidth - lineWidth) / 2);
        } else if (align === 'right') {
          lineStartX = startX + (blockWidth - lineWidth);
        }

        const lineY = startY + lineIndex * (glyphHeight * safeScale + lineGapCells);

        for (const char of line) {
          const glyph = glyphForDensity(char, safeDensity);
          const glyphWidth = glyph[0].length;

          for (let gy = 0; gy < glyph.length; gy++) {
            for (let gx = 0; gx < glyphWidth; gx++) {
              if (glyph[gy][gx] !== '1') continue;

              for (let sy = 0; sy < safeScale; sy++) {
                for (let sx = 0; sx < safeScale; sx++) {
                  const px = lineStartX + cursor + gx * safeScale + sx;
                  const py = lineY + gy * safeScale + sy;
                  const stripe = Math.floor(((gy * safeScale + sy) / Math.max(1, glyph.length * safeScale)) * RAINBOW.length);
                  setLiveTextPixel(px, py, rainbow ? RAINBOW[stripe] : color);
                }
              }
            }
          }
          cursor += (glyphWidth + gapUnits) * safeScale;
        }
      });
    }

    function rebuildLiveTextLayer() {
      makeBlankTextLayer();
      const text = els.textValue.value || '';
      if (!text.length) {
        render();
        return;
      }

      const scale = getNumberInput(els.textScale, 1, 1, 12);
      const density = getPixelDensity();
      const lineGapCells = getNumberInput(els.lineGap, 2, 0, 80);
      const measured = measureTextCells(text, scale, lineGapCells, density);
      const start = computeTextStart(measured);
      drawTextToLiveLayer(text, start.x, start.y, scale, state.color, els.rainbowText.checked, lineGapCells, density);
      render();
    }

    function updateLiveTextRealtime(recordHistory = true) {
      if (els.autoFitText.checked && (els.textValue.value || '').length) {
        const fit = getTextFitSize();
        if (fit) {
          if (fit.cols !== state.cols || fit.rows !== state.rows) {
            resizeGrid(fit.cols, fit.rows, state.cell, true, false);
          }
        }
      }
      rebuildLiveTextLayer();
      if (recordHistory) scheduleTextHistory();
    }

    function makeSample() {
      state.cell = 8;
      els.drawColor.value = '#ff00ff';
      state.brushSize = 1;
      if (els.brushSize) els.brushSize.value = '1';
      state.color = '#ff00ff';
      els.textScale.value = '2';
      els.pixelDensity.value = '100';
      els.textPadding.value = '1';
      els.lineGap.value = '2';
      els.textX.value = '0';
      els.textY.value = '0';
      els.textAlign.value = 'left';
      els.autoFitText.checked = true;
      els.rainbowText.checked = true;
      els.algodooObjectType.value = 'box';
      syncAlgodooObjectTypeUI();
      els.textValue.value = 'nduong18';
      makeBlankPixels();
      updateLiveTextRealtime(false);
      pushHistory();
    }

    function clearAll() {
      makeBlankPixels();
      els.textValue.value = '';
      makeBlankTextLayer();
      render();
      pushHistory();
    }

