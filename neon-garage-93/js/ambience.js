window.NG = window.NG || {};
NG.motionEnabled = () =>
  typeof window.matchMedia === "function" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
NG.playGarageTransition = (before, after, date, done, closingDate = date) => {
  if (!NG.motionEnabled()) {
    done();
    return;
  }
  const dialog = document.querySelector("#garage-transition");
  let finished = false;
  const unique = (markup) =>
    markup.replaceAll("vehicle-clip-", "ambience-clip-");
  dialog.innerHTML = `<div class="transition-frame"><div class="transition-content" inert>${unique(before)}</div><div class="transition-shutter" aria-hidden="true"></div><div class="transition-night" aria-hidden="true"></div><div class="transition-dawn" aria-hidden="true"></div><div class="transition-caption"><span id="transition-label">CLOSING THE GARAGE</span><small>${closingDate}</small></div></div><button id="skip-transition">Skip animation</button>`;
  let swapTimer, endTimer;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(swapTimer);
    clearTimeout(endTimer);
    dialog.close();
    dialog.oncancel = null;
    done();
  };
  dialog.oncancel = (e) => {
    e.preventDefault();
    finish();
  };
  dialog.querySelector("#skip-transition").onclick = finish;
  dialog.showModal();
  dialog.querySelector("#skip-transition").focus();
  swapTimer = setTimeout(() => {
    if (finished) return;
    dialog.querySelector(".transition-content").innerHTML = unique(after);
    dialog.querySelector(".transition-caption small").textContent = date;
    dialog.querySelector("#transition-label").textContent =
      "OPEN FOR A NEW DAY";
  }, 900);
  endTimer = setTimeout(finish, 1900);
};
