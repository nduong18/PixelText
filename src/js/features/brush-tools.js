function initBrushSizeOptions() {
      if (!els.brushSize) return;
      const options = [];
      for (let size = BRUSH_MIN; size <= BRUSH_MAX; size++) {
        const selected = size === state.brushSize ? ' selected' : '';
        options.push('<option value="' + size + '"' + selected + '>' + size + 'x' + size + '</option>');
      }
      els.brushSize.innerHTML = options.join('');
      els.brushSize.value = String(state.brushSize);
    }

    function getBrushSize() {
      if (!els.brushSize) return BRUSH_MIN;
      const size = getNumberInput(els.brushSize, state.brushSize, BRUSH_MIN, BRUSH_MAX);
      state.brushSize = size;
      return size;
    }

    function getBrushOrigin(x, y, size) {
      const offset = Math.floor(size / 2);
      return { x: x - offset, y: y - offset };
    }

    function applyBrush(x, y, color) {
      const size = getBrushSize();
      const origin = getBrushOrigin(x, y, size);
      for (let by = 0; by < size; by++) {
        for (let bx = 0; bx < size; bx++) {
          const px = origin.x + bx;
          const py = origin.y + by;
          if (!inBounds(px, py)) continue;
          setPixel(px, py, color);
        }
      }
    }

