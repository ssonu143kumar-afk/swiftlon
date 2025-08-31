const firebaseConfig = {
  apiKey: "AIzaSyAMfSpSFON8l11B-uJVlwUKfUaov7VUZ04",
  authDomain: "swiftlon.firebaseapp.com",
  projectId: "swiftlon",
  storageBucket: "swiftlon.firebasestorage.app",
  messagingSenderId: "6308449601",
  appId: "1:6308449601:web:058cf99411183d40bde5c0",
  measurementId: "G-9PTFT7KL3N"
};

/* =========================
   SwiftLoan – Front-End Demo (Improved)
   Storage: localStorage ("loans")
   Status Flow:
   - "Pending Approval"
   - "Approved (Waiting for Payment)"
   - "Paid (Congratulations)"
   - "Rejected"
========================= */



const qs  = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => [...r.querySelectorAll(s)];

const TABS = qsa('.tab-btn');
const TAB_VIEWS = qsa('.tab');

const el = {
  // Customer
  mobile: qs('#c_mobile'),
  upi: qs('#c_upi'),
  amount: qs('#c_amount'),
  feeView: qs('#feeView'),
  intView: qs('#intView'),
  totalView: qs('#totalView'),
  repayView: qs('#repayView'),
  cRefresh: qs('#btnCRefresh'),

  cStatus: qs('#c_status'),
  cId: qs('#c_id'),
  cP: qs('#c_p'),
  cFee: qs('#c_fee'),
  cInt: qs('#c_int'),
  cTotal: qs('#c_total'),
  cRepay: qs('#c_repay'),
  congrats: qs('#congratsBox'),
  stepper: qs('#stepper'),

  // Agreement Modal
  modal: qs('#agreementModal'),
  btnPreview: qs('#btnPreviewAgreement'),
  btnSubmitLoan: qs('#btnSubmitLoan'),
  btnCancelAgreement: qs('#btnCancelAgreement'),
  btnCloseModal: qs('#btnCloseModal'),
  agreeChk: qs('#agreeChk'),

  // Admin
  aPass: qs('#a_pass'),
  aLoginBtn: qs('#btnALogin'),
  aMsg: qs('#a_msg'),
  adminArea: qs('#adminArea'),
  aRefresh: qs('#btnARefresh'),
  aSearch: qs('#a_search'),
  rows: qs('#rows'),
  stTotal: qs('#st_total'),
  stPending: qs('#st_pending'),
  stApproved: qs('#st_approved'),
  stPaid: qs('#st_paid')
};

// --- Util ---
const fmtINR = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const today = () => new Date();
const addMonths = (d, m) => { const nd = new Date(d); nd.setMonth(nd.getMonth()+m); return nd; };
const ymd = d => d.toISOString().slice(0,10);
const niceDate = d => new Date(d).toLocaleDateString('en-IN',{year:'numeric', month:'short', day:'2-digit'});

// Load & Save
const getLoans = () => JSON.parse(localStorage.getItem('loans') || '[]');
const setLoans = data => localStorage.setItem('loans', JSON.stringify(data));

// Toast Notification
function toast(msg, type="info"){
  const box = document.createElement('div');
  box.textContent = msg;
  box.style.position = "fixed";
  box.style.bottom = "20px";
  box.style.right = "20px";
  box.style.padding = "10px 16px";
  box.style.borderRadius = "8px";
  box.style.fontWeight = "600";
  box.style.zIndex = 1000;
  box.style.color = "#fff";
  box.style.boxShadow = "0 4px 10px rgba(0,0,0,.3)";
  if(type==="success") box.style.background = "#16a34a";
  else if(type==="error") box.style.background = "#dc2626";
  else box.style.background = "#2563eb";
  document.body.appendChild(box);
  setTimeout(()=> box.remove(), 2500);
}

/* =========================
   Tabs
========================= */
TABS.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    TABS.forEach(b=>b.classList.remove('active'));
    TAB_VIEWS.forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    qs(`#${btn.dataset.tab}`).classList.add('active');
  });
});

/* =========================
   Customer: Live Calculations
========================= */
function recalc(){
  const p = Number(el.amount.value || 0);
  const fee = p * 0.05;                // 5% processing fee
  const monthlyInt = p * 0.32 / 12;    // 32% annual -> 1 month
  const total = p + monthlyInt;        // Payable in 1 month
  const repay = addMonths(today(), 1);

  el.feeView.textContent   = fmtINR(fee.toFixed(2));
  el.intView.textContent   = fmtINR(monthlyInt.toFixed(2));
  el.totalView.textContent = fmtINR(total.toFixed(2));
  el.repayView.textContent = niceDate(repay);
}
['input','change'].forEach(e=>{
  el.amount.addEventListener(e, recalc);
});
recalc();

/* =========================
   Agreement Modal Control
========================= */
el.btnPreview.addEventListener('click', ()=>{
  if(!el.mobile.value || !el.upi.value || !el.amount.value){
    toast('Please fill Mobile, UPI and Amount before continuing.','error');
    return;
  }
  // reset modal controls
  el.agreeChk.checked = false;
  el.btnSubmitLoan.disabled = true;
  el.modal.classList.remove('hidden');
});
el.btnCloseModal.addEventListener('click', ()=> el.modal.classList.add('hidden'));
el.btnCancelAgreement.addEventListener('click', ()=> el.modal.classList.add('hidden'));
el.agreeChk.addEventListener('change', ()=> el.btnSubmitLoan.disabled = !el.agreeChk.checked);

/* =========================
   Submit Loan
========================= */
el.btnSubmitLoan.addEventListener('click', ()=>{
  const p = Number(el.amount.value);
  const fee = p * 0.05;
  const monthlyInt = p * 0.32 / 12;
  const total = p + monthlyInt;
  const repay = addMonths(today(), 1);

  const loan = {
    id: Date.now(),
    mobile: el.mobile.value.trim(),
    upi: el.upi.value.trim(),
    principal: p,
    fee: Number(fee.toFixed(2)),
    interest: Number(monthlyInt.toFixed(2)),
    totalPayable: Number(total.toFixed(2)),
    repaymentDate: ymd(repay),
    status: 'Pending Approval',
    createdAt: ymd(today())
  };

  const all = getLoans();
  all.push(loan);
  setLoans(all);

  el.modal.classList.add('hidden');
  toast('Loan request submitted successfully!','success');
  paintCustomerView();
});

/* =========================
   Customer: Tracking View
========================= */
function paintStepper(status){
  const order = ['Pending Approval','Approved (Waiting for Payment)','Paid (Congratulations)','Rejected'];
  const idx = order.indexOf(status);
  const steps = qsa('.step', el.stepper);
  steps.forEach((st, i)=> {
    st.classList.toggle('done', i <= idx);
  });
}
function loadMyLatestLoan(){
  const all = getLoans();
  const me = el.mobile.value.trim();
  if(!me) return null;
  const myLoans = all.filter(x=> x.mobile === me);
  if(myLoans.length === 0) return null;
  return myLoans.sort((a,b)=> b.id - a.id)[0]; // latest
}
function paintCustomerView(){
  const L = loadMyLatestLoan();
  if(!L){
    el.cStatus.textContent = '—';
    el.cId.textContent = '—';
    el.cP.textContent = '₹0';
    el.cFee.textContent = '₹0';
    el.cInt.textContent = '₹0';
    el.cTotal.textContent = '₹0';
    el.cRepay.textContent = '—';
    paintStepper('Pending Approval');
    el.congrats.classList.add('hidden');
    return;
  }
  el.cStatus.textContent = L.status;
  el.cId.textContent = L.id;
  el.cP.textContent = fmtINR(L.principal);
  el.cFee.textContent = fmtINR(L.fee);
  el.cInt.textContent = fmtINR(L.interest);
  el.cTotal.textContent = fmtINR(L.totalPayable);
  el.cRepay.textContent = niceDate(L.repaymentDate);
  paintStepper(L.status);
  if(L.status.startsWith('Paid')) el.congrats.classList.remove('hidden');
  else el.congrats.classList.add('hidden');
}
el.cRefresh.addEventListener('click', paintCustomerView);

/* =========================
   Admin
========================= */
function computeStats(list){
  const st = { total:list.length, pending:0, approved:0, paid:0 };
  list.forEach(x=>{
    if(x.status==='Pending Approval') st.pending++;
    else if(x.status==='Approved (Waiting for Payment)') st.approved++;
    else if(x.status.startsWith('Paid')) st.paid++;
  });
  return st;
}
function badge(status){
  if(status==='Pending Approval') return `<span class="badge pending">Pending</span>`;
  if(status==='Approved (Waiting for Payment)') return `<span class="badge approved">Approved</span>`;
  if(status==='Rejected') return `<span class="badge rejected">Rejected</span>`;
  return `<span class="badge paid">Paid</span>`;
}
function rowTpl(x){
  return `
    <div class="table-row">
      <div>${x.id}</div>
      <div>${x.mobile}</div>
      <div>${x.upi}</div>
      <div>${fmtINR(x.principal)}</div>
      <div>${fmtINR(x.totalPayable)}</div>
      <div>${badge(x.status)}</div>
      <div class="actions">
        <button class="icon-btn approve" onclick="approveLoan(${x.id})">Approve</button>
        <button class="icon-btn paid" onclick="markPaid(${x.id})">Mark Paid</button>
        <button class="icon-btn reject" onclick="rejectLoan(${x.id})">Reject</button>
        <button class="icon-btn" onclick="deleteLoan(${x.id})">Delete</button>
      </div>
    </div>
  `;
}
function paintAdmin(list){
  const q = el.aSearch.value.trim().toLowerCase();
  const filtered = list.filter(x =>
    String(x.id).includes(q) ||
    x.mobile.toLowerCase().includes(q) ||
    x.upi.toLowerCase().includes(q)
  );

  el.rows.innerHTML = filtered.map(rowTpl).join('') || `<div class="table-row"><div style="grid-column:1 / -1; color:#9ca3af">No matching records.</div></div>`;

  const st = computeStats(list);
  el.stTotal.textContent = st.total;
  el.stPending.textContent = st.pending;
  el.stApproved.textContent = st.approved;
  el.stPaid.textContent = st.paid;
}
function loadAdmin(){
  const list = getLoans().sort((a,b)=> b.id - a.id);
  paintAdmin(list);
}
el.aLoginBtn.addEventListener('click', ()=>{
  if(el.aPass.value === 'Sonu@143'){
    el.aMsg.textContent = "Login successful!";
    el.aMsg.style.color = "lime";
    el.aMsg.classList.remove('hidden');
    el.adminArea.classList.remove('hidden');
    loadAdmin();
  }else{
    el.aMsg.textContent = "Invalid password.";
    el.aMsg.style.color = "red";
    el.aMsg.classList.remove('hidden');
  }
});
el.aRefresh.addEventListener('click', loadAdmin);
el.aSearch.addEventListener('input', loadAdmin);

// Admin Actions
window.approveLoan = (id)=>{
  const list = getLoans();
  const i = list.findIndex(x=> x.id===id);
  if(i>-1){
    if(list[i].status==='Pending Approval'){
      list[i].status = 'Approved (Waiting for Payment)';
      setLoans(list);
      loadAdmin();
      toast('Loan approved','success');
    } else {
      toast('Loan already processed','error');
    }
  }
};
window.markPaid = (id)=>{
  const list = getLoans();
  const i = list.findIndex(x=> x.id===id);
  if(i>-1){
    if(list[i].status==='Approved (Waiting for Payment)'){
      list[i].status = 'Paid (Congratulations)';
      setLoans(list);
      loadAdmin();
      toast('Loan marked Paid','success');
    } else {
      toast('Loan must be Approved first','error');
    }
  }
};
window.rejectLoan = (id)=>{
  const list = getLoans();
  const i = list.findIndex(x=> x.id===id);
  if(i>-1){
    if(list[i].status!=='Paid (Congratulations)'){
      list[i].status = 'Rejected';
      setLoans(list);
      loadAdmin();
      toast('Loan Rejected','error');
    } else {
      toast('Cannot reject a Paid loan','error');
    }
  }
};
window.deleteLoan = (id)=>{
  const list = getLoans().filter(x => x.id !== id);
  setLoans(list);
  loadAdmin();
  toast('Loan deleted','success');
};

// Initial paint
paintCustomerView();
