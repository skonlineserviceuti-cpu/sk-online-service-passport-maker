const el = {
  photoInput: document.getElementById("photoInput"),
  preset: document.getElementById("preset"),
  unit: document.getElementById("unit"),
  width: document.getElementById("width"),
  height: document.getElementById("height"),
  dpi: document.getElementById("dpi"),
  zoom: document.getElementById("zoom"),
  zoomValue: document.getElementById("zoomValue"),
  backgroundMode: document.getElementById("backgroundMode"),
  backgroundColor: document.getElementById("backgroundColor"),
  dressPreset: document.getElementById("dressPreset"),
  dressColor: document.getElementById("dressColor"),
  dressIntensity: document.getElementById("dressIntensity"),
  dressIntensityValue: document.getElementById("dressIntensityValue"),
  dressStart: document.getElementById("dressStart"),
  dressStartValue: document.getElementById("dressStartValue"),
  faceClean: document.getElementById("faceClean"),
  faceCleanValue: document.getElementById("faceCleanValue"),
  brightness: document.getElementById("brightness"),
  brightnessValue: document.getElementById("brightnessValue"),
  contrast: document.getElementById("contrast"),
  contrastValue: document.getElementById("contrastValue"),
  saturation: document.getElementById("saturation"),
  saturationValue: document.getElementById("saturationValue"),
  sharpness: document.getElementById("sharpness"),
  sharpnessValue: document.getElementById("sharpnessValue"),
  paper: document.getElementById("paper"),
  gap: document.getElementById("gap"),
  margin: document.getElementById("margin"),
  copiesPreset: document.getElementById("copiesPreset"),
  copies: document.getElementById("copies"),
  printCountInfo: document.getElementById("printCountInfo"),
  refreshBtn: document.getElementById("refreshBtn"),
  sheetBtn: document.getElementById("sheetBtn"),
  downloadPhotoBtn: document.getElementById("downloadPhotoBtn"),
  downloadSheetBtn: document.getElementById("downloadSheetBtn"),
  printBtn: document.getElementById("printBtn"),
  passportCanvas: document.getElementById("passportCanvas"),
  sheetCanvas: document.getElementById("sheetCanvas"),
  passportPlaceholder: document.getElementById("passportPlaceholder"),
  sheetPlaceholder: document.getElementById("sheetPlaceholder"),
  passportMeta: document.getElementById("passportMeta"),
  sheetMeta: document.getElementById("sheetMeta")
};

const ctx = {
  passport: el.passportCanvas.getContext("2d", { willReadFrequently: true }),
  sheet: el.sheetCanvas.getContext("2d")
};

const PRESETS = {
  india: { width: 35, height: 45, unit: "mm" },
  us: { width: 2, height: 2, unit: "in" },
  schengen: { width: 35, height: 45, unit: "mm" }
};

const PAPER = {
  a4: { widthMm: 210, heightMm: 297, label: "A4" },
  "4x6": { widthMm: 101.6, heightMm: 152.4, label: "4x6 inch" }
};

const DRESS_PRESETS = {
  white_formal: { r: 239, g: 241, b: 245 },
  black_formal: { r: 34, g: 37, b: 45 },
  navy_blazer: { r: 29, g: 51, b: 99 },
  light_blue_shirt: { r: 129, g: 172, b: 230 },
  olive_kurta: { r: 95, g: 118, b: 72 },
  maroon_blazer: { r: 112, g: 35, b: 52 }
};

const state = {
  image: null,
  offsetX: 0,
  offsetY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
  dragStartX: 0,
  dragStartY: 0,
  dragging: false,
  sheetReady: false,
  cache: {
    key: "",
    canvas: null
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mmToPx(mm, dpi) {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}

function mmToPxOptional(mm, dpi) {
  return Math.max(0, Math.round((mm / 25.4) * dpi));
}

function inToPx(inches, dpi) {
  return Math.max(1, Math.round(inches * dpi));
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatFixed(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function getPhotoSize() {
  const unit = el.unit.value;
  const dpi = clamp(toNumber(el.dpi.value, 300), 72, 1200);
  let width = clamp(toNumber(el.width.value, 35), 10, 200);
  let height = clamp(toNumber(el.height.value, 45), 10, 200);

  if (unit === "mm") {
    return {
      unit,
      dpi,
      widthDisplay: width,
      heightDisplay: height,
      widthMm: width,
      heightMm: height,
      widthPx: mmToPx(width, dpi),
      heightPx: mmToPx(height, dpi)
    };
  }

  return {
    unit,
    dpi,
    widthDisplay: width,
    heightDisplay: height,
    widthMm: width * 25.4,
    heightMm: height * 25.4,
    widthPx: inToPx(width, dpi),
    heightPx: inToPx(height, dpi)
  };
}

function getSheetLayout(size) {
  const paper = PAPER[el.paper.value] || PAPER.a4;
  const gapMm = clamp(toNumber(el.gap.value, 3), 0, 30);
  const marginMm = clamp(toNumber(el.margin.value, 5), 0, 40);
  const copiesRequested = clamp(Math.floor(toNumber(el.copies.value, 8)), 1, 100);

  const sheetWidth = mmToPx(paper.widthMm, size.dpi);
  const sheetHeight = mmToPx(paper.heightMm, size.dpi);
  const photoW = size.widthPx;
  const photoH = size.heightPx;
  const gapPx = mmToPxOptional(gapMm, size.dpi);
  const marginPx = mmToPxOptional(marginMm, size.dpi);

  const availableWidth = sheetWidth - marginPx * 2;
  const availableHeight = sheetHeight - marginPx * 2;
  const cols = availableWidth > 0 ? Math.max(0, Math.floor((availableWidth + gapPx) / (photoW + gapPx))) : 0;
  const rows = availableHeight > 0 ? Math.max(0, Math.floor((availableHeight + gapPx) / (photoH + gapPx))) : 0;
  const maxCopies = cols * rows;
  const copies = Math.min(copiesRequested, maxCopies);

  return {
    paper,
    gapMm,
    marginMm,
    gapPx,
    marginPx,
    copiesRequested,
    copies,
    maxCopies,
    sheetWidth,
    sheetHeight,
    photoW,
    photoH,
    cols,
    rows,
    startX: marginPx,
    startY: marginPx
  };
}

function updatePrintCountInfo() {
  const size = getPhotoSize();
  const layout = getSheetLayout(size);

  if (layout.maxCopies <= 0) {
    el.printCountInfo.textContent = "Current size/margin me 1 photo bhi fit nahi ho rahi.";
    return;
  }

  el.printCountInfo.textContent = `Selected: ${layout.copiesRequested} | Print: ${layout.copies} | Max Fit: ${layout.maxCopies}`;
}

function updateSlidersMeta() {
  el.zoomValue.textContent = `${formatFixed(toNumber(el.zoom.value, 1), 2)}x`;
  el.dressIntensityValue.textContent = `${toNumber(el.dressIntensity.value, 55)}`;
  el.dressStartValue.textContent = `${toNumber(el.dressStart.value, 58)}%`;
  el.faceCleanValue.textContent = `${toNumber(el.faceClean.value, 0)}`;
  el.brightnessValue.textContent = `${toNumber(el.brightness.value, 0)}`;
  el.contrastValue.textContent = `${toNumber(el.contrast.value, 0)}`;
  el.saturationValue.textContent = `${toNumber(el.saturation.value, 0)}`;
  el.sharpnessValue.textContent = `${toNumber(el.sharpness.value, 0)}`;
}

function updateDressControls() {
  el.dressColor.disabled = el.dressPreset.value !== "custom";
}

function setPreset(name) {
  if (!PRESETS[name]) return;
  const preset = PRESETS[name];
  el.unit.value = preset.unit;
  el.width.value = preset.width;
  el.height.value = preset.height;
}

function loadImageFile(file) {
  const readerUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.image = img;
    state.offsetX = 0;
    state.offsetY = 0;
    state.cache.key = "";
    state.cache.canvas = null;
    el.zoom.value = "1";
    updateSlidersMeta();
    renderPassport();
    URL.revokeObjectURL(readerUrl);
  };
  img.onerror = () => {
    URL.revokeObjectURL(readerUrl);
    alert("Image load failed. Please try another photo.");
  };
  img.src = readerUrl;
}

function getPreparedImageCanvas() {
  if (!state.image) return null;

  const sourceImage = state.image;
  const key = `${sourceImage.src}`;
  if (state.cache.key === key && state.cache.canvas) {
    return state.cache.canvas;
  }

  const maxEdge = 1800;
  const ratio = Math.min(1, maxEdge / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
  const width = Math.max(1, Math.round(sourceImage.naturalWidth * ratio));
  const height = Math.max(1, Math.round(sourceImage.naturalHeight * ratio));

  const buffer = document.createElement("canvas");
  buffer.width = width;
  buffer.height = height;
  const bctx = buffer.getContext("2d", { willReadFrequently: true });
  bctx.drawImage(sourceImage, 0, 0, width, height);

  state.cache.key = key;
  state.cache.canvas = buffer;
  return buffer;
}

function hexToRgb(hex) {
  const cleaned = hex.replace("#", "");
  const normalized = cleaned.length === 3
    ? cleaned.split("").map((part) => part + part).join("")
    : cleaned;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function isLikelySkin(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (
    r > 85 &&
    g > 40 &&
    b > 20 &&
    (max - min) > 15 &&
    r > g &&
    r > b
  );
}

function getDressTargetColor() {
  if (el.dressPreset.value === "custom") {
    return hexToRgb(el.dressColor.value || "#1f2f4a");
  }
  return DRESS_PRESETS[el.dressPreset.value] || null;
}

function applyDressCode(canvas, canvasCtx) {
  const target = getDressTargetColor();
  if (!target) return;

  const intensity = clamp(toNumber(el.dressIntensity.value, 55), 0, 100) / 100;
  if (intensity <= 0) return;

  const startRatio = clamp(toNumber(el.dressStart.value, 58), 35, 80) / 100;
  const startY = Math.floor(canvas.height * startRatio);
  const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const rowSpan = Math.max(1, height - startY);

  for (let y = startY; y < height; y += 1) {
    const verticalFactor = (y - startY) / rowSpan;
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 10) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isLikelySkin(r, g, b)) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max - min;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 245 && saturation < 14) continue;

      const blend = clamp(intensity * (0.58 + verticalFactor * 0.42), 0, 0.95);
      const shade = 0.45 + (lum / 255) * 0.75;
      const tr = clamp(target.r * shade, 0, 255);
      const tg = clamp(target.g * shade, 0, 255);
      const tb = clamp(target.b * shade, 0, 255);

      data[idx] = clamp(r * (1 - blend) + tr * blend, 0, 255);
      data[idx + 1] = clamp(g * (1 - blend) + tg * blend, 0, 255);
      data[idx + 2] = clamp(b * (1 - blend) + tb * blend, 0, 255);
    }
  }

  canvasCtx.putImageData(imageData, 0, 0);
}

function drawPhotoToCanvas(targetCanvas, targetCtx) {
  const size = getPhotoSize();
  targetCanvas.width = size.widthPx;
  targetCanvas.height = size.heightPx;
  targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

  if (!state.image) {
    return size;
  }

  const backgroundMode = el.backgroundMode.value;
  if (backgroundMode !== "transparent") {
    targetCtx.fillStyle = el.backgroundColor.value;
    targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  }

  const prepared = getPreparedImageCanvas();
  if (!prepared) return size;

  const coverScale = Math.max(targetCanvas.width / prepared.width, targetCanvas.height / prepared.height);
  const zoom = clamp(toNumber(el.zoom.value, 1), 0.6, 3);
  const scale = coverScale * zoom;
  const drawW = prepared.width * scale;
  const drawH = prepared.height * scale;
  const x = (targetCanvas.width - drawW) / 2 + state.offsetX;
  const y = (targetCanvas.height - drawH) / 2 + state.offsetY;

  const brightness = clamp(toNumber(el.brightness.value, 0), -40, 40);
  const contrast = clamp(toNumber(el.contrast.value, 0), -40, 40);
  const saturation = clamp(toNumber(el.saturation.value, 0), -40, 40);
  targetCtx.save();
  targetCtx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
  targetCtx.drawImage(prepared, x, y, drawW, drawH);
  targetCtx.restore();

  applyDressCode(targetCanvas, targetCtx);

  const faceClean = clamp(toNumber(el.faceClean.value, 0), 0, 100);
  if (faceClean > 0) {
    applyFaceClean(targetCanvas, targetCtx, faceClean);
  }

  const sharpness = clamp(toNumber(el.sharpness.value, 0), 0, 100);
  if (sharpness > 0) {
    applySharpen(targetCanvas, targetCtx, sharpness);
  }

  return size;
}

function applyFaceClean(canvas, canvasCtx, amount) {
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = canvas.width;
  blurCanvas.height = canvas.height;
  const blurCtx = blurCanvas.getContext("2d");
  const radius = 0.8 + amount / 18;
  blurCtx.filter = `blur(${radius}px)`;
  blurCtx.drawImage(canvas, 0, 0);

  const alpha = clamp(amount / 125, 0, 0.85);
  const centerX = canvas.width / 2 + state.offsetX * 0.08;
  const centerY = canvas.height * 0.42 + state.offsetY * 0.06;
  const radiusX = canvas.width * 0.24;
  const radiusY = canvas.height * 0.28;

  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  canvasCtx.clip();
  canvasCtx.globalAlpha = alpha;
  canvasCtx.drawImage(blurCanvas, 0, 0);
  canvasCtx.restore();
}

function applySharpen(canvas, canvasCtx, amount) {
  const srcData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
  const src = srcData.data;
  const out = new Uint8ClampedArray(src);
  const width = canvas.width;
  const height = canvas.height;
  const strength = clamp(amount / 100, 0, 1) * 0.9;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width + x) * 4;
      const top = ((y - 1) * width + x) * 4;
      const right = (y * width + (x + 1)) * 4;
      const bottom = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;

      for (let c = 0; c < 3; c += 1) {
        const sharpened = src[idx + c] * 5 - src[top + c] - src[right + c] - src[bottom + c] - src[left + c];
        out[idx + c] = clamp(src[idx + c] * (1 - strength) + sharpened * strength, 0, 255);
      }
    }
  }

  canvasCtx.putImageData(new ImageData(out, width, height), 0, 0);
}

function renderPassport() {
  updateSlidersMeta();
  const size = drawPhotoToCanvas(el.passportCanvas, ctx.passport);
  updatePrintCountInfo();

  if (!state.image) {
    el.passportPlaceholder.style.display = "block";
    el.passportMeta.textContent = "";
    state.sheetReady = false;
    clearSheetPreview();
    return;
  }

  el.passportPlaceholder.style.display = "none";
  const unitLabel = size.unit === "mm" ? "mm" : "inch";
  const dressNote = el.dressPreset.value === "off"
    ? "Dress: Original"
    : `Dress: ${el.dressPreset.options[el.dressPreset.selectedIndex].text}`;
  el.passportMeta.textContent = `Size: ${formatFixed(size.widthDisplay)} x ${formatFixed(size.heightDisplay)} ${unitLabel} | ${size.widthPx} x ${size.heightPx}px @ ${size.dpi} DPI | ${dressNote}`;
  state.sheetReady = false;
}

function clearSheetPreview() {
  ctx.sheet.clearRect(0, 0, el.sheetCanvas.width, el.sheetCanvas.height);
  el.sheetMeta.textContent = "";
  el.sheetPlaceholder.style.display = "block";
}

function drawCutMarks(targetCtx, x, y, w, h, length, lineWidth) {
  targetCtx.save();
  targetCtx.strokeStyle = "rgba(35, 50, 58, 0.72)";
  targetCtx.lineWidth = lineWidth;
  targetCtx.beginPath();

  targetCtx.moveTo(x - length, y);
  targetCtx.lineTo(x, y);
  targetCtx.moveTo(x, y - length);
  targetCtx.lineTo(x, y);

  targetCtx.moveTo(x + w + length, y);
  targetCtx.lineTo(x + w, y);
  targetCtx.moveTo(x + w, y - length);
  targetCtx.lineTo(x + w, y);

  targetCtx.moveTo(x - length, y + h);
  targetCtx.lineTo(x, y + h);
  targetCtx.moveTo(x, y + h + length);
  targetCtx.lineTo(x, y + h);

  targetCtx.moveTo(x + w + length, y + h);
  targetCtx.lineTo(x + w, y + h);
  targetCtx.moveTo(x + w, y + h + length);
  targetCtx.lineTo(x + w, y + h);

  targetCtx.stroke();
  targetCtx.restore();
}

function renderSheet(options = {}) {
  const { silent = false } = options;

  if (!state.image) {
    if (!silent) {
      alert("Please upload a photo first.");
    }
    clearSheetPreview();
    return;
  }

  renderPassport();

  const size = getPhotoSize();
  const layout = getSheetLayout(size);
  if (layout.maxCopies <= 0) {
    if (!silent) {
      alert("Current size/margin settings me photo fit nahi ho rahi. Margin ya photo size kam karo.");
    }
    clearSheetPreview();
    return;
  }

  el.sheetCanvas.width = layout.sheetWidth;
  el.sheetCanvas.height = layout.sheetHeight;

  ctx.sheet.fillStyle = "#ffffff";
  ctx.sheet.fillRect(0, 0, layout.sheetWidth, layout.sheetHeight);

  let drawn = 0;
  const cutLine = Math.max(1, Math.round(size.dpi / 220));
  const markLength = Math.max(8, Math.round(size.dpi / 22));
  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      if (drawn >= layout.copies) break;
      const x = layout.startX + col * (layout.photoW + layout.gapPx);
      const y = layout.startY + row * (layout.photoH + layout.gapPx);
      ctx.sheet.drawImage(el.passportCanvas, x, y, layout.photoW, layout.photoH);
      ctx.sheet.strokeStyle = "rgba(31, 43, 47, 0.18)";
      ctx.sheet.lineWidth = cutLine;
      ctx.sheet.strokeRect(x, y, layout.photoW, layout.photoH);
      drawCutMarks(ctx.sheet, x, y, layout.photoW, layout.photoH, markLength, cutLine);
      drawn += 1;
    }
  }

  state.sheetReady = true;
  el.sheetPlaceholder.style.display = "none";
  el.sheetMeta.textContent = `${layout.paper.label} sheet | Copies: ${layout.copies}/${layout.maxCopies} | Gap: ${formatFixed(layout.gapMm, 1)} mm | Margin: ${formatFixed(layout.marginMm, 1)} mm | ${layout.sheetWidth} x ${layout.sheetHeight}px @ ${size.dpi} DPI`;
}

function syncCopiesControl() {
  const preset = el.copiesPreset.value;
  if (preset === "custom") {
    el.copies.disabled = false;
    if (toNumber(el.copies.value, 0) < 1) {
      el.copies.value = "1";
    }
    el.copies.focus();
    return;
  }

  el.copies.value = preset;
  el.copies.disabled = true;
}

function refreshSheetPreviewLive() {
  updatePrintCountInfo();
  if (!state.image) {
    clearSheetPreview();
    return;
  }
  renderSheet({ silent: true });
}

function downloadCanvas(canvas, filename, type = "image/png", quality = 0.95) {
  const href = canvas.toDataURL(type, quality);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printSheet() {
  if (!state.sheetReady) {
    renderSheet();
    if (!state.sheetReady) return;
  }

  const img = el.sheetCanvas.toDataURL("image/png");
  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) {
    alert("Popup blocked. Please allow popups to print.");
    return;
  }

  popup.document.write(`
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Passport Sheet Print</title>
      <style>
        body { margin: 0; display: grid; place-items: center; min-height: 100vh; background: #f0f0f0; }
        img { width: 100%; max-width: 900px; height: auto; background: #fff; box-shadow: 0 12px 30px rgba(0,0,0,0.2); }
      </style>
    </head>
    <body>
      <img src="${img}" alt="Passport sheet">
      <script>
        window.onload = () => { window.print(); };
      <\/script>
    </body>
    </html>
  `);
  popup.document.close();
}

function onDragStart(event) {
  if (!state.image) return;
  state.dragging = true;
  el.passportCanvas.classList.add("dragging");
  const rect = el.passportCanvas.getBoundingClientRect();
  state.dragStartX = event.clientX - rect.left;
  state.dragStartY = event.clientY - rect.top;
  state.startOffsetX = state.offsetX;
  state.startOffsetY = state.offsetY;
  el.passportCanvas.setPointerCapture(event.pointerId);
}

function onDragMove(event) {
  if (!state.dragging || !state.image) return;
  const rect = el.passportCanvas.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;
  const ratioX = el.passportCanvas.width / rect.width;
  const ratioY = el.passportCanvas.height / rect.height;
  const dx = (currentX - state.dragStartX) * ratioX;
  const dy = (currentY - state.dragStartY) * ratioY;
  state.offsetX = state.startOffsetX + dx;
  state.offsetY = state.startOffsetY + dy;
  renderPassport();
}

function onDragEnd(event) {
  if (!state.dragging) return;
  state.dragging = false;
  el.passportCanvas.classList.remove("dragging");
  el.passportCanvas.releasePointerCapture(event.pointerId);
}

function bindEvents() {
  el.photoInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    loadImageFile(file);
  });

  el.preset.addEventListener("change", () => {
    const selected = el.preset.value;
    if (selected !== "custom") {
      setPreset(selected);
    }
    state.offsetX = 0;
    state.offsetY = 0;
    renderPassport();
    refreshSheetPreviewLive();
  });

  const repaintInputs = [
    el.unit,
    el.width,
    el.height,
    el.dpi,
    el.zoom,
    el.backgroundMode,
    el.backgroundColor,
    el.dressPreset,
    el.dressColor,
    el.dressIntensity,
    el.dressStart,
    el.faceClean,
    el.brightness,
    el.contrast,
    el.saturation,
    el.sharpness
  ];

  repaintInputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (input === el.dressPreset) {
        updateDressControls();
      }
      renderPassport();
      refreshSheetPreviewLive();
    });
  });

  el.dressPreset.addEventListener("change", () => {
    updateDressControls();
    renderPassport();
    refreshSheetPreviewLive();
  });

  [el.paper, el.gap, el.margin].forEach((input) => {
    const onSheetSettingsChanged = () => {
      refreshSheetPreviewLive();
    };
    input.addEventListener("input", onSheetSettingsChanged);
    input.addEventListener("change", onSheetSettingsChanged);
  });

  el.copiesPreset.addEventListener("change", () => {
    syncCopiesControl();
    refreshSheetPreviewLive();
  });

  el.copies.addEventListener("input", () => {
    refreshSheetPreviewLive();
  });
  el.copies.addEventListener("change", () => {
    refreshSheetPreviewLive();
  });

  el.refreshBtn.addEventListener("click", () => renderPassport());
  el.sheetBtn.addEventListener("click", () => renderSheet());

  el.downloadPhotoBtn.addEventListener("click", () => {
    if (!state.image) {
      alert("Please upload a photo first.");
      return;
    }
    renderPassport();
    downloadCanvas(el.passportCanvas, "passport-photo.png", "image/png");
  });

  el.downloadSheetBtn.addEventListener("click", () => {
    if (!state.sheetReady) {
      renderSheet();
      if (!state.sheetReady) return;
    }
    downloadCanvas(el.sheetCanvas, "passport-print-sheet.png", "image/png");
  });

  el.printBtn.addEventListener("click", () => printSheet());

  el.passportCanvas.addEventListener("pointerdown", onDragStart);
  el.passportCanvas.addEventListener("pointermove", onDragMove);
  el.passportCanvas.addEventListener("pointerup", onDragEnd);
  el.passportCanvas.addEventListener("pointercancel", onDragEnd);

  el.passportCanvas.addEventListener(
    "wheel",
    (event) => {
      if (!state.image) return;
      event.preventDefault();
      const delta = Math.sign(event.deltaY) * -0.05;
      const nextZoom = clamp(toNumber(el.zoom.value, 1) + delta, 0.6, 3);
      el.zoom.value = formatFixed(nextZoom, 2);
      renderPassport();
      refreshSheetPreviewLive();
    },
    { passive: false }
  );
}

function init() {
  setPreset("india");
  updateDressControls();
  updateSlidersMeta();
  syncCopiesControl();
  updatePrintCountInfo();
  clearSheetPreview();
  bindEvents();
}

init();
