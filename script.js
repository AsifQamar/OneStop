const rideForm = document.getElementById("ride-form");
const resultsSection = document.getElementById("results-section");
const submitButton = rideForm.querySelector("button[type='submit']");
const mapPlaceholder = document.querySelector(".map-placeholder");

let latestResult = null;
let activeSort = "match";
let activeFilter = "all";

rideForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await findRides();
});

async function findRides() {
  const pickup = document.getElementById("pickup").value.trim();
  const destination = document.getElementById("destination").value.trim();

  if (!pickup || !destination) {
    renderMessage("Add both a pickup and destination to compare rides.", "error");
    return;
  }

  setLoading(true);
  try {
    const params = new URLSearchParams({ pickup, destination });
    const response = await fetch(`/api/rides?${params}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "We could not compare rides right now.");

    latestResult = data;
    activeSort = "match";
    activeFilter = "all";
    renderResults();

    if (data.pickupLoc && data.destLoc && typeof updateLeafletRoute === "function") {
      mapPlaceholder.hidden = true;
      updateLeafletRoute(
        [data.pickupLoc.lat, data.pickupLoc.lng],
        [data.destLoc.lat, data.destLoc.lng]
      );
      setTimeout(() => map.invalidateSize(), 0);
    }
  } catch (error) {
    renderMessage(error.message, "error");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.querySelector("span").textContent = isLoading ? "Comparing…" : "Find Rides";
  if (isLoading) {
    resultsSection.replaceChildren(createElement("div", "results-status", "Checking prices, ETAs and reliability…"));
  }
}

function renderMessage(message, kind = "info") {
  const node = createElement("div", `results-status ${kind}`, message);
  node.setAttribute("role", kind === "error" ? "alert" : "status");
  resultsSection.replaceChildren(node);
}

function renderResults() {
  if (!latestResult) return;
  const rides = getVisibleRides(latestResult.rides);
  const fragment = document.createDocumentFragment();
  fragment.append(createSummary(latestResult), createControls(latestResult.rides));

  const list = createElement("div", "ride-list");
  if (rides.length === 0) {
    list.append(createElement("div", "results-status", "No rides match this filter."));
  } else {
    rides.forEach((ride, index) => list.append(createRideCard(ride, index === 0)));
  }
  fragment.append(list);
  resultsSection.replaceChildren(fragment);
}

function getVisibleRides(rides) {
  const filtered = rides.filter((ride) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "eco") return ride.category === "eco";
    return ride.category === activeFilter;
  });

  return [...filtered].sort((a, b) => {
    if (activeSort === "price") return nullLast(a.price, b.price);
    if (activeSort === "eta") return nullLast(a.eta, b.eta);
    if (activeSort === "reliability") return b.reliability - a.reliability;
    return b.matchScore - a.matchScore;
  });
}

function nullLast(a, b) {
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function createSummary(data) {
  const summary = createElement("div", "trip-summary");
  const cheapest = data.rides.filter((ride) => ride.price != null).sort((a, b) => a.price - b.price)[0];
  const priciest = data.rides.filter((ride) => ride.price != null).sort((a, b) => b.price - a.price)[0];
  const saving = cheapest && priciest ? priciest.price - cheapest.price : 0;

  const route = createElement("div", "summary-item");
  route.append(createElement("span", "summary-label", "Trip"));
  route.append(createElement("strong", "", data.distance_km ? `${data.distance_km} km · about ${data.eta_min} min` : "Route estimate unavailable"));

  const value = createElement("div", "summary-item highlight");
  value.append(createElement("span", "summary-label", "Best saving"));
  value.append(createElement("strong", "", saving > 0 ? `Save up to ₹${saving}` : "Prices compared"));
  summary.append(route, value);
  return summary;
}

function createControls(rides) {
  const controls = createElement("div", "comparison-controls");
  const filter = createSelect("Ride type", [
    ["all", `All rides (${rides.length})`],
    ["car", "Cars"],
    ["bike", "Bikes"],
    ["eco", "Low emission"]
  ], activeFilter);
  filter.addEventListener("change", () => {
    activeFilter = filter.value;
    renderResults();
  });

  const sort = createSelect("Sort by", [
    ["match", "Smart match"],
    ["price", "Lowest price"],
    ["eta", "Fastest pickup"],
    ["reliability", "Most reliable"]
  ], activeSort);
  sort.addEventListener("change", () => {
    activeSort = sort.value;
    renderResults();
  });
  controls.append(filter.parentElement, sort.parentElement);
  return controls;
}

function createSelect(labelText, options, value) {
  const wrapper = createElement("label", "control-field");
  wrapper.append(createElement("span", "", labelText));
  const select = document.createElement("select");
  options.forEach(([optionValue, text]) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = text;
    option.selected = optionValue === value;
    select.append(option);
  });
  wrapper.append(select);
  return select;
}

function createRideCard(ride, isTopResult) {
  const card = createElement("article", `ride-card${isTopResult ? " top-result" : ""}`);
  if (isTopResult) card.append(createElement("span", "match-badge", activeSort === "match" ? "Best match" : "Top result"));

  const logo = document.createElement("img");
  logo.src = ride.logo;
  logo.alt = `${ride.service} logo`;
  logo.className = "service-logo";
  logo.loading = "lazy";

  const details = createElement("div", "ride-details");
  details.append(createElement("h3", "", `${ride.service} ${ride.type}`));
  const metrics = createElement("div", "ride-metrics");
  metrics.append(
    metric(`${ride.eta ?? "—"} min`, "pickup"),
    metric(`${ride.reliability}%`, "reliable"),
    metric(ride.category === "eco" ? "Low emission" : ride.category, "type")
  );
  details.append(metrics);

  const price = createElement("div", "ride-price");
  price.append(createElement("p", "price", ride.price == null ? "Price N/A" : `₹${ride.price}`));
  price.append(createElement("p", "eta", `${ride.cancellationChance}% cancellation risk`));
  card.append(logo, details, price);
  return card;
}

function metric(value, label) {
  const item = createElement("span", "metric");
  item.textContent = `${value} ${label}`;
  return item;
}

function createElement(tag, className = "", textContent = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
}

const animatedElements = document.querySelectorAll(".scroll-animate");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });
  animatedElements.forEach((element) => observer.observe(element));
} else {
  animatedElements.forEach((element) => element.classList.add("visible"));
}
