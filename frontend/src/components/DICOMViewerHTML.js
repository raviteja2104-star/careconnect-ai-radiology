// DICOMViewerHTML.js
// Self-contained HTML string for the DWV DICOM viewer loaded inside a WebView.
// Communicates back to React Native via window.ReactNativeWebView.postMessage().

export const getDicomViewerHTML = ({ dicomUrl, patientName, scanType, bodyPart, aiFindings, aiConf, riskLevel }) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
<title>DICOM Viewer</title>
<script src="https://cdn.jsdelivr.net/npm/dwv@0.33.2/dist/dwv.min.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,sans-serif;}
  body{background:#000;color:#fff;height:100vh;display:flex;flex-direction:column;overflow:hidden;}
  #toolbar{display:flex;gap:6px;padding:8px 10px;background:#0a0a14;border-bottom:1px solid #1a2030;flex-wrap:wrap;align-items:center;}
  .tool-btn{background:#161c2a;border:1px solid #222c3c;color:#aaa;font-size:10px;font-weight:700;padding:5px 10px;border-radius:6px;cursor:pointer;letter-spacing:.5px;transition:all .2s;}
  .tool-btn.on{background:#00bfa5;border-color:#00bfa5;color:#fff;}
  .tool-btn:hover{border-color:#00bfa5;color:#00bfa5;}
  #layers-div{flex:1;position:relative;background:#000;}
  canvas{position:absolute;top:0;left:0;}
  #dropzone{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#555;}
  #dropzone svg{opacity:.3;}
  #dropzone p{font-size:13px;font-weight:600;text-align:center;}
  #dropzone small{font-size:11px;color:#333;text-align:center;}
  #status{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.7);padding:5px 10px;font-size:9px;color:#556;letter-spacing:.5px;text-transform:uppercase;}
  #ai-overlay{position:absolute;top:4px;right:4px;background:rgba(0,191,165,.12);border:1px solid rgba(0,191,165,.4);border-radius:8px;padding:6px 10px;font-size:9px;font-weight:700;color:#00bfa5;max-width:140px;}
  #slice-bar{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#0a0a14;border-top:1px solid #1a2030;}
  #slice-slider{flex:1;accent-color:#00bfa5;}
  #slice-label{font-size:10px;color:#666;min-width:70px;text-align:right;}
  #ww-bar{display:flex;gap:6px;padding:5px 10px;background:#0a0a14;flex-wrap:wrap;}
  .ww-btn{background:#111820;border:1px solid #1e2838;color:#666;font-size:9px;font-weight:700;padding:4px 9px;border-radius:5px;cursor:pointer;letter-spacing:.5px;}
  .ww-btn.on{background:#1a4a44;border-color:#00bfa5;color:#00bfa5;}
</style>
</head>
<body>

<div id="toolbar">
  <button class="tool-btn on" id="btn-scroll" onclick="setTool('Scroll')">⇅ Scroll</button>
  <button class="tool-btn" id="btn-zoom" onclick="setTool('ZoomAndPan')">🔍 Zoom</button>
  <button class="tool-btn" id="btn-wl" onclick="setTool('WindowLevel')">☀ W/L</button>
  <button class="tool-btn" id="btn-draw" onclick="setTool('Draw')">✏ Draw</button>
  <button class="tool-btn" id="btn-roi" onclick="drawROI()">⊙ ROI</button>
  <button class="tool-btn" id="btn-flip" onclick="flipImage()">↔ Flip</button>
  <button class="tool-btn" id="btn-inv" onclick="invertImage()">◑ Invert</button>
  <button class="tool-btn" id="btn-reset" onclick="resetView()">↺ Reset</button>
  <button class="tool-btn" style="margin-left:auto;background:#1a0a0a;border-color:#D32F2F;color:#D32F2F;" onclick="sendReport()">📤 Report</button>
</div>

<div id="layers-div">
  <div id="dropzone">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
    </svg>
    <p>DICOM Viewer Ready</p>
    <small>${patientName ? `Patient: ${patientName}<br>${scanType} · ${bodyPart}` : 'Load a DICOM file or URL to begin'}</small>
  </div>
  <div id="ai-overlay">
    🤖 AI: ${aiFindings || 'Analysis pending'}<br>
    Confidence: ${aiConf || '--'}%<br>
    Risk: ${(riskLevel || 'unknown').toUpperCase()}
  </div>
  <div id="status">DWV v0.33 · CareConnect Enterprise</div>
</div>

<div id="ww-bar">
  <button class="ww-btn on" id="ww-brain" onclick="applyWindow(40,80,'brain')">Brain WL:40 WW:80</button>
  <button class="ww-btn" id="ww-bone" onclick="applyWindow(400,1800,'bone')">Bone WL:400 WW:1800</button>
  <button class="ww-btn" id="ww-lung" onclick="applyWindow(-600,1500,'lung')">Lung WL:-600 WW:1500</button>
  <button class="ww-btn" id="ww-soft" onclick="applyWindow(60,400,'soft')">Soft WL:60 WW:400</button>
</div>

<div id="slice-bar">
  <input type="range" id="slice-slider" min="0" max="100" value="50" oninput="scrollToSlice(this.value)"/>
  <span id="slice-label">Slice 1 / 1</span>
</div>

<script>
var app = new dwv.App();
var currentTool = 'Scroll';
var inverted = false;

app.init({
  dataViewConfigs: { '*': [{ divId: 'layers-div' }] },
  tools: {
    Scroll: {},
    ZoomAndPan: {},
    WindowLevel: {},
    Draw: { options: ['Arrow', 'Ruler', 'Ellipse', 'Rectangle'] },
  }
});

// Try to load from URL if provided
var dicomUrl = '${dicomUrl || ''}';
if (dicomUrl && dicomUrl !== 'undefined' && dicomUrl !== '') {
  document.getElementById('dropzone').style.display = 'none';
  app.loadURLs([dicomUrl]);
}

app.addEventListener('loadend', function() {
  document.getElementById('dropzone').style.display = 'none';
  var nSlices = app.getImage(0)?.getGeometry()?.getSize()?.get(2) || 1;
  document.getElementById('slice-slider').max = nSlices - 1;
  document.getElementById('slice-label').textContent = 'Slice 1 / ' + nSlices;
  document.getElementById('status').textContent = 'Loaded · ${patientName || 'Unknown'} · ${scanType || 'DICOM'}';
  notify({ type: 'loaded', slices: nSlices });
});

app.addEventListener('error', function(e) {
  document.getElementById('status').textContent = 'Error loading DICOM: ' + e.message;
  notify({ type: 'error', message: e.message });
});

function setTool(t) {
  currentTool = t;
  app.setTool(t);
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('on'));
  var id = { Scroll:'btn-scroll', ZoomAndPan:'btn-zoom', WindowLevel:'btn-wl', Draw:'btn-draw' }[t];
  if (id) document.getElementById(id)?.classList.add('on');
  notify({ type: 'tool', tool: t });
}

function applyWindow(wl, ww, id) {
  try { app.setWindowLevel(wl, ww); } catch(e) {}
  document.querySelectorAll('.ww-btn').forEach(b => b.classList.remove('on'));
  document.getElementById('ww-' + id)?.classList.add('on');
}

function scrollToSlice(val) {
  try {
    var nSlices = app.getImage(0)?.getGeometry()?.getSize()?.get(2) || 1;
    app.getViewController(0)?.setCurrentIndex({ k: parseInt(val) });
    document.getElementById('slice-label').textContent = 'Slice ' + (parseInt(val)+1) + ' / ' + nSlices;
  } catch(e) {}
}

function flipImage() {
  try { app.getLayerController(0)?.getActiveViewLayer()?.getFlip()?.flipY(); } catch(e) {}
  notify({ type: 'action', action: 'flip' });
}

function invertImage() {
  inverted = !inverted;
  try { app.getViewController(0)?.setVoiLut(inverted ? dwv.image.lut.inverted : dwv.image.lut.plain); } catch(e) {}
  document.getElementById('btn-inv').classList.toggle('on', inverted);
  notify({ type: 'action', action: 'invert', value: inverted });
}

function resetView() {
  try { app.getLayerController(0)?.reset(); } catch(e) {}
  inverted = false;
  applyWindow(40, 80, 'brain');
  document.getElementById('btn-inv').classList.remove('on');
  notify({ type: 'action', action: 'reset' });
}

function drawROI() {
  setTool('Draw');
  try { app.setDrawShape('Ellipse'); } catch(e) {}
  notify({ type: 'action', action: 'roi' });
}

function sendReport() {
  notify({ type: 'navigate', target: 'ReportEditor' });
}

function notify(data) {
  try { window.ReactNativeWebView?.postMessage(JSON.stringify(data)); } catch(e) {}
}

// File drag-drop for web
document.getElementById('layers-div').addEventListener('dragover', function(e) { e.preventDefault(); });
document.getElementById('layers-div').addEventListener('drop', function(e) {
  e.preventDefault();
  var files = e.dataTransfer?.files;
  if (files && files.length) {
    document.getElementById('dropzone').style.display = 'none';
    app.loadFiles(Array.from(files));
  }
});
</script>
</body>
</html>
`;
