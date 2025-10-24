import { switchSection } from "./main.js";

export function renderAuthor(editId = null) {
    const container = document.getElementById("author-view");
    container.innerHTML = "";

    let capsule = null;
    if (editId) {
        capsule = JSON.parse(localStorage.getItem(`pc_capsule_${editId}`) || "null");
    }

    const meta = capsule?.meta || {};
    const notes = capsule?.notes?.join("\n") || "";
    const flashcards = capsule?.flashcards || [];
    const quiz = capsule?.quiz || [];

    container.innerHTML = `
    <div class="container-fluid p-2 p-md-3">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <h3 class="me-2">Author Capsule</h3>
            <div class="mt-2 mt-md-0">
                <button class="btn btn-secondary me-2 mb-1 mb-md-0" id="backBtn">← Back</button>
                <button class="btn btn-success" id="saveBtn">💾 Save</button>
            </div>
        </div>
        <p class="text-light mb-3">Draft notes, flashcards, and quizzes.</p>

        <div class="row g-3">
            <!-- Meta -->
            <div class="col-12 col-md-6">
                <div class="card bg-dark border border-white text-light p-3 h-100">
                    <h5>Meta</h5>
                    <label class="mt-2">Title</label>
                    <input id="meta-title" class="form-control w-100" value="${meta.title || ""}" />

                    <label class="mt-2">Subject</label>
                    <input id="meta-subject" class="form-control w-100" value="${meta.subject || ""}" />

                    <label class="mt-2">Level</label>
                    <select id="meta-level" class="form-select w-100">
                        <option ${meta.level === "Beginner" ? "selected" : ""}>Beginner</option>
                        <option ${meta.level === "Intermediate" ? "selected" : ""}>Intermediate</option>
                        <option ${meta.level === "Advanced" ? "selected" : ""}>Advanced</option>
                    </select>

                    <label class="mt-2">Description</label>
                    <textarea id="meta-description" rows="2" class="form-control w-100">${meta.description || ""}</textarea>
                </div>
            </div>

            <!-- Notes -->
            <div class="col-12 col-md-6">
                <div class="card bg-dark border border-white text-light p-3 h-100">
                    <h5>Notes <small class="text-light">(one idea per line)</small></h5>
                    <textarea id="notes" class="form-control w-100" rows="10" placeholder="Write notes here...">${notes}</textarea>
                </div>
            </div>
        </div>

        <div class="row g-3 mt-2">
            <!-- Flashcards -->
            <div class="col-12 col-md-6">
                <div class="card bg-dark border border-white text-light p-3 h-100">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5>Flashcards</h5>
                        <button id="addFlashcard" class="btn btn-sm btn-outline-info">+ Add</button>
                    </div>
                    <div id="flashcardsList" class="mt-2"></div>
                </div>
            </div>

            <!-- Quiz -->
            <div class="col-12 col-md-6">
                <div class="card bg-dark border border-white text-light p-3 h-100">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5>Quiz</h5>
                        <button id="addQuiz" class="btn btn-sm btn-outline-info">+ Add</button>
                    </div>
                    <div id="quizList" class="mt-2"></div>
                </div>
            </div>
        </div>
    </div>`;

    const flashList = document.getElementById("flashcardsList");
    const quizList = document.getElementById("quizList");

    function renderFlashcards() {
        flashList.innerHTML = flashcards.map((f, i) => `
            <div class="d-flex gap-2 align-items-center mb-2">
                <input class="form-control" placeholder="Front" value="${f.front}" data-index="${i}" data-field="front">
                <input class="form-control" placeholder="Back" value="${f.back}" data-index="${i}" data-field="back">
                <button class="btn btn-sm btn-danger" data-remove="${i}">✕</button>
            </div>`
        ).join("");
    }


    function renderQuiz() {
    if (!quiz.length) {
        quizList.innerHTML = `<p class="text-light">No quiz questions available.</p>`;
        return;
    }

    quizList.innerHTML = quiz.map((q, i) => {
        const question = q.question ?? "";
        const correct = Number(q.correct ?? 0);
        const explanation = q.explanation ?? "";
        const choices = Array.isArray(q.choices) ? q.choices : ["", "", "", ""];

        return `
        <div class="border rounded p-2 mb-3">
            <label>Question</label>
            <input class="form-control mb-2" value="${question}" data-quiz="${i}" data-field="question">

            <div class="row">
                ${choices.map((c, j) => `
                    <div class="col-6 mb-2">
                        <input class="form-control" placeholder="Option ${j + 1}" value="${c ?? ''}" data-quiz="${i}" data-choice="${j}">
                    </div>`
                ).join("")}
            </div>

            <label>Correct index (0–3)</label>
            <input class="form-control mb-2" type="number" min="0" max="3" value="${correct}" data-quiz="${i}" data-field="correct">

            <label>Explanation (optional)</label>
            <textarea class="form-control" rows="1" data-quiz="${i}" data-field="explanation">${explanation}</textarea>

            <button class="btn btn-sm btn-danger mt-2" data-removequiz="${i}" aria-label="Remove content">✕ Remove</button>
        </div>`;
        }).join("");

        // Delete Question
        quizList.addEventListener("click", e => {
            if (e.target.dataset.removequiz !== undefined) {
                quiz.splice(Number(e.target.dataset.removequiz), 1);
                renderQuiz();
            }
        });

        // Change input
        quizList.addEventListener("input", e => {
            const quizIndex = e.target.dataset.quiz;
            const field = e.target.dataset.field;
            const choiceIndex = e.target.dataset.choice;

            if (quizIndex !== undefined) {
                const qi = Number(quizIndex);
                if (field === "question") {
                    quiz[qi].question = e.target.value;
                } else if (field === "correct") {
                    const val = parseInt(e.target.value);
                    quiz[qi].correct = isNaN(val) ? 0 : val;
                } else if (field === "explanation") {
                    quiz[qi].explanation = e.target.value;
                } else if (choiceIndex !== undefined) {
                    quiz[qi].choices[Number(choiceIndex)] = e.target.value;
                }
            }
        });
    }

    renderFlashcards();
    renderQuiz();

    document.getElementById("addFlashcard").addEventListener("click", () => {
        flashcards.push({ front: "", back: "" });
        renderFlashcards();
    });

    flashList.addEventListener("input", e => {
        const i = e.target.dataset.index;
        const field = e.target.dataset.field;
        if (i !== undefined) flashcards[i][field] = e.target.value;
    });

    flashList.addEventListener("click", e => {
        if (e.target.dataset.remove !== undefined) {
            flashcards.splice(e.target.dataset.remove, 1);
            renderFlashcards();
        }
    });

    document.getElementById("addQuiz").addEventListener("click", () => {
        quiz.push({
            question: "",
            choices: ["", "", "", ""],
            correct: 0,
            explanation: "",
        });
        renderQuiz();
    });

    quizList.addEventListener("click", e => {
        if (e.target.dataset.removequiz !== undefined) {
            quiz.splice(e.target.dataset.removequiz, 1);
            renderQuiz();
        }
    });

    quizList.addEventListener("input", e => {
        const quizIndex = e.target.dataset.quiz;
        const field = e.target.dataset.field;
        const choiceIndex = e.target.dataset.choice;

        if (quizIndex !== undefined) {
            const qi = Number(quizIndex);
            if (field === "question") {
            quiz[qi].question = e.target.value;
            } else if (field === "correct") {
            quiz[qi].correct = parseInt(e.target.value) || 0;
            } else if (field === "explanation") {
            quiz[qi].explanation = e.target.value;
            } else if (choiceIndex !== undefined) {
            quiz[qi].choices[Number(choiceIndex)] = e.target.value;
            }
        }
    });



    document.getElementById("saveBtn").addEventListener("click", () => {
        const title = document.getElementById("meta-title").value.trim();
        if (!title) return alert("Title is required!");

        const capsule = {
            id: editId || window.newCapsuleTempId || crypto.randomUUID(),
            schema: "pocket-classroom/v1",
            meta: {
                title,
                subject: document.getElementById("meta-subject").value.trim(),
                level: document.getElementById("meta-level").value,
                description: document.getElementById("meta-description").value.trim(),
            },
            notes: document
                .getElementById("notes")
                .value.split("\n")
                .map(n => n.trim())
                .filter(n => n),
            flashcards,
            quiz,
            updatedAt: new Date().toISOString(),
        };

        delete window.newCapsuleTempId;

        const indexKey = "pc_capsules_index";
        let indexList = JSON.parse(localStorage.getItem(indexKey) || "[]");

        const idx = indexList.findIndex(c => c.id === capsule.id);
        if (idx >= 0) {
            // merge meta & updatedAt into existing entry
            indexList[idx] = {
                ...indexList[idx],
                title: capsule.meta.title,
                subject: capsule.meta.subject,
                level: capsule.meta.level,
                updatedAt: capsule.updatedAt
            };
        } 
        else {
            indexList.push({
                id: capsule.id,
                title: capsule.meta.title,
                subject: capsule.meta.subject,
                level: capsule.meta.level,
                updatedAt: capsule.updatedAt
            });
        }

        localStorage.setItem(indexKey, JSON.stringify(indexList));
        localStorage.setItem(`pc_capsule_${capsule.id}`, JSON.stringify(capsule));
        alert("Capsule saved successfully ✅");
    });

    // Back to library
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            switchSection("library"); 
        });
    }
}
// Prepare to create new capsule
window.prepareNewCapsule = function (tempId) {
    const container = document.getElementById("author-view");
    container.innerHTML = ""; 

    renderAuthor(null);

    window.newCapsuleTempId = tempId;
};

// Make sure the function is available globally
window.renderAuthor = renderAuthor;