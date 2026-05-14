function clampColorChannel(value, levels) {
      const step = 255 / Math.max(1, levels - 1);
      return Math.round(Math.round(value / step) * step);
    }

    function reduceImagePalette(imageData, paletteMode) {
      if (paletteMode === 'full') return imageData;
      const data = imageData.data;
      const levels = paletteMode === '16' ? 4 : 2;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 24) continue;

        if (paletteMode === '4') {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const bucket = Math.round((gray / 255) * 3);
          const value = Math.round((bucket / 3) * 255);
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          continue;
        }

        data[i] = clampColorChannel(data[i], levels);
        data[i + 1] = clampColorChannel(data[i + 1], levels);
        data[i + 2] = clampColorChannel(data[i + 2], levels);
      }

      return imageData;
    }

    function toHexChannel(value) {
      return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
    }

    function rgbToHex(r, g, b) {
      return '#' + toHexChannel(r) + toHexChannel(g) + toHexChannel(b);
    }

    function drawImageFitted(targetCtx, sourceImage, destWidth, destHeight, fitMode = 'contain') {
      const srcWidth = sourceImage.naturalWidth || sourceImage.width || 1;
      const srcHeight = sourceImage.naturalHeight || sourceImage.height || 1;
      targetCtx.clearRect(0, 0, destWidth, destHeight);

      if (fitMode === 'stretch') {
        targetCtx.drawImage(sourceImage, 0, 0, destWidth, destHeight);
        return;
      }

      const scale = fitMode === 'cover'
        ? Math.max(destWidth / srcWidth, destHeight / srcHeight)
        : Math.min(destWidth / srcWidth, destHeight / srcHeight);

      const drawWidth = Math.max(1, Math.round(srcWidth * scale));
      const drawHeight = Math.max(1, Math.round(srcHeight * scale));
      const dx = Math.floor((destWidth - drawWidth) / 2);
      const dy = Math.floor((destHeight - drawHeight) / 2);
      targetCtx.drawImage(sourceImage, dx, dy, drawWidth, drawHeight);
    }

    function convertImageToPixelLayer(sourceImage) {
      const pixelSize = getNumberInput(els.imagePixelSize, 1, 1, 24);
      const detailFactor = getNumberInput(els.imageDetail, 100, 50, 300) / 100;
      const paletteMode = els.imagePalette.value;
      const fitMode = els.imageFitMode.value;

      const tiny = document.createElement('canvas');
      const baseTinyWidth = Math.max(1, Math.floor(state.cols / pixelSize));
      const baseTinyHeight = Math.max(1, Math.floor(state.rows / pixelSize));
      tiny.width = Math.max(1, Math.round(baseTinyWidth * detailFactor));
      tiny.height = Math.max(1, Math.round(baseTinyHeight * detailFactor));
      const tinyCtx = tiny.getContext('2d');
      tinyCtx.imageSmoothingEnabled = true;
      drawImageFitted(tinyCtx, sourceImage, tiny.width, tiny.height, fitMode);

      let tinyData = tinyCtx.getImageData(0, 0, tiny.width, tiny.height);
      tinyData = reduceImagePalette(tinyData, paletteMode);
      tinyCtx.putImageData(tinyData, 0, 0);

      const scaled = document.createElement('canvas');
      scaled.width = state.cols;
      scaled.height = state.rows;
      const scaledCtx = scaled.getContext('2d');
      scaledCtx.imageSmoothingEnabled = tiny.width > scaled.width || tiny.height > scaled.height;
      scaledCtx.clearRect(0, 0, scaled.width, scaled.height);
      scaledCtx.drawImage(tiny, 0, 0, tiny.width, tiny.height, 0, 0, scaled.width, scaled.height);

      const data = scaledCtx.getImageData(0, 0, scaled.width, scaled.height).data;
      const next = new Array(state.cols * state.rows).fill(null);

      for (let y = 0; y < state.rows; y++) {
        for (let x = 0; x < state.cols; x++) {
          const idx = indexOf(x, y);
          const px = idx * 4;
          const alpha = data[px + 3];
          if (alpha < 24) continue;
          next[idx] = rgbToHex(data[px], data[px + 1], data[px + 2]);
        }
      }

      return next;
    }

    function updateImagePixelSizeLabel() {
      if (!els.imagePixelSizeValue || !els.imagePixelSize) return;
      els.imagePixelSizeValue.textContent = String(getNumberInput(els.imagePixelSize, 1, 1, 24));
    }

    function updateImageDetailLabel() {
      if (!els.imageDetailValue || !els.imageDetail) return;
      els.imageDetailValue.textContent = String(getNumberInput(els.imageDetail, 100, 50, 300));
    }

    function updateImageQualityLabel() {
      if (!els.imageQualityValue || !els.imageQuality) return;
      els.imageQualityValue.textContent = String(getNumberInput(els.imageQuality, 100, 50, 300));
    }

    function applyImportedImageToPixels() {
      if (!state.imageImportReady) return;
      const qualityFactor = getNumberInput(els.imageQuality, 100, 50, 300) / 100;
      const baseCols = clamp(parseInt(state.imageBaseCols, 10) || state.cols, 1, 300);
      const baseRows = clamp(parseInt(state.imageBaseRows, 10) || state.rows, 1, 200);
      const targetCols = clamp(Math.round(baseCols * qualityFactor), 1, 300);
      const targetRows = clamp(Math.round(baseRows * qualityFactor), 1, 200);

      if (targetCols !== state.cols || targetRows !== state.rows) {
        resizeGrid(targetCols, targetRows, state.cell, false, false);
      }

      let nextPixels;
      try {
        nextPixels = convertImageToPixelLayer(importedImage);
      } catch (error) {
        state.imageImportReady = false;
        const isCorsError = error && (error.name === 'SecurityError' || String(error.message || '').toLowerCase().includes('tainted'));
        alert(isCorsError
          ? 'This image URL blocks pixel access (CORS). Try another URL, or download and import the file directly.'
          : 'Cannot convert this image.');
        return;
      }
      state.pixels = nextPixels;
      makeBlankTextLayer();
      els.textValue.value = '';
      render();
      pushHistory();
    }

    function clearObjectImageUrl() {
      if (state.imageImportUrl) {
        URL.revokeObjectURL(state.imageImportUrl);
        state.imageImportUrl = '';
      }
    }

    function loadImageIntoImporter(source, options = {}) {
      const revokeObjectUrlAfterLoad = !!options.revokeObjectUrlAfterLoad;
      state.imageImportReady = false;
      state.imageBaseCols = state.cols;
      state.imageBaseRows = state.rows;
      importedImage.crossOrigin = options.crossOrigin || '';

      importedImage.onload = () => {
        state.imageImportReady = true;
        applyImportedImageToPixels();
        if (revokeObjectUrlAfterLoad) {
          clearObjectImageUrl();
        }
      };
      importedImage.onerror = () => {
        state.imageImportReady = false;
        alert('Cannot load this image source.');
      };
      importedImage.src = source;
    }

    function onImageFileChange() {
      const file = els.imageFile.files && els.imageFile.files[0];
      state.imageImportReady = false;
      if (!file) return;

      loadImageFileIntoImporter(file);
    }

    function loadImageFileIntoImporter(file) {
      if (!file) return;
      clearObjectImageUrl();

      const url = URL.createObjectURL(file);
      state.imageImportUrl = url;
      loadImageIntoImporter(url, { revokeObjectUrlAfterLoad: true });
    }

    function onImageUrlLoad() {
      const raw = (els.imageUrl.value || '').trim();
      if (!raw) {
        alert('Please enter an image URL.');
        return;
      }

      let parsed;
      try {
        parsed = new URL(raw);
      } catch (_) {
        alert('Invalid URL. Please use a full http(s) image URL.');
        return;
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        alert('Only http(s) image URLs are supported.');
        return;
      }

      clearObjectImageUrl();
      loadImageIntoImporter(parsed.href, { crossOrigin: 'anonymous' });
    }

    async function pasteImageFromClipboard() {
      if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
        state.waitingClipboardPaste = true;
        alert('Direct clipboard read is not supported here. Press Ctrl+V to paste the image.');
        return;
      }

      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (!imageType) continue;
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.' + imageType.split('/')[1], { type: imageType });
          state.waitingClipboardPaste = false;
          loadImageFileIntoImporter(file);
          return;
        }
        alert('Clipboard does not contain an image.');
      } catch (_) {
        state.waitingClipboardPaste = true;
        alert('Browser blocked direct clipboard read. Press Ctrl+V to paste image, or allow Clipboard permission for this site.');
      }
    }

    function onDocumentPaste(event) {
      const items = Array.from((event.clipboardData && event.clipboardData.items) || []);
      const imageItem = items.find(item => item.type && item.type.startsWith('image/'));
      if (!imageItem) {
        if (state.waitingClipboardPaste) {
          alert('Clipboard does not contain an image.');
        }
        return;
      }

      const file = imageItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      state.waitingClipboardPaste = false;
      loadImageFileIntoImporter(file);
    }

