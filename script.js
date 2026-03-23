const firebaseConfig = {
    apiKey: "AIzaSyBEatS2GakJM3G-9l9nP00Pg1dts-BB2bU",
    authDomain: "icgnube-7abb3.firebaseapp.com",
    databaseURL: "https://icgnube-7abb3-default-rtdb.firebaseio.com",
    projectId: "icgnube-7abb3",
    storageBucket: "icgnube-7abb3.firebasestorage.app",
    messagingSenderId: "523974615819",
    appId: "1:523974615819:web:f50fe767270974f31d380e"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const DATA_INCRUSTADA = null; 

const MONTHS_BASE = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
let PERIODS = ["DICIEMBRE 2025"]; MONTHS_BASE.forEach(m => PERIODS.push(`${m} 2026`));
const DAYS_IN_MONTH = 31;
const ROLES = ["Supervisor", "Tecnico de Seguridad", "Inspector"];
const ROLE_COLORS = { "Supervisor": "#2563eb", "Tecnico de Seguridad": "#16a34a", "Inspector": "#d97706" };
const PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#64748b"];
const IGNORE_SHIFT_ACTIVITIES = ["ATESTIGUAMIENTO", "INSPECCION", "MUESTREO", "DRAFT SURVEY", "INSPECCIÓN"];

const DEFAULT_SITES = ["Sidor", "Bauxilum", "Fmo", "Copal", "Palua", "Punta de Piedras"];
const DEFAULT_ACTIVITIES = ["Buque", "Gabarra", "Muestreo", "Atestiguamiento", "Draft Survey"];
const DEFAULT_EMPLOYEES = [
    { id: 1, name: "PEDRO GONZALEZ", role: "Supervisor", status: "Disponible", distanceScore: 8 }, 
    { id: 2, name: "JONNY FLORES", role: "Supervisor", status: "Disponible", distanceScore: 2 },
    { id: 3, name: "JORGE CEDEÑO", role: "Supervisor", status: "Disponible", distanceScore: 7 }, 
    { id: 4, name: "DIEGO RODRIGUEZ", role: "Supervisor", status: "Disponible", distanceScore: 5 },
    { id: 5, name: "DARIS PINTO", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 }, 
    { id: 6, name: "YENNYRES SUBERO", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 },
    { id: 7, name: "GRISBELYS ASTUDILLO", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 }, 
    { id: 8, name: "YUER MONTILLA", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 },
    { id: 9, name: "ALEXANDER MEDINA", role: "Inspector", status: "Disponible", distanceScore: 2 }, 
    { id: 10, name: "FABIAN SOTO", role: "Inspector", status: "Disponible", distanceScore: 3 },
    { id: 11, name: "AQUILES MAITA", role: "Inspector", status: "Disponible", distanceScore: 8 }, 
    { id: 12, name: "STEFANI ROJAS", role: "Inspector", status: "Disponible", distanceScore: 7 },
    { id: 13, name: "MARIA NORIEGA", role: "Inspector", status: "Disponible", distanceScore: 10 }, 
    { id: 14, name: "LEOMAR MARCANO", role: "Inspector", status: "Disponible", distanceScore: 7 },
    { id: 15, name: "JOEL RODRIGUEZ", role: "Inspector", status: "Disponible", distanceScore: 1 }, 
    { id: 16, name: "CARLOS FIGUERA", role: "Inspector", status: "Disponible", distanceScore: 1 },
    { id: 17, name: "ENRIQUE GONZALEZ", role: "Inspector", status: "Disponible", distanceScore: 6 },
    { id: 18, name: "KEINEL PALENCIA", role: "Inspector", status: "Disponible", distanceScore: 4 },
    { id: 19, name: "BRAYAN PEREZ", role: "Inspector", status: "Disponible", distanceScore: 6 }, 
    { id: 20, name: "CARLOS CORO", role: "Inspector", status: "Disponible", distanceScore: 8 }
];

let appData = { employees: [...DEFAULT_EMPLOYEES], sites: [...DEFAULT_SITES], activities: [...DEFAULT_ACTIVITIES], records: {}, historical2025: {} };
let currentEdit = { empId: null, dayIdx: null };
let isDirty = false;
let copiedRecordData = null;

function showToast(msg) {
    const toast = document.getElementById('toastNotif');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

function init() {
    if (DATA_INCRUSTADA) { loadParsedData(DATA_INCRUSTADA, true); return; }
    
    database.ref('icg_master_data').once('value').then((snapshot) => {
        const saved = snapshot.val();
        if(saved) { 
            try { loadParsedData(saved, false); } catch(e) { setupDefault(); } 
        } else { 
            setupDefault(); 
        }
    }).catch((error) => {
        console.error("Error conectando a Firebase:", error);
        alert("Hubo un problema de conexión con la Nube. Cargando sistema en blanco.");
        setupDefault();
    });
}

function save() { 
    const cleanData = JSON.parse(JSON.stringify(appData));
    
    database.ref('icg_master_data').set(cleanData)
        .then(() => { setDirty(false); showToast("☁️ ✅ Guardado en la nube"); })
        .catch((error) => { alert("⚠️ Error de conexión: No se pudo guardar el cambio en la Nube."); });
}

function setupDefault() {
    PERIODS.forEach(p => { if(!appData.records[p]) appData.records[p] = {}; });
    
    const sel = document.getElementById('monthSelector'); sel.innerHTML = '';
    const selSug = document.getElementById('monthSelectorSug'); selSug.innerHTML = '';
    
    PERIODS.forEach(p => { 
        let op = document.createElement('option'); op.value = p; op.innerText = p; sel.appendChild(op); 
        let opSug = document.createElement('option'); opSug.value = p; opSug.innerText = p; selSug.appendChild(opSug); 
    });
    
    const now = new Date(); 
    let curP = `${MONTHS_BASE[now.getMonth()]} ${now.getFullYear()}`;
    if(now.getFullYear()===2025 && now.getMonth()===11) curP="DICIEMBRE 2025";
    if(PERIODS.includes(curP)) { sel.value = curP; selSug.value = curP; }
    
    renderConfigLists(); handleMonthChange();
}

function loadParsedData(parsed, isEmbedded) {
    if(!parsed.historical2025) parsed.historical2025 = {};
    if(parsed.employees) parsed.employees.forEach(e => { if(!e.status) e.status = "Disponible"; });
    if(parsed.records) {
        const newRecords = {};
        Object.keys(parsed.records).forEach(key => { newRecords[key.toUpperCase()] = parsed.records[key]; });
        parsed.records = newRecords;
    }
    appData = parsed;
    
    if(appData.records) {
        Object.keys(appData.records).forEach(kUp => {
            if(!PERIODS.includes(kUp)) PERIODS.unshift(kUp); 
            Object.keys(appData.records[kUp]).forEach(eid => {
                let arr = appData.records[kUp][eid];
                
                if(!Array.isArray(arr) || arr.length < 31) {
                    const newArr = Array(31).fill(null);
                    if(Array.isArray(arr)) { 
                        for(let i=0; i<Math.min(arr.length, 31); i++) newArr[i] = arr[i] === undefined ? null : arr[i]; 
                    } else if (arr && typeof arr === 'object') {
                        Object.keys(arr).forEach(k => {
                            let idx = parseInt(k);
                            if(!isNaN(idx) && idx >= 0 && idx < 31) newArr[idx] = arr[k] === undefined ? null : arr[k];
                        });
                    }
                    appData.records[kUp][eid] = newArr;
                }
            });
        });
    }

    const sel = document.getElementById('monthSelector'); sel.innerHTML = '';
    const selSug = document.getElementById('monthSelectorSug'); selSug.innerHTML = '';
    
    PERIODS.forEach(p => { 
        let op = document.createElement('option'); op.value = p; op.innerText = p; sel.appendChild(op); 
        let opSug = document.createElement('option'); opSug.value = p; opSug.innerText = p; selSug.appendChild(opSug); 
    });
    
    let foundMonth = null;
    for(let i=PERIODS.length-1; i>=0; i--) {
        const p = PERIODS[i];
        if(appData.records[p]) {
            const hasData = Object.values(appData.records[p]).some(arr => arr && arr.some(r => r && (parseFloat(r.amount) > 0)));
            if(hasData) { foundMonth = p; break; }
        }
    }
    
    if(foundMonth) { 
        sel.value = foundMonth; selSug.value = foundMonth; 
    } else {
        const now = new Date(); 
        let curP = `${MONTHS_BASE[now.getMonth()]} ${now.getFullYear()}`;
        if(now.getFullYear()===2025 && now.getMonth()===11) curP="DICIEMBRE 2025";
        if(PERIODS.includes(curP)) { sel.value = curP; selSug.value = curP; }
    }
    if(isEmbedded) alert("✅ Datos cargados.");
    renderConfigLists(); handleMonthChange();
}

function syncMonths(val) {
    document.getElementById('monthSelector').value = val;
    document.getElementById('monthSelectorSug').value = val;
    handleMonthChange();
    if (document.getElementById('tab-sugerencias').classList.contains('active')) {
        renderSuggestions();
    }
}

function closeEditor() { document.getElementById('cellEditorModal').classList.remove('open'); }
function setDirty(val) { isDirty = val; const dot = document.getElementById('unsavedDot'); if(isDirty) dot.classList.add('visible'); else dot.classList.remove('visible'); }

function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    event.target.classList.add('active'); document.getElementById('tab-' + tab).classList.add('active');
    if(tab === 'nomina') handleMonthChange();
    if(tab === 'sugerencias') renderSuggestions();
    if(tab === 'graficos') renderAllCharts();
    if(tab === 'analytics') renderAnalytics();
}

function handleMonthChange() {
    const period = document.getElementById('monthSelector').value;
    const tableContainer = document.getElementById('payrollTable');
    const decContainer = document.getElementById('dec2025Container');
    const totalDisplay = document.getElementById('monthlyTotalDisplay');
    document.getElementById('printHeaderTitle').innerText = "REPORTE DE NÓMINA - " + period;
    if (period === "DICIEMBRE 2025") {
        tableContainer.style.display = 'none'; decContainer.style.display = 'block'; totalDisplay.style.visibility = 'hidden';
        renderDec2025();
    } else {
        tableContainer.style.display = 'table'; decContainer.style.display = 'none'; totalDisplay.style.visibility = 'visible';
        renderTable(period);
    }
}

function renderDec2025() {
    const tbody = document.getElementById('dec2025Body'); tbody.innerHTML = '';
    appData.employees.forEach(emp => {
        const hist = appData.historical2025[emp.id] || { month: 0, year: 0 };
        const tr = document.createElement('tr'); tr.className = 'dec2025-row';
        tr.innerHTML = `<td style="padding:10px; border-bottom:1px solid #eee;"><b>${emp.name}</b><br><small style="color:#64748b">${emp.role}</small></td><td style="padding:10px; text-align:right; border-bottom:1px solid #eee;"><input type="number" class="dec2025-input" value="${hist.month}" onchange="saveDec2025(${emp.id}, 'month', this.value)"></td><td style="padding:10px; text-align:right; border-bottom:1px solid #eee;"><input type="number" class="dec2025-input" value="${hist.year}" onchange="saveDec2025(${emp.id}, 'year', this.value)" style="color:var(--accent); font-weight:bold;"></td>`;
        tbody.appendChild(tr);
    });
}
function saveDec2025(empId, field, val) {
    if(!appData.historical2025[empId]) appData.historical2025[empId] = { month: 0, year: 0 };
    appData.historical2025[empId][field] = parseFloat(val) || 0; save();
}

function renderTable(period) {
    const tbody = document.getElementById('tableBody'); const thead = document.getElementById('tableHeader');
    const printBody = document.getElementById('printBody'); 
    tbody.innerHTML = ''; printBody.innerHTML = '';
    if(!appData.records[period]) appData.records[period] = {};
    const filter = document.getElementById('searchPayroll').value.toUpperCase();
    let h = `<th class="sticky-col sticky-col-header" style="text-align:left; min-width:140px;">EMPLEADO</th>`;
    for(let i=1; i<=DAYS_IN_MONTH; i++) h += `<th class="day-col">${i}</th>`;
    h += `<th class="center-text">TOTAL MES</th><th class="center-text">ACUM. ANUAL</th>`;
    thead.innerHTML = h;
    let grandTotal = 0; const currentYear = period.split(' ')[1];

    appData.employees.forEach(emp => {
        if(filter && !emp.name.includes(filter)) return;
        if(!appData.records[period][emp.id]) appData.records[period][emp.id] = Array(DAYS_IN_MONTH).fill(null);
        let mTotal = 0; let cells = '';
        for(let i=0; i < DAYS_IN_MONTH; i++) {
            const rec = appData.records[period][emp.id][i];
            if (rec && rec.span > 1) {
                const shiftIcon = rec.shift==='Diurno'?'☀️':(rec.shift==='Nocturno'?'🌙':'');
                const obsText = rec.obs ? `\n📝 NOTA: ${rec.obs}` : '';
                const amtNum = parseFloat(rec.amount) || 0;
                const tooltip = `💵 $${amtNum}\n📍 ${rec.site}\n⚓ ${rec.activity}\n🕒 ${rec.shift}\n📅 Días: ${rec.span}${obsText}`;
                cells += `<td colspan="${rec.span}" class="data-cell merged-cell" data-tooltip="${tooltip}" onclick="selectCell(this)" ondblclick="openEditor(${emp.id}, ${i})">${rec.obs?'<div class="obs-dot"></div>':''}<div style="font-size:0.8rem;">$${amtNum}</div><div style="font-size:0.6rem; overflow:hidden; white-space:nowrap; padding:0 2px;">${shiftIcon} ${rec.activity}</div></td>`;
                mTotal += amtNum; i += (rec.span - 1);
            } else if (rec && rec.linked) { cells += `<td class="data-cell" style="background:#f1f5f9;">-</td>`; }
            else {
                const amt = rec ? (parseFloat(rec.amount) || 0) : 0; mTotal += amt; let shiftIcon = '';
                if(rec && rec.shift === 'Diurno') shiftIcon = '<span class="shift-day" style="font-size:0.6rem;">☀</span>';
                if(rec && rec.shift === 'Nocturno') shiftIcon = '<span class="shift-night" style="font-size:0.6rem;">☾</span>';
                cells += `<td class="data-cell day-col ${amt>0?'has-data':''}" onclick="selectCell(this)" ondblclick="openEditor(${emp.id}, ${i})">${(rec&&rec.obs)?'<div class="obs-dot"></div>':''}${amt>0?amt:''}${shiftIcon}</td>`;
            }
        }
        grandTotal += mTotal;
        let yTotal = 0;
        PERIODS.filter(p => p.includes(currentYear)).forEach(p => { 
            if(appData.records[p] && appData.records[p][emp.id]) { 
                yTotal += appData.records[p][emp.id].reduce((sum, r) => sum + (r && (parseFloat(r.amount)>0) ? parseFloat(r.amount) : 0), 0); 
            } 
        });
        
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="sticky-col" style="text-align:left; padding-left:10px;"><div style="font-weight:600; font-size:0.8rem;">${emp.name}</div><div style="font-size:0.65rem; color:#64748b">${emp.role}</div></td>${cells}<td class="total-cell-month center-text">${mTotal}</td><td class="total-cell-year center-text">${yTotal}</td>`;
        tbody.appendChild(tr);
        const trPrint = document.createElement('tr');
        trPrint.innerHTML = `<td>${emp.name}<br><small style="font-style:italic;">${emp.role}</small></td><td class="text-center">$${mTotal.toLocaleString()}</td><td class="text-center">$${yTotal.toLocaleString()}</td>`;
        printBody.appendChild(trPrint);
    });
    document.getElementById('monthTotal').innerText = grandTotal.toLocaleString();
}

function selectCell(cell) { document.querySelectorAll('.selected-cell').forEach(c => c.classList.remove('selected-cell')); cell.classList.add('selected-cell'); }

function openEditor(eid, dix) {
    currentEdit = { empId: eid, dayIdx: dix };
    const p = document.getElementById('monthSelector').value;
    const emp = appData.employees.find(e => e.id == eid);
    const rec = appData.records[p][eid][dix];
    document.getElementById('modalTitle').innerText = `${emp.name}`;
    let start = dix + 1; let end = dix + 1; let val = rec ? (parseFloat(rec.amount)||'') : '';
    if (rec && rec.span > 1) { end = start + rec.span - 1; }
    document.getElementById('editorStartDay').value = start;
    document.getElementById('editorEndDay').value = end;
    document.getElementById('editorAmount').value = val;
    document.getElementById('editorShift').value = rec ? rec.shift : 'Diurno';
    document.getElementById('editorObs').value = rec ? (rec.obs || '') : '';
    fillSelect('editorRole', ROLES, rec ? rec.role : emp.role);
    fillSelectOther('editorSite', appData.sites, rec ? rec.site : '');
    fillSelectOther('editorActivity', appData.activities, rec ? rec.activity : '');
    document.getElementById('cellEditorModal').classList.add('open');
}

function copyRecord() {
    copiedRecordData = {
        span: parseInt(document.getElementById('editorEndDay').value) - parseInt(document.getElementById('editorStartDay').value),
        amount: document.getElementById('editorAmount').value,
        role: document.getElementById('editorRole').value,
        site: document.getElementById('editorSite').value,
        siteOther: document.getElementById('editorSiteOther').value,
        activity: document.getElementById('editorActivity').value,
        activityOther: document.getElementById('editorActivityOther').value,
        obs: document.getElementById('editorObs').value
    };
    showToast("📋 ¡Copiado! Ahora abre otra casilla y dale Pegar.");
}

function pasteRecord() {
    if (!copiedRecordData) { alert("⚠️ No has copiado ninguna guardia todavía."); return; }
    const startD = parseInt(document.getElementById('editorStartDay').value);
    let newEnd = startD + copiedRecordData.span;
    if (newEnd > 31) newEnd = 31; 
    document.getElementById('editorEndDay').value = newEnd;
    document.getElementById('editorAmount').value = copiedRecordData.amount;
    document.getElementById('editorRole').value = copiedRecordData.role;
    document.getElementById('editorSite').value = copiedRecordData.site;
    if (copiedRecordData.site === 'OTRO') {
        document.getElementById('editorSiteOther').value = copiedRecordData.siteOther;
        document.getElementById('editorSiteOther').classList.add('visible');
    } else { document.getElementById('editorSiteOther').classList.remove('visible'); }
    
    document.getElementById('editorActivity').value = copiedRecordData.activity;
    if (copiedRecordData.activity === 'OTRO') {
        document.getElementById('editorActivityOther').value = copiedRecordData.activityOther;
        document.getElementById('editorActivityOther').classList.add('visible');
    } else { document.getElementById('editorActivityOther').classList.remove('visible'); }

    document.getElementById('editorObs').value = copiedRecordData.obs;
    showToast("📥 Datos pegados. ¡Verifica el Turno y dale Guardar!");
}

function deleteRecord() {
    if (!confirm("⚠️ ¿Estás seguro de querer BORRAR esta guardia por completo?")) return;
    const p = document.getElementById('monthSelector').value;
    const startD = parseInt(document.getElementById('editorStartDay').value) - 1;
    const oldRec = appData.records[p][currentEdit.empId][startD];
    const oldSpan = oldRec ? (oldRec.span || 1) : 1;
    for(let i = 0; i < oldSpan; i++) { if(startD + i < 31) { appData.records[p][currentEdit.empId][startD + i] = null; } }
    save(); closeEditor(); renderTable(p);
    showToast("🗑️ Guardia eliminada con éxito");
}

function saveEditor() {
    const startD = parseInt(document.getElementById('editorStartDay').value);
    const endD = parseInt(document.getElementById('editorEndDay').value);
    const amount = parseFloat(document.getElementById('editorAmount').value);
    const p = document.getElementById('monthSelector').value;
    if (endD > 31) { alert("⚠️ ERROR: El mes termina el día 31."); return; }
    if (endD < startD) { alert("⚠️ ERROR: Fecha final menor a inicial."); return; }

    let userRow = appData.records[p][currentEdit.empId];
    if (!userRow) { userRow = Array(31).fill(null); } 
    else if (userRow.length < 31) { while (userRow.length < 31) { userRow.push(null); } }
    appData.records[p][currentEdit.empId] = userRow;

    const oldRec = userRow[currentEdit.dayIdx];
    const oldSpan = oldRec ? (oldRec.span || 1) : 1;
    for(let d=0; d<oldSpan; d++) { if(currentEdit.dayIdx + d < 31) userRow[currentEdit.dayIdx + d] = null; }

    const span = endD - startD + 1;
    for(let d=startD; d<=endD; d++) { userRow[d-1] = null; } 
    
    if (amount > 0) {
        const commonData = { role: document.getElementById('editorRole').value, site: getSelectVal('editorSite'), activity: getSelectVal('editorActivity'), shift: document.getElementById('editorShift').value, obs: document.getElementById('editorObs').value };
        userRow[startD-1] = { amount: amount, span: span, ...commonData };
        for(let k=1; k < span; k++) { userRow[startD-1+k] = { amount: 0, linked: true, span: 0, ...commonData }; }
    }
    save(); closeEditor(); renderTable(p);
}

function renderSuggestions() {
    const grid = document.getElementById('suggestionGrid'); grid.innerHTML = '';
    const p = document.getElementById('monthSelectorSug').value; 
    const currentYear = p.split(' ')[1];
    const pIdx = PERIODS.indexOf(p);
    
    ROLES.forEach(role => {
        const group = appData.employees.filter(e => e.role === role);
        const activeGroup = group.filter(e => e.status !== "Vacaciones" && e.status !== "Reposo");
        const ranking = activeGroup.map(emp => {
            let cur = 0;
            if(p === "DICIEMBRE 2025") cur = (appData.historical2025[emp.id]?.month || 0);
            else if(appData.records[p] && appData.records[p][emp.id]) cur = appData.records[p][emp.id].reduce((a,b)=>a+(b ? parseFloat(b.amount)||0 : 0), 0);
            
            let prev = 0;
            if(pIdx > 0) {
                const prevP = PERIODS[pIdx-1];
                if(prevP === "DICIEMBRE 2025") { prev = (appData.historical2025[emp.id]?.month || 0); } 
                else { if(appData.records[prevP] && appData.records[prevP][emp.id]) { prev = appData.records[prevP][emp.id].reduce((a,b)=>a+(b ? parseFloat(b.amount)||0 : 0), 0); } }
            }
            
            let ann = 0;
            if(p.includes("2025")) ann = (appData.historical2025[emp.id]?.year || 0);
            else PERIODS.filter(x => x.includes(currentYear)).forEach(x => { 
                if(appData.records[x]&&appData.records[x][emp.id]) ann += appData.records[x][emp.id].reduce((a,b)=>a+(b ? parseFloat(b.amount)||0 : 0), 0); 
            });
            
            return { name: emp.name, cur, prev, ann, lastOp: getLastOperationalShift(emp.id), status: emp.status };
        });
        
        ranking.sort((a,b) => {
            if (a.status === "En Guardia" && b.status !== "En Guardia") return 1;
            if (a.status !== "En Guardia" && b.status === "En Guardia") return -1;
            const bimestralA = a.cur + a.prev;
            const bimestralB = b.cur + b.prev;
            if (bimestralA !== bimestralB) return bimestralA - bimestralB;
            return a.ann - b.ann;
        });

        const thresh = role === 'Inspector' ? 4 : 2;
        let rows = '';
        ranking.forEach((r, i) => {
            const isLow = (i < thresh && r.status !== "En Guardia"); 
            let nextInfo = '';
            if(r.lastOp) { nextInfo = `<span class="shift-info">Últ: <span class="badge-shift ${r.lastOp.shift==='Diurno'?'shift-day':'shift-night'}">${r.lastOp.shift.substring(0,1)}</span> (${r.lastOp.activity.substring(0,6)}..)</span>`; }
            else { nextInfo = '<span class="shift-info" style="color:#cbd5e1">-</span>'; }
            let statusBadge = '';
            if(r.status === "En Guardia") statusBadge = `<span class="badge-status-busy">⚠️ OCUPADO</span>`;
            rows += `<tr style="${r.status==='En Guardia'?'background:#fffbeb; opacity:0.7':''}"><td>${statusBadge} ${isLow ? '<span class="badge-low">BAJO</span> ' : ''}<b>${r.name}</b>${nextInfo}</td><td class="money" style="color:${r.cur<1?'#dc2626':'#16a34a'}">$${r.cur}</td><td class="money prev-month">$${r.prev}</td><td class="money" style="color:var(--accent)">$${r.ann}</td></tr>`;
        });
        const card = document.createElement('div'); card.className='dash-card';
        card.id = `card-sug-${role}`; 
        card.innerHTML = `<div class="dash-title">${role}</div><table class="rank-table" id="table-sug-${role}"><thead><tr><th>Nombre</th><th>Mes Actual</th><th>Mes Ant.</th><th>Anual</th></tr></thead><tbody>${rows}</tbody></table>`;
        grid.appendChild(card);
    });
}

function printSuggestions() {
    const printArea = document.getElementById('printSuggestionsSection');
    const p = document.getElementById('monthSelectorSug').value;
    printArea.innerHTML = '';
    let html = `<div class="sug-header">REPORTE DE ASIGNACIÓN DE GUARDIAS</div>`;
    html += `<div class="sug-sub">Generado el: ${new Date().toLocaleDateString()} | Periodo Base: ${p}</div>`;
    html += `<div style="font-size:9pt; margin-bottom:15px;"><i>Nota: Ordenados por prioridad de asignación (Menor suma Bimestral [Mes Actual + Anterior] > Menor Anual).</i></div>`;
    const pluralMap = { "Supervisor": "Supervisores", "Tecnico de Seguridad": "Técnicos de Seguridad", "Inspector": "Inspectores" };
    ROLES.forEach(role => {
        const cardTable = document.getElementById(`table-sug-${role}`);
        if (cardTable) {
            const title = pluralMap[role] || role + "s";
            html += `<div class="print-block">`; 
            html += `<h3 style="margin-bottom:5px; border-bottom:1px solid #ccc; page-break-after: avoid;">${title}</h3>`;
            html += `<table class="sug-print-table">`;
            html += `<thead><tr style="background:#f1f5f9;"><th>Nombre</th><th style="text-align:right;">Mes Actual</th><th style="text-align:right;">Mes Ant.</th><th style="text-align:right;">Anual</th><th>Última Actividad</th><th>Estatus</th></tr></thead><tbody>`;
            const rows = cardTable.querySelectorAll('tbody tr');
            rows.forEach(r => {
                const cells = r.querySelectorAll('td');
                const nameText = cells[0].querySelector('b').innerText;
                const lastTurn = cells[0].querySelector('.shift-info') ? cells[0].querySelector('.shift-info').innerText : '-';
                const badgeBusy = cells[0].querySelector('.badge-status-busy') ? 'OCUPADO' : 'DISPONIBLE';
                html += `<tr><td><b>${nameText}</b></td><td style="text-align:right;">${cells[1].innerText}</td><td style="text-align:right;">${cells[2].innerText}</td><td style="text-align:right;">${cells[3].innerText}</td><td>${lastTurn}</td><td>${badgeBusy === 'OCUPADO' ? '<span class="badge-print">OCUPADO</span>' : 'DISPONIBLE'}</td></tr>`;
            });
            html += `</tbody></table></div>`;
        }
    });
    printArea.innerHTML = html;
    document.body.classList.add('printing-suggestions');
    window.print();
    document.body.classList.remove('printing-suggestions');
}

function printPayroll() {
    document.body.classList.add('printing-payroll');
    window.print();
    document.body.classList.remove('printing-payroll');
}

function renderAnalytics() {
    let stats = { 2025: { total: 0, roles: { 'Supervisor':0, 'Tecnico de Seguridad':0, 'Inspector':0 } }, 2026: { total: 0, roles: { 'Supervisor':0, 'Tecnico de Seguridad':0, 'Inspector':0 } } };
    let siteMap = {};
    let monthStats = {};
    appData.employees.forEach(emp => {
        const hist = appData.historical2025[emp.id];
        if (hist && hist.year > 0) {
            stats[2025].total += hist.year;
            if(stats[2025].roles[emp.role] !== undefined) stats[2025].roles[emp.role] += hist.year;
        }
    });
    PERIODS.forEach(p => {
        if(!appData.records[p]) return;
        const year = p.includes("2025") ? 2025 : 2026;
        if (year === 2026) { if (!monthStats[p]) monthStats[p] = { total: 0, roles: { 'Supervisor':0, 'Tecnico de Seguridad':0, 'Inspector':0 } }; }
        Object.keys(appData.records[p]).forEach(eId => {
            const emp = appData.employees.find(x => x.id == eId);
            if(!emp) return;
            appData.records[p][eId].forEach(r => {
                if(r && (parseFloat(r.amount) > 0)) {
                    const amtNum = parseFloat(r.amount);
                    stats[year].total += amtNum;
                    let actualRole = r.role || emp.role;
                    if(stats[year].roles[actualRole] !== undefined) { stats[year].roles[actualRole] += amtNum; }
                    if (year === 2026) {
                        monthStats[p].total += amtNum;
                        if(monthStats[p].roles[actualRole] !== undefined) { monthStats[p].roles[actualRole] += amtNum; }
                    }
                    if(!siteMap[r.site]) siteMap[r.site] = 0; siteMap[r.site] += amtNum;
                }
            });
        });
    });
    const container = document.getElementById('analyticsContainer');
    container.innerHTML = `${renderYearCard(2025, stats[2025])}${renderYearCard(2026, stats[2026])}`;
    const monthContainer = document.getElementById('monthlyAnalyticsContainer');
    let monthHtml = '';
    Object.keys(monthStats).forEach(m => {
        if (monthStats[m].total > 0) { monthHtml += renderMonthCard(m, monthStats[m]); }
    });
    monthContainer.innerHTML = monthHtml;
    const sitesContainer = document.getElementById('sitesChart'); sitesContainer.innerHTML = '';
    const totalGlobal = stats[2025].total + stats[2026].total;
    Object.keys(siteMap).sort((a,b)=>siteMap[b]-siteMap[a]).forEach(s => {
        const pct = totalGlobal > 0 ? (siteMap[s] / totalGlobal) * 100 : 0;
        const row = document.createElement('div'); row.className = 'bar-chart-row';
        row.innerHTML = `<div class="bar-label" title="${s}">${s}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%">$${siteMap[s].toLocaleString()}</div></div>`;
        sitesContainer.appendChild(row);
    });
    renderAnalyticsCharts();
}

function renderMonthCard(month, data) {
    const rolesHtml = Object.keys(data.roles)
        .filter(r => data.roles[r] > 0)
        .map(r => `<div class="role-row"><span>${r}</span><strong>$${data.roles[r].toLocaleString()}</strong></div>`)
        .join('');
    return `<div class="month-card"><h4 style="margin:0; color:#10b981">${month}</h4><div class="big-number">$${data.total.toLocaleString()}</div><div style="margin-top:10px; font-size: 0.85rem;">${rolesHtml || '<div style="color:#94a3b8; font-style:italic;">Sin registros</div>'}</div></div>`;
}

function renderAnalyticsCharts() {
    const chartPeriods = PERIODS.filter(p => p !== "DICIEMBRE 2025");
    const monthlyData = chartPeriods.map(p => {
        let mTotal = 0; let mRoles = { 'Supervisor': 0, 'Tecnico de Seguridad': 0, 'Inspector': 0 };
        if(appData.records[p]) {
            Object.keys(appData.records[p]).forEach(eId => {
                const emp = appData.employees.find(x => x.id == eId);
                if(!emp) return;
                appData.records[p][eId].forEach(r => {
                    if(r && (parseFloat(r.amount) > 0)) {
                        const amtNum = parseFloat(r.amount);
                        mTotal += amtNum;
                        let actualRole = r.role || emp.role;
                        if(mRoles[actualRole] !== undefined) mRoles[actualRole] += amtNum;
                    }
                });
            });
        }
        return { label: p, total: mTotal, roles: mRoles };
    });

    const globalSeries = [{ name: "Total Global", values: monthlyData.map(d => d.total), color: "#F29100", id: "g-total", visible: true }];
    drawSVG(document.getElementById('chart-GlobalMonthly'), document.getElementById('legend-GlobalMonthly'), globalSeries, chartPeriods);

    const roleSeries = [
        { name: "Supervisor", values: monthlyData.map(d => d.roles['Supervisor']), color: ROLE_COLORS['Supervisor'], id: "r-sup", visible: !hiddenSeries["r-sup"] },
        { name: "Técnico", values: monthlyData.map(d => d.roles['Tecnico de Seguridad']), color: ROLE_COLORS['Tecnico de Seguridad'], id: "r-tec", visible: !hiddenSeries["r-tec"] },
        { name: "Inspector", values: monthlyData.map(d => d.roles['Inspector']), color: ROLE_COLORS['Inspector'], id: "r-ins", visible: !hiddenSeries["r-ins"] }
    ];
    drawSVG(document.getElementById('chart-RoleMonthly'), document.getElementById('legend-RoleMonthly'), roleSeries, chartPeriods);
}

function renderYearCard(year, data) { return `<div class="year-card y${year}"><h3 style="margin:0; color:${year===2025?'#475569':'var(--accent)'}">Año ${year}</h3><div class="big-number">$${data.total.toLocaleString()}</div><div style="margin-top:15px;">${Object.keys(data.roles).map(r => `<div class="role-row"><span>${r}</span><strong>$${data.roles[r].toLocaleString()}</strong></div>`).join('')}</div></div>`; }

let hiddenSeries = {};
function toggleSeries(seriesId) { if (hiddenSeries[seriesId]) { delete hiddenSeries[seriesId]; } else { hiddenSeries[seriesId] = true; } renderAllCharts(); renderAnalytics(); }
function renderAllCharts() { renderChart('Supervisor'); renderChart('Tecnico de Seguridad'); renderChart('Inspector'); }

function renderChart(roleFilter) {
    const idBase = roleFilter.split(' ')[0];
    const container = document.getElementById(`chart-${idBase}`); const legCont = document.getElementById(`legend-${idBase}`); 
    if(!container) return; container.innerHTML = ''; legCont.innerHTML = '';
    const employees = appData.employees.filter(e => e.role === roleFilter);
    const chartPeriods = PERIODS.filter(p => p !== "DICIEMBRE 2025");

    const dataSeries = employees.map((e, idx) => {
        const sId = `line-${idBase}-${idx}`;
        const vals = chartPeriods.map(p => {
            if(appData.records[p] && appData.records[p][e.id]) return appData.records[p][e.id].reduce((s,r)=>s+(r?parseFloat(r.amount)||0:0),0);
            return 0;
        });
        return { name: e.name, values: vals, color: PALETTE[idx % PALETTE.length], id: sId, visible: !hiddenSeries[sId] };
    });
    drawSVG(container, legCont, dataSeries, chartPeriods);
}

function drawSVG(container, legCont, dataSeries, labels) {
    container.innerHTML = ''; legCont.innerHTML = '';
    let maxVal = 0; dataSeries.forEach(s => { if(s.visible) maxVal = Math.max(maxVal, ...s.values); });
    if(maxVal === 0) maxVal = 1000;
    const w = container.clientWidth; const h = container.clientHeight; const padL=40, padB=25, padT=10; const chW=w-padL-10, chH=h-padB-padT;
    const ns = "http://www.w3.org/2000/svg"; const svg = document.createElementNS(ns, "svg"); svg.setAttribute("class", "chart-svg");
    for(let i=0; i<=5; i++) {
        const y = (padT+chH) - (i/5*chH); const v = Math.round((i/5)*maxVal);
        const l = document.createElementNS(ns,"line"); l.setAttribute("x1",padL); l.setAttribute("y1",y); l.setAttribute("x2",w); l.setAttribute("y2",y); l.setAttribute("class","grid-line"); svg.appendChild(l);
        const t = document.createElementNS(ns,"text"); t.setAttribute("x",padL-5); t.setAttribute("y",y+3); t.setAttribute("text-anchor","end"); t.setAttribute("class","axis-text"); t.textContent = `$${v}`; svg.appendChild(t);
    }
    const xStep = chW / (labels.length - 1 || 1);
    labels.forEach((p, i) => {
        const x = padL + i * xStep;
        const t = document.createElementNS(ns,"text"); t.setAttribute("x",x); t.setAttribute("y",h-5); t.setAttribute("text-anchor","middle"); t.setAttribute("class","axis-text");
        t.textContent = p.includes("2025") ? "DIC'25" : p.split(' ')[0].substr(0,3); svg.appendChild(t);
    });
    dataSeries.forEach(s => {
        const li = document.createElement("div"); li.className = `legend-item ${s.visible ? '' : 'inactive'}`; 
        li.innerHTML=`<div class="legend-color" style="background:${s.color}"></div><div class="legend-text">${s.name}</div>`;
        li.onclick = () => toggleSeries(s.id); li.onmouseenter=()=> { if(s.visible) highlight(svg,s.id); }; li.onmouseleave=()=> { if(s.visible) unhighlight(svg); }; 
        legCont.appendChild(li);
        if(!s.visible) return; 
        let d=""; s.values.forEach((v,i)=>{ const x=padL+i*xStep; const y=(padT+chH)-(v/maxVal)*chH; d+=(i===0?"M":"L")+` ${x} ${y}`; 
            const pt=document.createElementNS(ns,"circle"); pt.setAttribute("cx",x); pt.setAttribute("cy",y); pt.setAttribute("r",3); pt.setAttribute("stroke",s.color); pt.setAttribute("class",`chart-point point-${s.id}`);
            pt.addEventListener('mouseenter',(e)=>showTooltip(e,s.name,labels[i],v)); pt.addEventListener('mouseleave',hideTooltip); svg.appendChild(pt);
        });
        const pth=document.createElementNS(ns,"path"); pth.setAttribute("d",d); pth.setAttribute("stroke",s.color); pth.setAttribute("class",`chart-line line-${s.id}`); svg.prepend(pth);
    });
    container.appendChild(svg);
}

function highlight(svg, id) { svg.querySelectorAll('.chart-line,.chart-point').forEach(e=>e.classList.add('faded')); svg.querySelectorAll(`.line-${id},.point-${id}`).forEach(e=>{e.classList.remove('faded');e.classList.add('highlight');}); }
function unhighlight(svg) { svg.querySelectorAll('*').forEach(e=>{e.classList.remove('faded');e.classList.remove('highlight');}); }
const tt=document.getElementById('globalTooltip');
function showTooltip(e,n,p,v){tt.style.display='block';tt.style.left=(e.pageX+10)+'px';tt.style.top=(e.pageY-20)+'px';tt.innerHTML=`<strong>${n}</strong><br>${p}: $${v}`;}
function hideTooltip(){tt.style.display='none';}

function renderL(id,arr,fmt,del){const el=document.getElementById(id);if(!el)return;el.innerHTML='';arr.forEach((x,i)=>{const l=document.createElement('li');l.className='list-item';l.innerHTML=fmt(x);const b=document.createElement('button');b.className='delete-btn';b.innerText='✕';b.onclick=()=>{del(x.id?x.id:i);save();renderConfigLists();};l.appendChild(b);el.appendChild(l);});}
function renderConfigLists(){renderL('employeeList',appData.employees,e=>`<div style="display:flex;align-items:center;width:100%;gap:10px;"><div style="flex:1;min-width:120px;"><b>${e.name}</b></div><select class="role-select" onchange="changeRole(${e.id},this.value)"><option value="Supervisor" ${e.role==='Supervisor'?'selected':''}>Supervisor</option><option value="Tecnico de Seguridad" ${e.role==='Tecnico de Seguridad'?'selected':''}>Técnico</option><option value="Inspector" ${e.role==='Inspector'?'selected':''}>Inspector</option></select><select class="status-select ${getStatusClass(e.status)}" onchange="changeStatus(${e.id},this.value)"><option value="Disponible" ${e.status==='Disponible'?'selected':''}>🟢 Disp.</option><option value="En Guardia" ${e.status==='En Guardia'?'selected':''}>🟡 Guardia</option><option value="Vacaciones" ${e.status==='Vacaciones'?'selected':''}>🔴 Vacac.</option><option value="Reposo" ${e.status==='Reposo'?'selected':''}>🔴 Reposo</option></select></div>`,(id)=>{deleteEmployee(id);});renderL('siteList',appData.sites,s=>s,i=>appData.sites.splice(i,1));renderL('activityList',appData.activities,a=>a,i=>appData.activities.splice(i,1));}
function getStatusClass(s){if(s==='Disponible')return 'st-active';if(s==='En Guardia')return 'st-busy';return 'st-vacation';}
function fillSelect(id,opts,sel){const el=document.getElementById(id);el.innerHTML='';opts.forEach(o=>{const op=document.createElement('option');op.value=o;op.innerText=o;if(o===sel)op.selected=true;el.appendChild(op);});}
function fillSelectOther(id,opts,sel){const el=document.getElementById(id);el.innerHTML='';let found=false;opts.forEach(o=>{const op=document.createElement('option');op.value=o;op.innerText=o;if(o===sel){op.selected=true;found=true;}el.appendChild(op);});const otherOp=document.createElement('option');otherOp.value='OTRO';otherOp.innerText='OTRO (Escribir manual)';el.appendChild(otherOp);const baseId=id.replace('editor','');const otherInput=document.getElementById(id+'Other');if(sel&&!found){el.value='OTRO';otherInput.value=sel;otherInput.classList.add('visible');}else{otherInput.classList.remove('visible');otherInput.value='';}}
function checkOther(type){const sel=document.getElementById('editor'+type);const inp=document.getElementById('editor'+type+'Other');if(sel.value==='OTRO')inp.classList.add('visible');else inp.classList.remove('visible');}
function getSelectVal(id){const sel=document.getElementById(id);if(sel.value==='OTRO')return document.getElementById(id+'Other').value.toUpperCase();return sel.value;}
function addEmployee(){const n=document.getElementById('newEmpName').value.toUpperCase();if(n){appData.employees.push({id:Date.now(),name:n,role:document.getElementById('newEmpRole').value,status:'Disponible'});save();renderConfigLists();document.getElementById('newEmpName').value='';}}
function addSite(){const n=document.getElementById('newSiteName').value.toUpperCase();if(n&&!appData.sites.includes(n)){appData.sites.push(n);save();renderConfigLists();document.getElementById('newSiteName').value='';}}
function addActivity(){const n=document.getElementById('newActivityName').value.toUpperCase();if(n&&!appData.activities.includes(n)){appData.activities.push(n);save();renderConfigLists();document.getElementById('newActivityName').value='';}}
function getLastOperationalShift(empId){const currentP=document.getElementById('monthSelectorSug').value;const pIdx=PERIODS.indexOf(currentP);for(let i=pIdx;i>=0;i--){const pName=PERIODS[i];if(pName==="DICIEMBRE 2025")continue;const userRecs=appData.records[pName][empId];if(!userRecs)continue;for(let d=30;d>=0;d--){const rec=userRecs[d];if(rec&&rec.activity){const actUpper=rec.activity.toUpperCase();let ignored=false;for(let ign of IGNORE_SHIFT_ACTIVITIES)if(actUpper.includes(ign))ignored=true;if(!ignored&&(rec.shift==='Diurno'||rec.shift==='Nocturno'))return{shift:rec.shift,activity:rec.activity,date:`Dia ${d+1} ${pName.slice(0,3)}`};}}}return null;}
function changeStatus(id,newStatus){const emp=appData.employees.find(e=>e.id==id);if(emp){emp.status=newStatus;save();renderSuggestions();}}
function changeRole(id,newRole){const emp=appData.employees.find(e=>e.id==id);if(emp){emp.role=newRole;save();renderConfigLists();renderSuggestions();renderAllCharts();renderAnalytics();}}
function setAllAvailable(){if(!confirm("¿Estás seguro de poner a TODOS los empleados en estado 'Disponible'?"))return;appData.employees.forEach(e=>e.status="Disponible");save();renderConfigLists();renderSuggestions();alert("Todo el personal está ahora disponible.");}
function deleteEmployee(id){if(confirm('¿Eliminar empleado? Esto borrará su historial.')){appData.employees=appData.employees.filter(e=>e.id!==id);save();renderConfigLists();}}
function exportToExcel(){const table=document.getElementById('payrollTable');const p=document.getElementById('monthSelector').value;const html=table.outerHTML;const url='data:application/vnd.ms-excel;charset=utf-8,'+encodeURIComponent(html);const downloadLink=document.createElement("a");document.body.appendChild(downloadLink);downloadLink.href=url;downloadLink.download=`Nomina_${p}.xls`;downloadLink.click();document.body.removeChild(downloadLink);}
async function downloadData(){const str=JSON.stringify(appData);try{const handle=await window.showSaveFilePicker({suggestedName:'icg_backup.json',types:[{description:'JSON File',accept:{'application/json':['.json']}}]});const writable=await handle.createWritable();await writable.write(str);await writable.close();}catch(err){if(err.name!=='AbortError'){const a=document.createElement('a');a.href="data:text/json;charset=utf-8,"+encodeURIComponent(str);a.download="icg_backup_v1.0.json";document.body.appendChild(a);a.click();a.remove();}}setDirty(false);}

function loadBackup(input){
    const reader=new FileReader();
    reader.onload=e=>{
        let raw=e.target.result;
        if(raw.charCodeAt(0)===0xFEFF){raw=raw.slice(1);}
        try {
            const parsed=JSON.parse(raw);
            loadParsedData(parsed, false);
            save(); 
            alert("✅ Archivo cargado correctamente y sincronizado con la Nube.");
        } catch(x) {
            console.error(x); alert("❌ Error: "+x.message);
        }
    };
    reader.readAsText(input.files[0]);
}

function inspectData(){if(!appData.records){alert("No hay datos cargados.");return;}let msg="📅 PERIODOS ENCONTRADOS EN LA NUBE:\n\n";Object.keys(appData.records).forEach(k=>{const count=Object.values(appData.records[k]).reduce((acc,curr)=>acc+(curr?curr.filter(x=>x&&(parseFloat(x.amount)>0)).length:0),0);msg+=`• ${k}: ${count} registros\n`;});alert(msg);}
function openBaseModal(){const container=document.getElementById('baseList');container.innerHTML='';appData.employees.forEach(emp=>{const hist=appData.historical2025[emp.id]||{year:0};const row=document.createElement('div');row.style.display='flex';row.style.justifyContent='space-between';row.style.alignItems='center';row.innerHTML=`<span style="font-size:0.85rem; font-weight:bold;">${emp.name}</span><input type="number" id="base_year_${emp.id}" value="${hist.year}" class="compact-input" style="width:100px; text-align:right;">`;container.appendChild(row);});document.getElementById('baseModal').classList.add('open');}
function saveBases(){appData.employees.forEach(emp=>{const val=parseFloat(document.getElementById(`base_year_${emp.id}`).value)||0;if(!appData.historical2025[emp.id])appData.historical2025[emp.id]={month:0,year:0};appData.historical2025[emp.id].year=val;});save();document.getElementById('baseModal').classList.remove('open');renderAnalytics();}

function resetData(){
    if(confirm("⚠️ ¿Borrar todo de la nube? Esto no se puede deshacer.")){
        database.ref('icg_master_data').remove().then(() => {
            location.reload();
        });
    }
}

init();