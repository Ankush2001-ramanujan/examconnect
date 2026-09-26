/**
 * profile.js — Student Profile page logic.
 *
 * Handles:
 *  - Auth guard (redirect to / if not logged in)
 *  - Loading and displaying personal profile form
 *  - Saving profile via PUT /student/profile
 *  - Loading, displaying, adding, editing, and deleting education records
 */

/* ── State ────────────────────────────────────────────────── */
let educationRecords = [];
let editingEducationId = null;

/* ── DOM refs ─────────────────────────────────────────────── */
const loadingCard       = qs("#loading-card");
const mainContent       = qs("#main-content");
const feedbackEl        = qs("#feedback-msg");

// Profile form
const profileForm       = qs("#profile-form");
const fFirstName        = qs("#firstName");
const fLastName         = qs("#lastName");
const fDob              = qs("#dateOfBirth");
const fGender           = qs("#gender");
const fState            = qs("#state");
const fCategory         = qs("#category");
const saveProfileBtn    = qs("#save-profile-btn");

// Education
const educationListEl   = qs("#education-list");
const eduForm           = qs("#education-form");
const eduFormTitle      = qs("#edu-form-title");
const fQualification    = qs("#qualification");
const fCourseName       = qs("#courseName");
const fStream           = qs("#stream");
const fPassingYear      = qs("#passingYear");
const fPercentage       = qs("#percentage");
const fInstitution      = qs("#institutionName");
const fBoard            = qs("#boardOrUniversity");
const saveEduBtn        = qs("#save-edu-btn");
const cancelEduBtn      = qs("#cancel-edu-btn");

/* ── Init ─────────────────────────────────────────────────── */
async function init() {
  try {
    // Auth guard
    await authMe();
  } catch {
    window.location.href = "../index.html";
    return;
  }

  await loadProfileData();
  show(mainContent);
  hide(loadingCard);
}

async function loadProfileData() {
  try {
    const [profileData, eduData] = await Promise.all([
      getProfile().catch(() => null),
      getEducation().catch(() => ({ education: [] })),
    ]);

    if (profileData?.profile) {
      const p = profileData.profile;
      fFirstName.value  = p.firstName  ?? "";
      fLastName.value   = p.lastName   ?? "";
      fDob.value        = p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "";
      fGender.value     = p.gender     ?? "";
      fState.value      = p.state      ?? "";
      fCategory.value   = p.category   ?? "";
    }

    educationRecords = eduData?.education ?? [];
    renderEducationList();
  } catch (err) {
    showError(feedbackEl, "Unable to load your profile. " + (err.message || ""));
  }
}

/* ── Profile form ─────────────────────────────────────────── */
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg(feedbackEl);

  if (!isNonEmpty(fFirstName.value)) {
    showError(feedbackEl, "First name is required.");
    feedbackEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  saveProfileBtn.disabled     = true;
  saveProfileBtn.textContent  = "Saving…";

  try {
    const payload = {
      firstName: fFirstName.value.trim(),
      lastName:  fLastName.value.trim()   || undefined,
      gender:    fGender.value            || undefined,
      state:     fState.value.trim()      || undefined,
      category:  fCategory.value          || undefined,
    };

    if (fDob.value) {
      payload.dateOfBirth = `${fDob.value}T00:00:00.000Z`;
    }

    await saveProfile(payload);
    showSuccess(feedbackEl,
      "Profile saved successfully. Your eligibility will be recalculated when you check your exams."
    );
    showToast("Profile saved!", "success");
  } catch (err) {
    showError(feedbackEl, err.message || "Unable to save profile.");
  } finally {
    saveProfileBtn.disabled    = false;
    saveProfileBtn.textContent = "Save Profile";
    feedbackEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

/* ── Education list ───────────────────────────────────────── */
function renderEducationList() {
  educationListEl.innerHTML = "";

  if (educationRecords.length === 0) {
    educationListEl.innerHTML =
      '<p style="color:var(--clr-muted);font-size:13px;">No education records yet. Add one below.</p>';
    return;
  }

  educationRecords.forEach((record) => {
    const item = el("article", { class: "education-item" });

    // Info block
    const info = el("div");
    info.appendChild(el("h3", {}, record.qualification));
    if (record.courseName)
      info.appendChild(el("p", {}, record.courseName));
    if (record.stream)
      info.appendChild(el("p", {}, `Stream: ${record.stream}`));
    if (record.institutionName)
      info.appendChild(el("p", {}, record.institutionName));
    if (record.passingYear)
      info.appendChild(el("p", {}, `Passing Year: ${record.passingYear}`));
    if (record.percentage !== null && record.percentage !== undefined)
      info.appendChild(el("p", {}, `Percentage: ${record.percentage}%`));
    item.appendChild(info);

    // Action buttons
    const actions = el("div", { class: "education-actions" });

    const editBtn = el("button", { class: "btn btn--outline btn--sm", type: "button" }, "Edit");
    editBtn.addEventListener("click", () => startEditingEducation(record));
    actions.appendChild(editBtn);

    const delBtn = el("button", { class: "btn btn--danger btn--sm", type: "button" }, "Delete");
    delBtn.addEventListener("click", () => handleDeleteEducation(record.id));
    actions.appendChild(delBtn);

    item.appendChild(actions);
    educationListEl.appendChild(item);
  });
}

/* ── Education form ───────────────────────────────────────── */
function clearEducationForm() {
  fQualification.value = "";
  fCourseName.value    = "";
  fStream.value        = "";
  fPassingYear.value   = "";
  fPercentage.value    = "";
  fInstitution.value   = "";
  fBoard.value         = "";
}

function startEditingEducation(record) {
  editingEducationId   = record.id;
  fQualification.value = record.qualification    ?? "";
  fCourseName.value    = record.courseName       ?? "";
  fStream.value        = record.stream           ?? "";
  fPassingYear.value   = record.passingYear      !== null ? String(record.passingYear) : "";
  fPercentage.value    = record.percentage       !== null ? String(record.percentage)  : "";
  fInstitution.value   = record.institutionName  ?? "";
  fBoard.value         = record.boardOrUniversity ?? "";

  setText(eduFormTitle, "Edit Education");
  setText(saveEduBtn, "Update Education");
  show(cancelEduBtn);
  clearMsg(feedbackEl);

  eduForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

cancelEduBtn.addEventListener("click", () => {
  editingEducationId = null;
  clearEducationForm();
  setText(eduFormTitle, "Add Education");
  setText(saveEduBtn, "Add Education");
  hide(cancelEduBtn);
  clearMsg(feedbackEl);
});

eduForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg(feedbackEl);

  if (!isNonEmpty(fQualification.value)) {
    showError(feedbackEl, "Qualification is required.");
    return;
  }

  saveEduBtn.disabled = true;
  const originalLabel = editingEducationId ? "Update Education" : "Add Education";
  saveEduBtn.textContent = editingEducationId ? "Updating…" : "Adding…";

  try {
    const payload = {
      qualification: fQualification.value.trim(),
    };
    if (fCourseName.value.trim())   payload.courseName       = fCourseName.value.trim();
    if (fInstitution.value.trim())  payload.institutionName  = fInstitution.value.trim();
    if (fBoard.value.trim())        payload.boardOrUniversity = fBoard.value.trim();
    if (fStream.value.trim())       payload.stream           = fStream.value.trim();
    if (fPassingYear.value)         payload.passingYear      = Number(fPassingYear.value);
    if (fPercentage.value)          payload.percentage       = Number(fPercentage.value);

    if (editingEducationId !== null) {
      await updateEducation(editingEducationId, payload);
      showSuccess(feedbackEl,
        "Education record updated. Your eligibility will be recalculated when you check your exams."
      );
      showToast("Education updated!", "success");
    } else {
      await addEducation(payload);
      showSuccess(feedbackEl,
        "Education added. Your eligibility will be recalculated when you check your exams."
      );
      showToast("Education added!", "success");
    }

    // Reload education list from server
    const eduData = await getEducation();
    educationRecords = eduData?.education ?? [];
    renderEducationList();

    editingEducationId = null;
    clearEducationForm();
    setText(eduFormTitle, "Add Education");
    setText(saveEduBtn, "Add Education");
    hide(cancelEduBtn);
  } catch (err) {
    showError(feedbackEl, err.message || "Unable to save education record.");
  } finally {
    saveEduBtn.disabled    = false;
    saveEduBtn.textContent = originalLabel;
    feedbackEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

/* ── Delete education ─────────────────────────────────────── */
async function handleDeleteEducation(id) {
  if (!window.confirm("Delete this education record?")) return;

  clearMsg(feedbackEl);

  try {
    await deleteEducation(id);
    const eduData = await getEducation();
    educationRecords = eduData?.education ?? [];
    renderEducationList();
    showSuccess(feedbackEl, "Education record deleted successfully.");
    showToast("Record deleted.", "info");
  } catch (err) {
    showError(feedbackEl, err.message || "Unable to delete education record.");
  }
}

/* ── Navigation ───────────────────────────────────────────── */
qs("#back-btn").addEventListener("click", () => {
  window.location.href = "../index.html";
});
qs("#check-exams-btn").addEventListener("click", () => {
  window.location.href = "../index.html";
});

/* ── Boot ─────────────────────────────────────────────────── */
init();
