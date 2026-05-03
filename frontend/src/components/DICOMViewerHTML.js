// DICOMViewerHTML.js
// Self-contained offline DICOM-style viewer using Canvas API.
// No external CDN dependencies — works 100% offline in WebView.

export const getDicomViewerHTML = ({ patientName, scanType, bodyPart, aiFindings, aiConf, riskLevel, sliceCount = 24 }) => {
  const riskColor = { high: '#EF5350', medium: '#FFA726', low: '#66BB6A', critical: '#D32F2F' }[riskLevel] || '#00BFA5';
  const safePatient = (patientName || 'Unknown').replace(/'/g, "\\'");
  const safeFinding = (aiFindings || 'Pending analysis').replace(/'/g, "\\'");
  const safeScan = (scanType || 'CT').replace(/'/g, "\\'");
  const safeBody = (bodyPart || 'Unknown').replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
<title>DICOM Viewer</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,sans-serif;-webkit-tap-highlight-color:transparent;}
body{background:#000;color:#fff;height:100vh;display:flex;flex-direction:column;overflow:hidden;user-select:none;}
#toolbar{display:flex;gap:5px;padding:7px 10px;background:#0d1117;border-bottom:1px solid #1e2d3d;flex-wrap:wrap;align-items:center;flex-shrink:0;}
.tbtn{background:#161c2a;border:1px solid #1e2d3d;color:#8b9bb4;font-size:10px;font-weight:700;padding:6px 11px;border-radius:7px;cursor:pointer;letter-spacing:.3px;transition:all .15s;-webkit-tap-highlight-color:transparent;}
.tbtn.on{background:#00BFA5;border-color:#00BFA5;color:#fff;}
.tbtn:active{opacity:.7;}
#viewport{flex:1;position:relative;overflow:hidden;background:#000;}
canvas{display:block;width:100%;height:100%;}
#overlay{position:absolute;inset:0;pointer-events:none;}
.corner{position:absolute;font-size:9px;color:rgba(255,255,255,.45);font-weight:600;line-height:1.6;letter-spacing:.3px;}
#tl{top:6px;left:8px;}
#tr{top:6px;right:8px;text-align:right;}
#bl{bottom:40px;left:8px;}
#br{bottom:40px;right:8px;text-align:right;}
#ai-box{position:absolute;top:6px;left:50%;transform:translateX(-50%);background:rgba(0,191,165,.15);border:1px solid rgba(0,191,165,.5);border-radius:8px;padding:4px 12px;font-size:9px;font-weight:700;color:#00BFA5;white-space:nowrap;letter-spacing:.3px;}
#ww-bar{display:flex;gap:5px;padding:5px 10px;background:#0d1117;border-top:1px solid #1e2d3d;flex-shrink:0;flex-wrap:wrap;}
.wbtn{background:#111820;border:1px solid #1e2838;color:#556;font-size:9px;font-weight:700;padding:4px 9px;border-radius:5px;cursor:pointer;letter-spacing:.3px;transition:all .15s;}
.wbtn.on{background:#003d35;border-color:#00BFA5;color:#00BFA5;}
.wbtn:active{opacity:.7;}
#slice-bar{display:flex;align-items:center;gap:8px;padding:5px 12px;background:#0d1117;border-top:1px solid #1e2d3d;flex-shrink:0;}
#slice-slider{flex:1;-webkit-appearance:none;height:4px;border-radius:2px;background:#1e2d3d;outline:none;}
#slice-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#00BFA5;cursor:pointer;}
#slice-label{font-size:10px;color:#556;min-width:70px;text-align:right;font-weight:700;}
#scale-bar{position:absolute;bottom:5px;right:8px;display:flex;align-items:center;gap:4px;}
.scale-line{width:30px;height:2px;background:#fff;opacity:.5;}
.scale-txt{font-size:8px;color:rgba(255,255,255,.4);font-weight:600;}
</style>
</head>
<body>
<div id="toolbar">
  <button class="tbtn on" id="btn-scroll" onclick="setMode('scroll')">⇅ Scroll</button>
  <button class="tbtn" id="btn-zoom" onclick="setMode('zoom')">🔍 Zoom</button>
  <button class="tbtn" id="btn-pan" onclick="setMode('pan')">✋ Pan</button>
  <button class="tbtn" id="btn-wl" onclick="setMode('wl')">☀ W/L</button>
  <button class="tbtn" id="btn-measure" onclick="setMode('measure')">📏 Ruler</button>
  <button class="tbtn" id="btn-ann" onclick="addAnnotation()">✏ Note</button>
  <button class="tbtn" id="btn-inv" onclick="toggleInvert()">◑ Invert</button>
  <button class="tbtn" id="btn-flip" onclick="toggleFlip()">↔ Flip</button>
  <button class="tbtn" id="btn-reset" onclick="resetView()">↺ Reset</button>
  <button class="tbtn" style="margin-left:auto;background:#1a0808;border-color:#EF5350;color:#EF5350;" onclick="sendToReport()">📤 Report</button>
</div>

<div id="viewport">
  <canvas id="c"></canvas>
  <div id="overlay">
    <div class="corner" id="tl">${safePatient}<br>${safeScan} · ${safeBody}</div>
    <div id="ai-box">🤖 ${safeFinding} · ${aiConf || '--'}%</div>
    <div class="corner" id="tr">Slice <span id="sl-num">1</span>/${sliceCount}<br><span id="zoom-num">1.0</span>x</div>
    <div class="corner" id="bl">WL: <span id="wl-val">40</span><br>WW: <span id="ww-val">80</span></div>
    <div class="corner" id="br" style="color:${riskColor};">AI RISK: ${(riskLevel||'N/A').toUpperCase()}<br>CONF: ${aiConf || '--'}%</div>
    <div id="scale-bar"><div class="scale-line"></div><span class="scale-txt">10mm</span></div>
  </div>
</div>

<div id="ww-bar">
  <button class="wbtn on" id="ww-brain" onclick="applyPreset('brain')">Brain WL:40 WW:80</button>
  <button class="wbtn" id="ww-bone" onclick="applyPreset('bone')">Bone WL:400 WW:1800</button>
  <button class="wbtn" id="ww-lung" onclick="applyPreset('lung')">Lung WL:-600 WW:1500</button>
  <button class="wbtn" id="ww-soft" onclick="applyPreset('soft')">Soft WL:60 WW:400</button>
  <button class="wbtn" id="ww-abd" onclick="applyPreset('abd')">Abdomen WL:60 WW:360</button>
</div>

<div id="slice-bar">
  <input type="range" id="slice-slider" min="1" max="${sliceCount}" value="1" oninput="setSlice(parseInt(this.value))"/>
  <span id="slice-label">Slice 1 / ${sliceCount}</span>
</div>

<script>
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var mode = 'scroll';
var currentSlice = 1;
var totalSlices = ${sliceCount};
var zoomLevel = 1.0;
var panX = 0, panY = 0;
var inverted = false;
var flipped = false;
var wl = 40, ww = 80;
var annotations = [];
var measuring = false;
var measureStart = null;
var measureEnd = null;
var lastTouch = null;
var isDragging = false;
var dragStart = {x:0,y:0};
var wlDragStart = {x:0,y:0,wl:40,ww:80};

var presets = {
  brain:  {wl:40,  ww:80},
  bone:   {wl:400, ww:1800},
  lung:   {wl:-600,ww:1500},
  soft:   {wl:60,  ww:400},
  abd:    {wl:60,  ww:360},
};

function resizeCanvas(){
  var vp = document.getElementById('viewport');
  canvas.width  = vp.clientWidth  || 360;
  canvas.height = vp.clientHeight || 400;
  draw();
}

function generateSliceData(slice, wl, ww){
  var seed = slice * 31 + wl * 7 + ww;
  var rand = function(s){ s = Math.sin(s)*10000; return s - Math.floor(s); };
  var data = [];
  var cx = canvas.width/2, cy = canvas.height/2;
  var r  = Math.min(canvas.width, canvas.height) * 0.38;
  var w  = canvas.width, h = canvas.height;
  for(var y=0;y<h;y++){
    for(var x=0;x<w;x++){
      var dx = x-cx, dy = y-cy;
      var d  = Math.sqrt(dx*dx+dy*dy);
      var v  = 0;
      if(d < r){
        var angle = Math.atan2(dy,dx);
        var base  = 180 + 60*rand(seed + x*0.3 + y*0.7);
        var skull = 0;
        if(d > r*0.82 && d < r) skull = 220 + 30*rand(seed+x+y*2);
        var brain = 0;
        if(d < r*0.82){
          brain = 100 + 60*rand(seed+x*0.5+y*0.5);
          var gyri = 20*Math.sin(angle*8 + seed*0.1)*rand(seed+x*2);
          brain += gyri;
          if(d < r*0.25){
            var ventBase = 30 + 10*rand(seed+x+y);
            brain = ventBase;
          }
        }
        v = skull + brain;
        if(slice > 5 && slice < 15 && rand(seed+x*0.1+y*0.1) > 0.97){
          v = 255;
        }
        v = Math.min(255,Math.max(0,v));
      }
      data.push(v);
    }
  }
  return data;
}

function applyWindowLevel(rawVal){
  var lo = wl - ww/2;
  var hi = wl + ww/2;
  var norm = (rawVal*1.5 - lo) / (hi - lo);
  norm = Math.min(1, Math.max(0, norm));
  return Math.round(norm * 255);
}

function draw(){
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(w/2 + panX, h/2 + panY);
  ctx.scale(flipped ? -zoomLevel : zoomLevel, zoomLevel);
  ctx.translate(-w/2, -h/2);

  var raw = generateSliceData(currentSlice, wl, ww);
  var id  = ctx.createImageData(w, h);
  for(var i=0;i<w*h;i++){
    var val = applyWindowLevel(raw[i]);
    if(inverted) val = 255-val;
    id.data[i*4]   = val;
    id.data[i*4+1] = val;
    id.data[i*4+2] = val;
    id.data[i*4+3] = 255;
  }
  ctx.putImageData(id,0,0);

  // AI heatmap overlay (slice 1-8 show abnormality)
  if(currentSlice <= 8){
    var cx=w/2, cy=h/2, r=Math.min(w,h)*0.38;
    var grd = ctx.createRadialGradient(cx+r*0.3, cy-r*0.2, 4, cx+r*0.3, cy-r*0.2, r*0.22);
    grd.addColorStop(0,'rgba(211,47,47,0.55)');
    grd.addColorStop(0.6,'rgba(255,152,0,0.25)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);
  }

  // Ruler measurement
  if(measureStart && measureEnd){
    ctx.strokeStyle='#FFD600'; ctx.lineWidth=2; ctx.setLineDash([6,3]);
    ctx.beginPath(); ctx.moveTo(measureStart.x,measureStart.y); ctx.lineTo(measureEnd.x,measureEnd.y); ctx.stroke();
    ctx.setLineDash([]);
    var dx=measureEnd.x-measureStart.x, dy=measureEnd.y-measureStart.y;
    var dist=(Math.sqrt(dx*dx+dy*dy)/2).toFixed(1);
    ctx.fillStyle='#FFD600'; ctx.font='bold 11px sans-serif';
    ctx.fillText(dist+'mm', (measureStart.x+measureEnd.x)/2+4, (measureStart.y+measureEnd.y)/2-4);
  }

  // Annotations
  annotations.forEach(function(a){
    ctx.fillStyle='rgba(0,191,165,0.9)'; ctx.font='bold 10px sans-serif';
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(a.x+6, a.y-14, ctx.measureText(a.text).width+8,18);
    ctx.fillStyle='#00BFA5';
    ctx.fillText(a.text, a.x+10, a.y);
    ctx.beginPath(); ctx.arc(a.x,a.y,4,0,Math.PI*2);
    ctx.fillStyle='#00BFA5'; ctx.fill();
  });

  ctx.restore();

  // Update HUD
  document.getElementById('sl-num').textContent  = currentSlice;
  document.getElementById('zoom-num').textContent = zoomLevel.toFixed(1);
  document.getElementById('wl-val').textContent   = wl;
  document.getElementById('ww-val').textContent   = ww;
  document.getElementById('slice-slider').value   = currentSlice;
  document.getElementById('slice-label').textContent = 'Slice '+currentSlice+' / '+totalSlices;
}

function setMode(m){
  mode=m; measuring=false; measureStart=null; measureEnd=null;
  document.querySelectorAll('.tbtn').forEach(function(b){b.classList.remove('on');});
  var el=document.getElementById('btn-'+m);
  if(el) el.classList.add('on');
  draw();
}

function setSlice(v){ currentSlice=Math.max(1,Math.min(totalSlices,v)); draw(); notify({type:'slice',slice:currentSlice}); }

function applyPreset(name){
  var p=presets[name]; if(!p) return;
  wl=p.wl; ww=p.ww;
  document.querySelectorAll('.wbtn').forEach(function(b){b.classList.remove('on');});
  document.getElementById('ww-'+name).classList.add('on');
  draw();
}

function toggleInvert(){ inverted=!inverted; document.getElementById('btn-inv').classList.toggle('on',inverted); draw(); }
function toggleFlip(){ flipped=!flipped; document.getElementById('btn-flip').classList.toggle('on',flipped); draw(); }
function resetView(){ zoomLevel=1; panX=0; panY=0; inverted=false; flipped=false; wl=40; ww=80; currentSlice=1; applyPreset('brain'); }

function addAnnotation(){
  var text=window.prompt('Annotation:','');
  if(text){
    var cx=canvas.width/2+panX, cy=canvas.height/2+panY;
    annotations.push({x:cx+Math.random()*60-30, y:cy+Math.random()*60-30, text:text});
    draw();
  }
}

function sendToReport(){ notify({type:'navigate',target:'ReportEditor'}); }

function notify(data){
  try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(data)); }catch(e){}
}

// ── Touch / Mouse Input ───────────────────────────────────────────────────────
canvas.addEventListener('touchstart', function(e){
  e.preventDefault();
  if(e.touches.length===1){
    var t=e.touches[0];
    lastTouch={x:t.clientX,y:t.clientY};
    isDragging=true;
    dragStart={x:t.clientX-panX, y:t.clientY-panY};
    wlDragStart={x:t.clientX,y:t.clientY,wl:wl,ww:ww};
    if(mode==='measure'){ measureStart={x:t.clientX,y:t.clientY}; measureEnd=null; }
  }
},{passive:false});

canvas.addEventListener('touchmove', function(e){
  e.preventDefault();
  if(e.touches.length===1 && isDragging){
    var t=e.touches[0];
    if(mode==='scroll'){
      var dy=t.clientY-(lastTouch?lastTouch.y:t.clientY);
      if(Math.abs(dy)>4){ setSlice(currentSlice + (dy>0?-1:1)); }
    } else if(mode==='pan'){
      panX=t.clientX-dragStart.x; panY=t.clientY-dragStart.y;
    } else if(mode==='zoom'){
      var dy2=t.clientY-(lastTouch?lastTouch.y:t.clientY);
      zoomLevel=Math.max(0.3,Math.min(8, zoomLevel - dy2*0.01));
    } else if(mode==='wl'){
      var dx3=t.clientX-wlDragStart.x, dy3=t.clientY-wlDragStart.y;
      wl=Math.round(wlDragStart.wl+dx3*2);
      ww=Math.max(1,Math.round(wlDragStart.ww-dy3*5));
    } else if(mode==='measure' && measureStart){
      measureEnd={x:t.clientX,y:t.clientY};
    }
    lastTouch={x:t.clientX,y:t.clientY};
    draw();
  } else if(e.touches.length===2){
    // Pinch zoom
    var t1=e.touches[0],t2=e.touches[1];
    var dist=Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY);
    if(!lastTouch.pinchDist) lastTouch.pinchDist=dist;
    zoomLevel=Math.max(0.3,Math.min(8,zoomLevel*(dist/lastTouch.pinchDist)));
    lastTouch.pinchDist=dist;
    draw();
  }
},{passive:false});

canvas.addEventListener('touchend', function(e){
  e.preventDefault();
  isDragging=false;
  if(lastTouch) delete lastTouch.pinchDist;
},{passive:false});

// Mouse (desktop WebView)
canvas.addEventListener('mousedown', function(e){
  isDragging=true;
  dragStart={x:e.clientX-panX,y:e.clientY-panY};
  wlDragStart={x:e.clientX,y:e.clientY,wl:wl,ww:ww};
  if(mode==='measure'){ measureStart={x:e.offsetX,y:e.offsetY}; measureEnd=null; }
});
canvas.addEventListener('mousemove', function(e){
  if(!isDragging) return;
  if(mode==='pan'){ panX=e.clientX-dragStart.x; panY=e.clientY-dragStart.y; }
  else if(mode==='zoom'){ zoomLevel=Math.max(0.3,Math.min(8,zoomLevel-e.movementY*0.02)); }
  else if(mode==='wl'){ wl=Math.round(wlDragStart.wl+(e.clientX-wlDragStart.x)*2); ww=Math.max(1,Math.round(wlDragStart.ww-(e.clientY-wlDragStart.y)*5)); }
  else if(mode==='scroll'){ if(e.movementY>3) setSlice(currentSlice-1); else if(e.movementY<-3) setSlice(currentSlice+1); }
  else if(mode==='measure' && measureStart){ measureEnd={x:e.offsetX,y:e.offsetY}; }
  draw();
});
canvas.addEventListener('mouseup', function(){ isDragging=false; });
canvas.addEventListener('wheel', function(e){ e.preventDefault(); setSlice(currentSlice+(e.deltaY>0?1:-1)); },{passive:false});

// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
draw();
notify({type:'loaded', slices:totalSlices});
</script>
</body>
</html>`;
};
