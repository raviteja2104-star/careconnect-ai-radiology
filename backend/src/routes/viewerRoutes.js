const express = require('express');
const router = express.Router();
const DWEB = process.env.DICOMWEB_URL || 'http://localhost:5000/api/dicomweb';

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self' http://localhost:*");
  next();
});

router.get('/', (req, res) => {
  const studyUID = req.query.studyUID || '';
  const seriesUID = req.query.seriesUID || '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>CareConnect Radiology Viewer</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#050d1a;font-family:-apple-system,sans-serif;overflow:hidden;color:#fff}
#app{display:flex;flex-direction:column;height:100vh}
#toolbar{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#08111e;border-bottom:1px solid rgba(0,229,160,0.15);flex-shrink:0}
.brand{display:flex;align-items:center;gap:8px;margin-right:12px}
.brand-icon{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#00E5A0,#00B4D8);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#0A1628}
.brand-name{color:#00E5A0;font-weight:700;font-size:13px;letter-spacing:.3px}
.brand-sub{color:#64748B;font-size:10px}
.tool-sep{width:1px;height:24px;background:rgba(255,255,255,0.1);margin:0 4px}
.tool-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid transparent;cursor:pointer;transition:all .15s;min-width:42px;color:#94A3B8;font-size:9px}
.tool-btn:hover{background:rgba(0,229,160,0.1);border-color:rgba(0,229,160,0.3);color:#00E5A0}
.tool-btn.active{background:rgba(0,229,160,0.15);border-color:#00E5A0;color:#00E5A0}
.tool-icon{font-size:15px;line-height:1}
.wl-presets{display:flex;gap:4px;margin-left:auto}
.wl-btn{padding:4px 10px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-size:10px;color:#94A3B8;transition:all .15s}
.wl-btn:hover,.wl-btn.active{background:rgba(0,180,216,0.15);border-color:#00B4D8;color:#00B4D8}
#main{display:flex;flex:1;overflow:hidden}
#viewer-wrap{flex:1;position:relative;background:#000}
#cs-canvas{width:100%;height:100%;display:block}
#meta-tl,#meta-tr,#meta-bl,#meta-br{position:absolute;padding:6px 8px;font-size:9px;color:rgba(0,229,160,0.5);font-family:monospace;line-height:1.5;pointer-events:none}
#meta-tl{top:8px;left:8px}
#meta-tr{top:8px;right:8px;text-align:right}
#meta-bl{bottom:40px;left:8px}
#meta-br{bottom:40px;right:8px;text-align:right}
#slice-bar{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:6px 12px;background:rgba(0,0,0,0.7)}
.sl-btn{width:26px;height:26px;border-radius:13px;background:rgba(255,255,255,0.08);border:none;color:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
#slice-track{flex:1;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;cursor:pointer}
#slice-fill{height:100%;background:#00E5A0;border-radius:2px;transition:width .1s}
#slice-label{font-size:10px;color:#64748B;min-width:50px;text-align:center}
#ai-panel{width:280px;background:#08111e;border-left:1px solid rgba(0,229,160,0.12);overflow-y:auto;flex-shrink:0}
#ai-header{padding:12px 14px;border-bottom:1px solid rgba(0,229,160,0.12);display:flex;align-items:center;gap:6px}
#ai-header span{color:#00E5A0;font-size:12px;font-weight:700}
.ai-badge{padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.5px}
.risk-high{background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#ef4444}
.risk-medium{background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#f59e0b}
.risk-low{background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#22c55e}
.ai-section{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.04)}
.ai-section-title{font-size:9px;color:#64748B;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:8px}
.finding-text{font-size:11px;color:#94A3B8;line-height:1.6}
.issue-row{margin-bottom:8px}
.issue-name{display:flex;justify-content:space-between;font-size:11px;color:#fff;margin-bottom:3px}
.issue-pct{color:#ef4444;font-weight:700}
.issue-loc{font-size:9px;color:#64748B;margin-bottom:3px}
.prob-bar{height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden}
.prob-fill{height:100%;background:linear-gradient(90deg,#ef4444,#f59e0b);border-radius:2px}
.rec-row{display:flex;gap:6px;margin-bottom:6px}
.rec-dot{width:4px;height:4px;border-radius:2px;background:#00E5A0;margin-top:4px;flex-shrink:0}
.rec-text{font-size:10px;color:#94A3B8;line-height:1.5}
.cta-btn{display:flex;align-items:center;justify-content:center;gap:6px;margin:12px;padding:10px;border-radius:10px;background:linear-gradient(135deg,#00E5A0,#00B4D8);color:#0A1628;font-weight:700;font-size:12px;cursor:pointer;border:none}
#loading{position:absolute;inset:0;background:#050d1a;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:100}
.spinner{width:40px;height:40px;border:3px solid rgba(0,229,160,0.15);border-top-color:#00E5A0;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.load-text{color:#94A3B8;font-size:13px}
#sim-canvas{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
</style>
</head>
<body>
<div id="app">
  <div id="toolbar">
    <div class="brand">
      <div class="brand-icon">&#10010;</div>
      <div>
        <div class="brand-name">CareConnect Radiology</div>
        <div class="brand-sub">Advanced DICOM Viewer</div>
      </div>
    </div>
    <div class="tool-sep"></div>
    <div class="tool-btn active" id="tool-pan" onclick="setTool('pan')">
      <span class="tool-icon">&#9870;</span>Pan
    </div>
    <div class="tool-btn" id="tool-zoom" onclick="setTool('zoom')">
      <span class="tool-icon">&#128269;</span>Zoom
    </div>
    <div class="tool-btn" id="tool-wl" onclick="setTool('wl')">
      <span class="tool-icon">&#9788;</span>W/L
    </div>
    <div class="tool-btn" id="tool-len" onclick="setTool('len')">
      <span class="tool-icon">&#8212;</span>Length
    </div>
    <div class="tool-btn" id="tool-ann" onclick="setTool('ann')">
      <span class="tool-icon">&#128393;</span>Annotate
    </div>
    <div class="tool-sep"></div>
    <div class="tool-btn" onclick="toggleInvert()">
      <span class="tool-icon" id="inv-icon">&#11053;</span>Invert
    </div>
    <div class="tool-btn" onclick="resetView()">
      <span class="tool-icon">&#8635;</span>Reset
    </div>
    <div class="wl-presets">
      <div class="wl-btn active" onclick="setWindow(event,'brain')">Brain</div>
      <div class="wl-btn" onclick="setWindow(event,'bone')">Bone</div>
      <div class="wl-btn" onclick="setWindow(event,'lung')">Lung</div>
      <div class="wl-btn" onclick="setWindow(event,'soft')">Soft Tissue</div>
    </div>
  </div>
  <div id="main">
    <div id="viewer-wrap">
      <div id="loading">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="brand-icon" style="width:40px;height:40px;border-radius:10px;font-size:18px">&#10010;</div>
          <div><div style="color:#00E5A0;font-weight:700;font-size:16px">CareConnect Radiology</div>
          <div style="color:#64748B;font-size:11px">Loading DICOM study&hellip;</div></div>
        </div>
        <div class="spinner"></div>
        <div class="load-text" id="load-msg">Connecting to DICOMweb server&hellip;</div>
      </div>
      <canvas id="cs-canvas"></canvas>
      <div id="meta-tl" id="meta-tl"></div>
      <div id="meta-tr"></div>
      <div id="meta-bl"></div>
      <div id="meta-br"></div>
      <div id="slice-bar">
        <button class="sl-btn" onclick="changeSlice(-1)">&#8249;</button>
        <div id="slice-track" onclick="seekSlice(event)">
          <div id="slice-fill" style="width:50%"></div>
        </div>
        <span id="slice-label">12 / 24</span>
        <button class="sl-btn" onclick="changeSlice(1)">&#8250;</button>
      </div>
    </div>
    <div id="ai-panel">
      <div id="ai-header">
        <span>&#10024; AI Analysis</span>
        <span class="ai-badge risk-high" id="risk-badge">HIGH RISK</span>
      </div>
      <div class="ai-section">
        <div class="ai-section-title">Findings</div>
        <div class="finding-text" id="ai-findings">Loading AI analysis&hellip;</div>
      </div>
      <div class="ai-section" id="issues-section">
        <div class="ai-section-title">Detected Issues</div>
        <div id="issues-list"></div>
      </div>
      <div class="ai-section" id="recs-section">
        <div class="ai-section-title">Recommendations</div>
        <div id="recs-list"></div>
      </div>
      <button class="cta-btn" onclick="openReportEditor()">
        &#128221; Write Radiology Report
      </button>
    </div>
  </div>
</div>

<script>
(function(){
'use strict';

var DWEB='${DWEB}';
var studyUID='${studyUID}';
var total=24, current=12, inverted=false;
var wlPresets={brain:{wl:40,ww:80},bone:{wl:300,ww:1500},lung:{wl:-600,ww:1500},soft:{wl:50,ww:350}};
var currentWL='brain';
var activeTool='pan';

// AI data injected via postMessage from parent or URL params
var AI={
  riskLevel:'high',confidence:0.94,
  findings:'Large hyperdense lesion in right frontal lobe (3.2x2.8 cm) with perilesional oedema. Midline shift 4mm to left.',
  detectedIssues:[
    {name:'Subdural Hematoma',probability:0.968,location:'Right frontal lobe'},
    {name:'Perilesional Oedema',probability:0.870,location:'Bilateral'},
    {name:'Midline Shift',probability:0.820,location:'Central'}
  ],
  recommendations:[
    'Immediate neurosurgical consultation required',
    'Repeat CT in 6 hours to monitor progression',
    'Consider MRI for soft-tissue characterisation'
  ]
};

// Canvas-based viewer
var canvas=document.getElementById('cs-canvas');
var ctx=canvas.getContext('2d');
var wrap=document.getElementById('viewer-wrap');

function resize(){
  var r=wrap.getBoundingClientRect();
  canvas.width=r.width;
  canvas.height=r.height-40;
  render();
}

function render(){
  if(!ctx) return;
  var W=canvas.width,H=canvas.height;
  var bg=inverted?'#e8e8e8':'#0a0a0a';
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // Brain cross-section
  var cx=W/2,cy=H/2,rx=Math.min(W,H)*0.32,ry=Math.min(W,H)*0.36;
  var sliceT=(current-1)/(total-1);
  var brainAlpha=inverted?0.18:0.14;

  ctx.save();
  // Outer skull
  ctx.beginPath();
  ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=inverted?'rgba(0,0,0,'+brainAlpha*3+')':'rgba(200,200,200,'+brainAlpha+')';
  ctx.fill();
  ctx.strokeStyle=inverted?'rgba(0,0,0,0.3)':'rgba(200,200,200,0.2)';
  ctx.lineWidth=2; ctx.stroke();

  // Brain parenchyma
  ctx.beginPath();
  ctx.ellipse(cx,cy,rx*0.82,ry*0.82,0,0,Math.PI*2);
  ctx.fillStyle=inverted?'rgba(0,0,0,0.25)':'rgba(160,160,160,0.12)';
  ctx.fill();

  // Ventricles
  ctx.beginPath();
  ctx.ellipse(cx-rx*0.12,cy,rx*0.08,ry*0.14,0,0,Math.PI*2);
  ctx.fillStyle=inverted?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.4)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx+rx*0.12,cy,rx*0.08,ry*0.14,0,0,Math.PI*2);
  ctx.fill();

  // Hematoma (high-density lesion) with animation based on slice
  if(sliceT>0.2&&sliceT<0.8){
    var hx=cx+rx*0.35,hy=cy-ry*0.2;
    var hr=Math.min(rx,ry)*(0.15+sliceT*0.08);
    ctx.beginPath();
    ctx.ellipse(hx,hy,hr,hr*0.85,0,0,Math.PI*2);
    var hg=ctx.createRadialGradient(hx,hy,0,hx,hy,hr);
    hg.addColorStop(0,inverted?'rgba(0,0,200,0.6)':'rgba(255,100,100,0.8)');
    hg.addColorStop(1,inverted?'rgba(0,0,200,0.1)':'rgba(200,50,50,0.1)');
    ctx.fillStyle=hg;
    ctx.fill();
    // AI heatmap ring
    ctx.beginPath();
    ctx.ellipse(hx,hy,hr+8,hr*0.85+8,0,0,Math.PI*2);
    ctx.strokeStyle='rgba(239,68,68,0.4)';
    ctx.lineWidth=2;
    ctx.setLineDash([4,4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Label
    ctx.fillStyle='rgba(239,68,68,0.9)';
    ctx.font='bold 9px monospace';
    ctx.fillText('Subdural 96%',hx+hr+4,hy);
  }

  ctx.restore();

  // Orientation labels
  ctx.font='bold 10px monospace';
  ctx.fillStyle=inverted?'rgba(0,100,200,0.5)':'rgba(0,229,160,0.5)';
  ctx.textAlign='center';
  ctx.fillText('S',cx,16);
  ctx.fillText('I',cx,H-50);
  ctx.textAlign='left';
  ctx.fillText('R',8,cy);
  ctx.textAlign='right';
  ctx.fillText('L',W-8,cy);
  ctx.textAlign='left';

  // Metadata overlay
  updateMeta();
}

function updateMeta(){
  var p=wlPresets[currentWL];
  document.getElementById('meta-tl').innerHTML=
    'RAVI TEJA<br>31M CT HEAD<br>'+new Date().toLocaleDateString('en-IN');
  document.getElementById('meta-tr').innerHTML=
    'ACC-2026-001<br>Apollo Diagnostics<br>CareConnect AI v2.0';
  document.getElementById('meta-bl').innerHTML=
    'Slice: '+current+'/'+total+'<br>'+
    'WL:'+p.wl+' WW:'+p.ww+'<br>'+currentWL.toUpperCase();
  document.getElementById('meta-br').innerHTML=
    'AI: '+Math.round(AI.confidence*100)+'%<br>'+
    AI.riskLevel.toUpperCase()+' RISK<br>';
}

function setTool(t){
  activeTool=t;
  document.querySelectorAll('.tool-btn').forEach(function(b){b.classList.remove('active')});
  var el=document.getElementById('tool-'+t);
  if(el) el.classList.add('active');
}

function setWindow(e,preset){
  currentWL=preset;
  document.querySelectorAll('.wl-btn').forEach(function(b){b.classList.remove('active')});
  e.currentTarget.classList.add('active');
  render();
}

function toggleInvert(){
  inverted=!inverted;
  document.getElementById('inv-icon').style.color=inverted?'#00E5A0':'';
  render();
}

function resetView(){ current=12; inverted=false; currentWL='brain'; render(); updateSliceUI(); }

function changeSlice(d){
  current=Math.max(1,Math.min(total,current+d));
  render(); updateSliceUI();
}

function seekSlice(e){
  var r=e.currentTarget.getBoundingClientRect();
  var pct=(e.clientX-r.left)/r.width;
  current=Math.max(1,Math.min(total,Math.round(pct*total)));
  render(); updateSliceUI();
}

function updateSliceUI(){
  document.getElementById('slice-label').textContent=current+' / '+total;
  document.getElementById('slice-fill').style.width=((current/total)*100)+'%';
}

// Mouse interactions
var drag=false,lastX=0,lastY=0;
canvas.addEventListener('mousedown',function(e){drag=true;lastX=e.clientX;lastY=e.clientY});
canvas.addEventListener('mouseup',function(){drag=false});
canvas.addEventListener('mousemove',function(e){
  if(!drag) return;
  var dx=e.clientX-lastX,dy=e.clientY-lastY;
  if(activeTool==='wl'){
    // simulate W/L change
    currentWL=currentWL; // would adjust in real implementation
  }
  lastX=e.clientX; lastY=e.clientY;
});
canvas.addEventListener('wheel',function(e){
  e.preventDefault();
  changeSlice(e.deltaY>0?1:-1);
},{passive:false});

// Keyboard
document.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'||e.key==='ArrowDown') changeSlice(1);
  if(e.key==='ArrowLeft'||e.key==='ArrowUp') changeSlice(-1);
  if(e.key==='i'||e.key==='I') toggleInvert();
  if(e.key==='r'||e.key==='R') resetView();
});

function openReportEditor(){
  window.parent.postMessage({type:'navigate',target:'ReportEditor',scan:{scanId:'SCAN-2026-001',scanType:'CT',bodyPart:'Head',patientName:'Ravi Teja',aiReport:AI}},'*');
}

// Load AI panel
function loadAI(){
  var rb=document.getElementById('risk-badge');
  rb.textContent=AI.riskLevel.toUpperCase()+' RISK';
  rb.className='ai-badge risk-'+AI.riskLevel;
  document.getElementById('ai-findings').textContent=AI.findings;
  var il=document.getElementById('issues-list');
  il.innerHTML=AI.detectedIssues.map(function(iss){
    var pct=Math.round(iss.probability*100);
    var col=pct>90?'#ef4444':pct>80?'#f59e0b':'#00B4D8';
    return '<div class="issue-row">'+
      '<div class="issue-name"><span>'+iss.name+'</span><span class="issue-pct" style="color:'+col+'">'+pct+'%</span></div>'+
      '<div class="issue-loc">'+iss.location+'</div>'+
      '<div class="prob-bar"><div class="prob-fill" style="width:'+pct+'%;background:'+col+'"></div></div>'+
      '</div>';
  }).join('');
  var rl=document.getElementById('recs-list');
  rl.innerHTML=AI.recommendations.map(function(r){
    return '<div class="rec-row"><div class="rec-dot"></div><div class="rec-text">'+r+'</div></div>';
  }).join('');
}

// Fetch study metadata from DICOMweb
function init(){
  var msg=document.getElementById('load-msg');
  fetch(DWEB+'/rs/studies'+(studyUID?'?StudyInstanceUIDs='+studyUID:''))
    .then(function(r){return r.json()})
    .then(function(studies){
      if(studies&&studies.length>0){
        var s=studies[0];
        msg.textContent='Study loaded \u2014 '+
          (s['00081030']&&s['00081030'].Value?s['00081030'].Value[0]:'CT Study');
      }
      return fetch(DWEB+'/rs/studies/'+(studyUID||'1.2.840.113619.2.55.3.604688119.971.1717595236.375')+'/series');
    })
    .then(function(r){return r.json()})
    .then(function(series){
      if(series&&series.length>0){
        var inst=series[0]['00201209'];
        if(inst&&inst.Value) total=inst.Value[0]||24;
      }
      document.getElementById('loading').style.display='none';
      resize();
      loadAI();
      updateSliceUI();
    })
    .catch(function(){
      document.getElementById('load-msg').textContent='\u26A0\uFE0F Demo mode \u2014 backend offline';
      setTimeout(function(){
        document.getElementById('loading').style.display='none';
        resize(); loadAI(); updateSliceUI();
      },1000);
    });
}

// Listen for AI data from parent (CareConnect app)
window.addEventListener('message',function(e){
  if(e.data&&e.data.type==='aiData') { AI=e.data.ai; loadAI(); }
});

// Expose all onclick-referenced functions to global scope
window.setTool=setTool;
window.setWindow=setWindow;
window.toggleInvert=toggleInvert;
window.resetView=resetView;
window.changeSlice=changeSlice;
window.seekSlice=seekSlice;
window.openReportEditor=openReportEditor;

window.addEventListener('resize',resize);
init();
})();
</script>
</body>
</html>`);
});

module.exports = router;
