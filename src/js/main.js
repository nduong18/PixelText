function bootstrapApp() {
  movePixelTextGroupToTop();
  initCollapsibleGroups();

  initBrushSizeOptions();
  updateImagePixelSizeLabel();
  updateImageDetailLabel();
  updateImageQualityLabel();
  syncAlgodooObjectTypeUI();
  setWorkspaceCursorTool(state.tool);
  setPreviewCollapsed(true);

  bindAppEvents();

  makeBlankPixels();
  makeBlankTextLayer();
  resizeCanvas();
  render();
  pushHistory();
}

bootstrapApp();

