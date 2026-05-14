function visibleColorAtIndex(i) {
      return state.pixels[i] || state.liveTextPixels[i] || null;
    }

    function collectVisibleRuns(mode = 'pixel') {
      const runs = [];
      for (let y = 0; y < state.rows; y++) {
        let x = 0;
        while (x < state.cols) {
          const color = visibleColorAtIndex(indexOf(x, y));
          if (!color) {
            x += 1;
            continue;
          }

          if (mode === 'merge') {
            let len = 1;
            while (x + len < state.cols && visibleColorAtIndex(indexOf(x + len, y)) === color) {
              len += 1;
            }
            runs.push({ x, y, len, color });
            x += len;
          } else {
            runs.push({ x, y, len: 1, color });
            x += 1;
          }
        }
      }
      return runs;
    }

    function hexToAlgodooColor(hex) {
      const clean = (hex || '#000000').replace('#', '').trim();
      const normalized = clean.length === 3
        ? clean.split('').map(ch => ch + ch).join('')
        : clean.padEnd(6, '0').slice(0, 6);
      const r = parseInt(normalized.slice(0, 2), 16) / 255;
      const g = parseInt(normalized.slice(2, 4), 16) / 255;
      const b = parseInt(normalized.slice(4, 6), 16) / 255;
      const fmt = n => (Number.isFinite(n) ? n : 0).toFixed(6);
      return '[' + fmt(r) + ', ' + fmt(g) + ', ' + fmt(b) + ', 1.000000]';
    }

    function fmtAlgodooNumber(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '0.000000';
      return n.toFixed(6);
    }

    function boolAlgodoo(value) {
      return value ? 'true' : 'false';
    }

    function getAlgodooFloat(el, fallback, min = -999999, max = 999999) {
      const n = parseFloat(el.value);
      const value = Number.isFinite(n) ? n : fallback;
      return clamp(value, min, max);
    }

    function getAlgodooInt(el, fallback, min = -999999, max = 999999) {
      const n = parseInt(el.value, 10);
      const value = Number.isFinite(n) ? n : fallback;
      return clamp(value, min, max);
    }

    function quoteAlgodooString(value) {
      return '"' + String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }

    function getExtraAlgodooScriptLines() {
      return (els.algodooExtraScript.value || '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => line.endsWith(';') ? line : line + ';');
    }

    function getAlgodooAdvancedState() {
      const values = {};
      document.querySelectorAll('[data-algodoo-field]').forEach(el => {
        values[el.id] = el.type === 'checkbox' ? el.checked : el.value;
      });
      return values;
    }

    function restoreAlgodooAdvancedState(values = {}) {
      document.querySelectorAll('[data-algodoo-field]').forEach(el => {
        if (!(el.id in values)) return;
        if (el.type === 'checkbox') el.checked = !!values[el.id];
        else el.value = values[el.id];
      });
    }

    function getAdvancedEl(id) {
      return document.getElementById(id);
    }

    function getAdvancedValue(id, fallback = '') {
      const el = getAdvancedEl(id);
      if (!el) return fallback;
      return el.value;
    }

    function getAdvancedChecked(id, fallback = false) {
      const el = getAdvancedEl(id);
      if (!el) return fallback;
      return !!el.checked;
    }

    function advancedNumber(id, fallback, min = -999999, max = 999999) {
      const n = parseFloat(getAdvancedValue(id, fallback));
      const value = Number.isFinite(n) ? n : fallback;
      return clamp(value, min, max);
    }

    function advancedInt(id, fallback, min = -999999, max = 999999) {
      const n = parseInt(getAdvancedValue(id, fallback), 10);
      const value = Number.isFinite(n) ? n : fallback;
      return clamp(value, min, max);
    }

    function pushRawProp(lines, name, value) {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) return;
      lines.push('    ' + name + ' := ' + trimmed + ';');
    }

    function pushStringProp(lines, name, value) {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) return;
      lines.push('    ' + name + ' := ' + quoteAlgodooString(trimmed) + ';');
    }

    function pushBoolProp(lines, name, value) {
      lines.push('    ' + name + ' := ' + boolAlgodoo(!!value) + ';');
    }

    function pushCommonAlgodooProperties(lines, run, i, collideSet, fixed, objectType) {
      const baseZ = getAlgodooFloat(els.algodooZDepth, 5, -999999, 999999);
      const zDepth = baseZ + (i % 1000) * 0.000001;
      const bodyValue = getAdvancedValue('algodooBody', '').trim();

      lines.push('    color := ' + hexToAlgodooColor(run.color) + ';');
      lines.push('    drawBorder := ' + boolAlgodoo(els.algodooDrawBorder.checked) + ';');
      lines.push('    edgeBlur := ' + fmtAlgodooNumber(getAlgodooFloat(els.algodooEdgeBlur, 0, 0, 20)) + ';');
      lines.push('    collideSet := ' + collideSet + ';');
      lines.push('    collideWater := ' + boolAlgodoo(els.algodooCollideWater.checked) + ';');
      lines.push('    density := ' + fmtAlgodooNumber(getAlgodooFloat(els.algodooDensity, 1, 0.000001, 100000)) + ';');
      lines.push('    friction := ' + fmtAlgodooNumber(getAlgodooFloat(els.algodooFriction, 0.5, 0, 100000)) + ';');
      lines.push('    restitution := ' + fmtAlgodooNumber(getAlgodooFloat(els.algodooRestitution, 0, 0, 100000)) + ';');
      lines.push('    attraction := ' + fmtAlgodooNumber(getAlgodooFloat(els.algodooAttraction, 0, -100000, 100000)) + ';');
      lines.push('    adhesion := ' + fmtAlgodooNumber(getAlgodooFloat(els.algodooAdhesion, 0, -100000, 100000)) + ';');
      lines.push('    layer := ' + getAlgodooInt(els.algodooLayer, 0, -100000, 100000) + ';');

      lines.push('    airFrictionMult := ' + fmtAlgodooNumber(advancedNumber('algodooAirFrictionMult', 1, -100000, 100000)) + ';');
      lines.push('    angle := ' + fmtAlgodooNumber(advancedNumber('algodooAngle', 0, -100000, 100000)) + ';');
      lines.push('    angvel := ' + fmtAlgodooNumber(advancedNumber('algodooAngvel', 0, -100000, 100000)) + ';');
      lines.push('    attractionType := ' + advancedInt('algodooAttractionType', 2, -100000, 100000) + ';');
      lines.push('    heteroCollide := ' + boolAlgodoo(getAdvancedChecked('algodooHeteroCollide', false)) + ';');
      lines.push('    inertiaMultiplier := ' + fmtAlgodooNumber(advancedNumber('algodooInertiaMultiplier', 1, -100000, 100000)) + ';');
      pushRawProp(lines, 'materialVelocity', getAdvancedValue('algodooMaterialVelocity', '[0, 0]'));
      pushRawProp(lines, 'vel', getAdvancedValue('algodooVel', '[0, 0]'));
      pushRawProp(lines, 'velocityDamping', getAdvancedValue('algodooVelocityDamping', '[0, 0, 0]'));
      pushRawProp(lines, 'timeToLive', getAdvancedValue('algodooTimeToLive', ''));

      lines.push('    glued := ' + boolAlgodoo(fixed) + ';');
      if (fixed) {
        lines.push('    body := ' + (bodyValue || '0') + ';');
      } else if (bodyValue) {
        lines.push('    body := ' + bodyValue + ';');
      }

      lines.push('    killer := ' + boolAlgodoo(els.algodooKiller.checked) + ';');
      lines.push('    immortal := ' + boolAlgodoo(els.algodooImmortal.checked) + ';');
      lines.push('    ruler := ' + boolAlgodoo(els.algodooRuler.checked) + ';');
      lines.push('    showForceArrows := ' + boolAlgodoo(els.algodooShowForceArrows.checked) + ';');
      lines.push('    showMomentum := ' + boolAlgodoo(els.algodooShowMomentum.checked) + ';');
      lines.push('    showVelocity := ' + boolAlgodoo(els.algodooShowVelocity.checked) + ';');

      lines.push('    controllerAcc := ' + fmtAlgodooNumber(advancedNumber('algodooControllerAcc', 11, -100000, 100000)) + ';');
      lines.push('    controllerInvertX := ' + boolAlgodoo(getAdvancedChecked('algodooControllerInvertX', false)) + ';');
      lines.push('    controllerInvertY := ' + boolAlgodoo(getAdvancedChecked('algodooControllerInvertY', false)) + ';');
      lines.push('    controllerReverseXY := ' + boolAlgodoo(getAdvancedChecked('algodooControllerReverseXY', false)) + ';');

      lines.push('    opaqueBorders := ' + boolAlgodoo(getAdvancedChecked('algodooOpaqueBorders', true)) + ';');
      if (objectType === 'circle') {
        lines.push('    drawCake := ' + boolAlgodoo(getAdvancedChecked('algodooDrawCake', false)) + ';');
      }
      lines.push('    protractor := ' + boolAlgodoo(getAdvancedChecked('algodooProtractor', false)) + ';');
      lines.push('    reflectiveness := ' + fmtAlgodooNumber(advancedNumber('algodooReflectiveness', 1, -100000, 100000)) + ';');
      lines.push('    refractiveIndex := ' + fmtAlgodooNumber(advancedNumber('algodooRefractiveIndex', 1.5, -100000, 100000)) + ';');
      pushStringProp(lines, 'texture', getAdvancedValue('algodooTexture', ''));
      pushRawProp(lines, 'textureClamped', getAdvancedValue('algodooTextureClamped', '[false, false]'));
      pushRawProp(lines, 'textureMatrix', getAdvancedValue('algodooTextureMatrix', '[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]'));
      pushRawProp(lines, 'resources', getAdvancedValue('algodooResources', '[]'));

      pushStringProp(lines, 'text', getAdvancedValue('algodooText', ''));
      pushRawProp(lines, 'textColor', getAdvancedValue('algodooTextColor', '[1, 1, 1, 1]'));
      lines.push('    textConstrained := ' + boolAlgodoo(getAdvancedChecked('algodooTextConstrained', true)) + ';');
      pushStringProp(lines, 'textFont', getAdvancedValue('algodooTextFont', 'Verdana'));
      lines.push('    textFontSize := ' + fmtAlgodooNumber(advancedNumber('algodooTextFontSize', 32, 0, 100000)) + ';');
      lines.push('    textScale := ' + fmtAlgodooNumber(advancedNumber('algodooTextScale', 0.1, -100000, 100000)) + ';');

      pushRawProp(lines, 'onClick', getAdvancedValue('algodooOnClick', '(e)=>{}'));
      pushRawProp(lines, 'onCollide', getAdvancedValue('algodooOnCollide', '(e)=>{}'));
      pushRawProp(lines, 'onDie', getAdvancedValue('algodooOnDie', '(e)=>{}'));
      pushRawProp(lines, 'onHitByLaser', getAdvancedValue('algodooOnHitByLaser', '(e)=>{}'));
      pushRawProp(lines, 'onKey', getAdvancedValue('algodooOnKey', '(e)=>{}'));
      pushRawProp(lines, 'onSpawn', getAdvancedValue('algodooOnSpawn', '(e)=>{}'));
      pushRawProp(lines, 'postStep', getAdvancedValue('algodooPostStep', '(e)=>{}'));
      pushRawProp(lines, 'update', getAdvancedValue('algodooUpdate', '(e)=>{}'));

      lines.push('    _pixelX := ' + run.x + ';');
      lines.push('    _pixelY := ' + run.y + ';');
      lines.push('    zDepth := ' + fmtAlgodooNumber(zDepth) + ';');

      for (const extraLine of getExtraAlgodooScriptLines()) {
        lines.push('    ' + extraLine);
      }
    }

    function applyAlgodooMaterialPreset() {
      const preset = ALGODOO_MATERIALS[els.algodooMaterial.value] || ALGODOO_MATERIALS.default;
      els.algodooDensity.value = Number(preset.density).toFixed(2);
      els.algodooFriction.value = Number(preset.friction).toFixed(2);
      els.algodooRestitution.value = Number(preset.restitution).toFixed(2);
      els.algodooAttraction.value = Number(preset.attraction).toFixed(2);
      els.algodooAdhesion.value = Number(preset.adhesion).toFixed(2);
    }

    function markAlgodooMaterialCustom() {
      if (els.algodooMaterial.value !== 'custom') {
        els.algodooMaterial.value = 'custom';
      }
    }

    function syncAlgodooObjectTypeUI() {
      const mergeOption = els.algodooMode.querySelector('option[value="merge"]');
      const isCircle = els.algodooObjectType.value === 'circle';
      if (mergeOption) mergeOption.disabled = isCircle;
      if (isCircle && els.algodooMode.value === 'merge') {
        els.algodooMode.value = 'pixel';
      }
    }

    function buildAlgodooPhn() {
      syncAlgodooObjectTypeUI();

      const objectType = els.algodooObjectType.value === 'circle' ? 'circle' : 'box';
      let mode = els.algodooMode.value;
      if (objectType === 'circle' && mode === 'merge') {
        mode = 'pixel';
      }

      const runs = collectVisibleRuns(mode);
      if (!runs.length) {
        alert('There are no pixels to export to Algodoo.');
        return null;
      }

      if (mode === 'pixel' && runs.length > 8000) {
        const ok = confirm(
          'You are exporting ' + runs.length + ' separate objects. ' +
          'Algodoo may lag or load slowly. Do you still want to export?'
        );
        if (!ok) return null;
      }

      const objectSize = clamp(parseFloat(els.algodooPixelSize.value) || 0.08, 0.005, 5);
      const gap = clamp(parseFloat(els.algodooGap.value) || 0, 0, 5);
      const step = objectSize + gap;
      const originX = parseFloat(els.algodooOriginX.value) || 0;
      const originY = parseFloat(els.algodooOriginY.value) || 0;
      const fixed = els.algodooFixed.checked;
      const collideSet = els.algodooCollide.checked ? advancedInt('algodooCollideSet', 1023, 0, 65535) : 0;

      const lines = [
        '// FileVersion 21',
        '// Phunlet created by Pixel Text Editor v11',
        '// Object type: ' + objectType,
        '// Export mode: ' + mode,
        '',
        'FileInfo -> {',
        '    author = "Pixel Text Editor";',
        '    version = 21',
        '};',
        ''
      ];

      const totalWidth = state.cols * step;
      const totalHeight = state.rows * step;
      lines.push('Scene.camera.pan = [' + fmtAlgodooNumber(originX + totalWidth / 2) + ', ' + fmtAlgodooNumber(originY - totalHeight / 2) + '];');
      lines.push('Scene.camera.zoom = ' + fmtAlgodooNumber(Math.max(10, 120 / Math.max(1, Math.max(totalWidth, totalHeight)))) + ';');
      lines.push('');

      runs.forEach((run, i) => {
        const w = run.len * objectSize + Math.max(0, run.len - 1) * gap;
        const h = objectSize;
        const cx = originX + run.x * step + w / 2;
        const cy = originY - run.y * step - h / 2;

        if (objectType === 'circle') {
          const radius = objectSize / 2;
          const circleCx = originX + run.x * step + radius;
          const circleCy = originY - run.y * step - radius;

          lines.push('Scene.addCircle {');
          lines.push('    pos := [' + fmtAlgodooNumber(circleCx) + ', ' + fmtAlgodooNumber(circleCy) + '];');
          lines.push('    radius := ' + fmtAlgodooNumber(radius) + ';');
          pushCommonAlgodooProperties(lines, run, i, collideSet, fixed, objectType);
          lines.push('};');
        } else {
          lines.push('Scene.addBox {');
          lines.push('    pos := [' + fmtAlgodooNumber(cx) + ', ' + fmtAlgodooNumber(cy) + '];');
          lines.push('    size := [' + fmtAlgodooNumber(w) + ', ' + fmtAlgodooNumber(h) + '];');
          pushCommonAlgodooProperties(lines, run, i, collideSet, fixed, objectType);
          lines.push('};');
        }
      });

      return { text: lines.join('\n'), count: runs.length, objectType, mode };
    }

    function exportAlgodooPhn() {
      const result = buildAlgodooPhn();
      if (!result) return;

      const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pixel-art-algodoo-' + result.objectType + '-' + result.mode + '-' + result.count + '.phn';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    }

