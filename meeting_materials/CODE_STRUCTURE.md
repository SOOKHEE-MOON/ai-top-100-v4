# 코드 구조 분석 (v3)

## 📐 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    index-v3.html                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  #profiles (프로필 섹션)                          │  │
│  │  ├─ .profiles-container (스크롤 컨테이너)         │  │
│  │  │  ├─ .profile-row × 5 (5개 행)                 │  │
│  │  │  │  ├─ .profile-slot × 25 (원본 슬롯)         │  │
│  │  │  │  ├─ .logo-card (로고)                      │  │
│  │  │  │  └─ .slogan-card (슬로건)                  │  │
│  │  │  └─ (위 내용 복제 - seamless 스크롤)          │  │
│  │  ├─ .fixed-hosts-logo (고정 로고 - 우측)         │  │
│  │  ├─ .fixed-credit (고정 크레딧 - 좌측)           │  │
│  │  └─ .underbar-bg (언더바 배경 효과)              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ↓ styles-v3.css        ↓ script-v3.js
    ┌──────────────┐      ┌────────────────────┐
    │ 레이아웃 스타일 │      │ 애니메이션 로직     │
    │ 애니메이션 정의 │      │ 스크롤 제어        │
    └──────────────┘      │ 데이터 관리        │
                          └────────────────────┘
                                 ↓
                          ┌────────────────┐
                          │ data-full.json │
                          │  (106명 데이터)  │
                          └────────────────┘
```

---

## 📄 HTML 구조 (index-v3.html)

### 레이아웃 패턴

```html
<div id="profiles" class="section">
  <!-- 5행 레이아웃 -->
  <div class="profiles-container">

    <!-- 1행: 슬롯0-1 + 로고 + 슬롯2-3-4 -->
    <div class="profile-row row-1">
      <div class="profile-slot" data-slot="0"></div>
      <div class="profile-slot" data-slot="1"></div>
      <div class="logo-card">...</div>
      <div class="profile-slot" data-slot="2"></div>
      <div class="profile-slot" data-slot="3"></div>
      <div class="profile-slot" data-slot="4"></div>
      <!-- 위 내용 복제 (seamless) -->
    </div>

    <!-- 2행: 슬롯5-6 + 슬로건 + 슬롯7-8-9 -->
    <div class="profile-row row-2">
      <div class="profile-slot" data-slot="5"></div>
      <div class="profile-slot" data-slot="6"></div>
      <div class="slogan-card">
        <div class="slogan-icon">...</div>
        <div class="slogan-text">미래를 가속하는 도전.</div>
      </div>
      <div class="profile-slot" data-slot="7"></div>
      ...
    </div>

    <!-- 3~5행: 동일 패턴 -->
    ...
  </div>

  <!-- 고정 요소 (스크롤 안 됨) -->
  <div class="fixed-hosts-logo">...</div>
  <div class="fixed-credit">...</div>
  <div class="underbar-bg" id="underbar-bg"></div>
</div>
```

### 프로필 모듈 구조 (JavaScript로 동적 생성)

```html
<div class="profile-slot active" data-slot="0" style="min-width: XXXpx">
  <div class="profile-module">

    <!-- 이미지 -->
    <div class="profile-image-wrapper fade-in">
      <img src="..." class="profile-image">
    </div>

    <!-- 텍스트 -->
    <div class="profile-text">
      <div class="profile-message wipe-in">메시지 내용</div>
      <div class="profile-nickname wipe-in">닉네임</div>
      <div class="profile-underbar wipe-in" style="background: ...; width: XXXpx"></div>
    </div>

  </div>
</div>
```

---

## 🎨 CSS 구조 (styles-v3.css)

### 1. 기본 설정 (lines 1-15)
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 7680px; height: 2160px; background: #000; }
```

### 2. 섹션 공통 스타일 (17-31)
```css
.section { position: absolute; display: none; }
.section.active { display: flex; }
```

### 3. 프로필 컨테이너 (103-128)
```css
.profiles-container {
  display: flex;
  flex-direction: column;
  gap: 60px;
  padding: 100px 120px;
  /* transform: translateX(-XXXpx) - JS로 제어 */
}
```

### 4. 각 행 (120-128)
```css
.profile-row {
  display: flex;
  gap: 80px;
  transition: all 1.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### 5. 프로필 슬롯 (180-204)
```css
.profile-slot {
  flex-shrink: 0;
  min-width: 0; /* JS로 동적 설정 */
  opacity: 0;
  transition: min-width 1.2s cubic-bezier(...);
}
.profile-slot.active { opacity: 1; }
```

### 6. 애니메이션 키프레임

**이미지 scale (232-252)**
```css
@keyframes imageScaleOut {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.7); }
}

@keyframes imageScaleIn {
  0% { opacity: 0; transform: scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}
```

**텍스트 wipe (282-303)**
```css
@keyframes wipeOutRightToLeft {
  0% { clip-path: inset(0 0 0 0); opacity: 1; }
  100% { clip-path: inset(0 100% 0 0); opacity: 0; }
}

@keyframes wipeInLeftToRight {
  0% { clip-path: inset(0 100% 0 0); opacity: 0; }
  100% { clip-path: inset(0 0 0 0); opacity: 1; }
}
```

**언더바 (345-390)**
```css
@keyframes underbarWipeOut { ... }
@keyframes underbarWipeIn { ... }
@keyframes underbarFlow { /* 흐름 효과 */ }
```

---

## 💻 JavaScript 구조 (script-v3.js)

### 전역 변수 & 상수

```javascript
// 데이터 (1-2)
let profilesData = [];

// 타이밍 (5-11)
const TIMING = {
  OPENING_WAIT: 1000,
  TRANSITION_DURATION: 2000,  // 트랜지션 총 시간
  WIPE_DURATION: 1000,        // wipe 애니메이션 (1초)
  ENDING: 3000
};

// 그라데이션 (13-18)
const GRADIENTS = [
  ["#04F3FF", "#90F779"],  // CONFIDENT COOL
  ["#DDF730", "#FFBD19"],  // INSPIRATION WARM
  ["#FF638A", "#FF1FE0"]   // ENERGETIC HOT
];

// 슬롯별 노출 시간 (20-53)
const SLOT_DISPLAY_TIMES = {
  0: 6000, 1: 7600, 2: 9400, ...  // 25개 모두 다름
};

// 슬롯별 프로필 개수 (55-67)
const SLOT_PROFILE_COUNTS = {
  0: 5, 4: 5, 12: 5, 7: 5, 19: 5, 17: 5,  // 6슬롯 × 5명
  1: 4, 2: 4, 3: 4, ...  // 19슬롯 × 4명
};

// 프로필 시퀀스 & 인덱스 (69-71)
let slotProfileSequences = [];  // 각 슬롯의 프로필 순서
let slotCurrentIndex = [];      // 각 슬롯의 현재 인덱스

// 이미지 프리로딩 (73-74)
const preloadedImages = new Map();

// 스크롤 제어 (459-465)
let scrollPosition = 0;
let scrollAnimationId = null;
const SCROLL_SPEED = 150;  // px/초
let isProfileCycleActive = false;
```

---

### 주요 함수 구조

```
main flow:
  window.load
    → loadData()
      → initializeSlots()
        → renderProfile() × 25
    → runAnimation()
      → switchSection()
      → startProfileCycle()
        → smoothInfiniteScroll()
          → animate() [recursive, 60fps]
            → calculateTotalWidth() [매 프레임]
        → startSlotCycle() × 25 [parallel]
          → transitionProfile() [재귀]
            → preload next image
            → fade-out (1초)
            → change data
            → fade-in (1초)
            → recursive call
```

### 1. 데이터 로딩 & 초기화

**`loadData()` (77-122)**
```javascript
async function loadData() {
  // 1. data-full.json 로드
  const response = await fetch('data-full.json');
  profilesData = await response.json();

  // 2. 각 슬롯에 프로필 시퀀스 생성
  let profileCounter = 0;
  slotProfileSequences = Array(25).fill(0).map((_, slotIndex) => {
    const sequence = [];
    const profilesPerSlot = SLOT_PROFILE_COUNTS[slotIndex];

    // 100사이클 반복
    for (let cycle = 0; cycle < 100; cycle++) {
      for (let j = 0; j < profilesPerSlot; j++) {
        sequence.push(profileCounter + j);
      }
    }

    profileCounter += profilesPerSlot;
    return sequence;
  });

  // 3. 초기 인덱스 설정
  slotCurrentIndex = Array(25).fill(0);

  // 4. 슬롯 초기화
  initializeSlots();
}
```

**`initializeSlots()` (124-154)**
```javascript
function initializeSlots() {
  const processedSlots = new Set();
  const slots = document.querySelectorAll('.profile-slot');

  slots.forEach((slot) => {
    const slotNumber = parseInt(slot.getAttribute('data-slot'));

    // 중복 제거 (복제본 제외)
    if (processedSlots.has(slotNumber)) return;
    processedSlots.add(slotNumber);

    // 첫 번째 프로필 가져오기
    const profileIndex = slotProfileSequences[slotNumber][0];
    const profile = profilesData[profileIndex];

    // 같은 슬롯 번호를 가진 모든 요소에 렌더링 (원본+복제)
    const allSlotsWithSameNumber = document.querySelectorAll(
      `.profile-slot[data-slot="${slotNumber}"]`
    );
    allSlotsWithSameNumber.forEach(s => {
      renderProfile(s, profile, slotNumber);
      s.classList.add('active');
    });
  });
}
```

**`renderProfile(slot, profile, slotIndex)` (156-185)**
```javascript
function renderProfile(slot, profile, slotIndex) {
  // 1. 그라데이션 선택
  const gradient = GRADIENTS[slotIndex % GRADIENTS.length];
  const gradientStyle = `background: linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`;

  // 2. 너비 계산 (메시지 길이 기반)
  const messageLength = profile.message.length;
  const estimatedWidth = Math.max(600, messageLength * 32);
  slot.style.minWidth = `${estimatedWidth + 260}px`;

  // 3. HTML 생성 (초기 상태: wipe-out)
  slot.innerHTML = `
    <div class="profile-module">
      <div class="profile-image-wrapper">
        <img src="${profile.profile_image}"
             style="opacity: 0;"
             class="profile-image">
      </div>
      <div class="profile-text">
        <div class="profile-message wipe-out">${profile.message}</div>
        <div class="profile-nickname wipe-out">${profile.nickname}</div>
        <div class="profile-underbar wipe-out"
             style="${gradientStyle}; width: ${estimatedWidth}px;"></div>
      </div>
    </div>
  `;
}
```

---

### 2. 프로필 전환 애니메이션

**`transitionProfile(slotNumber)` (193-307) - 핵심 함수**
```javascript
async function transitionProfile(slotNumber) {
  // 0. 모든 복제본 찾기
  const allSlots = document.querySelectorAll(`.profile-slot[data-slot="${slotNumber}"]`);

  // 1. 다음 프로필 데이터 가져오기
  const currentSeqIndex = slotCurrentIndex[slotNumber];
  const nextSeqIndex = (currentSeqIndex + 1) % slotProfileSequences[slotNumber].length;
  slotCurrentIndex[slotNumber] = nextSeqIndex;

  const nextProfileIndex = slotProfileSequences[slotNumber][nextSeqIndex];
  const nextProfile = profilesData[nextProfileIndex];

  // 2. 모든 DOM 요소 수집
  const allElements = [];
  allSlots.forEach(slot => {
    const imageWrapper = slot.querySelector('.profile-image-wrapper');
    const nickname = slot.querySelector('.profile-nickname');
    const message = slot.querySelector('.profile-message');
    const underbar = slot.querySelector('.profile-underbar');
    const image = slot.querySelector('.profile-image');

    if (imageWrapper && nickname && message && underbar && image) {
      allElements.push({ slot, imageWrapper, nickname, message, underbar, image });
    }
  });

  // 3. 프리로드된 이미지 대기
  const preloadKey = `slot-${slotNumber}`;
  const preloadImg = preloadedImages.get(preloadKey);
  const imageLoadPromise = new Promise((resolve) => {
    if (preloadImg && preloadImg.complete) resolve();
    else if (preloadImg) {
      preloadImg.onload = resolve;
      preloadImg.onerror = resolve;
      setTimeout(resolve, 100);
    } else {
      const fallbackImg = new Image();
      fallbackImg.src = nextProfile.profile_image;
      fallbackImg.onload = resolve;
      fallbackImg.onerror = resolve;
      setTimeout(resolve, 200);
    }
  });

  // === 전환 3단계 ===

  // 🔴 1단계: fade-out + wipe-out (1초)
  allElements.forEach(({ imageWrapper, nickname, message, underbar }) => {
    imageWrapper.classList.add('fade-out');
    nickname.classList.add('wipe-out');
    message.classList.add('wipe-out');
    underbar.classList.add('wipe-out');
  });
  await new Promise(resolve => setTimeout(resolve, TIMING.WIPE_DURATION));
  await imageLoadPromise;

  // 🟡 2단계: 데이터 교체 (투명 상태 유지)
  const messageLength = nextProfile.message.length;
  const estimatedWidth = Math.max(600, messageLength * 32);

  allElements.forEach(({ slot, imageWrapper, image, nickname, message, underbar }) => {
    // 투명 상태를 inline style로 고정 (깜빡임 방지!)
    image.style.opacity = '0';
    image.style.transform = 'scale(0.7)';
    nickname.style.clipPath = 'inset(0 100% 0 0)';
    nickname.style.opacity = '0';
    message.style.clipPath = 'inset(0 100% 0 0)';
    message.style.opacity = '0';
    underbar.style.clipPath = 'inset(0 100% 0 0)';
    underbar.style.opacity = '0';

    // 데이터 변경
    image.src = nextProfile.profile_image;
    image.alt = nextProfile.nickname;
    message.textContent = nextProfile.message;
    nickname.textContent = nextProfile.nickname;
    underbar.style.background = `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`;
    underbar.style.width = `${estimatedWidth}px`;
    slot.style.minWidth = `${estimatedWidth + 260}px`;

    // 클래스 제거
    imageWrapper.classList.remove('fade-out');
    nickname.classList.remove('wipe-out');
    message.classList.remove('wipe-out');
    underbar.classList.remove('wipe-out');
  });

  // 리플로우 보장
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // 🟢 3단계: fade-in + wipe-in (1초)
  allElements.forEach(({ imageWrapper, image, nickname, message, underbar }) => {
    // inline style 제거 (CSS 애니메이션 활성화)
    image.style.opacity = '';
    image.style.transform = '';
    nickname.style.clipPath = '';
    nickname.style.opacity = '';
    message.style.clipPath = '';
    message.style.opacity = '';
    underbar.style.clipPath = '';
    underbar.style.opacity = '';

    // 클래스 추가
    imageWrapper.classList.add('fade-in');
    nickname.classList.add('wipe-in');
    message.classList.add('wipe-in');
    underbar.classList.add('wipe-in');
  });
  await new Promise(resolve => setTimeout(resolve, TIMING.WIPE_DURATION));

  // 4. 클래스 정리
  allElements.forEach(({ imageWrapper, nickname, message, underbar }) => {
    imageWrapper.classList.remove('fade-in');
    message.classList.remove('wipe-in');
    nickname.classList.remove('wipe-in');
    underbar.classList.remove('wipe-in');
  });
}
```

---

### 3. 무한 스크롤 시스템

**`calculateTotalWidth()` (486-516) - 동적 너비 계산**
```javascript
function calculateTotalWidth() {
  const profilesContainer = document.querySelector('.profiles-container');
  const firstRow = profilesContainer.querySelector('.profile-row');

  // 원본 슬롯들만 계산 (복제 제외)
  const allSlots = firstRow.querySelectorAll('.profile-slot');
  const processedSlots = new Set();
  let totalWidth = 0;

  allSlots.forEach(slot => {
    const slotNumber = slot.getAttribute('data-slot');
    if (!processedSlots.has(slotNumber)) {
      processedSlots.add(slotNumber);
      totalWidth += slot.offsetWidth + 80;  // 슬롯 너비 + gap
    }
  });

  // 슬로건 카드 추가
  const allSloganCards = profilesContainer.querySelectorAll('.slogan-card');
  if (allSloganCards.length > 0) {
    totalWidth += allSloganCards[0].offsetWidth + 80;
  }

  // 로고 카드 추가
  const allLogoCards = profilesContainer.querySelectorAll('.logo-card');
  if (allLogoCards.length > 0) {
    totalWidth += allLogoCards[0].offsetWidth + 80;
  }

  return totalWidth;
}
```

**`smoothInfiniteScroll()` (518-542) - 스크롤 엔진**
```javascript
function smoothInfiniteScroll() {
  const profilesContainer = document.querySelector('.profiles-container');
  if (!profilesContainer) return;

  const speedPerFrame = SCROLL_SPEED / 60;  // 60fps 기준

  function animate() {
    scrollPosition += speedPerFrame;

    // ⚠️ 매 프레임마다 실제 너비 재측정 (동적 슬롯 너비 대응)
    const currentTotalWidth = calculateTotalWidth();

    // seamless 리셋
    if (scrollPosition >= currentTotalWidth) {
      scrollPosition = 0;  // 🔴 이슈: overflow 손실
    }

    profilesContainer.style.transform = `translateX(-${scrollPosition}px)`;
    scrollAnimationId = requestAnimationFrame(animate);
  }

  animate();
}
```

**`startSlotCycle(slotNumber)` (404-457) - 슬롯별 재귀 순환**
```javascript
async function startSlotCycle(slotNumber) {
  // 중단 체크
  if (!isProfileCycleActive) return;

  // 1. 노출 시간 가져오기
  const displayTime = getDisplayTimeForSlot(slotNumber);

  // 2. 다음 이미지 프리로딩 (노출 시간 동안!)
  const currentSeqIndex = slotCurrentIndex[slotNumber];
  const nextSeqIndex = (currentSeqIndex + 1) % slotProfileSequences[slotNumber].length;
  const nextProfileIndex = slotProfileSequences[slotNumber][nextSeqIndex];
  const nextProfile = profilesData[nextProfileIndex];

  if (nextProfile) {
    const preloadKey = `slot-${slotNumber}`;
    const preloadImg = new Image();
    preloadImg.src = nextProfile.profile_image;
    preloadedImages.set(preloadKey, preloadImg);
  }

  // 3. displayTime만큼 대기 (6~10.8초)
  await new Promise(resolve => setTimeout(resolve, displayTime));
  if (!isProfileCycleActive) return;

  // 4. 트랜지션 실행
  await transitionProfile(slotNumber);
  if (!isProfileCycleActive) return;

  // 5. 재귀 호출 (무한 반복)
  startSlotCycle(slotNumber);
}
```

---

### 4. 메인 플로우

**`startProfileCycle()` (526-636) - 시작 함수**
```javascript
async function startProfileCycle() {
  // 1. 플래그 활성화
  isProfileCycleActive = true;

  // 2. 스크롤 시작
  const profilesContainer = document.querySelector('.profiles-container');
  if (profilesContainer) {
    profilesContainer.classList.add('scrolling');
    smoothInfiniteScroll();
  }

  // 3. 첫 등장 애니메이션 (wipe-in)
  const allSlots = document.querySelectorAll('.profile-slot');
  const processedSlots = new Set();

  // wipe-out 제거
  allSlots.forEach(slot => {
    const slotNumber = slot.getAttribute('data-slot');
    if (processedSlots.has(slotNumber)) return;
    processedSlots.add(slotNumber);

    const allSameSlots = document.querySelectorAll(`.profile-slot[data-slot="${slotNumber}"]`);
    allSameSlots.forEach(s => {
      const imageWrapper = s.querySelector('.profile-image-wrapper');
      const nickname = s.querySelector('.profile-nickname');
      const message = s.querySelector('.profile-message');
      const underbar = s.querySelector('.profile-underbar');

      if (nickname && message && underbar && imageWrapper) {
        // 초기 img opacity 리셋
        const image = imageWrapper.querySelector('.profile-image');
        if (image) image.style.opacity = '';

        nickname.classList.remove('wipe-out');
        message.classList.remove('wipe-out');
        underbar.classList.remove('wipe-out');
      }
    });
  });

  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // wipe-in 시작
  processedSlots.clear();
  allSlots.forEach(slot => {
    const slotNumber = slot.getAttribute('data-slot');
    if (processedSlots.has(slotNumber)) return;
    processedSlots.add(slotNumber);

    const allSameSlots = document.querySelectorAll(`.profile-slot[data-slot="${slotNumber}"]`);
    allSameSlots.forEach(s => {
      const imageWrapper = s.querySelector('.profile-image-wrapper');
      const nickname = s.querySelector('.profile-nickname');
      const message = s.querySelector('.profile-message');
      const underbar = s.querySelector('.profile-underbar');

      if (nickname && message && underbar && imageWrapper) {
        imageWrapper.classList.add('fade-in');
        nickname.classList.add('wipe-in');
        message.classList.add('wipe-in');
        underbar.classList.add('wipe-in');
      }
    });
  });

  await new Promise(resolve => setTimeout(resolve, TIMING.WIPE_DURATION));

  // 클래스 정리 (생략 - 코드 동일)

  // 4. 모든 슬롯 동시 시작 (병렬)
  for (let slotNumber = 0; slotNumber < 25; slotNumber++) {
    startSlotCycle(slotNumber);  // 비동기 재귀, 독립 실행
  }
}
```

**`runAnimation()` (654-667)**
```javascript
async function runAnimation() {
  const profiles = document.getElementById('profiles');

  // 인트로 없이 바로 프로필 보드 시작
  switchSection(null, profiles);

  // 프로필 순환 시작
  startProfileCycle();

  // 무한 반복 (엔딩 없음)
}
```

**`window.addEventListener('load')` (670-675)**
```javascript
window.addEventListener('load', async () => {
  console.log('🚀 Page loaded');
  await loadData();
  console.log('🎬 Starting animation...');
  runAnimation();
});
```

---

## 🔄 데이터 플로우

```
1. 페이지 로드
   └─ loadData()
      ├─ fetch('data-full.json')
      ├─ 프로필 시퀀스 생성 (100사이클)
      │  slotProfileSequences[0] = [0,1,2,3,4, 0,1,2,3,4, ... ×100]
      │  slotProfileSequences[1] = [5,6,7,8, 5,6,7,8, ... ×100]
      │  ...
      └─ initializeSlots()
         └─ renderProfile() × 25

2. 애니메이션 시작
   └─ runAnimation()
      └─ startProfileCycle()
         ├─ smoothInfiniteScroll()
         │  └─ animate() [60fps loop]
         │     ├─ scrollPosition += 2.5px
         │     ├─ calculateTotalWidth() [매 프레임!]
         │     └─ transform: translateX(-XXXpx)
         │
         └─ startSlotCycle(0~24) × 25 [parallel]
            └─ [무한 재귀]
               ├─ preload next image
               ├─ wait displayTime (6~10.8초)
               ├─ transitionProfile()
               │  ├─ fade-out (1초)
               │  ├─ change data
               │  └─ fade-in (1초)
               └─ recursive call

3. 프로필 전환 (예: 슬롯 0)
   slotCurrentIndex[0] = 0 → profile 0 표시
   6초 대기
   slotCurrentIndex[0] = 1 → profile 1로 전환
   6초 대기
   slotCurrentIndex[0] = 2 → profile 2로 전환
   ...
   slotCurrentIndex[0] = 499 → profile 4로 전환 (99번째 사이클)
   slotCurrentIndex[0] = 500 → profile 0으로 돌아감 (100번째 사이클)
```

---

## ⚠️ 주요 이슈 코드 위치

### Issue #1: 스크롤 튀는 현상
**위치:** `script-v3.js:532`
```javascript
if (scrollPosition >= currentTotalWidth) {
  scrollPosition = 0;  // 🔴 하드 리셋 → overflow 손실
}
```

**개선안:**
```javascript
if (scrollPosition >= currentTotalWidth) {
  scrollPosition = scrollPosition - currentTotalWidth;  // overflow 보존
}
```

### Issue #2: 매 프레임 DOM 측정
**위치:** `script-v3.js:529`
```javascript
const currentTotalWidth = calculateTotalWidth();  // 🔴 60fps × offsetWidth
```

**우려:**
- Layout thrashing 가능성
- 성능 오버헤드

### Issue #3: 깜빡임 방지 로직
**위치:** `script-v3.js:267-275`
```javascript
// inline style로 투명 상태 고정
image.style.opacity = '0';
image.style.transform = 'scale(0.7)';
// ... (클래스 제거 전에 최종 상태 고정)
```

---

## 📊 복잡도 분석

### 시간 복잡도
- **초기화**: O(n) - n = 106개 프로필
- **매 프레임**: O(m) - m = 슬롯 개수 (25개)
- **프로필 전환**: O(k) - k = 복제본 개수 (2개)

### 공간 복잡도
- **프로필 시퀀스**: O(n × c) - n=25슬롯, c=100사이클 ≈ 10,000개 인덱스
- **DOM 요소**: O(m × r) - m=25슬롯, r=2복제 = 50개 모듈

### 성능 핫스팟
1. ⚠️ `calculateTotalWidth()` - 60fps 호출
2. ⚠️ `querySelectorAll()` - 프로필 전환마다
3. ✅ 이미지 프리로딩 - 효율적

---

## 🎯 개선 포인트

### 1. 스크롤 시스템
- [ ] overflow 보존 방식으로 변경
- [ ] ResizeObserver로 변경 감지 최적화

### 2. DOM 조작
- [ ] 복제본 참조 캐싱
- [ ] Virtual DOM 고려

### 3. 메모리 최적화
- [ ] 프로필 시퀀스 → 모듈로 연산
- [ ] 사용하지 않는 이미지 언로드

---

이 문서가 코드 구조 이해에 도움이 되길 바랍니다! 😊
