(function () {
  "use strict";

  const STORAGE_KEYS = {
    saved: "onestop.saved-routes.v1",
    recent: "onestop.recent-routes.v1"
  };
  const MAX_SAVED = 6;
  const MAX_RECENT = 4;

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("ride-form");
    const pickupInput = document.getElementById("pickup");
    const destinationInput = document.getElementById("destination");
    const results = document.getElementById("results-section");
    if (!form || !pickupInput || !destinationInput || !results) return;

    const feedback = createElement("p", "commute-feedback");
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");

    const actions = createElement("div", "commute-actions");
    const swapButton = createButton("⇅ Swap", "swap-route-button");
    const saveButton = createButton("☆ Save route", "save-route-button");
    actions.append(swapButton, saveButton);
    form.insertBefore(actions, form.querySelector("button[type='submit']"));

    const shortcuts = createElement("section", "commute-shortcuts");
    shortcuts.setAttribute("aria-label", "Commute shortcuts");
    form.after(shortcuts, feedback);

    swapButton.addEventListener("click", () => {
      const pickup = pickupInput.value;
      pickupInput.value = destinationInput.value;
      destinationInput.value = pickup;
      pickupInput.focus();
      announce("Pickup and destination swapped.");
    });

    saveButton.addEventListener("click", () => {
      const route = currentRoute();
      if (!route) return announce("Enter both locations before saving a route.", true);

      const suggestedName = `${shortLocation(route.pickup)} → ${shortLocation(route.destination)}`;
      const name = window.prompt("Name this shortcut (for example, Home to Work):", suggestedName);
      if (name === null) return;

      const saved = readRoutes(STORAGE_KEYS.saved).filter((item) => item.key !== route.key);
      saved.unshift({ ...route, name: name.trim() || suggestedName, savedAt: Date.now() });
      writeRoutes(STORAGE_KEYS.saved, saved.slice(0, MAX_SAVED));
      renderShortcuts();
      announce(`Saved ${name.trim() || suggestedName}.`);
    });

    form.addEventListener("submit", () => {
      const route = currentRoute();
      if (!route) return;
      const recent = readRoutes(STORAGE_KEYS.recent).filter((item) => item.key !== route.key);
      recent.unshift({ ...route, name: `${shortLocation(route.pickup)} → ${shortLocation(route.destination)}`, searchedAt: Date.now() });
      writeRoutes(STORAGE_KEYS.recent, recent.slice(0, MAX_RECENT));
      renderShortcuts();
    }, true);

    let enhancingResults = false;
    const observer = new MutationObserver(() => {
      if (enhancingResults || results.querySelector(".comparison-utility")) return;
      if (results.querySelector(".ride-card")) enhanceResults();
    });
    observer.observe(results, { childList: true, subtree: true });

    function currentRoute() {
      const pickup = pickupInput.value.trim();
      const destination = destinationInput.value.trim();
      if (!pickup || !destination) return null;
      return { pickup, destination, key: `${pickup.toLowerCase()}|${destination.toLowerCase()}` };
    }

    function renderShortcuts() {
      shortcuts.replaceChildren();
      const saved = readRoutes(STORAGE_KEYS.saved);
      const recent = readRoutes(STORAGE_KEYS.recent);
      if (!saved.length && !recent.length) {
        shortcuts.append(createElement("p", "shortcut-empty", "Your saved and recent routes will appear here."));
        return;
      }
      if (saved.length) shortcuts.append(createRouteGroup("Saved routes", saved, true));
      if (recent.length) shortcuts.append(createRouteGroup("Recent trips", recent, false));
    }

    function createRouteGroup(title, routes, removable) {
      const group = createElement("div", "shortcut-group");
      group.append(createElement("h4", "shortcut-title", title));
      const list = createElement("div", "shortcut-list");
      routes.forEach((route) => {
        const item = createElement("div", "shortcut-item");
        const useButton = createButton(route.name, "shortcut-button");
        useButton.title = `${route.pickup} to ${route.destination}`;
        useButton.addEventListener("click", () => {
          pickupInput.value = route.pickup;
          destinationInput.value = route.destination;
          destinationInput.focus();
          announce(`Loaded ${route.name}.`);
        });
        item.append(useButton);

        if (removable) {
          const removeButton = createButton("×", "remove-shortcut-button");
          removeButton.setAttribute("aria-label", `Remove ${route.name}`);
          removeButton.addEventListener("click", () => {
            writeRoutes(STORAGE_KEYS.saved, readRoutes(STORAGE_KEYS.saved).filter((savedRoute) => savedRoute.key !== route.key));
            renderShortcuts();
            announce(`Removed ${route.name}.`);
          });
          item.append(removeButton);
        }
        list.append(item);
      });
      group.append(list);
      return group;
    }

    function enhanceResults() {
      enhancingResults = true;
      const utility = createElement("div", "comparison-utility");
      const budgetLabel = createElement("label", "budget-control");
      budgetLabel.append(createElement("span", "", "Maximum fare"));
      const budgetSelect = document.createElement("select");
      [["all", "Any budget"], ["150", "Up to ₹150"], ["250", "Up to ₹250"], ["400", "Up to ₹400"]].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        budgetSelect.append(option);
      });
      budgetLabel.append(budgetSelect);

      const shareButton = createButton("Share best option", "share-trip-button");
      const count = createElement("span", "budget-result-count");
      utility.append(budgetLabel, shareButton, count);
      results.prepend(utility);

      const applyBudget = () => {
        const cap = budgetSelect.value === "all" ? Infinity : Number(budgetSelect.value);
        const cards = [...results.querySelectorAll(".ride-card")];
        let visible = 0;
        cards.forEach((card) => {
          const price = parsePrice(card.querySelector(".price")?.textContent);
          const shouldShow = price === null || price <= cap;
          card.hidden = !shouldShow;
          if (shouldShow) visible += 1;
        });
        count.textContent = `${visible} of ${cards.length} options`;
      };

      budgetSelect.addEventListener("change", applyBudget);
      shareButton.addEventListener("click", async () => {
        const bestCard = [...results.querySelectorAll(".ride-card")].find((card) => !card.hidden);
        if (!bestCard) return announce("No ride fits the selected budget.", true);
        const rideName = bestCard.querySelector("h3")?.textContent?.trim() || "ride";
        const price = bestCard.querySelector(".price")?.textContent?.trim() || "price unavailable";
        const eta = bestCard.querySelector(".eta")?.textContent?.trim() || "ETA unavailable";
        const message = `OneStop trip: ${pickupInput.value.trim()} → ${destinationInput.value.trim()}\nBest visible option: ${rideName}, ${price}, ${eta}`;
        try {
          if (navigator.share) await navigator.share({ title: "OneStop ride option", text: message });
          else await copyText(message);
          announce(navigator.share ? "Trip shared." : "Trip details copied to your clipboard.");
        } catch (error) {
          if (error.name !== "AbortError") announce("Could not share this trip.", true);
        }
      });
      applyBudget();
      enhancingResults = false;
    }

    function announce(message, isError = false) {
      feedback.textContent = message;
      feedback.classList.toggle("error", isError);
    }

    function readRoutes(key) {
      try {
        const routes = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(routes) ? routes : [];
      } catch {
        return [];
      }
    }

    function writeRoutes(key, routes) {
      try {
        localStorage.setItem(key, JSON.stringify(routes));
      } catch {
        announce("Browser storage is unavailable; this shortcut could not be saved.", true);
      }
    }

    renderShortcuts();
  });

  function shortLocation(location) {
    return location.split(",")[0].trim().slice(0, 24);
  }

  function parsePrice(text = "") {
    const value = Number(text.replace(/[^0-9.]/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function createButton(text, className) {
    const button = createElement("button", className, text);
    button.type = "button";
    return button;
  }

  function createElement(tag, className = "", text = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }
})();
