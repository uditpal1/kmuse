(function () {
  "use strict";

  const form = document.getElementById("applicationForm");
  if (!form) return;

  const photos = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  let video = null;

  // Telegram WebApp initialize
  const tg = window.Telegram.WebApp;
  tg.expand();
  tg.setHeaderColor("#FFFFFF");
  tg.setBackgroundColor("#FFFFFF");

  const dobInput = document.getElementById("dob");
  const ageInput = document.getElementById("age");
  const ageWarning = document.getElementById("ageWarning");
  const submitBtn = document.getElementById("submitBtn");

  function calculateAge(dob) {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  }

  if (dobInput) {
    dobInput.addEventListener("change", () => {
      const age = calculateAge(dobInput.value);
      if (age === null) { ageInput.value = ""; ageWarning.style.display = "none"; return; }
      ageInput.value = age;
      ageWarning.style.display = age < 18 ? "block" : "none";
      updateSubmitState();
    });
  }

  const consents = document.querySelectorAll(".consent");
  consents.forEach((c) => c.addEventListener("change", updateSubmitState));

  function updateSubmitState() {
    const allConsents = Array.from(consents).every((c) => c.checked);
    const age = parseInt(ageInput.value, 10);
    submitBtn.disabled = !(allConsents && age && age >= 18);
  }

  const photoGrid = document.getElementById("photoGrid");

  function renderPhotoSlots() {
    photoGrid.innerHTML = "";
    PHOTO_SLOTS.forEach((slot) => {
      const demoUrl = DEMO_IMAGES["photo" + slot.num];
      const card = document.createElement("div");
      card.className = "photo-card";
      card.innerHTML = `
        <div class="photo-card-head">
          <span class="num">${String(slot.num).padStart(2, "0")}</span>
          <h4>${slot.title}</h4>
        </div>
        <p class="instruction">${slot.instruction}</p>
        <div class="photo-block">
          <div class="photo-block-label">Reference Photo</div>
          <div class="photo-area" id="demo-area-${slot.num}"><div class="placeholder"><p class="label">Loading…</p></div></div>
        </div>
        <div class="photo-block">
          <div class="photo-block-label">Your Photo</div>
          <div class="photo-area placeholder" id="upload-area-${slot.num}">
            <p class="label">Upload your photo</p>
            <button type="button" class="btn btn-ghost btn-sm" data-slot="${slot.num}">Choose Photo</button>
          </div>
          <input type="file" id="file-input-${slot.num}" accept="image/jpeg,image/png,image/webp" hidden />
          <div class="file-actions" id="file-actions-${slot.num}" style="display:none;">
            <button type="button" class="btn btn-ghost btn-sm" data-replace="${slot.num}">Replace</button>
            <button type="button" class="btn btn-ghost btn-sm" data-remove="${slot.num}">Remove</button>
          </div>
        </div>
      `;
      photoGrid.appendChild(card);

      const demoArea = card.querySelector(`#demo-area-${slot.num}`);
      const img = new Image();
      img.onload = () => { demoArea.innerHTML = ""; demoArea.classList.remove("placeholder"); demoArea.appendChild(img); };
      img.onerror = () => { demoArea.innerHTML = '<div class="unavailable">Reference unavailable</div>'; };
      img.src = demoUrl; img.alt = `Reference ${slot.title}`;
      img.style.width = "100%"; img.style.height = "100%"; img.style.objectFit = "cover";

      const fileInput = card.querySelector(`#file-input-${slot.num}`);
      card.querySelector(`button[data-slot="${slot.num}"]`).addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => handlePhotoSelect(slot.num, e.target.files[0]));
      card.querySelector(`button[data-replace="${slot.num}"]`).addEventListener("click", () => fileInput.click());
      card.querySelector(`button[data-remove="${slot.num}"]`).addEventListener("click", () => removePhoto(slot.num));
    });
  }

  function handlePhotoSelect(slotNum, file) {
    if (!file) return;
    if (!UPLOAD_LIMITS.photoTypes.includes(file.type) || file.size > UPLOAD_LIMITS.photoMaxMB * 1024 * 1024) {
      window.showToast("Invalid photo. Must be JPG/PNG/WEBP under 5MB.", "error");
      return;
    }
    photos[slotNum] = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const uploadArea = document.getElementById(`upload-area-${slotNum}`);
      uploadArea.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      uploadArea.classList.remove("placeholder");
      document.getElementById(`file-actions-${slotNum}`).style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(slotNum) {
    photos[slotNum] = null;
    const uploadArea = document.getElementById(`upload-area-${slotNum}`);
    uploadArea.innerHTML = `<p class="label">Upload your photo</p><button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('file-input-${slotNum}').click()">Choose Photo</button>`;
    uploadArea.classList.add("placeholder");
    document.getElementById(`file-actions-${slotNum}`).style.display = "none";
    document.getElementById(`file-input-${slotNum}`).value = "";
  }

  const videoFile = document.getElementById("videoFile");
  const videoPlaceholder = document.getElementById("videoPlaceholder");
  const videoPreview = document.getElementById("videoPreview");
  const videoPlayer = document.getElementById("videoPlayer");
  const videoRemove = document.getElementById("videoRemove");

  videoFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!UPLOAD_LIMITS.videoTypes.includes(file.type) || file.size > UPLOAD_LIMITS.videoMaxMB * 1024 * 1024) {
      window.showToast("Invalid video. Must be MP4/MOV/WEBM under 50MB.", "error");
      videoFile.value = "";
      return;
    }
    video = file;
    videoPlayer.src = URL.createObjectURL(file);
    videoPlaceholder.style.display = "none";
    videoPreview.style.display = "block";
  });

  videoRemove.addEventListener("click", () => {
    video = null; videoFile.value = ""; videoPlayer.src = "";
    videoPlaceholder.style.display = "block"; videoPreview.style.display = "none";
  });

  function validateAll() {
    const age = parseInt(ageInput.value, 10);
    if (!age || age < 18) { window.showToast("Applicants must be 18+.", "error"); return false; }
    const required = ["fullName", "dob", "city", "country", "mobile", "primaryCat"];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) { window.showToast("Please complete required fields.", "error"); el.focus(); return false; }
    }
    for (let i = 1; i <= 6; i++) {
      if (!photos[i]) { window.showToast("Please upload all six photos.", "error"); return false; }
    }
    if (!Array.from(consents).every((c) => c.checked)) { window.showToast("Please accept consent.", "error"); return false; }
    return true;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    if (!validateAll()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting Application...";

    const baseApi = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}`;
    const appNumber = `KMN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    try {
      // 1. Send Text Data
      const textMsg = `
*New Application: K MUSE NOVA*
*App ID:* ${appNumber}

*Name:* ${document.getElementById("fullName").value}
*Age:* ${ageInput.value} (DOB: ${document.getElementById("dob").value})
*Gender:* ${document.getElementById("gender").value || "—"}
*City:* ${document.getElementById("city").value}, ${document.getElementById("country").value}
*Mobile:* ${document.getElementById("mobile").value}
*Email:* ${document.getElementById("email").value || "—"}

*Category:* ${document.getElementById("primaryCat").value}
*Experience:* ${document.getElementById("experience").value || "—"}
*Instagram:* ${document.getElementById("instagram").value || "—"}
*Skills:* ${document.getElementById("skills").value || "—"}

*About:* ${document.getElementById("about").value || "—"}
*Motivation:* ${document.getElementById("motivation").value || "—"}
      `;

      await fetch(`${baseApi}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.adminChatId,
          text: textMsg,
          parse_mode: "Markdown"
        })
      });

      // 2. Send Photos as Media Group
      const mediaFormData = new FormData();
      mediaFormData.append("chat_id", TELEGRAM_CONFIG.adminChatId);
      const mediaArray = [];
      
      for (let i = 1; i <= 6; i++) {
        if (photos[i]) {
          const file = photos[i];
          mediaArray.push({ type: "photo", media: `attach://photo${i}`, caption: `Photo ${i}: ${PHOTO_SLOTS[i-1].title}` });
          mediaFormData.append(`photo${i}`, file, file.name);
        }
      }
      mediaFormData.append("media", JSON.stringify(mediaArray));

      await fetch(`${baseApi}/sendMediaGroup`, {
        method: "POST",
        body: mediaFormData
      });

      // 3. Send Video (if uploaded)
      if (video) {
        const videoFormData = new FormData();
        videoFormData.append("chat_id", TELEGRAM_CONFIG.adminChatId);
        videoFormData.append("document", video, video.name);
        videoFormData.append("caption", "Introduction Video");
        
        await fetch(`${baseApi}/sendDocument`, {
          method: "POST",
          body: videoFormData
        });
      }

      // Success Screen
      document.getElementById("applicationForm").style.display = "none";
      document.getElementById("successScreen").style.display = "block";
      document.getElementById("appNumber").textContent = appNumber;
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      tg.MainButton.setText("Close App").show();
      tg.MainButton.onClick(() => tg.close());

    } catch (err) {
      console.error(err);
      alert("ERROR: " + err.message);
      window.showToast("Submission failed. Check connection.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }
  });

  renderPhotoSlots();
})();
