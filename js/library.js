import { exportCapsule } from './storage.js';
import { timeAgo } from './utils.js';
import { switchSection } from './main.js';
import { renderLearn } from "./learn.js";

window.addEventListener("capsuleProgressUpdated", renderLibrary);

const container = document.getElementById('library-view');

export function renderLibrary() {
    const index = JSON.parse(localStorage.getItem('pc_capsules_index') || '[]');

    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'library-wrapper p-3 rounded-3';
    wrapper.style.backgroundColor = '#161b22';
    wrapper.style.border = '1px solid #30363d';
    wrapper.style.color = '#e6edf3';

    wrapper.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="mb-2 fs-5 fw-semibold">Your Capsules</h3>
                <p class="text-light mb-0" style="font-size: 0.9rem;">
                    Create, import, export, and manage learning capsules. All data stays in your browser.
                </p>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-success px-3 py-2" id="new-capsule-btn" aria-label="New Capsule">➕ New Capsule</button>
                <button class="btn btn-outline-light px-3 py-2" id="import-json-btn" aria-label="Import JSON">⬆ Import JSON</button>
            </div>
        </div>
    `;

    if (!index.length) {
        wrapper.innerHTML += `
            <div class="text-center text-light py-5">
                <p>No capsules yet. Click <strong>New Capsule</strong> to create one!</p>
            </div>
        `;
        container.appendChild(wrapper);
        attachTopButtons();
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'row g-3';

    index.forEach(cap => {
        const card = document.createElement('div');
        card.className = 'col-md-4';
        card.innerHTML = `
            <div class="card bg-dark text-light h-100 shadow-sm border border-white">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${cap.title}</h5>
                    <span class="badge bg-primary mb-2">${cap.level}</span>
                    <p class="card-text small text-info mb-1">${cap.subject}</p>
                    <p class="text-light small mb-3">Updated ${timeAgo(cap.updatedAt)}</p>

                    <div class="mt-auto">
                        <div class="d-flex justify-content-between mb-2">
                            <small>Quiz best:</small>
                            <small>${cap.bestScore ?? 0}%</small>
                        </div>
                        <div class="progress mb-3" style="height:6px;">
                            <div class="progress-bar bg-success" style="width:${cap.bestScore ?? 0}%"></div>
                        </div>

                        <div class="d-flex justify-content-between mb-2">
                            <small>Known cards:</small>
                            <small>${cap.knownCards ?? 0}</small>
                        </div>

                        <div class="btn-group w-100">
                            <button class="btn btn-outline-light btn-sm learn-btn" data-id="${cap.id}" aria-label="Learn">Learn</button>
                            <button class="btn btn-outline-warning btn-sm edit-btn" data-id="${cap.id}" aria-label="Edit">Edit</button>
                            <button class="btn btn-outline-info btn-sm export-btn" data-id="${cap.id}" aria-label="Export">Export</button>
                            <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${cap.id}" aria-label="Delete">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    wrapper.appendChild(grid);
    container.appendChild(wrapper);

    attachTopButtons();
    attachCardActions();
}

// Top Buttons
function attachTopButtons() {
    const newBtn = document.getElementById('new-capsule-btn');

    if (newBtn) {
        newBtn.addEventListener('click', () => {
            const id = Date.now();
            switchSection('author', id);
            if (window.prepareNewCapsule) {
                window.prepareNewCapsule(id);
            }
        });
    }

    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            switchSection('author', Number(id));
        });
    });


    // Import JSON
    const importBtn = document.getElementById('import-json-btn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';

            fileInput.addEventListener('change', event => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const imported = JSON.parse(e.target.result);
                        if (!imported.meta || !imported.schema) {
                            alert('❌ Invalid capsule file.');
                            return;
                        }

                        const id = Date.now();
                        imported.id = id;
                        imported.updatedAt = new Date().toISOString();

                        localStorage.setItem(`pc_capsule_${id}`, JSON.stringify(imported));

                        const indexKey = 'pc_capsules_index';
                        const indexList = JSON.parse(localStorage.getItem(indexKey) || '[]');
                        indexList.push({
                            id,
                            title: imported.meta.title || 'Imported Capsule',
                            subject: imported.meta.subject || 'General',
                            level: imported.meta.level || 'Beginner',
                            updatedAt: imported.updatedAt
                        });
                        localStorage.setItem(indexKey, JSON.stringify(indexList));

                        alert(`✅ Imported capsule: ${imported.meta.title || 'Untitled'}`);
                        renderLibrary();
                    } catch (err) {
                        console.error(err);
                        alert('❌ Failed to read JSON file. Make sure it is a valid capsule export.');
                    }
                };

                reader.readAsText(file);
            });

            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        });
    }
}

// Card Actions
function attachCardActions() {
    const container = document.getElementById('library-view'); 
    if (!container) return;


    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("learn-btn")) {
            const id = Number(e.target.dataset.id);
            switchSection("learn"); 
            renderLearn(id);        
        }
    });
    // Edit / Author 
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = Number(e.target.dataset.id);
            switchSection('author', id);
        });
    });

    // Export
    container.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = Number(e.target.dataset.id);
            exportCapsule(id);
        });
    });

    // Delete
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = Number(e.target.dataset.id);

            if (confirm('Are you sure you want to delete this capsule?')) {
                // Delete from localstorage
                localStorage.removeItem(`pc_capsule_${id}`);

                const indexKey = 'pc_capsules_index';
                const indexList = JSON.parse(localStorage.getItem(indexKey) || '[]');
                const newIndex = indexList.filter(c => c.id !== id);
                localStorage.setItem(indexKey, JSON.stringify(newIndex));

                renderLibrary();
            }
        });
    });
}