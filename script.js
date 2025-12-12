// ---------- Tab switching for Natoli dashboard ----------

function activateTab(tabId) {
  const tabs = document.querySelectorAll(".tab");
  const buttons = document.querySelectorAll(".tab-button");

  tabs.forEach(t => {
    if (t.id === tabId) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });

  buttons.forEach(btn => {
    const target = btn.getAttribute("data-tab");
    if (target === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Set up click handlers
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      if (target) {
        activateTab(target);
      }
    });
  });

  // Load contacts when the page loads
  renderContacts();
  scheduleSync();
});

// ---------- Google Sheets Sync Logic for Outbound Activity ----------

const API_URL = "https://script.google.com/macros/s/AKfycbzqEX5U6-AsQxYzqunUOKwp0wLbyrK6Jr20Vb0XopHMmn3oN_rgd7nkRiVydS9ezznC2g/exec";

let contacts = JSON.parse(localStorage.getItem("NATOLI_OUTBOUND_CONTACTS_V2") || "[]");

function saveContacts() {
  localStorage.setItem("NATOLI_OUTBOUND_CONTACTS_V2", JSON.stringify(contacts));
}

function renderContacts() {
  const table = document.querySelector("#contact-table tbody");
  if (!table) return; // Exit if the table doesn't exist on this page
  table.innerHTML = "";
  contacts.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.first || ""} ${c.last || ""}</td>
      <td>${c.email || ""}</td>
      <td>${c.company || ""}</td>
      <td>${c.stage || ""}</td>
      <td>${c.sent ? "✔️" : ""}</td>
    `;
    table.appendChild(tr);
  });

  const kpiContacts = document.querySelector("#kpi-contacts");
  const kpiSent = document.querySelector("#kpi-sent");

  if (kpiContacts) kpiContacts.textContent = contacts.length;
  if (kpiSent) kpiSent.textContent = contacts.filter(c => c.sent).length;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const newContact = {
        first: form.first.value,
        last: form.last.value,
        email: form.email.value,
        company: form.company.value,
        stage: form.stage.value,
        sent: false,
        created: new Date().toISOString()
      };
      contacts.push(newContact);
      saveContacts();
      renderContacts();
      form.reset();
      const status = document.querySelector("#importStatus");
      if (status) status.textContent = "Saved locally.";
      scheduleSync();
    });
  }
});

function scheduleSync() {
  if (navigator.onLine) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ contacts }),
      headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(data => {
      const status = document.querySelector("#importStatus");
      if (status) status.textContent = "Synced to Google Sheets.";
      contacts.forEach(c => c.sent = true); // Mark all as sent
      saveContacts();
      renderContacts();
    })
    .catch(() => {
      const status = document.querySelector("#importStatus");
      if (status) status.textContent = "Sync failed. Will retry.";
    });
  } else {
    const status = document.querySelector("#importStatus");
    if (status) status.textContent = "Offline – saved locally.";
  }
}
