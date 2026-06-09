const reviews = [];

let current = 0;
let timer;
let uploadedImage = "";

const reviewCard = document.querySelector("#reviewCard");
const reviewDots = document.querySelector("#reviewDots");
const detailDialog = document.querySelector("#detailDialog");
const detailContent = document.querySelector("#detailContent");
const genreFilter = document.querySelector("#genreFilter");
const searchInput = document.querySelector("#searchInput");
const topSearchInput = document.querySelector("#topSearchInput");
const authActions = document.querySelector("#authActions");
const userMenu = document.querySelector("#userMenu");
const headerNickname = document.querySelector("#headerNickname");
const toast = document.querySelector("#toast");

const users = new Map();
let currentUser = null;
let toastTimer;

function starText(value) {
  const number = Number(value);
  const full = Math.floor(number);
  const half = number % 1 >= 0.5 ? "☆" : "";
  return "★".repeat(full) + half;
}

function placeholderInitial(name) {
  return (name || "G").trim().slice(0, 1).toUpperCase();
}

function renderEmptyState() {
  reviewCard.innerHTML = `
    <div class="empty-state">
      <div>
        <div class="empty-icon">★</div>
        <h3>아직 등록된 게임 리뷰가 없습니다.</h3>
        <p>첫 번째 리뷰를 작성하면 이곳에 카드형 리뷰 목록이 표시됩니다.</p>
        <button type="button" data-target="write">리뷰 작성하러 가기</button>
      </div>
    </div>
  `;
  reviewCard.querySelector("button").addEventListener("click", scrollToTarget);
  reviewDots.innerHTML = "";
  document.querySelector("#prevReview").disabled = true;
  document.querySelector("#nextReview").disabled = true;
}

function renderReview(index) {
  if (reviews.length === 0) {
    renderEmptyState();
    return;
  }

  const review = reviews[index];
  const cover = review.image
    ? `<div class="review-cover"><img src="${review.image}" alt="${review.name} 게임 이미지" /></div>`
    : `<div class="review-cover placeholder">${placeholderInitial(review.name)}</div>`;

  reviewCard.innerHTML = `
    <article class="review-item">
      ${cover}
      <div class="review-info">
        <div class="game-meta">
          <span>${review.genre}</span>
          <span>${review.platform}</span>
        </div>
        <h3>${review.name}</h3>
        <div class="stars" aria-label="별점 ${review.rating}점">${starText(review.rating)} <span>${review.rating}</span></div>
        <p class="one-line">${review.line}</p>
        <p class="summary">${review.summary}</p>
        <button class="detail-btn" type="button">자세히 보기</button>
      </div>
    </article>
  `;
  reviewCard.querySelector(".detail-btn").addEventListener("click", () => openDetail(review));

  document.querySelector("#prevReview").disabled = reviews.length < 2;
  document.querySelector("#nextReview").disabled = reviews.length < 2;
  [...reviewDots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });
}

function moveReview(direction) {
  if (reviews.length < 2) return;
  current = (current + direction + reviews.length) % reviews.length;
  renderReview(current);
  restartTimer();
}

function restartTimer() {
  clearInterval(timer);
  if (reviews.length > 1) {
    timer = setInterval(() => moveReview(1), 5000);
  }
}

function openDetail(review) {
  const hero = review.image
    ? `<div class="detail-hero"><img src="${review.image}" alt="${review.name} 상세 이미지" /></div>`
    : `<div class="detail-hero placeholder">${placeholderInitial(review.name)}</div>`;

  detailContent.innerHTML = `
    ${hero}
    <div class="detail-body">
      <div class="game-meta">
        <span>${review.genre}</span>
        <span>${review.platform}</span>
      </div>
      <h3>${review.name}</h3>
      <div class="stars">${starText(review.rating)} ${review.rating}</div>
      <p class="one-line">${review.line}</p>
      <p>${review.detail}</p>
    </div>
  `;
  detailDialog.showModal();
}

function renderDots() {
  reviewDots.innerHTML = "";
  reviews.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `${index + 1}번 리뷰 보기`);
    dot.addEventListener("click", () => {
      current = index;
      renderReview(current);
      restartTimer();
    });
    reviewDots.appendChild(dot);
  });
}

function updateGenreOptions() {
  const selected = genreFilter.value || "all";
  const genres = [...new Set(reviews.map((review) => review.genre).filter(Boolean))].sort();
  genreFilter.innerHTML = `<option value="all">전체 장르</option>`;
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
  genreFilter.value = genres.includes(selected) ? selected : "all";
}

function renderSearchResults() {
  const keyword = searchInput.value.trim().toLowerCase();
  const genre = genreFilter.value;
  const filtered = reviews.filter((review) => {
    const text = [review.name, review.genre, review.platform, review.line].join(" ").toLowerCase();
    const matchKeyword = text.includes(keyword);
    const matchGenre = genre === "all" || review.genre === genre;
    return matchKeyword && matchGenre;
  });

  const target = document.querySelector("#searchResults");
  if (reviews.length === 0) {
    target.innerHTML = `
      <div class="empty-state">
        <div>
          <div class="empty-icon">⌕</div>
          <h3>검색할 리뷰가 없습니다.</h3>
          <p>리뷰를 등록하면 게임 이름, 장르, 플랫폼으로 검색할 수 있습니다.</p>
        </div>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    target.innerHTML = `
      <div class="empty-state">
        <div>
          <div class="empty-icon">!</div>
          <h3>검색 결과가 없습니다.</h3>
          <p>다른 검색어를 입력하거나 장르 필터를 변경해보세요.</p>
        </div>
      </div>
    `;
    return;
  }

  target.innerHTML = filtered
    .map((review) => {
      const cover = review.image
        ? `<img src="${review.image}" alt="${review.name} 검색 결과 이미지" />`
        : `<div class="mini-card-cover">${placeholderInitial(review.name)}</div>`;
      return `
        <article class="mini-card" data-name="${review.name}">
          ${cover}
          <div>
            <h3>${review.name}</h3>
            <p>${review.genre} · ${review.platform} · ${review.rating}점</p>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".mini-card").forEach((card) => {
    card.addEventListener("click", () => {
      const review = reviews.find((item) => item.name === card.dataset.name);
      if (review) openDetail(review);
    });
  });
}

function updateMyPage() {
  const count = reviews.length;
  document.querySelector("#myReviewCount").textContent =
    count === 0 ? "아직 작성한 리뷰가 없습니다." : `현재 ${count}개의 리뷰를 작성했습니다.`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function moveToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateAuthHeader() {
  if (currentUser) {
    authActions.classList.add("is-hidden");
    userMenu.classList.remove("is-hidden");
    headerNickname.textContent = `${currentUser.nickname}님`;
    return;
  }

  authActions.classList.remove("is-hidden");
  userMenu.classList.add("is-hidden");
  headerNickname.textContent = "";
}

function completeAuth(user, message) {
  currentUser = user;
  updateAuthHeader();
  showToast(message);
  moveToTop();
}

function syncAll() {
  updateGenreOptions();
  renderDots();
  current = Math.min(current, Math.max(reviews.length - 1, 0));
  renderReview(current);
  renderSearchResults();
  updateMyPage();
  restartTimer();
}

function scrollToTarget(event) {
  const target = event.currentTarget.dataset.target;
  if (!target) return;
  document.querySelector(`#${target}`).scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", scrollToTarget);
});

document.querySelector("#signupButton").addEventListener("click", () => {
  const id = document.querySelector("#signupId").value.trim();
  const nickname = document.querySelector("#signupNickname").value.trim();
  const password = document.querySelector("#signupPassword").value.trim();

  if (!id || !nickname || !password) {
    showToast("아이디, 닉네임, 비밀번호를 입력하세요.");
    return;
  }

  const user = { id, nickname, password };
  users.set(id, user);
  document.querySelector("#signupId").value = "";
  document.querySelector("#signupNickname").value = "";
  document.querySelector("#signupPassword").value = "";
  completeAuth(user, "회원가입 완료");
});

document.querySelector("#loginButton").addEventListener("click", () => {
  const id = document.querySelector("#loginId").value.trim();
  const password = document.querySelector("#loginPassword").value.trim();

  if (!id || !password) {
    showToast("아이디와 비밀번호를 입력하세요.");
    return;
  }

  const savedUser = users.get(id);
  if (savedUser && savedUser.password !== password) {
    showToast("비밀번호가 일치하지 않습니다.");
    return;
  }

  const user = savedUser || { id, nickname: id, password };
  document.querySelector("#loginId").value = "";
  document.querySelector("#loginPassword").value = "";
  completeAuth(user, "로그인 완료");
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  currentUser = null;
  updateAuthHeader();
  showToast("로그아웃 완료");
  moveToTop();
});

document.querySelector("#prevReview").addEventListener("click", () => moveReview(-1));
document.querySelector("#nextReview").addEventListener("click", () => moveReview(1));
document.querySelector("#closeDialog").addEventListener("click", () => detailDialog.close());
searchInput.addEventListener("input", renderSearchResults);
genreFilter.addEventListener("change", renderSearchResults);

topSearchInput.addEventListener("input", () => {
  searchInput.value = topSearchInput.value;
  document.querySelector("#search").scrollIntoView({ behavior: "smooth", block: "start" });
  renderSearchResults();
});

document.querySelector("#imageUpload").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  const preview = document.querySelector("#uploadPreview");
  uploadedImage = "";
  if (!file) {
    preview.innerHTML = "<span>게임 사진을 업로드하면 이곳에 미리보기로 표시됩니다.</span>";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    uploadedImage = String(reader.result);
    preview.innerHTML = `<img src="${uploadedImage}" alt="업로드한 게임 사진 미리보기" />`;
  });
  reader.readAsDataURL(file);
});

document.querySelector("#reviewForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  reviews.unshift({
    name: String(data.get("gameName")).trim(),
    genre: String(data.get("genre")).trim(),
    platform: String(data.get("platform")).trim(),
    rating: String(data.get("rating")),
    line: String(data.get("tagline")).trim(),
    summary: String(data.get("detail")).trim().slice(0, 90),
    detail: String(data.get("detail")).trim(),
    image: uploadedImage,
  });
  uploadedImage = "";
  event.currentTarget.reset();
  document.querySelector("#uploadPreview").innerHTML = "<span>게임 사진을 업로드하면 이곳에 미리보기로 표시됩니다.</span>";
  syncAll();
  document.querySelector("#reviews").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".hero-poster").forEach((image) => {
  image.addEventListener("error", () => {
    image.remove();
    setupHeroSlider();
  });
});

let heroSlideIndex = 0;
let heroSlideTimer;

function setupHeroSlider() {
  const slides = [...document.querySelectorAll(".hero-poster")];
  clearInterval(heroSlideTimer);

  if (slides.length === 0) return;
  heroSlideIndex = Math.min(heroSlideIndex, slides.length - 1);
  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === heroSlideIndex);
  });

  if (slides.length < 2) return;
  heroSlideTimer = setInterval(() => {
    slides[heroSlideIndex].classList.remove("is-active");
    heroSlideIndex = (heroSlideIndex + 1) % slides.length;
    slides[heroSlideIndex].classList.add("is-active");
  }, 4200);
}

setupHeroSlider();
updateAuthHeader();
syncAll();
