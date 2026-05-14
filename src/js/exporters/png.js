function renderExportPng(targetCtx) {
      targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

      const drawLayer = layer => {
        for (let y = 0; y < state.rows; y++) {
          for (let x = 0; x < state.cols; x++) {
            const color = layer[indexOf(x, y)];
            if (!color) continue;
            targetCtx.fillStyle = color;
            targetCtx.fillRect(x * state.cell, y * state.cell, state.cell, state.cell);
          }
        }
      };

      drawLayer(state.liveTextPixels);
      drawLayer(state.pixels);
    }

    function exportPng() {
      const output = document.createElement('canvas');
      output.width = state.cols * state.cell;
      output.height = state.rows * state.cell;

      const maxCanvasSide = 16384;
      if (output.width > maxCanvasSide || output.height > maxCanvasSide) {
        alert('Export is too large for the browser. Reduce Cell px, Columns, or Rows.');
        return;
      }

      const outputCtx = output.getContext('2d');
      renderExportPng(outputCtx);

      const a = document.createElement('a');
      a.href = output.toDataURL('image/png');
      a.download = 'pixel-art-algodoo.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

