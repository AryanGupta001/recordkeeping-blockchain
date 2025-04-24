document.addEventListener('DOMContentLoaded', () => {
    // Section toggle logic
    const sections = {
      search: document.getElementById('searchSection'),
      add: document.getElementById('addSection'),
      verify: document.getElementById('verifySection'),
      all: document.getElementById('allSection'),
    };
    const navItems = document.querySelectorAll('.nav-item');
  
    function showSection(name) {
      Object.entries(sections).forEach(([key, section]) => {
        section.style.display = key === name ? 'block' : 'none';
      });
      navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === name);
      });
      // Trigger load when switching
      if (name === 'all') loadRecords();
      if (name === 'search') document.getElementById('searchResults').innerHTML = '';
    }
  
    navItems.forEach(item => {
      item.addEventListener('click', () => showSection(item.dataset.section));
    });
  
    showSection('search');
  
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    }
    darkModeToggle.addEventListener('click', () => {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.body.removeAttribute('data-theme');
        darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
        localStorage.setItem('darkMode', 'false');
      } else {
        document.body.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        localStorage.setItem('darkMode', 'true');
      }
    });
  
    // Common elements
    const recordForm = document.getElementById('recordForm');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const chainStatus = document.getElementById('chainStatus');
    const verifyChainBtn = document.getElementById('verifyChain');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    let currentDeleteHash = null;
  
    // Helper: show alerts
    function showAlert(message, type) {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type} alert-dismissible fade show`;
      alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
      document.querySelector('.header').after(alert);
      setTimeout(() => alert.remove(), 5000);
    }
  
    // Loading indicator
    function showLoading() { /* implementation if needed */ }
    function hideLoading() { /* implementation if needed */ }
  
    // API calls and display logic
    async function loadRecords() {
      try {
        showLoading();
        const res = await fetch('/api/records');
        const data = await res.json();
        displayRecords(data.slice(1), 'recordsList');
      } catch (e) { showAlert('Error loading records', 'danger'); }
      finally { hideLoading(); }
    }
  
    async function searchRecords() {
      const term = searchInput.value.trim().toLowerCase();
      if (!term) return;
      try {
        showLoading();
        const res = await fetch('/api/records');
        const data = await res.json();
        const filtered = data.slice(1).filter(b => 
          b.data.studentId.toLowerCase().includes(term) ||
          b.data.studentName.toLowerCase().includes(term)
        );
        displayRecords(filtered, 'searchResults');
      } catch (e) { showAlert('Error searching', 'danger'); }
      finally { hideLoading(); }
    }
  
    function displayRecords(records, containerId) {
      const container = document.getElementById(containerId);
      if (!records.length) {
        container.innerHTML = '<div class="card-custom p-4 text-center">No records found.</div>';
        return;
      }
      container.innerHTML = records.map(b => `
        <div class="record-card">
          <h5>${b.data.studentName}</h5>
          <span class="badge-custom">ID: ${b.data.studentId}</span>
          <ul>
            <li>Course: ${b.data.courseDetails}</li>
            <li>Grades: ${b.data.grades}</li>
          </ul>
          <small class="timestamp">Added: ${new Date(b.timestamp).toLocaleString()}</small>
          <button class="delete-btn-custom" onclick="deleteRecord('${b.hash}')"><i class="bi bi-trash"></i></button>
        </div>
      `).join('');
    }
  
    // Form submit
    recordForm.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        studentName: document.getElementById('studentName').value,
        studentId: document.getElementById('studentId').value,
        courseDetails: document.getElementById('courseDetails').value,
        grades: document.getElementById('grades').value
      };
      try {
        showLoading();
        const res = await fetch('/api/records', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (res.ok) { showAlert('Record added!', 'success'); recordForm.reset(); }
        else showAlert(result.error, 'danger');
      } catch (e) { showAlert('Error adding record', 'danger'); }
      finally { hideLoading(); }
    });
  
    // Verify chain
    verifyChainBtn && verifyChainBtn.addEventListener('click', async () => {
      try {
        showLoading();
        const res = await fetch('/api/verify');
        const { isValid, blockCount } = await res.json();
        chainStatus.textContent = `Chain is ${isValid?'Valid':'Invalid'} (${blockCount} blocks)`;
        chainStatus.className = isValid ? 'status-box status-valid' : 'status-box status-invalid';
      } catch (e) { showAlert('Error verifying', 'danger'); }
      finally { hideLoading(); }
    });
  
    // Delete record
    window.deleteRecord = function(hash) {
      currentDeleteHash = hash;
      deleteModal.show();
    };
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!currentDeleteHash) return;
      try {
        showLoading();
        const res = await fetch(`/api/records/${currentDeleteHash}`, { method: 'DELETE' });
        if (res.ok) showAlert('Deleted!', 'success');
        else { const err = await res.json(); showAlert(err.error,'danger'); }
        showSection('all');
      } catch (e) { showAlert('Error deleting','danger'); }
      finally { hideLoading(); deleteModal.hide(); }
    });
  
    // Search button
    searchButton.addEventListener('click', searchRecords);
    searchInput.addEventListener('keypress', e => { if (e.key==='Enter') searchRecords(); });
  });
  