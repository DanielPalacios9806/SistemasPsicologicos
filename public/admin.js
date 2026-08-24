const state = { user:null, overview:null, applications:[], campaigns:[], staff:[], directory:[] };
const viewMeta = {
  overview:["Panel institucional","Resumen operativo"],
  results:["Evaluaciones","Resultados y exportación"],
  directory:["Administración","Personal registrado"],
  campaigns:["Administración","Campañas de evaluación"],
  staff:["Seguridad","Accesos de personal"],
};

function renderIcons() {
  window.lucide?.createIcons({ attrs:{ "stroke-width":1.8 } });
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

async function request(path, options={}) {
  const response = await fetch(path, options);
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (response.status === 401) {
    window.location.replace("/login.html");
    throw new Error("La sesión expiró.");
  }
  if (!response.ok) {
    if (payload.mustChangePassword) window.location.replace("/login.html?change=1");
    throw new Error(payload.error || "No se pudo completar la operación.");
  }
  return payload;
}

function showAlert(message, success=false) {
  const alert = document.getElementById("adminAlert");
  alert.textContent = message;
  alert.className = `admin-alert${success ? " success" : ""}`;
  clearTimeout(showAlert.timer);
  showAlert.timer = setTimeout(() => alert.classList.add("hidden"), 4500);
}

function formatDate(value, dateOnly=false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-EC", dateOnly ? { dateStyle:"medium" } : { dateStyle:"medium", timeStyle:"short" }).format(date);
}

function statusLabel(status) {
  return { pending:"Pendiente", in_progress:"En progreso", completed:"Completado", invalid:"Revisar" }[status] || status || "Pendiente";
}

function statusPill(status) {
  return `<span class="status-pill ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>`;
}

function emptyState(message) {
  return `<div class="empty-state"><div><i data-lucide="inbox"></i><p>${escapeHtml(message)}</p></div></div>`;
}

function showView(view) {
  const target = document.getElementById(`${view}View`);
  if (!target || (target.hasAttribute("data-admin-only") && state.user?.role !== "admin")) return;
  document.querySelectorAll(".admin-view").forEach((section) => section.classList.toggle("active", section === target));
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.getElementById("viewEyebrow").textContent = viewMeta[view][0];
  document.getElementById("viewTitle").textContent = viewMeta[view][1];
  document.querySelector(".admin-sidebar").classList.remove("open");
  if (view === "results" && !state.applications.length) loadApplications().catch((error) => showAlert(error.message));
  if (view === "directory" && !state.directory.length) loadDirectory().catch((error) => showAlert(error.message));
  if (view === "campaigns") loadCampaigns().catch((error) => showAlert(error.message));
  if (view === "staff") loadStaff().catch((error) => showAlert(error.message));
}

function renderMetrics() {
  const totals = state.overview?.totals || {};
  const metrics = [
    ["Personal",totals.participants ?? 0,"users","Perfiles dentro del alcance"],
    ["Asignaciones",totals.assignments ?? 0,"clipboard-list","Instrumentos programados"],
    ["Aplicaciones",totals.applications ?? 0,"file-check-2","Evaluaciones iniciadas"],
    ["Finalizadas",totals.completed ?? 0,"badge-check","Resultados disponibles"],
  ];
  document.getElementById("overviewMetrics").innerHTML = metrics.map(([label,value,icon,note]) => `<article class="metric"><span class="metric-icon"><i data-lucide="${icon}"></i></span><div><span>${label}</span><strong>${Number(value).toLocaleString("es-EC")}</strong><small>${note}</small></div></article>`).join("");
}

function renderBreakdown(targetId, entries) {
  const max = Math.max(...entries.map(([,value]) => Number(value) || 0),1);
  document.getElementById(targetId).innerHTML = entries.map(([label,value]) => `<div class="breakdown-row"><span>${escapeHtml(label)}</span><div class="progress-track"><span style="width:${Math.round((Number(value)||0)*100/max)}%"></span></div><strong>${Number(value||0).toLocaleString("es-EC")}</strong></div>`).join("");
}

function applicationsTable(applications, compact=false) {
  if (!applications.length) return emptyState("No hay aplicaciones para mostrar.");
  const rows = applications.map((application) => {
    const participant = application.participant || {};
    return `<tr><td class="table-person"><strong>${escapeHtml(participant.fullName || "Sin nombre")}</strong><span>${escapeHtml(participant.idNumber || "-")}</span></td><td>${escapeHtml((application.instrumentCode || "").toUpperCase())}</td>${compact ? "" : `<td>${escapeHtml(application.campaign?.name || application.campaignName || "-")}</td>`}<td>${statusPill(application.status)}</td><td>${escapeHtml(application.percentageComplete || 0)}%</td><td>${formatDate(application.completedAt || application.startedAt)}</td><td><div class="row-actions"><button type="button" data-open-result="${escapeHtml(application.id)}" title="Ver resultado" aria-label="Ver resultado"><i data-lucide="eye"></i></button></div></td></tr>`;
  }).join("");
  return `<table><thead><tr><th>Participante</th><th>Instrumento</th>${compact ? "" : "<th>Campaña</th>"}<th>Estado</th><th>Avance</th><th>Fecha</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function loadOverview() {
  state.overview = await request("/api/admin/overview");
  state.campaigns = state.overview.campaigns || [];
  renderMetrics();
  renderBreakdown("statusBreakdown", [["Pendientes",state.overview.statuses?.pending],["En progreso",state.overview.statuses?.in_progress],["Completadas",state.overview.statuses?.completed]]);
  renderBreakdown("instrumentBreakdown", [["EMA",state.overview.instruments?.ema],["Bar-On ICE",state.overview.instruments?.baron],["DISC",state.overview.instruments?.disc]]);
  document.getElementById("recentApplications").innerHTML = applicationsTable(state.overview.recentApplications || [],true);
  renderIcons();
}

function resultParams() {
  const params = new URLSearchParams();
  const id = document.getElementById("resultSearchId").value.trim();
  const instrument = document.getElementById("resultInstrument").value;
  const status = document.getElementById("resultStatus").value;
  if (id) params.set("cedula",id);
  if (instrument) params.set("instrument",instrument);
  if (status) params.set("status",status);
  return params;
}

async function loadApplications() {
  const payload = await request(`/api/admin/applications?${resultParams()}`);
  state.applications = payload.applications || [];
  document.getElementById("resultsCount").textContent = `${state.applications.length.toLocaleString("es-EC")} registros`;
  document.getElementById("resultsTable").innerHTML = applicationsTable(state.applications);
  renderIcons();
}

function scoreCards(application) {
  const scoring = application.scoringSnapshot || {};
  if (application.instrumentCode === "baron") return (scoring.components || []).map((item) => [item.label,`CE ${item.ceScore ?? "-"}`,item.category || ""]);
  if (application.instrumentCode === "disc") return ["D","I","S","C"].map((key) => [`Factor ${key}`,`Diferencia ${scoring.difference?.[key] ?? "-"}`,`Más ${scoring.most?.[key] ?? "-"} · Menos ${scoring.least?.[key] ?? "-"}`]);
  return (scoring.dimensions || []).map((item) => [item.label,`${item.favorablePercentage ?? item.rawTotal ?? "-"}${item.favorablePercentage != null ? "%" : ""}`,item.band || item.interpretiveLevel || ""]);
}

async function openResult(applicationId) {
  const application = await request(`/api/admin/applications/${encodeURIComponent(applicationId)}`);
  const participant = application.participant || {};
  document.getElementById("resultDialogTitle").textContent = `${application.instrumentName || application.instrumentCode?.toUpperCase()} · ${participant.fullName || "Participante"}`;
  const identity = [["Cédula",participant.idNumber],["Grado",participant.rankName || participant.rankCode],["Unidad",participant.unitName || participant.unit],["Promoción",participant.promotion != null ? `Promoción ${participant.promotion}` : "-"],["Campaña",application.campaign?.name || application.campaignName],["Estado",statusLabel(application.status)],["Inicio",formatDate(application.startedAt)],["Finalización",formatDate(application.completedAt)]];
  const observations = application.scoringSnapshot?.observations || {};
  const observationSections = [["Fortalezas",observations.strengths],["Áreas de atención",observations.attentionAreas],["Sugerencias",observations.suggestions]].filter(([,items]) => items?.length);
  document.getElementById("resultDialogBody").innerHTML = `<div class="result-identity">${identity.map(([label,value]) => `<div><span>${label}</span><strong>${escapeHtml(value || "-")}</strong></div>`).join("")}</div><div class="result-scores">${scoreCards(application).map(([label,value,note]) => `<article class="result-score"><h3>${escapeHtml(label)}</h3><p><strong>${escapeHtml(value)}</strong></p><p>${escapeHtml(note)}</p></article>`).join("")}</div>${observationSections.map(([title,items]) => `<section><h3>${escapeHtml(title)}</h3><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`).join("")}<p class="form-hint">${(application.answers || []).length} respuestas registradas · Resultado ${application.valid === false ? "marcado para revisión" : "procesado"}.</p>`;
  document.getElementById("resultDialog").showModal();
  renderIcons();
}

async function exportExcel() {
  const response = await fetch(`/api/export/excel?${resultParams()}`);
  if (response.status === 401) return window.location.replace("/login.html");
  if (!response.ok) {
    let error={}; try { error=await response.json(); } catch {}
    throw new Error(error.error || "No se pudo generar el archivo Excel.");
  }
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "MENTE_DE_ACERO_Resultados.xlsx";
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a"); link.href=url; link.download=filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}

async function loadDirectory() {
  const search = document.getElementById("directorySearch").value.trim();
  const payload = await request(`/api/admin/directory?search=${encodeURIComponent(search)}&limit=100`);
  state.directory = payload.people || [];
  if (!state.directory.length) {
    document.getElementById("directoryTable").innerHTML = emptyState("No se encontraron perfiles.");
  } else {
    document.getElementById("directoryTable").innerHTML = `<table><thead><tr><th>Personal</th><th>Grado</th><th>Unidad</th><th>Promoción</th><th>Asignaciones</th><th>Cuenta</th><th></th></tr></thead><tbody>${state.directory.map((person) => `<tr><td class="table-person"><strong>${escapeHtml(person.fullName)}</strong><span>${escapeHtml(person.idNumber)}</span></td><td>${escapeHtml(person.rankName || person.rankCode || "-")}</td><td>${escapeHtml(person.unitCode || "-")}</td><td>${person.promotion == null ? "-" : escapeHtml(person.promotion)}</td><td>${person.assignments.length}</td><td>${person.account ? statusPill(person.account.active ? "completed" : "invalid") : "Sin cuenta"}</td><td><div class="row-actions"><button type="button" data-assign-person="${escapeHtml(person.id)}" title="Asignar evaluaciones" aria-label="Asignar evaluaciones"><i data-lucide="clipboard-plus"></i></button>${person.account ? `<button type="button" data-reset-account="${escapeHtml(person.account.id)}" data-account-name="${escapeHtml(person.fullName)}" title="Restablecer contraseña" aria-label="Restablecer contraseña"><i data-lucide="key-round"></i></button>` : ""}</div></td></tr>`).join("")}</tbody></table>`;
  }
  renderIcons();
}

function campaignOptions(selected=[]) {
  const selectedSet = new Set(selected);
  return state.campaigns.map((campaign) => `<label><input type="checkbox" value="${escapeHtml(campaign.id)}" ${selectedSet.has(campaign.id) ? "checked" : ""}/> ${escapeHtml(campaign.name)}</label>`).join("") || "<p class=\"form-hint\">No hay campañas registradas.</p>";
}

function fillCampaignControls() {
  document.getElementById("assignmentCampaign").innerHTML = state.campaigns.map((campaign) => `<option value="${escapeHtml(campaign.id)}">${escapeHtml(campaign.name)}</option>`).join("");
  document.getElementById("staffCampaignOptions").innerHTML = campaignOptions();
}

async function loadCampaigns() {
  const payload = await request("/api/admin/campaigns");
  state.campaigns = payload.campaigns || [];
  document.getElementById("campaignList").innerHTML = state.campaigns.length ? state.campaigns.map((campaign) => `<article class="management-item"><div><h4>${escapeHtml(campaign.name)}</h4><p>${formatDate(campaign.startsAt,true)} al ${formatDate(campaign.endsAt,true)}</p><div class="management-item-tags"><span>${campaign.active ? "ACTIVA" : "CERRADA"}</span></div></div><div class="row-actions"><button type="button" data-toggle-campaign="${escapeHtml(campaign.id)}" data-active="${campaign.active}" title="${campaign.active ? "Cerrar campaña" : "Activar campaña"}" aria-label="${campaign.active ? "Cerrar campaña" : "Activar campaña"}"><i data-lucide="${campaign.active ? "pause" : "play"}"></i></button></div></article>`).join("") : emptyState("No hay campañas registradas.");
  fillCampaignControls();
  renderIcons();
}

async function loadStaff() {
  if (!state.campaigns.length) await loadCampaigns();
  const payload = await request("/api/admin/staff");
  state.staff = payload.staff || [];
  document.getElementById("staffList").innerHTML = state.staff.length ? state.staff.map((account) => `<article class="management-item"><div><h4>${escapeHtml(account.username)}</h4><p>${account.role === "admin" ? "Administrador" : "Psicólogo"} · Último acceso: ${formatDate(account.lastLoginAt)}</p><div class="management-item-tags"><span>${account.active ? "ACTIVO" : "INACTIVO"}</span>${account.mustChangePassword ? "<span>CAMBIO PENDIENTE</span>" : ""}${account.role === "psychologist" ? `<span>${account.campaignIds.length} CAMPAÑAS</span>` : ""}</div></div><div class="row-actions">${account.role === "psychologist" ? `<button type="button" data-edit-scope="${escapeHtml(account.id)}" title="Editar campañas" aria-label="Editar campañas"><i data-lucide="calendar-range"></i></button>` : ""}<button type="button" data-reset-account="${escapeHtml(account.id)}" data-account-name="${escapeHtml(account.username)}" title="Restablecer contraseña" aria-label="Restablecer contraseña"><i data-lucide="key-round"></i></button><button type="button" data-toggle-account="${escapeHtml(account.id)}" data-active="${account.active}" title="${account.active ? "Desactivar" : "Activar"}" aria-label="${account.active ? "Desactivar" : "Activar"}"><i data-lucide="${account.active ? "user-x" : "user-check"}"></i></button></div></article>`).join("") : emptyState("No hay cuentas de personal.");
  renderIcons();
}

function openAssignment(personId) {
  const person = state.directory.find((item) => item.id === personId);
  if (!person) return;
  document.getElementById("assignmentPersonId").value = person.id;
  document.getElementById("assignmentPersonName").textContent = person.fullName;
  document.querySelectorAll('[name="assignmentInstrument"]').forEach((input) => { input.checked=false; });
  fillCampaignControls();
  document.getElementById("assignmentDialog").showModal();
}

function openScope(accountId) {
  const account = state.staff.find((item) => item.id === accountId);
  if (!account) return;
  document.getElementById("scopeAccountId").value = account.id;
  document.getElementById("scopeStaffName").textContent = account.username;
  document.getElementById("scopeCampaignOptions").innerHTML = campaignOptions(account.campaignIds);
  document.getElementById("scopeDialog").showModal();
}

function openPasswordReset(accountId,name) {
  document.getElementById("passwordAccountId").value = accountId;
  document.getElementById("passwordStaffName").textContent = name;
  document.getElementById("temporaryPassword").value = "";
  document.getElementById("passwordDialog").showModal();
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]"); if (viewButton) showView(viewButton.dataset.view);
  const goButton = event.target.closest("[data-go-view]"); if (goButton) showView(goButton.dataset.goView);
  const resultButton = event.target.closest("[data-open-result]"); if (resultButton) openResult(resultButton.dataset.openResult).catch((error) => showAlert(error.message));
  const assignButton = event.target.closest("[data-assign-person]"); if (assignButton) openAssignment(assignButton.dataset.assignPerson);
  const scopeButton = event.target.closest("[data-edit-scope]"); if (scopeButton) openScope(scopeButton.dataset.editScope);
  const resetButton = event.target.closest("[data-reset-account]"); if (resetButton) openPasswordReset(resetButton.dataset.resetAccount,resetButton.dataset.accountName);
  const closeButton = event.target.closest("[data-close-dialog]"); if (closeButton) document.getElementById(closeButton.dataset.closeDialog).close();
  const campaignToggle = event.target.closest("[data-toggle-campaign]");
  if (campaignToggle) request(`/api/admin/campaigns/${encodeURIComponent(campaignToggle.dataset.toggleCampaign)}`,{ method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ active:campaignToggle.dataset.active !== "true" }) }).then(() => { showAlert("Campaña actualizada.",true); return loadCampaigns(); }).catch((error) => showAlert(error.message));
  const accountToggle = event.target.closest("[data-toggle-account]");
  if (accountToggle) request(`/api/admin/accounts/${encodeURIComponent(accountToggle.dataset.toggleAccount)}`,{ method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ active:accountToggle.dataset.active !== "true" }) }).then(() => { showAlert("Cuenta actualizada.",true); return loadStaff(); }).catch((error) => showAlert(error.message));
});

document.getElementById("resultsFilterForm").addEventListener("submit", (event) => { event.preventDefault(); loadApplications().catch((error) => showAlert(error.message)); });
document.getElementById("directorySearchForm").addEventListener("submit", (event) => { event.preventDefault(); loadDirectory().catch((error) => showAlert(error.message)); });
document.getElementById("refreshOverviewButton").addEventListener("click", () => loadOverview().then(() => showAlert("Resumen actualizado.",true)).catch((error) => showAlert(error.message)));
document.getElementById("adminExportButton").addEventListener("click", () => exportExcel().then(() => showAlert("Archivo Excel generado.",true)).catch((error) => showAlert(error.message)));
document.getElementById("mobileMenuButton").addEventListener("click", () => document.querySelector(".admin-sidebar").classList.toggle("open"));
document.getElementById("staffRole").addEventListener("change", (event) => document.getElementById("staffCampaignFields").classList.toggle("hidden",event.target.value === "admin"));

document.getElementById("campaignForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request("/api/admin/campaigns",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ name:document.getElementById("campaignName").value,startsAt:document.getElementById("campaignStart").value,endsAt:document.getElementById("campaignEnd").value,active:document.getElementById("campaignActive").checked }) });
    event.target.reset(); document.getElementById("campaignActive").checked=true; showAlert("Campaña creada.",true); await loadCampaigns(); await loadOverview();
  } catch (error) { showAlert(error.message); }
});

document.getElementById("staffForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const role=document.getElementById("staffRole").value;
    const campaignIds=role === "psychologist" ? [...document.querySelectorAll("#staffCampaignOptions input:checked")].map((input) => input.value) : [];
    await request("/api/admin/staff",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ username:document.getElementById("staffUsername").value,temporaryPassword:document.getElementById("staffPassword").value,role,campaignIds }) });
    event.target.reset(); document.getElementById("staffCampaignFields").classList.remove("hidden"); showAlert("Cuenta creada.",true); await loadStaff();
  } catch (error) { showAlert(error.message); }
});

document.getElementById("assignmentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const instrumentCodes=[...document.querySelectorAll('[name="assignmentInstrument"]:checked')].map((input) => input.value);
    await request("/api/admin/assignments",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ personId:document.getElementById("assignmentPersonId").value,campaignId:document.getElementById("assignmentCampaign").value,instrumentCodes }) });
    document.getElementById("assignmentDialog").close(); showAlert("Evaluaciones asignadas.",true); await loadDirectory(); await loadOverview();
  } catch (error) { showAlert(error.message); }
});

document.getElementById("scopeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const accountId=document.getElementById("scopeAccountId").value;
    const campaignIds=[...document.querySelectorAll("#scopeCampaignOptions input:checked")].map((input) => input.value);
    await request(`/api/admin/staff/${encodeURIComponent(accountId)}/campaigns`,{ method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignIds}) });
    document.getElementById("scopeDialog").close(); showAlert("Alcance actualizado.",true); await loadStaff();
  } catch (error) { showAlert(error.message); }
});

document.getElementById("passwordResetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const accountId=document.getElementById("passwordAccountId").value;
    await request(`/api/admin/accounts/${encodeURIComponent(accountId)}`,{ method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ temporaryPassword:document.getElementById("temporaryPassword").value }) });
    document.getElementById("passwordDialog").close(); showAlert("Contraseña temporal actualizada.",true); if (state.user.role === "admin") await loadStaff();
  } catch (error) { showAlert(error.message); }
});

document.getElementById("adminLogoutButton").addEventListener("click", async () => { try { await fetch("/api/auth/logout",{method:"POST"}); } finally { window.location.replace("/login.html"); } });

async function init() {
  try {
    const auth=await request("/api/auth/me");
    if (!auth.user || !["admin","psychologist"].includes(auth.user.role)) return window.location.replace("/portal.html");
    if (auth.user.mustChangePassword) return window.location.replace("/login.html?change=1");
    state.user=auth.user;
    document.getElementById("adminUsername").textContent=auth.user.username;
    document.getElementById("adminRoleBadge").textContent=auth.user.role === "admin" ? "Administrador" : "Psicología";
    document.querySelectorAll("[data-admin-only]").forEach((element) => element.classList.toggle("hidden",auth.user.role !== "admin"));
    document.getElementById("adminLoading").classList.add("hidden");
    document.getElementById("adminApp").classList.remove("hidden");
    await loadOverview();
  } catch (error) {
    if (!document.getElementById("adminLoading").classList.contains("hidden")) document.getElementById("adminLoading").innerHTML=`<span>${escapeHtml(error.message)}</span>`;
  }
  renderIcons();
}

renderIcons();
init();
