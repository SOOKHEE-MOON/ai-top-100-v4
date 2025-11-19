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

// 통일된 노출 시간
const PROFILE_DISPLAY_TIME = 12000; // 12초 (모든 슬롯 동일)

// 슬롯별 프로필 개수 (모두 동일하게 4명으로 통일)
// 25개 슬롯 × 4명 = 100명 + 나머지 6명을 일부 슬롯에 추가
const SLOT_PROFILE_COUNTS = {
    // 106명을 25개 슬롯에 배치: 21개 슬롯(4명) + 4개 슬롯(5명) = 84 + 20 = 104명... 아니다
    // 재계산: 4명 기본 × 25 = 100명, 나머지 6명을 분산
    0: 5, 1: 4, 2: 4, 3: 4, 4: 5,
    5: 4, 6: 4, 7: 5, 8: 4, 9: 4,
    10: 4, 11: 4, 12: 5, 13: 4, 14: 4,
    15: 4, 16: 4, 17: 5, 18: 4, 19: 5,
    20: 4, 21: 4, 22: 4, 23: 4, 24: 4
    // 총 6개 슬롯(5명) + 19개 슬롯(4명) = 30 + 76 = 106명
};

// 각 슬롯의 프로필 시퀀스 (중복 방지)
let slotProfileSequences = [];
let slotCurrentIndex = [];

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

        const templates = document.getElementById('templates');

        templates.innerHTML = profilesData.map((profile, index) => {
            return renderProfile(profile, index).trim();
        }).join('');

        templates.childNodes.forEach((element) => {
            // 실제 크기를 측정
            if (element.offsetWidth) {
                element.style.width = `${element.offsetWidth}px`;
            }
        });

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

        document.getElementById('profiles').addEventListener('animationend', ({ target, animationName }) => {
            if (animationName === 'scroll-left' || animationName === 'scroll-left-alt') {
                const offset = (600 - target.offsetLeft) % (target.scrollWidth >> 1);
                target.style.left = -offset + 'px';
                target.classList.toggle('alt');
            }
        });
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// 슬롯 초기화 (원본 25개만, 복제는 자동으로 같은 내용 렌더링)
function initializeSlots() {
    console.log('🎨 Initializing slots (original 25 only)...');

    Array.from({ length: 25}, (_, slotNumber) => {
        // 각 슬롯의 첫 번째 프로필 가져오기
        const profileIndex = slotProfileSequences[slotNumber][0];
        const profile = document.getElementById(`profile-${profileIndex}`);

        if (profile) {
            // 같은 슬롯 번호를 가진 모든 요소에 렌더링 (원본+복제)
            const allSlotsWithSameNumber = document.querySelectorAll(`.profile-slot[data-slot="${slotNumber}"]`);
            allSlotsWithSameNumber.forEach(s => {
                s.style.width = profile.style.width;
                s.innerHTML = profile.innerHTML;
                s.classList.add('active');
            });
        }
    });

    //console.log(`✅ Slots initialized (${processedSlots.size} unique slots, ${slots.length} total including duplicates)`);
}

// 프로필 렌더링
function renderProfile(profile, slotIndex) {
    const gradientClass = `profile-underbar-${slotIndex % 3}`;

    new Image().src = profile.profile_image; // 이미지 프리로드

    // 🎯 초기 상태는 wipe-out + 이미지 투명 - 첫 등장 애니메이션을 위해
    return `
    <div id="profile-${profile.id - 1}" class="profile-slot active">
        <div class="profile-module">
            <div class="profile-image-wrapper">
                <img src="${profile.profile_image}"
                     alt="${profile.nickname}"
                     class="profile-image"
                     style=""
                     loading="eager">
            </div>
            <div class="profile-text">
                <div class="profile-message">${profile.message}</div>
                <div class="profile-nickname">${profile.nickname}</div>
                <div class="profile-underbar ${gradientClass}"></div>
            </div>
        </div>
    </div>
    `;
}

// 슬롯별 노출 시간 반환 (모두 동일)
function getDisplayTimeForSlot(slotNumber) {
    return PROFILE_DISPLAY_TIME; // 12초 (모든 슬롯 동일)
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
    const template = document.getElementById(`profile-${nextProfileIndex}`);

    // 디버깅: 첫 슬롯만 로그
    if (slotNumber === 0) {
        const profilesPerSlot = SLOT_PROFILE_COUNTS[slotNumber];
        console.log(`🔄 Slot 0 (12초, ${profilesPerSlot}명): cycle ${Math.floor(nextSeqIndex / profilesPerSlot) + 1}/100, profile ${nextProfileIndex}`);
    }

    // 1단계: 이미지와 텍스트 동시에 fade-out/wipe-out 시작
    allSlots.forEach((slot) => {
        slot.classList.remove('in');
        slot.classList.add('out');
        slot.addEventListener('animationend', ({ currentTarget }) => {
            currentTarget.style.width = template.style.width;
            currentTarget.innerHTML = template.innerHTML;
            currentTarget.classList.remove('out');
            currentTarget.classList.add('in');
        }, { once: true });
    });
}

// 각 슬롯의 재귀 순환 함수 (async) - 슬롯 번호만 받아서 모든 복제본 동시 제어
async function startSlotCycle(slotNumber) {
    // 🎯 사이클이 비활성화되면 재귀 중단
    if (!isProfileCycleActive) {
        console.log(`⏹️  Slot ${slotNumber}: cycle stopped`);
        return;
    }

    // 슬롯별 노출 시간 가져오기 (6~8초 사이로 다양하게)
    // const displayTime = getDisplayTimeForSlot(slotNumber);

    // 디버깅: 첫 슬롯만 로그
    // if (slotNumber === 0) {
        // console.log(`⏱️  Slot 0 (12초): ${displayTime}ms 노출 대기`);
    // }

    // 1단계: 완전히 표시된 상태에서 displayTime만큼 대기 (12초)
    // await new Promise(resolve => setTimeout(resolve, displayTime));

    // 🎯 대기 중에 사이클이 중단되었을 수 있으므로 다시 확인
    // if (!isProfileCycleActive) {
        // console.log(`⏹️  Slot ${slotNumber}: cycle stopped during wait`);
        // return;
    // }

    // 2단계: 트랜지션 실행 (모든 복제본 동시 업데이트)
    await transitionProfile(slotNumber);

    // 🎯 트랜지션 후에도 확인
    // if (!isProfileCycleActive) {
        // console.log(`⏹️  Slot ${slotNumber}: cycle stopped after transition`);
        // return;
    // }

    // 3단계: 새 프로필이 완전히 표시된 상태로 재귀 호출
    // startSlotCycle(slotNumber);
}

// 프로필 사이클 제어 플래그
let isProfileCycleActive = false;

// 프로필 순환 시작 (원본 25개만 제어, 복제는 자동으로 동기화)
async function startProfileCycle() {
    console.log('🔄 Starting profile cycle (25 unique slots, STAGGERED START)...');
    console.log('⏱️  Display time: 12초 (모든 슬롯 통일) + 2초 전환');
    console.log('📊 시작 지연: 0~48초 (2초 간격) → 동시 전환 방지');

    // 🎯 사이클 활성화 플래그
    isProfileCycleActive = true;

    console.log('✅ Initial wipe-in animation completed');

    // 🎯 슬롯별 시작 지연 적용 (2초 간격으로 순차 시작)
    console.log('🎯 Starting 25 slots with staggered delays (2s intervals)');

    let slotNumber = 0;

    (function cycleSlot() {
        startSlotCycle(slotNumber);
        startSlotCycle((slotNumber + 12) % 25);
        // console.log(`🎬 Slot ${slotNumber} started (after ${startDelay/1000}s delay)`);
        slotNumber = (slotNumber + 7) % 25;
        setTimeout(cycleSlot, 2000);
    })();    

    console.log('✅ Staggered start scheduled (0~48s) - simple & effective');
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
