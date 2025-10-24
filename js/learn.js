export function renderLearn(selectedId = null) {
    const container = document.getElementById("learn-view");
    if (!container) return;

    const capsules = JSON.parse(localStorage.getItem("pc_capsules_index") || "[]");
    if (capsules.length === 0) {
        container.innerHTML = `
            <div class="text-center text-light p-5">
                <p>No capsules found.</p>
                <p><a href="#" data-view="author" class="btn btn-outline-light btn-sm">Create your first capsule</a></p>
            </div>`;
        return;
    }

    let currentId = selectedId != null ? String(selectedId) : (capsules.length > 0 ? capsules[0].id : null);
    let capsuleData = currentId ? loadCapsule(currentId) : null;


    container.innerHTML = `
        <div class="p-4 text-light">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="fw-bold">Learn</h3>
                <div class="d-flex gap-2 align-items-center">
                    <select id="capsuleSelector" class="form-select bg-dark text-light">
                        ${capsules.map(c => `<option value="${c.id}" ${c.id === currentId ? 'selected' : ''}>${c.title}</option>`).join("")}
                    </select>
                    <button id="exportCapsule" aria-label="Export JSON" class="btn btn-outline-light btn-sm">Export</button>
                </div>
            </div>

            <p class="text-light mb-4">Study a capsule in Notes, Flashcards, or Quiz mode.</p>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-3" id="learnTabs">
                <li class="nav-item"><a class="nav-link active" data-mode="notes" href="#">Notes</a></li>
                <li class="nav-item"><a class="nav-link" data-mode="flashcards" href="#">Flashcards</a></li>
                <li class="nav-item"><a class="nav-link" data-mode="quiz" href="#">Quiz</a></li>
            </ul>

            <!-- Content area -->
            <div id="learnContent" class="mt-3"></div>
        </div>
    `;

    const selector = container.querySelector("#capsuleSelector");
    const content = container.querySelector("#learnContent");
    const tabs = container.querySelectorAll("#learnTabs .nav-link");
    const exportBtn = container.querySelector("#exportCapsule");

    // Capsule Selector
    selector.addEventListener("change", (e) => {
        currentId = e.target.value;
        window.currentLearnId = currentId;
        capsuleData = loadCapsule(currentId);

        const activeTab = container.querySelector("#learnTabs .nav-link.active").dataset.mode;
        if (activeTab === "notes") renderNotes();
        else if (activeTab === "flashcards") renderFlashcards();
        else renderQuiz();
    });

    // Tabs 
    tabs.forEach(tab => {
        tab.addEventListener("click", e => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const mode = tab.dataset.mode;
            if (mode === "notes") renderNotes();
            else if (mode === "flashcards") renderFlashcards();
            else renderQuiz();
        });
    });

    // Export
    exportBtn.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(capsuleData, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${capsuleData.meta?.title || "capsule"}.json`;
        a.click();
    });


    // Notes
    function renderNotes() {
        const notes = capsuleData.notes || [];

        if (notes.length === 0) {
            content.innerHTML = `<p class="text-light">No notes found for this capsule.</p>`;
            return;
        }

        content.innerHTML = `
            <input type="text" id="noteSearch" class="form-control bg-dark text-light mb-1" placeholder="Search notes...">
            <small class="text-light d-block mb-3">
                This notes belong to capsule <strong>Web Development Course</strong> 
                with <strong>Advanced</strong> level.
            </small>
            <ol id="noteList" class="list-group list-group-numbered"></ol>
        `;

        const list = content.querySelector("#noteList");
        const search = content.querySelector("#noteSearch");

        const renderList = (filter = "") => {
            const f = filter.toLowerCase();
            list.innerHTML = notes
                .filter(n => n && n.toLowerCase().includes(f))
                .map(n => `<li class="list-group-item bg-dark text-light border-secondary">${n}</li>`)
                .join("");
        };

        search.addEventListener("input", e => renderList(e.target.value));
        renderList();
    }

    // Flashcard
    function renderFlashcards() {
        const cards = capsuleData.flashcards || [];
        if (cards.length === 0) {
            content.innerHTML = `<p class="text-light">No flashcards available.</p>`;
            return;
        }

        let index = 0;
        let flipped = false;
        const knownSet = JSON.parse(localStorage.getItem(`known_${currentId}`) || "[]");

        const sections = ["notes", "flashcards", "quiz"];
        let currentSectionIndex = 1;

        const setActiveTab = (sectionName) => {
            const tabs = document.querySelectorAll(".nav-link");
            tabs.forEach(tab => {
                if (tab.dataset.section === sectionName) {
                    tab.classList.add("active");
                } else {
                    tab.classList.remove("active");
                }
            });
        };

        const renderCard = () => {
            const c = cards[index];
            const known = knownSet.includes(index);

            content.innerHTML = `
                <div class="text-center">
                    <div class="flashcard-container mb-3" style="perspective: 1000px; cursor:pointer;">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <h5 style="user-select:none; color:#000;">${c.front}</h5>
                            </div>
                            <div class="flashcard-back">
                                <h5 style="user-select:none; color:#000;">${c.back}</h5>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex justify-content-between mt-2">
                        <button id="prevCard" aria-label="Previous Flashcard" class="btn btn-danger btn-sm">Prev</button>
                        <div>
                            <button id="markKnown" class="btn ${known ? 'btn-success' : 'btn-outline-success'} btn-sm me-2">
                                ${known ? 'Known ✓' : 'Mark Known'}
                            </button>
                            <button id="nextCard" aria-label="Next Flashcard" class="btn btn-danger btn-sm">Next</button>
                        </div>
                    </div>
                    <p class="text-light mt-2">Card ${index + 1} / ${cards.length}</p>
                </div>
            `;

            const flashcardInner = content.querySelector(".flashcard-inner");
            const flashcardContainer = content.querySelector(".flashcard-container");

            flashcardContainer.onclick = () => {
                flipped = !flipped;
                flashcardInner.style.transform = flipped ? "rotateY(180deg)" : "rotateY(0deg)";
            };

            content.querySelector("#prevCard").onclick = () => {
                index = (index - 1 + cards.length) % cards.length;
                flipped = false;
                renderCard();
            };
            content.querySelector("#nextCard").onclick = () => {
                index = (index + 1) % cards.length;
                flipped = false;
                renderCard();
            };

            content.querySelector("#markKnown").onclick = () => {
                const known = knownSet.includes(index);
                if (known) {
                    const idx = knownSet.indexOf(index);
                    if (idx >= 0) knownSet.splice(idx, 1);
                    cards[index].known = false;
                } else {
                    knownSet.push(index);
                    cards[index].known = true;
                }

                localStorage.setItem(`known_${currentId}`, JSON.stringify(knownSet));

                try {
                    const capsuleKey = `pc_capsule_${currentId}`;
                    const capsule = JSON.parse(localStorage.getItem(capsuleKey) || "{}");
                    capsule.flashcards = cards;
                    capsule.updatedAt = new Date().toISOString();
                    localStorage.setItem(capsuleKey, JSON.stringify(capsule));
                } catch (err) {
                    console.warn("Failed to update capsule in localStorage:", err);
                }

                try {
                    const indexList = JSON.parse(localStorage.getItem("pc_capsules_index") || "[]");
                    const idx = indexList.findIndex(c => String(c.id) === String(currentId));
                    if (idx >= 0) {
                        indexList[idx].knownCards = knownSet.length;
                        indexList[idx].updatedAt = new Date().toISOString();
                        localStorage.setItem("pc_capsules_index", JSON.stringify(indexList));
                    }
                } catch (err) {
                    console.warn("Failed to update pc_capsules_index:", err);
                }

                window.dispatchEvent(new Event("capsuleProgressUpdated"));

                renderCard();
            };
        };

        document.onkeydown = (e) => {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable)) return;

            const flashcardInner = content.querySelector(".flashcard-inner");

            if (e.code === "Space") {
                e.preventDefault();
                flipped = !flipped;
                if (flashcardInner)
                    flashcardInner.style.transform = flipped ? "rotateY(180deg)" : "rotateY(0deg)";
                return;
            }

            if (e.key === "]" || e.code === "BracketRight") {
                e.preventDefault();
                currentSectionIndex = (currentSectionIndex + 1) % sections.length;
                const nextSection = sections[currentSectionIndex];
                setActiveTab(nextSection);

                if (nextSection === "notes" && typeof renderNotes === "function") renderNotes();
                else if (nextSection === "flashcards") renderFlashcards();
                else if (nextSection === "quiz" && typeof renderQuiz === "function") renderQuiz();
                return;
            }

            if (e.key === "[" || e.code === "BracketLeft") {
                e.preventDefault();
                currentSectionIndex = (currentSectionIndex - 1 + sections.length) % sections.length;
                const prevSection = sections[currentSectionIndex];
                setActiveTab(prevSection);

                if (prevSection === "notes" && typeof renderNotes === "function") renderNotes();
                else if (prevSection === "flashcards") renderFlashcards();
                else if (prevSection === "quiz" && typeof renderQuiz === "function") renderQuiz();
                return;
            }
        };

        renderCard();
    }

    // Quiz
    function renderQuiz() {
        const quiz = capsuleData.quiz || [];
        if (quiz.length === 0) {
            content.innerHTML = `<p class="text-light">No quiz questions available.</p>`;
            return;
        }

        let qIndex = 0;
        let score = 0;
        const bestScoreKey = `quiz_best_${currentId}`;
        const bestScore = Number(localStorage.getItem(bestScoreKey) || 0);

        const renderQuestion = () => {
            const q = quiz[qIndex];
            content.innerHTML = `
                <div class="card bg-dark border text-light p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-secondary">Q ${qIndex + 1} / ${quiz.length}</span>
                        
                    </div>
                    <h5>${q.question}</h5>
                    <div id="answers" class="mt-3">
                        ${q.options.map((opt, i) => `
                            <button class="btn btn-outline-light w-100 text-start mb-2" data-index="${i}">
                                ${String.fromCharCode(65 + i)}. ${opt}
                            </button>
                        `).join("")}
                    </div>
                </div>
            `;

            const buttons = content.querySelectorAll("#answers button");
            buttons.forEach(btn => {
                btn.addEventListener("click", () => {
                    btn.addEventListener("click", () => {
                        const chosen = Number(btn.dataset.index);
                        const correct = chosen === Number(q.answer);

                        btn.classList.remove("btn-outline-light");
                        btn.classList.add(correct ? "btn-success" : "btn-danger");

                        // Save answers
                        if (correct) score++;

                        // Save progress in localstorage
                        const capsule = JSON.parse(localStorage.getItem(`pc_capsule_${currentId}`) || "{}");

                        capsule.progress = capsule.progress || {
                            total: quiz.length,
                            correct: 0,
                            knownCards: 0,
                            lastScore: 0
                        };

                        if (correct) capsule.progress.knownCards++;

                        // Update Progress
                        capsule.progress.correct = score;
                        capsule.progress.lastScore = Math.round((score / quiz.length) * 100);

                        // Save again in localstorage
                        localStorage.setItem(`pc_capsule_${currentId}`, JSON.stringify(capsule));

                        const indexList = JSON.parse(localStorage.getItem("pc_capsules_index") || "[]");
                        const idx = indexList.findIndex(c => c.id === currentId);
                        if (idx >= 0) {
                            indexList[idx].progress = capsule.progress.lastScore;
                            indexList[idx].updatedAt = new Date().toISOString();
                            localStorage.setItem("pc_capsules_index", JSON.stringify(indexList));
                        };

                        buttons.forEach(b => (b.disabled = true));

                        setTimeout(() => {
                            qIndex++;
                            if (qIndex < quiz.length) renderQuestion();
                            else showResult();
                        }, 800);
                    });

                });
            });
        };

        const showResult = () => {
            const percent = quiz.length > 0 ? Math.round((score / quiz.length) * 100) : 0;

            let newBest = bestScore;
            if (percent > bestScore) {
                newBest = percent;
            } else if (percent < bestScore) {
                const penalty = 10 // Decrease 10 score per wrong answer
                newBest = Math.max(0, bestScore - penalty); // Avoid being negative
            }

            localStorage.setItem(bestScoreKey, newBest);

            // Update progress in capsule index for Library view 
            const indexList = JSON.parse(localStorage.getItem("pc_capsules_index") || "[]");
            const idx = indexList.findIndex(c => String(c.id) === String(currentId));

            if (idx >= 0) {
                indexList[idx].bestScore = newBest; // Update percent of progress
                indexList[idx].updatedAt = new Date().toISOString();
                localStorage.setItem("pc_capsules_index", JSON.stringify(indexList));
            }

            window.dispatchEvent(new Event("capsuleProgressUpdated"));

            content.innerHTML = `
                <div class="text-center p-4">
                    <h4>Your Score: ${percent}%</h4>
                    <button class="btn btn-outline-light mt-3" id="retryQuiz">Retry</button>
                </div>
            `;

            content.querySelector("#retryQuiz").addEventListener("click", () => {
                qIndex = 0;
                score = 0;
                renderQuestion();
            });
        };

        renderQuestion();
    }

    function loadCapsule(id) {
        const raw = JSON.parse(localStorage.getItem(`pc_capsule_${id}`) || "{}");

        // normalize notes -> array of strings (keep as strings)
        const notes = Array.isArray(raw.notes) ? raw.notes.slice() : [];

        // normalize flashcards -> [{front, back}]
        const flashcards = Array.isArray(raw.flashcards)
            ? raw.flashcards.map(f => ({ front: f.front ?? f.front ?? "", back: f.back ?? f.back ?? "" }))
            : [];

        // normalize quiz -> {question, options, answer, explanation}
        const quiz = Array.isArray(raw.quiz)
            ? raw.quiz.map(q => ({
                question: q.question ?? q.q ?? "",
                options: q.choices ?? q.options ?? [],
                answer: Number(q.correct ?? q.answer ?? 0) || 0,
                explanation: q.explanation ?? q.expl ?? ""
            }))
            : [];

        return {
            meta: raw.meta || {},
            notes,
            flashcards,
            quiz
        };
    }


    // Default tab
    renderNotes();


    const now = new Date().toISOString();
    if (capsuleData && capsuleData.meta) {
        capsuleData.meta.updatedAt = now;
        localStorage.setItem(`pc_capsule_${currentId}`, JSON.stringify(capsuleData));

        const indexList = JSON.parse(localStorage.getItem('pc_capsules_index') || '[]');
        const idx = indexList.findIndex(c => c.id === currentId);
        if (idx >= 0) {
            indexList[idx].updatedAt = now;
        }
        localStorage.setItem('pc_capsules_index', JSON.stringify(indexList));
    }
}