// 프로필 데이터
let profilesData = [];

// 타이밍 상수
const TIMING = {
    OPENING_WAIT: 1000,         // 비디오 후 대기 (Scene02 제거, 빠른 진입)
    // PROFILE_DISPLAY: 슬롯별로 6~10초로 다양 (SLOT_DISPLAY_TIMES 참조)
    TRANSITION_DURATION: 2000,  // 트랜지션 애니메이션 (2초)
    WIPE_DURATION: 1000,        // 와이프 효과 (1초)
    ENDING: 3000                // 엔딩
};

// 언더바 그라데이션 컬러 (3종류로 통일감 있게)
const GRADIENTS = [
    ["#04F3FF", "#90F779"],  // CONFIDENT COOL (청록→연두)
    ["#DDF730", "#FFBD19"],  // INSPIRATION WARM (라임→주황)
    ["#FF638A", "#FF1FE0"],  // ENERGETIC HOT (핑크→마젠타)
];

// 슬롯별 노출 시간 (6.0~10.8초, 25개 모두 다른 시간, 0.2초 간격)
// 짧은 시간 → 많은 프로필, 긴 시간 → 적은 프로필
const SLOT_DISPLAY_TIMES = {
    // 1행: 짧음-중간-김-중간-짧음 패턴
    0: 6000,    // 6.0s (5명)
    1: 7600,    // 7.6s (4명)
    2: 9400,    // 9.4s (4명)
    3: 8200,    // 8.2s (4명)
    4: 6400,    // 6.4s (5명)
    // 2행: 다른 조합
    5: 7800,    // 7.8s (4명)
    6: 9800,    // 9.8s (4명)
    7: 6800,    // 6.8s (5명)
    8: 8600,    // 8.6s (4명)
    9: 10400,   // 10.4s (4명)
    // 3행
    10: 7200,   // 7.2s (4명)
    11: 9600,   // 9.6s (4명)
    12: 6200,   // 6.2s (5명)
    13: 8800,   // 8.8s (4명)
    14: 10800,  // 10.8s (4명)
    // 4행
    15: 8000,   // 8.0s (4명)
    16: 10200,  // 10.2s (4명)
    17: 7000,   // 7.0s (5명)
    18: 9200,   // 9.2s (4명)
    19: 6600,   // 6.6s (5명)
    // 5행
    20: 10600,  // 10.6s (4명)
    21: 8400,   // 8.4s (4명)
    22: 7400,   // 7.4s (4명)
    23: 9000,   // 9.0s (4명)
    24: 10000   // 10.0s (4명)
};

// 슬롯별 프로필 개수 (짧은 시간 6.0~7.0초 → 5명, 나머지 → 4명)
const SLOT_PROFILE_COUNTS = {
    // 6.0~7.0초: 5명 (6개 슬롯)
    0: 5,   // 6.0s
    4: 5,   // 6.4s
    12: 5,  // 6.2s
    7: 5,   // 6.8s
    19: 5,  // 6.6s
    17: 5,  // 7.0s
    // 7.2~10.8초: 4명 (19개 슬롯)
    1: 4, 2: 4, 3: 4, 5: 4, 6: 4, 8: 4, 9: 4, 10: 4, 11: 4,
    13: 4, 14: 4, 15: 4, 16: 4, 18: 4, 20: 4, 21: 4, 22: 4, 23: 4, 24: 4
};

// 각 슬롯의 프로필 시퀀스 (중복 방지)
let slotProfileSequences = [];
let slotCurrentIndex = [];

// 이미지 프리로딩 캐시 (슬롯별로 다음 이미지 미리 로딩)
const preloadedImages = new Map();

// 데이터 로드
async function loadData() {
    console.log('🔄 Loading data-full.json...');
    try {
        const response = await fetch('data-full.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        profilesData = await response.json();
        console.log(`✅ Loaded ${profilesData.length} profiles`);

        // 각 슬롯에 고유한 프로필 시퀀스 생성 (106명을 25개 슬롯에 배치)
        // 짧은 시간(6.0~7.0초) → 5명, 나머지(7.2~10.8초) → 4명
        // 6개 슬롯 × 5명 = 30명, 19개 슬롯 × 4명 = 76명, 총 106명

        let profileCounter = 0;
        slotProfileSequences = Array(25).fill(0).map((_, slotIndex) => {
            const sequence = [];
            const profilesPerSlot = SLOT_PROFILE_COUNTS[slotIndex];

            // 무한 반복을 위해 충분히 많이 반복 (100번)
            for (let cycle = 0; cycle < 100; cycle++) {
                for (let j = 0; j < profilesPerSlot; j++) {
                    sequence.push(profileCounter + j);
                }
            }

            // 다음 슬롯을 위해 카운터 증가
            profileCounter += profilesPerSlot;

            return sequence;
        });

        // 각 슬롯의 현재 인덱스 초기화
        slotCurrentIndex = Array(25).fill(0);

        console.log('📝 Slot profile distribution (25개 슬롯 모두 다른 시간):');
        console.log('Slot 0 (6.0s, 5명):', slotProfileSequences[0]);
        console.log('Slot 1 (7.6s, 4명):', slotProfileSequences[1]);
        console.log('Slot 14 (10.8s, 4명):', slotProfileSequences[14]);
        console.log('Total profiles:', profileCounter);

        initializeSlots();
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// 슬롯 초기화 (원본 25개만, 복제는 자동으로 같은 내용 렌더링)
function initializeSlots() {
    console.log('🎨 Initializing slots (original 25 only)...');

    // 각 슬롯 번호당 첫 번째 슬롯만 가져오기 (중복 제거)
    const processedSlots = new Set();
    const slots = document.querySelectorAll('.profile-slot');

    slots.forEach((slot) => {
        const slotNumber = parseInt(slot.getAttribute('data-slot'));

        // 이미 처리한 슬롯 번호면 스킵
        if (processedSlots.has(slotNumber)) return;
        processedSlots.add(slotNumber);

        // 각 슬롯의 첫 번째 프로필 가져오기
        const profileIndex = slotProfileSequences[slotNumber][0];
        const profile = profilesData[profileIndex];

        if (profile) {
            // 같은 슬롯 번호를 가진 모든 요소에 렌더링 (원본+복제)
            const allSlotsWithSameNumber = document.querySelectorAll(`.profile-slot[data-slot="${slotNumber}"]`);
            allSlotsWithSameNumber.forEach(s => {
                renderProfile(s, profile, slotNumber);
                s.classList.add('active');
            });
        }
    });

    console.log(`✅ Slots initialized (${processedSlots.size} unique slots, ${slots.length} total including duplicates)`);
}

// 프로필 렌더링
function renderProfile(slot, profile, slotIndex) {
    const gradient = GRADIENTS[slotIndex % GRADIENTS.length];
    const gradientStyle = `background: linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`;

    // 메시지 길이 계산 (대략적인 픽셀 width)
    // 56px 글자 크기이므로 더 넓게
    const messageLength = profile.message.length;
    const estimatedWidth = Math.max(600, messageLength * 32); // 최소 600px

    slot.style.minWidth = `${estimatedWidth + 260}px`; // 이미지(200) + 갭(30) + 텍스트 + 여백(30)

    // 🎯 초기 상태는 wipe-out + 이미지 투명 - 첫 등장 애니메이션을 위해
    slot.innerHTML = `
        <div class="profile-module">
            <div class="profile-image-wrapper">
                <img src="${profile.profile_image}"
                     alt="${profile.nickname}"
                     class="profile-image"
                     style="opacity: 0;"
                     loading="eager">
            </div>
            <div class="profile-text">
                <div class="profile-message wipe-out">${profile.message}</div>
                <div class="profile-nickname wipe-out">${profile.nickname}</div>
                <div class="profile-underbar wipe-out" style="${gradientStyle}; width: ${estimatedWidth}px;"></div>
            </div>
        </div>
    `;
}

// 슬롯별 노출 시간 반환 (6~8초 사이로 다양하게)
function getDisplayTimeForSlot(slotNumber) {
    return SLOT_DISPLAY_TIMES[slotNumber] || 7000; // 기본값 7초
}

// 프로필 트랜지션 (축소/확대 + 텍스트 와이프 오→왼, 왼→오) - 복제본도 동시 업데이트
async function transitionProfile(slotNumber) {
    // 같은 슬롯 번호를 가진 모든 요소 (원본+복제)
    const allSlots = document.querySelectorAll(`.profile-slot[data-slot="${slotNumber}"]`);

    // 다음 프로필 데이터 미리 가져오기
    const currentSeqIndex = slotCurrentIndex[slotNumber];
    const nextSeqIndex = (currentSeqIndex + 1) % slotProfileSequences[slotNumber].length;
    slotCurrentIndex[slotNumber] = nextSeqIndex;

    const nextProfileIndex = slotProfileSequences[slotNumber][nextSeqIndex];
    const nextProfile = profilesData[nextProfileIndex];
    const gradient = GRADIENTS[slotNumber % GRADIENTS.length];

    // 디버깅: 첫 슬롯만 로그
    if (slotNumber === 0) {
        const profilesPerSlot = SLOT_PROFILE_COUNTS[slotNumber];
        console.log(`🔄 Slot 0 (6초, 5명): cycle ${Math.floor(nextSeqIndex / profilesPerSlot) + 1}/100, profile ${nextProfileIndex}`);
    }

    // 모든 슬롯(원본+복제)에 동시에 애니메이션 적용
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

    // 🎯 프리로드된 이미지 사용 (5초 동안 미리 불러온 이미지!)
    const preloadKey = `slot-${slotNumber}`;
    const preloadImg = preloadedImages.get(preloadKey);

    // 이미지 로딩 완료 대기 (이미 로딩되었을 가능성 매우 높음!)
    const imageLoadPromise = new Promise((resolve) => {
        if (preloadImg && preloadImg.complete) {
            resolve();
        } else if (preloadImg) {
            preloadImg.onload = resolve;
            preloadImg.onerror = resolve;
            setTimeout(resolve, 100); // 거의 즉시 완료될 것
        } else {
            // 프리로드 실패 시 직접 로딩
            const fallbackImg = new Image();
            fallbackImg.src = nextProfile.profile_image;
            fallbackImg.onload = resolve;
            fallbackImg.onerror = resolve;
            setTimeout(resolve, 200);
        }
    });

    // 1단계: 이미지와 텍스트 동시에 fade-out/wipe-out 시작
    allElements.forEach(({ imageWrapper, nickname, message, underbar }) => {
        imageWrapper.classList.add('fade-out');
        nickname.classList.add('wipe-out');
        message.classList.add('wipe-out');
        underbar.classList.add('wipe-out');
    });

    // 🎯 fade-out/wipe-out 애니메이션 완료 대기 (1초)
    await new Promise(resolve => setTimeout(resolve, TIMING.WIPE_DURATION));

    // 이미지 로딩 완료 대기 (이미 로딩되었을 가능성 높음)
    await imageLoadPromise;

    // 2단계: 모든 데이터 동시 교체 (이미지 & 텍스트 모두 투명한 상태)
    const messageLength = nextProfile.message.length;
    const estimatedWidth = Math.max(600, messageLength * 32);

    allElements.forEach(({ slot, imageWrapper, image, nickname, message, underbar }) => {
        // 🎯 클래스 제거 전에 최종 상태를 inline style로 고정 (깜빡임 방지!)
        image.style.opacity = '0';
        image.style.transform = 'scale(0.7)';
        nickname.style.clipPath = 'inset(0 100% 0 0)';
        nickname.style.opacity = '0';
        message.style.clipPath = 'inset(0 100% 0 0)';
        message.style.opacity = '0';
        underbar.style.clipPath = 'inset(0 100% 0 0)';
        underbar.style.opacity = '0';

        // 이미지 src 즉시 변경 (opacity 0 상태)
        image.src = nextProfile.profile_image;
        image.alt = nextProfile.nickname;

        // 텍스트 데이터 변경
        message.textContent = nextProfile.message;
        nickname.textContent = nextProfile.nickname;
        underbar.style.background = `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`;
        underbar.style.width = `${estimatedWidth}px`;
        slot.style.minWidth = `${estimatedWidth + 260}px`;

        // fade-out, wipe-out 제거
        imageWrapper.classList.remove('fade-out');
        nickname.classList.remove('wipe-out');
        message.classList.remove('wipe-out');
        underbar.classList.remove('wipe-out');
    });

    // 🎯 requestAnimationFrame으로 브라우저 렌더링 사이클 완료 보장
    // 두 번 호출로 확실한 리플로우 트리거 - CSS 애니메이션 100% 보장!
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // fade-in, wipe-in 시작 (inline style 제거하고 CSS 애니메이션으로 전환)
    allElements.forEach(({ imageWrapper, image, nickname, message, underbar }) => {
        // 🎯 inline style 제거 (CSS 애니메이션이 제대로 작동하도록)
        image.style.opacity = '';
        image.style.transform = '';
        nickname.style.clipPath = '';
        nickname.style.opacity = '';
        message.style.clipPath = '';
        message.style.opacity = '';
        underbar.style.clipPath = '';
        underbar.style.opacity = '';

        // fade-in, wipe-in 클래스 추가
        imageWrapper.classList.add('fade-in');
        nickname.classList.add('wipe-in');
        message.classList.add('wipe-in');
        underbar.classList.add('wipe-in');
    });

    // 3단계: 텍스트+바 왼→오 펼쳐지기 + 이미지 페이드인 (1초)
    await new Promise(resolve => setTimeout(resolve, TIMING.WIPE_DURATION));

    // 클래스 정리
    allElements.forEach(({ imageWrapper, nickname, message, underbar }) => {
        imageWrapper.classList.remove('fade-in');
        message.classList.remove('wipe-in');
        nickname.classList.remove('wipe-in');
        underbar.classList.remove('wipe-in');
    });
}

// Scene 02: 언더바 + 로고/아이콘 진입 효과
function playScene02Underbars() {
    console.log('🎬 Scene 02: Underbars + Logos + Icons entering...');
    const underbarBg = document.getElementById('underbar-bg');
    underbarBg.classList.add('active');

    // Sub icon 목록
    const subIcons = [
        'assets/icons/chair_4096_P.png',
        'assets/icons/flame_4096_P.png',
        'assets/icons/headphone_4096_P.png',
        'assets/icons/light_4096_P.png',
        'assets/icons/notebook_4096_P.png',
        'assets/icons/poping_mug_4096_P.png',
        'assets/icons/power_strip_4096_P.png',
        'assets/icons/rocket_pen_4096_P.png',
        'assets/icons/rubberduck_4096_P.png'
    ];

    // 언더바, 로고, 아이콘을 믹스하여 생성 (10초 동안 7개 요소만)
    for (let i = 0; i < 7; i++) {
        setTimeout(() => {
            const elementType = Math.random();
            let element;

            if (elementType < 0.5) {
                // 언더바 (50%)
                element = document.createElement('div');
                element.className = 'underbar-line enter';
                element.style.width = `${Math.random() * 800 + 300}px`;

                const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
                element.style.background = `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`;
            } else if (elementType < 0.7) {
                // 로고 (20%)
                element = document.createElement('img');
                element.className = 'scene02-logo';
                element.src = 'assets/logo/logo.png';
            } else {
                // Sub icon (30%)
                element = document.createElement('img');
                element.className = 'scene02-icon';
                element.src = subIcons[Math.floor(Math.random() * subIcons.length)];
            }

            // 랜덤 위치
            element.style.position = 'absolute';
            element.style.top = `${Math.random() * 80 + 10}%`;

            underbarBg.appendChild(element);

            // 애니메이션 후 제거
            setTimeout(() => element.remove(), 700);
        }, i * 1400); // 10초 / 7개 ≈ 1400ms 간격
    }

    // 효과 종료 후 비활성화
    setTimeout(() => {
        underbarBg.classList.remove('active');
    }, TIMING.SCENE02_UNDERBARS);
}

// Scene 05: 언더바 퇴장 효과
function playScene05Underbars() {
    console.log('🎬 Scene 05: Underbars exiting...');
    const underbarBg = document.getElementById('underbar-bg');
    underbarBg.classList.add('active');

    // 여러 개의 언더바 생성
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const line = document.createElement('div');
            line.className = 'underbar-line exit';

            // 랜덤 위치
            line.style.top = `${Math.random() * 80 + 10}%`;
            line.style.width = `${Math.random() * 600 + 200}px`;

            // 랜덤 그라데이션
            const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
            line.style.background = `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`;

            underbarBg.appendChild(line);

            // 애니메이션 후 제거
            setTimeout(() => line.remove(), 1000);
        }, i * 100);
    }

    // 효과 종료 후 비활성화
    setTimeout(() => {
        underbarBg.classList.remove('active');
    }, TIMING.SCENE05_UNDERBARS);
}

// 각 슬롯의 재귀 순환 함수 (async) - 슬롯 번호만 받아서 모든 복제본 동시 제어
async function startSlotCycle(slotNumber) {
    // 🎯 사이클이 비활성화되면 재귀 중단
    if (!isProfileCycleActive) {
        console.log(`⏹️  Slot ${slotNumber}: cycle stopped`);
        return;
    }

    // 슬롯별 노출 시간 가져오기 (6~8초 사이로 다양하게)
    const displayTime = getDisplayTimeForSlot(slotNumber);

    // 🚀 다음 이미지 프리로딩 시작 (노출 시간 동안 미리 불러오기!)
    const currentSeqIndex = slotCurrentIndex[slotNumber];
    const nextSeqIndex = (currentSeqIndex + 1) % slotProfileSequences[slotNumber].length;
    const nextProfileIndex = slotProfileSequences[slotNumber][nextSeqIndex];
    const nextProfile = profilesData[nextProfileIndex];

    if (nextProfile) {
        const preloadKey = `slot-${slotNumber}`;
        const preloadImg = new Image();
        preloadImg.src = nextProfile.profile_image;
        preloadedImages.set(preloadKey, preloadImg);

        if (slotNumber === 0) {
            console.log(`🖼️  Slot 0 (6초): Preloading next image during ${displayTime/1000}s wait`);
        }
    }

    // 디버깅: 첫 슬롯만 로그
    if (slotNumber === 0) {
        console.log(`⏱️  Slot 0 (6초, 5명): ${displayTime}ms 노출 대기`);
    }

    // 1단계: 완전히 표시된 상태에서 displayTime만큼 대기 (6~10초)
    await new Promise(resolve => setTimeout(resolve, displayTime));

    // 🎯 대기 중에 사이클이 중단되었을 수 있으므로 다시 확인
    if (!isProfileCycleActive) {
        console.log(`⏹️  Slot ${slotNumber}: cycle stopped during wait`);
        return;
    }

    // 2단계: 트랜지션 실행 (모든 복제본 동시 업데이트)
    await transitionProfile(slotNumber);

    // 🎯 트랜지션 후에도 확인
    if (!isProfileCycleActive) {
        console.log(`⏹️  Slot ${slotNumber}: cycle stopped after transition`);
        return;
    }

    // 3단계: 새 프로필이 완전히 표시된 상태로 재귀 호출
    startSlotCycle(slotNumber);
}

// 가로 스크롤 변수
let scrollPosition = 0;
let scrollAnimationId = null;
const SCROLL_SPEED = 150; // px/초 (멀미 방지 - 느린 속도)

// 프로필 사이클 제어 플래그
let isProfileCycleActive = false;

// 전체 너비 계산 함수
function calculateTotalWidth() {
    const profilesContainer = document.querySelector('.profiles-container');
    const firstRow = profilesContainer.querySelector('.profile-row');

    // 첫 번째 행의 원본 슬롯들만 계산 (복제 제외)
    const allSlots = firstRow.querySelectorAll('.profile-slot');
    const processedSlots = new Set();
    let totalWidth = 0;

    allSlots.forEach(slot => {
        const slotNumber = slot.getAttribute('data-slot');
        if (!processedSlots.has(slotNumber)) {
            processedSlots.add(slotNumber);
            totalWidth += slot.offsetWidth + 80; // 슬롯 너비 + gap
        }
    });

    // 슬로건 카드와 로고 카드 너비도 추가 (전체 컨테이너에서 찾기)
    const allSloganCards = profilesContainer.querySelectorAll('.slogan-card');
    if (allSloganCards.length > 0) {
        totalWidth += allSloganCards[0].offsetWidth + 80;
    }

    const allLogoCards = profilesContainer.querySelectorAll('.logo-card');
    if (allLogoCards.length > 0) {
        totalWidth += allLogoCards[0].offsetWidth + 80;
    }

    return totalWidth;
}

// 부드러운 무한 스크롤 (일정 속도)
function smoothInfiniteScroll() {
    const profilesContainer = document.querySelector('.profiles-container');
    if (!profilesContainer) return;

    const speedPerFrame = SCROLL_SPEED / 60; // 60fps 기준

    function animate() {
        scrollPosition += speedPerFrame;

        // 🎯 매 프레임마다 실제 너비 재측정 (동적 슬롯 너비 대응)
        const currentTotalWidth = calculateTotalWidth();

        // 실제 너비만큼 이동하면 seamless 리셋
        if (scrollPosition >= currentTotalWidth) {
            scrollPosition = 0;
        }

        profilesContainer.style.transform = `translateX(-${scrollPosition}px)`;
        scrollAnimationId = requestAnimationFrame(animate);
    }

    animate();
    console.log(`✅ Smooth infinite scroll started (${SCROLL_SPEED}px/s, dynamic width recalculation enabled)`);
}

// 스크롤 정지 함수
function stopInfiniteScroll() {
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
    }
}

// 프로필 순환 시작 (원본 25개만 제어, 복제는 자동으로 동기화)
async function startProfileCycle() {
    console.log('🔄 Starting profile cycle (25 unique slots, ALL SYNCHRONIZED)...');
    console.log('⏱️  Display time: 6.0~10.8초 (25개 슬롯 모두 다른 시간, 0.2초 간격) + 2초 전환');
    console.log('📊 짧은시간=많은프로필: 6.0~7.0초(5명) × 6슬롯, 7.2~10.8초(4명) × 19슬롯');

    // 🎯 사이클 활성화 플래그
    isProfileCycleActive = true;

    const profilesContainer = document.querySelector('.profiles-container');

    // 전체 판 가로 이동 시작 (JavaScript 방식)
    if (profilesContainer) {
        profilesContainer.classList.add('scrolling');
        smoothInfiniteScroll(); // 일정 속도 스크롤 시작
    }

    // 🎬 첫 등장 애니메이션: 모든 슬롯 wipe-in (좌→우 펼쳐지기) + 이미지 페이드인
    console.log('🎬 Initial wipe-in animation starting...');

    const allSlots = document.querySelectorAll('.profile-slot');
    const processedSlots = new Set();

    // wipe-out 제거 + 이미지 wrapper opacity 리셋
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

    // requestAnimationFrame으로 리플로우 보장
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

    // 첫 등장 애니메이션 완료 대기 (1000ms = 1초)
    await new Promise(resolve => setTimeout(resolve, TIMING.WIPE_DURATION));

    // 클래스 정리
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
                imageWrapper.classList.remove('fade-in');
                nickname.classList.remove('wipe-in');
                message.classList.remove('wipe-in');
                underbar.classList.remove('wipe-in');
            }
        });
    });

    console.log('✅ Initial wipe-in animation completed');

    // 🎯 모든 슬롯을 동시에 시작
    console.log('🎯 All 25 slots starting SIMULTANEOUSLY');

    for (let slotNumber = 0; slotNumber < 25; slotNumber++) {
        startSlotCycle(slotNumber);
    }

    console.log('✅ All slots synchronized - uniform rhythm achieved');
}

// 프로필 순환 정지
function stopProfileCycle() {
    console.log('⏹️  Stopping all profile cycles...');
    isProfileCycleActive = false;
}

// 섹션 전환
function switchSection(from, to) {
    if (from) {
        from.classList.remove('active');
    }
    if (to) {
        to.classList.add('active');
    }
}

// 메인 애니메이션 시퀀스 (엔딩 제거 - 프로필 보드만 무한 반복)
async function runAnimation() {
    const profiles = document.getElementById('profiles');

    // 🎬 인트로 영상 제거 - 바로 프로필 보드로 시작 (v0.3 가이드)
    console.log('📺 Profile board starting (no intro video)');
    switchSection(null, profiles);

    // 프로필 순환 시작
    startProfileCycle();

    // 🔄 프로필 보드만 무한 반복 (엔딩 없음)
    console.log('♾️  Profile board will loop infinitely (no ending)');
}

// 페이지 로드 시 시작
window.addEventListener('load', async () => {
    console.log('🚀 Page loaded');
    await loadData();
    console.log('🎬 Starting animation...');
    runAnimation();
});

// 전체화면 토글 함수
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // 전체화면 진입
        document.documentElement.requestFullscreen().then(() => {
            console.log('🖥️  Fullscreen mode activated');
        }).catch(err => {
            console.error('❌ Fullscreen error:', err);
        });
    } else {
        // 전체화면 해제
        document.exitFullscreen().then(() => {
            console.log('🪟 Fullscreen mode deactivated');
        });
    }
}

// 키보드 컨트롤
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        console.log('🔄 Space pressed - Reloading...');
        location.reload();
    } else if (e.code === 'KeyF') {
        // F키로 전체화면 토글
        e.preventDefault();
        toggleFullscreen();
    }
});

// 더블클릭으로 전체화면 토글
document.addEventListener('dblclick', () => {
    toggleFullscreen();
});

// 페이지 로드 시 안내 메시지
window.addEventListener('load', () => {
    console.log('💡 Tip: Press F or Double-click for fullscreen mode');
});

console.log('✅ Script-v3 loaded');
