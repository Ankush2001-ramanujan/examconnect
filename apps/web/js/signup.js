/**
 * signup.js — Student Registration Page Controller
 *
 * Implements:
 * - Session detection & redirect if already authenticated
 * - Client-side validation & normalization (email, length limits, XSS-safe handling)
 * - Real-time password strength analyzer (Argon2-friendly policy)
 * - Real-time password confirmation matching
 * - Accessible show/hide password visibility toggles
 * - Secure registration call to backend with automatic session establishment
 * - Seamless onboarding redirect to profile or dashboard
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ── DOM References ─────────────────────────────────────── */
  const form              = qs("#signup-form");
  const firstNameInput    = qs("#signup-firstName");
  const lastNameInput     = qs("#signup-lastName");
  const emailInput        = qs("#signup-email");
  const passwordInput     = qs("#signup-password");
  const confirmPassInput  = qs("#signup-confirm-password");
  const termsCheckbox     = qs("#signup-terms");
  const submitBtn         = qs("#signup-btn");
  const errorAlert        = qs("#signup-error");
  const successAlert      = qs("#signup-success");

  // Toggles
  const togglePassBtn     = qs("#toggle-password-btn");
  const toggleConfirmBtn  = qs("#toggle-confirm-btn");

  // Password Meter Elements
  const meterBadge        = qs("#meter-badge");
  const meterBars         = qsa(".meter-bar");
  const reqLength         = qs("#req-length");
  const reqCases          = qs("#req-cases");
  const reqNumberSymbol   = qs("#req-number-symbol");
  const matchHint         = qs("#match-hint");

  /* ── 1. Check Existing Session ─────────────────────────── */
  async function checkSession() {
    try {
      const data = await authMe();
      if (data && data.user) {
        // User already has an active session, redirect to portal
        const isPagesDir = window.location.pathname.includes("/pages/");
        window.location.href = isPagesDir ? "../index.html" : "index.html";
      }
    } catch {
      // 401 Unauthenticated is expected here for new users
    }
  }

  checkSession();

  /* ── 2. Password Visibility Toggles ─────────────────────── */
  function setupPasswordToggle(button, input) {
    if (!button || !input) return;

    button.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      const showPath = button.querySelector(".eye-icon");
      const hidePath = button.querySelector(".eye-off-icon");

      if (showPath && hidePath) {
        if (isPassword) {
          showPath.classList.add("hidden");
          hidePath.classList.remove("hidden");
          button.setAttribute("aria-label", "Hide password");
        } else {
          showPath.classList.remove("hidden");
          hidePath.classList.add("hidden");
          button.setAttribute("aria-label", "Show password");
        }
      }
    });
  }

  setupPasswordToggle(togglePassBtn, passwordInput);
  setupPasswordToggle(toggleConfirmBtn, confirmPassInput);

  /* ── 3. Password Strength Evaluation ─────────────────────── */
  function evaluatePassword(pwd) {
    const checks = {
      length: pwd.length >= 8,
      upperLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
      numberOrSymbol: /[0-9]/.test(pwd) || /[^a-zA-Z0-9]/.test(pwd),
      strongLength: pwd.length >= 12,
    };

    let score = 0;
    if (checks.length) score++;
    if (checks.upperLower) score++;
    if (checks.numberOrSymbol) score++;
    if (checks.strongLength && score === 3) score++;

    return { score, checks };
  }

  function updateMeterUI() {
    const pwd = passwordInput.value;
    const { score, checks } = evaluatePassword(pwd);

    // Update requirements checklist
    updateReqState(reqLength, checks.length);
    updateReqState(reqCases, checks.upperLower);
    updateReqState(reqNumberSymbol, checks.numberOrSymbol);

    // Update Meter Bars
    const levels = ["weak", "fair", "good", "strong"];
    meterBars.forEach((bar, index) => {
      bar.className = "meter-bar";
      if (pwd.length > 0 && index < score) {
        const levelClass = levels[Math.max(0, score - 1)];
        bar.classList.add(`active-${levelClass}`);
      }
    });

    // Update Badge
    if (!meterBadge) return;

    meterBadge.className = "meter-badge";
    if (pwd.length === 0) {
      meterBadge.textContent = "Required";
      meterBadge.classList.add("weak");
    } else if (score <= 1) {
      meterBadge.textContent = "Weak";
      meterBadge.classList.add("weak");
    } else if (score === 2) {
      meterBadge.textContent = "Fair";
      meterBadge.classList.add("fair");
    } else if (score === 3) {
      meterBadge.textContent = "Good";
      meterBadge.classList.add("good");
    } else {
      meterBadge.textContent = "Strong";
      meterBadge.classList.add("strong");
    }

    checkMatch();
  }

  function updateReqState(element, isMet) {
    if (!element) return;
    const icon = element.querySelector(".req-icon");
    if (isMet) {
      element.classList.add("met");
      if (icon) icon.textContent = "✓";
    } else {
      element.classList.remove("met");
      if (icon) icon.textContent = "•";
    }
  }

  function checkMatch() {
    const pwd = passwordInput.value;
    const confirm = confirmPassInput.value;

    if (!matchHint) return;

    if (confirm.length === 0) {
      matchHint.textContent = "";
      matchHint.className = "match-hint";
      return;
    }

    if (pwd === confirm) {
      matchHint.textContent = "✓ Passwords match";
      matchHint.className = "match-hint match";
    } else {
      matchHint.textContent = "✕ Passwords do not match";
      matchHint.className = "match-hint mismatch";
    }
  }

  passwordInput.addEventListener("input", updateMeterUI);
  confirmPassInput.addEventListener("input", checkMatch);

  /* ── 4. Form Submit Handler ─────────────────────────────── */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearMsg(errorAlert);
    clearMsg(successAlert);

    const firstName = firstNameInput.value.trim();
    const lastName  = lastNameInput.value.trim();
    const email     = emailInput.value.trim().toLowerCase();
    const password  = passwordInput.value;
    const confirm   = confirmPassInput.value;
    const termsOk   = termsCheckbox.checked;

    /* Security & Input Validations */
    if (!isNonEmpty(firstName)) {
      showError(errorAlert, "Please provide your first name.");
      firstNameInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showError(errorAlert, "Please enter a valid email address (e.g. name@example.com).");
      emailInput.focus();
      return;
    }

    if (email.length > 254) {
      showError(errorAlert, "Email address is too long (maximum 254 characters).");
      emailInput.focus();
      return;
    }

    if (password.length < 8) {
      showError(errorAlert, "Password must be at least 8 characters long.");
      passwordInput.focus();
      return;
    }

    if (password.length > 128) {
      showError(errorAlert, "Password must not exceed 128 characters.");
      passwordInput.focus();
      return;
    }

    if (password !== confirm) {
      showError(errorAlert, "Passwords do not match. Please re-enter your confirmation password.");
      confirmPassInput.focus();
      return;
    }

    if (!termsOk) {
      showError(errorAlert, "Please acknowledge the eligibility declaration to create your account.");
      termsCheckbox.focus();
      return;
    }

    /* Set loading state */
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Creating Account…';

    try {
      const payload = {
        email,
        password,
        firstName,
        ...(lastName ? { lastName } : {}),
      };

      const response = await authRegister(payload);

      showSuccess(
        successAlert,
        "Account created successfully! Preparing your student portal…"
      );

      // Determine navigation target
      const isPagesDir = window.location.pathname.includes("/pages/");
      const targetUrl = isPagesDir ? "student-profile.html" : "pages/student-profile.html";

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1200);

    } catch (err) {
      let friendlyMsg = err.message || "Failed to create account. Please try again.";

      if (err.message && err.message.includes("EMAIL_ALREADY_EXISTS")) {
        friendlyMsg = "An account with this email address already exists. Please sign in instead.";
      } else if (err.status === 409) {
        friendlyMsg = "An account with this email already exists. Please sign in instead.";
      } else if (err.status === 400) {
        friendlyMsg = err.message || "Please check your input details and try again.";
      }

      showError(errorAlert, friendlyMsg);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

  // Initial meter render
  updateMeterUI();
});
