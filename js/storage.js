export function loadCapsuleIndex() {
    try {
        return JSON.parse(localStorage.getItem('pc_capsules_index')) || [];
    } catch (e) {
        console.error('Failed to parse index', e);
        return [];
    }
}

export function saveCapsuleIndex(index) {
    localStorage.setItem('pc_capsules_index', JSON.stringify(index));
}

export function deleteCapsule(id) {
    const index = loadCapsuleIndex().filter(c => c.id !== id);
    saveCapsuleIndex(index);
    localStorage.removeItem(`pc_capsule_${id}`);
    localStorage.removeItem(`pc_progress_${id}`);
}

export function exportCapsule(id) {
    try {
        const raw = localStorage.getItem(`pc_capsule_${id}`);
        if (!raw) {
            alert('Capsule not found');
            return;
        }

        const capsule = JSON.parse(raw);
        const rawTitle = (capsule && (capsule.meta?.title || capsule.title)) || `capsule_${id}`;

        const safeTitle = String(rawTitle).trim().replace(/[^\w\-_. ]+/g, '').replace(/\s+/g, '_') || `capsule_${id}`;

        const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
        console.error('exportCapsule failed', err);
        alert('Failed to export capsule. See console for details.');
    }
}