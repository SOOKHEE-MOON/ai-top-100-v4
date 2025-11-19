# 프로필 보드 개선사항

## 📋 우선순위별 개선 요구사항

### 🔴 Priority 1: 슬롯 간 거리 조정 모션 개선

**현상:**
- 슬롯1에 긴 문장이 나오는 경우, **슬롯1의 문장이 시작되기도 전에** 슬롯2에 있는 프로필이 임의로 뒤로 일정 거리를 **덜컥 이동**하는 현상 발생
- 문장 길이가 달라질 때 슬롯과 슬롯 사이 거리를 조정하는 모션이 부자연스러움

**요구사항:**
- 슬롯1 문장이 **모두 완성될 즈음** 반응형으로 뒤로 밀리는 느낌으로 수정
- 문장 길이 변화에 따른 레이아웃 재배치가 훨씬 부드럽게 이루어져야 함

**현재 시도한 해결방법 (실패):**
```css
/* 시도 1: transition 제거 - 덜컥거림 방지 */
.profile-slot {
    transition: opacity 0.3s ease; /* min-width transition 제거 */
}
```
- transition을 제거했지만 문제 지속
- Flexbox가 즉시 공간 재배치하는 것이 근본 원인

**기술적 분석:**
1. **전환 타임라인 (현재):**
   ```
   0.0초: fade-out + wipe-out 시작
   1.0초: 데이터 변경 (긴 문장으로 변경)
         → slot.style.minWidth 즉시 증가
         → ⚠️ Flexbox가 즉시 재배치 (덜컥!)
   1.0초: fade-in + wipe-in 시작 (텍스트 나타남)
   2.0초: 전환 완료
   ```

2. **원하는 타임라인:**
   ```
   0.0초: fade-out + wipe-out 시작
   1.0초: 데이터 변경 (긴 문장으로 변경)
         → 텍스트는 투명 상태
         → slot.style.minWidth는 아직 변경 안 함
   1.0초: fade-in + wipe-in 시작 (텍스트 나타남)
   1.0~2.0초: 텍스트가 나타나는 동안 부드럽게 너비 확장
         → transition: min-width 1s ease-out
   2.0초: 전환 완료
   ```

**제안 해결방법:**

**옵션 A: 너비 변경 지연 + transition 복원**
```javascript
// transitionProfile() 함수 수정
// 2단계: 데이터 변경 시 너비는 변경 안 함
allElements.forEach(({ slot, imageWrapper, image, nickname, message, underbar }) => {
    // ... (기존 코드)
    // slot.style.minWidth 변경 제거 (나중에 처리)
});

// 3단계: fade-in 시작하면서 너비 변경
allElements.forEach(({ slot, imageWrapper, image, nickname, message, underbar }) => {
    // fade-in 시작
    imageWrapper.classList.add('fade-in');
    nickname.classList.add('wipe-in');
    message.classList.add('wipe-in');
    underbar.classList.add('wipe-in');

    // 🎯 너비를 지금 변경 (wipe-in과 동시에)
    slot.style.minWidth = `${estimatedWidth + 260}px`;
});
```

```css
/* CSS에 transition 복원 */
.profile-slot {
    transition: min-width 1s ease-out, opacity 0.3s ease;
}
```

**옵션 B: 최대 너비로 고정 + 텍스트만 동적**
- 모든 슬롯을 가장 긴 메시지 기준으로 고정
- 짧은 메시지는 좌측 정렬로 표시
- 장점: 덜컥거림 완전 제거
- 단점: 동적 느낌 상실, 공간 낭비

**옵션 C: 고정 폭 슬롯 + 텍스트 overflow**
- 슬롯 너비를 고정 (예: 1000px)
- 긴 메시지는 말줄임표(...) 또는 애니메이션 스크롤
- 장점: 레이아웃 안정적
- 단점: 메시지 일부 잘림

---

### 🟡 Priority 2: 노출 시간 확대 및 다양화

**현재 설정:**
```javascript
// 6.0~10.8초 (0.2초 간격)
const SLOT_DISPLAY_TIMES = {
    0: 6000,    // 6.0s
    1: 7600,    // 7.6s
    2: 9400,    // 9.4s
    ...
    24: 10000   // 10.0s
};
```

**요구사항:**
- 전반적으로 문장 노출 시간을 늘려야 함
- **약 1.5배로 수정** 필요
- 슬롯마다 교체되는 초 수를 더 다양하게

**제안 수정:**
```javascript
// 9.0~16.2초 (1.5배, 간격 유지 또는 확대)
const SLOT_DISPLAY_TIMES = {
    // 옵션 1: 1.5배 × 0.2초 간격 = 0.3초 간격
    0: 9000,    // 9.0s  (6.0 × 1.5)
    1: 11400,   // 11.4s (7.6 × 1.5)
    2: 14100,   // 14.1s (9.4 × 1.5)
    3: 12300,   // 12.3s (8.2 × 1.5)
    ...

    // 옵션 2: 더 다양하게 (0.5초 간격)
    0: 9000,    // 9.0s
    1: 11500,   // 11.5s
    2: 14500,   // 14.5s
    3: 12500,   // 12.5s
    ...
};
```

**영향 분석:**
- **현재 1사이클**: 평균 ~8초 × 25슬롯 = ~200초 (3분 20초)
- **1.5배 후**: 평균 ~12초 × 25슬롯 = ~300초 (5분)
- 전체 106명 노출 시간도 1.5배 증가

---

## 🔧 기술적 고려사항

### Issue 1-1 해결을 위한 코드 수정 위치

**파일:** `script-v3.js`

**수정 대상 함수:** `transitionProfile(slotNumber)` (lines 193-307)

**현재 문제 코드:**
```javascript
// 2단계: 데이터 교체 (line 266)
allElements.forEach(({ slot, imageWrapper, image, nickname, message, underbar }) => {
    // ...
    slot.style.minWidth = `${estimatedWidth + 260}px`; // ⚠️ 즉시 변경 → 덜컥!
    // ...
});

// 3단계: fade-in (line 299)
allElements.forEach(({ imageWrapper, image, nickname, message, underbar }) => {
    // fade-in만 처리, 너비는 이미 변경됨
});
```

**수정 방향:**
```javascript
// 2단계: 데이터 교체
allElements.forEach(({ slot, imageWrapper, image, nickname, message, underbar }) => {
    // ... (기존 코드)
    // slot.style.minWidth 여기서는 변경 안 함! (나중으로 지연)
});

// 3단계: fade-in과 동시에 너비 변경
allElements.forEach(({ slot, imageWrapper, image, nickname, message, underbar }) => {
    // ... (inline style 제거)

    // fade-in 클래스 추가
    imageWrapper.classList.add('fade-in');
    nickname.classList.add('wipe-in');
    message.classList.add('wipe-in');
    underbar.classList.add('wipe-in');

    // 🎯 너비 변경 (wipe-in과 동시에 시작)
    slot.style.minWidth = `${estimatedWidth + 260}px`;
});
```

**CSS 수정:**
```css
/* styles-v3.css */
.profile-slot {
    flex-shrink: 0;
    min-width: 0;
    opacity: 0;
    /* 너비 변경을 1초 동안 부드럽게 (wipe-in과 동기화) */
    transition: min-width 1s ease-out, opacity 0.3s ease;
}
```

---

### Issue 2 해결을 위한 코드 수정

**파일:** `script-v3.js`

**수정 대상:**
1. `SLOT_DISPLAY_TIMES` 객체 (lines 22-52)
2. `SLOT_PROFILE_COUNTS` 업데이트 (필요 시)

**계산식:**
```javascript
// 기존 값에 1.5 곱하기
const originalTimes = {
    0: 6000, 1: 7600, 2: 9400, 3: 8200, 4: 6400,
    5: 7800, 6: 9800, 7: 6800, 8: 8600, 9: 10400,
    10: 7200, 11: 9600, 12: 6200, 13: 8800, 14: 10800,
    15: 8000, 16: 10200, 17: 7000, 18: 9200, 19: 6600,
    20: 10600, 21: 8400, 22: 7400, 23: 9000, 24: 10000
};

const SLOT_DISPLAY_TIMES = {};
Object.keys(originalTimes).forEach(slot => {
    SLOT_DISPLAY_TIMES[slot] = Math.round(originalTimes[slot] * 1.5);
});

// 결과:
// 0: 9000, 1: 11400, 2: 14100, 3: 12300, 4: 9600,
// 5: 11700, 6: 14700, 7: 10200, 8: 12900, 9: 15600,
// ...
```

**프로필 개수 재조정 (선택):**
- 노출 시간이 길어지면서 짧은/긴 슬롯 구분 기준 변경 가능
- 예: 9~10.5초(5명), 10.5~16.2초(4명)

---

## 📊 예상 개선 효과

### Before (현재)
- ❌ 덜컥거리는 레이아웃 이동
- ⚡ 빠른 전환 (평균 8초)
- 😵 어지러운 시각 경험

### After (개선 후)
- ✅ 부드러운 레이아웃 전환
- 🐌 여유로운 전환 (평균 12초)
- 😌 편안한 시각 경험

---

## ✅ 실행 계획

1. **Phase 1: 노출 시간 1.5배 확대** (쉬움)
   - [ ] `SLOT_DISPLAY_TIMES` 값 × 1.5
   - [ ] 테스트 및 검증

2. **Phase 2: 슬롯 너비 전환 개선** (중간)
   - [ ] `transitionProfile()` 함수 수정
   - [ ] CSS transition 복원
   - [ ] 타이밍 동기화 테스트

3. **Phase 3: 최종 검증** (중요)
   - [ ] 다양한 메시지 길이 조합 테스트
   - [ ] 성능 프로파일링
   - [ ] 사용자 피드백 수렴

---

## 💡 추가 논의 사항

1. **노출 시간 범위**
   - 현재 제안: 9~16.2초 (1.5배)
   - 대안: 10~15초 (더 좁은 범위)
   - 대안: 8~18초 (더 넓은 범위)

2. **너비 전환 방식**
   - 제안: wipe-in과 동시에 transition
   - 대안: 최대 너비 고정
   - 대안: 가변 너비 + 스무스 애니메이션

3. **프로필 개수 재분배**
   - 짧은 시간 슬롯: 5명 유지?
   - 긴 시간 슬롯: 4명 → 3명?
   - 전체 균형 재조정 필요성

---

작성일: 2025-11-17
작성자: 사용자 피드백 기반
