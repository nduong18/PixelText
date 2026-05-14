function bindAppEvents() {
  document.querySelectorAll('.tool').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });

  els.drawColor.addEventListener('input', e => {
    state.color = e.target.value;
    rebuildLiveTextLayer();
    scheduleTextHistory();
  });

  if (els.brushSize) {
    els.brushSize.addEventListener('change', () => {
      getBrushSize();
      refreshWorkspaceCursor();
    });
  }

  els.bgColor.addEventListener('input', e => { state.bg = e.target.value; render(); });
  els.bgColor.addEventListener('change', pushHistory);
  els.gridColor.addEventListener('input', e => { state.grid = e.target.value; render(); });
  els.gridColor.addEventListener('change', pushHistory);
  els.showGrid.addEventListener('change', e => { state.showGrid = e.target.checked; render(); pushHistory(); });
  els.previewZoom.addEventListener('input', e => setPreviewZoom(e.target.value));
  els.fitPreview.addEventListener('click', fitPreviewToWidth);

  if (els.previewToggle) {
    els.previewToggle.addEventListener('click', () => {
      const section = document.querySelector('.workspace-preview');
      setPreviewCollapsed(!(section && section.classList.contains('collapsed')));
    });
  }

  [
    els.textValue,
    els.textScale,
    els.pixelDensity,
    els.textX,
    els.textY,
    els.textPadding,
    els.lineGap,
    els.textAlign
  ].forEach(el => el.addEventListener('input', () => updateLiveTextRealtime(true)));

  els.autoFitText.addEventListener('change', () => { updateLiveTextRealtime(true); });
  els.rainbowText.addEventListener('change', () => { rebuildLiveTextLayer(); pushHistory(); });
  els.sample.addEventListener('click', makeSample);

  els.imageFile.addEventListener('change', onImageFileChange);
  els.loadImageUrl.addEventListener('click', onImageUrlLoad);
  els.pasteImageClipboard.addEventListener('click', pasteImageFromClipboard);
  els.imageUrl.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onImageUrlLoad();
    }
  });

  els.imagePixelSize.addEventListener('input', updateImagePixelSizeLabel);
  els.imagePixelSize.addEventListener('change', () => {
    if (state.imageImportReady) applyImportedImageToPixels();
  });

  els.imageDetail.addEventListener('input', updateImageDetailLabel);
  els.imageDetail.addEventListener('change', () => {
    if (state.imageImportReady) applyImportedImageToPixels();
  });

  els.imageQuality.addEventListener('input', updateImageQualityLabel);
  els.imageQuality.addEventListener('change', () => {
    if (state.imageImportReady) applyImportedImageToPixels();
  });

  els.imagePalette.addEventListener('change', () => {
    if (state.imageImportReady) applyImportedImageToPixels();
  });

  els.imageFitMode.addEventListener('change', () => {
    if (state.imageImportReady) applyImportedImageToPixels();
  });

  els.undo.addEventListener('click', undo);
  els.redo.addEventListener('click', redo);
  els.clear.addEventListener('click', clearAll);
  els.exportPng.addEventListener('click', exportPng);
  els.exportAlgodoo.addEventListener('click', exportAlgodooPhn);
  els.algodooObjectType.addEventListener('change', () => { syncAlgodooObjectTypeUI(); render(); pushHistory(); });
  els.algodooMaterial.addEventListener('change', () => { applyAlgodooMaterialPreset(); pushHistory(); });

  [
    els.algodooDensity,
    els.algodooFriction,
    els.algodooRestitution,
    els.algodooAttraction,
    els.algodooAdhesion
  ].forEach(el => el.addEventListener('input', markAlgodooMaterialCustom));

  [
    els.algodooPixelSize,
    els.algodooGap,
    els.algodooOriginX,
    els.algodooOriginY,
    els.algodooMode,
    els.algodooFixed,
    els.algodooCollide,
    els.algodooDrawBorder,
    els.algodooKiller,
    els.algodooImmortal,
    els.algodooRuler,
    els.algodooShowForceArrows,
    els.algodooShowMomentum,
    els.algodooShowVelocity,
    els.algodooCollideWater,
    els.algodooDensity,
    els.algodooFriction,
    els.algodooRestitution,
    els.algodooAttraction,
    els.algodooAdhesion,
    els.algodooLayer,
    els.algodooZDepth,
    els.algodooEdgeBlur,
    els.algodooExtraScript
  ].forEach(el => el.addEventListener('change', pushHistory));

  document.querySelectorAll('[data-algodoo-field]').forEach(el => {
    el.addEventListener('change', pushHistory);
  });

  canvas.addEventListener('pointerdown', event => {
    updateWorkspaceCursor(event);
    canvas.setPointerCapture(event.pointerId);
    state.isDown = true;
    const cell = cellFromEvent(event);
    state.lastCellKey = cell.x + ',' + cell.y;
    paintAt(cell.x, cell.y, true);
  });

  canvas.addEventListener('pointermove', event => {
    updateWorkspaceCursor(event);
    if (!state.isDown) return;
    const cell = cellFromEvent(event);
    const key = cell.x + ',' + cell.y;
    if (key === state.lastCellKey) return;
    state.lastCellKey = key;
    paintAt(cell.x, cell.y, false);
  });

  window.addEventListener('pointerup', () => {
    if (state.isDown) pushHistory();
    state.isDown = false;
    state.lastCellKey = '';
  });

  els.stageWrap.addEventListener('pointerenter', updateWorkspaceCursor);
  els.stageWrap.addEventListener('pointermove', updateWorkspaceCursor);
  els.stageWrap.addEventListener('pointerleave', hideWorkspaceCursor);

  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    const isUndo = (event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey;
    const isRedo = (event.ctrlKey || event.metaKey) && (key === 'y' || (key === 'z' && event.shiftKey));

    if (isUndo) {
      event.preventDefault();
      undo();
    }

    if (isRedo) {
      event.preventDefault();
      redo();
    }
  });

  document.addEventListener('paste', onDocumentPaste);
}

