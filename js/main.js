import { renderLibrary } from './library.js';
import { renderAuthor } from './author.js';
import { renderLearn } from './learn.js';

const views = {
    library: document.getElementById('library-view'),
    author: document.getElementById('author-view'),
    learn: document.getElementById('learn-view'),
};

// Save current ID
window.currentLearnId = null;

// Navigation between tabs
document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = e.target.getAttribute('data-view');
        showView(target);
    });
});

function showView(name) {
    for (const [key, section] of Object.entries(views)) {
        section.classList.toggle('d-none', key !== name);
    }

    // Update navbar active link
    document.querySelectorAll('[data-view]').forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-view') === name);
    });

    // Render section content
    if (name === 'library') renderLibrary();
    else if (name === 'author') {
        if (window.prepareNewCapsule) {
            const tempId = Date.now();
            window.prepareNewCapsule(tempId);
        } else {
            renderAuthor();
        }
    }
    else if (name === 'learn') {
        renderLearn(window.currentLearnId || null);
    }
}

// Default view
showView('library');

const navButtons = document.querySelectorAll('.nav-btn');
const navbarCollapse = document.getElementById('mainNavbar');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        }
    });
});

export function switchSection(view, id = null) {
    // Hide view
    document.querySelectorAll('.view').forEach(v => v.classList.add('d-none'));

    // Show active view
    const active = document.getElementById(`${view}-view`);
    if (active) active.classList.remove('d-none');

    // Active navbar link
    const navLinks = document.querySelectorAll('.navbar .nav-btn');
    navLinks.forEach(link => link.classList.remove('active'));
    const navLink = document.querySelector(`.navbar .nav-btn[data-view="${view}"]`);
    if (navLink) navLink.classList.add('active');

    // Save ID for learn
    if (view === 'learn') {
        window.currentLearnId = id;
    }

    if (view === 'library' && window.renderLibrary) {
        window.renderLibrary();
    } else if (view === 'author' && window.renderAuthor) {
        window.renderAuthor(Number(id));
    } else if (view === 'learn' && window.renderLearn) {
        window.renderLearn(Number(id));
    }
}