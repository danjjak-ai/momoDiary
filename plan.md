# Danjjak Android App Implementation Plan

작성일: 2026-05-02
기준 문서: `researchMerge.md`
목적: AI 캐릭터 + 페르소나 + 교환일기 모바일 앱을 Android 앱으로 구현하기 위한 단계별 개발 계획
핵심 원칙: 기능별 독립 구현, 작은 테스트 게이트, 테스트 통과 후 다음 기능 진행, 토큰 사용량과 디버깅 범위 최소화

---

## 0. 개발 방식 요약

이 프로젝트는 “한 번에 전체 앱을 만드는 방식”이 아니라, 기능 단위를 매우 작게 나누고 각 단위마다 테스트를 먼저 또는 동시에 작성한 뒤, 모든 테스트가 통과해야 다음 기능으로 넘어가는 방식으로 구현한다.

기본 루프는 항상 같다.

1. 현재 단계의 파일만 연다.
2. 도메인 모델 또는 순수 로직을 먼저 구현한다.
3. 해당 기능의 단위 테스트를 작성한다.
4. 테스트를 실행한다.
5. 실패하면 현재 단계 파일 안에서만 수정한다.
6. 테스트가 완전히 통과하면 UI 또는 다음 계층으로 연결한다.
7. 단계 종료 시 변경 파일과 테스트 결과를 기록한다.

금지 원칙:

- 여러 기능을 한 번에 구현하지 않는다.
- UI, DB, AI Gateway, 안전 필터를 한 PR/한 세션에서 동시에 바꾸지 않는다.
- 테스트가 깨진 상태로 다음 기능을 시작하지 않는다.
- 기존 센서/식단/식당 추천 기능은 MVP 핵심 흐름이 끝나기 전 확장하지 않는다.
- AI 응답 품질 문제를 UI 코드에서 임시 문자열로 해결하지 않는다.

---

## 1. 목표 제품 범위

MVP는 다음 기능만 완성한다.

- 게스트/소셜 로그인 진입 구조
- 연령 모드 선택
- 동의 화면
- 캐릭터 생성 및 다중 캐릭터 선택 (반달곰, 기린, 코알라, 토끼, 드래곤 등)
- 페르소나 선택: 친구, 가족, 선생님, 멘토
- 말투 선택
- 기본 아바타 파츠 선택
- 기본 패턴 선택과 색상 변경
- 오늘의 감정 선택
- 한 줄 교환일기 작성
- AI 추가 질문 1개 생성
- AI 답장 생성
- 일기 저장/조회
- 날짜별 일기 목록 또는 캘린더
- 기억 후보 제안/승인/삭제
- 기본 안전 필터
- Mock AI Gateway 우선, 이후 실제 Gemini Gateway 연결

MVP에서 제외한다.

- 캐릭터 간 그룹챗
- 사람과 함께 쓰는 공유 일기
- 커뮤니티 패턴 공유
- 음성 통화
- AR/3D 아바타
- 실제 LoRA 파인튜닝
- 완전한 FCM 푸시
- 자동 위치/앱 사용 센서 수집
- 식단/식당 추천

---

## 2. 권장 아키텍처

Android 앱은 기능별 독립성을 위해 `feature-first + domain-first` 구조를 사용한다.

```text
frontend/app/src/main/java/com/danjjak/
  app/
    MainActivity.kt
    DanjjakApp.kt
    navigation/
      AppRoute.kt
      AppNavHost.kt
  core/
    model/
    design/
    result/
    time/
    testing/
  data/
    local/
      DanjjakDatabase.kt
      dao/
      entity/
      mapper/
    repository/
    ai/
      AiGateway.kt
      MockAiGateway.kt
      RemoteAiGateway.kt
    safety/
      SafetyClassifier.kt
      CrisisPolicy.kt
  domain/
    character/
    diary/
    memory/
    pattern/
    persona/
    safety/
    onboarding/
  feature/
    onboarding/
    home/
    character/
    diary/
    memory/
    settings/
```

테스트 위치:

```text
frontend/app/src/test/java/com/danjjak/
  domain/
  data/
  feature/

frontend/app/src/androidTest/java/com/danjjak/
  data/
  feature/
```

원칙:

- `domain`은 Android 의존성이 없는 순수 Kotlin으로 유지한다.
- `data`는 Room, AI Gateway, repository 구현을 담당한다.
- `feature`는 ViewModel과 Compose UI만 담당한다.
- UI는 도메인 규칙을 직접 판단하지 않는다.
- AI Gateway 응답은 항상 JSON DTO로 받고, 파싱/검증 로직은 별도 테스트한다.

---

## 3. KV Cache와 토큰 사용량 최적화 규칙

vibe coding으로 구현할 때 매 단계마다 전체 코드베이스를 읽지 않는다. 아래의 “컨텍스트 팩”만 사용한다.

### 3.1 공통 컨텍스트 팩

모든 단계에서 필요한 최소 파일:

- `plan.md`
- 현재 단계에서 수정할 파일 목록
- 현재 단계 테스트 파일
- 실패한 테스트 로그

### 3.2 단계별 컨텍스트 제한

| 단계 | 열어야 할 파일 | 열지 말아야 할 파일 |
|---|---|---|
| 도메인 모델 | 해당 `domain/*` 파일과 테스트 | Compose UI, Room DB, AI Gateway |
| Room 저장 | entity/dao/database/repository 테스트 | 화면 UI 전체 |
| AI Gateway | gateway interface/mock/DTO/parser 테스트 | Compose UI, Room 전체 |
| UI 화면 | 해당 feature UI/ViewModel/test | 다른 feature 화면 |
| Navigation | app navigation 파일과 route 테스트 | 도메인 내부 구현 전체 |
| 안전 필터 | safety domain/data/test | 일기 UI 전체 |

### 3.3 세션 단위 작업 규칙

각 구현 세션은 다음 형식으로 시작한다.

```text
현재 단계: Step N - 기능명
목표: 한 문장
수정 허용 파일: n개
테스트 명령: ./gradlew testDebugUnitTest 또는 해당 모듈 테스트
완료 조건: 테스트 n개 통과 + 앱 빌드 통과
```

각 세션 종료 보고는 다음 형식으로 남긴다.

```text
완료 단계: Step N
변경 파일:
테스트:
남은 리스크:
다음 단계:
```

### 3.4 디버깅 규칙

- 테스트 실패 1개마다 원인을 하나만 가정하고 수정한다.
- 같은 실패를 3회 이상 반복하면 테스트 기대값과 요구사항을 다시 확인한다.
- UI snapshot 문제가 아닌 도메인 실패는 UI 파일을 열지 않는다.
- Room migration 실패는 DAO 테스트와 schema만 본다.
- AI 응답 테스트 실패는 prompt가 아니라 DTO/parser/validator부터 본다.

---

## 4. 테스트 전략

### 4.1 테스트 피라미드

1. Domain unit test: 가장 많이 작성한다.
2. Repository unit test: fake DAO 또는 in-memory DB로 작성한다.
3. Room instrumentation test: 핵심 DAO만 검증한다.
4. ViewModel unit test: 상태 전이와 이벤트 처리 검증.
5. Compose UI test: 핵심 유저 플로우만 작성한다.
6. End-to-end smoke test: MVP 완료 후 1-2개만 작성한다.

### 4.2 테스트 명령

프로젝트 구조에 맞게 최종 확정하되, 기본 명령은 다음을 사용한다.

```bash
./gradlew :app:testDebugUnitTest
./gradlew :app:connectedDebugAndroidTest
./gradlew :app:assembleDebug
```

Windows PowerShell에서는 다음 형태를 사용한다.

```powershell
.\gradlew.bat :app:testDebugUnitTest
.\gradlew.bat :app:assembleDebug
```

### 4.3 다음 단계 진입 게이트

각 단계 완료 조건:

- 새로 추가한 단위 테스트 100% 통과
- 기존 단위 테스트 100% 통과
- `assembleDebug` 성공
- lint 또는 ktlint가 있으면 해당 검사 통과
- 테스트가 flaky하면 해당 단계 완료로 인정하지 않음

---

## 5. 단계별 구현 계획

## Step 1. 프로젝트 기준선 확인과 테스트 하네스 정리

목표: 현재 Android 프로젝트가 빌드/테스트 가능한 상태인지 확인하고, 이후 기능 테스트를 추가할 기반을 만든다.

수정 범위:

- `frontend/app/build.gradle`
- `frontend/build.gradle` 또는 루트 Gradle 설정
- `frontend/app/src/test/...`
- 필요 시 `core/testing` 패키지

구현 작업:

1. 현재 Gradle 구조를 확인한다.
2. JUnit, kotlinx-coroutines-test, Turbine, Room testing, Compose UI test 의존성을 확인한다.
3. 테스트 실행 명령을 README 또는 plan 체크리스트에 맞게 확정한다.
4. `TestCoroutineRule` 또는 `MainDispatcherRule`을 추가한다.
5. 빈 smoke unit test 1개를 추가한다.

테스트:

- `BuildSmokeTest` 작성
- `MainDispatcherRuleTest` 작성

완료 조건:

- `:app:testDebugUnitTest` 통과
- `:app:assembleDebug` 통과

다음 단계로 넘어가기 전 확인:

- 테스트 명령이 확정되었는가?
- 실패 로그 없이 빌드 가능한가?

---

## Step 2. 핵심 도메인 모델 정의

목표: 앱 전체에서 공유할 순수 Kotlin 모델을 먼저 고정한다.

수정 범위:

- `core/model/*`
- `domain/persona/*`
- `domain/character/*`
- `domain/diary/*`
- `domain/memory/*`
- `domain/pattern/*`
- 각 도메인 테스트

구현 모델:

- `AgeMode`: `ChildWithGuardian`, `Teen`, `Adult`
- `ConsentState`
- `PersonaType`: `Friend`, `Family`, `Teacher`, `Mentor`
- `SpeechStyle`
- `CharacterProfile`
- `VisualParts`
- `PatternDesign`
- `DiaryEntry`
- `DiaryQuestionAnswer`
- `MemoryItem`
- `SafetyLevel`: `Normal`, `Sensitive`, `Crisis`

구현 규칙:

- 모든 모델은 nullable을 최소화한다.
- ID는 일단 `String`으로 통일한다.
- 날짜는 `LocalDate` 또는 epoch millis 중 하나로 통일한다. Android API 호환성을 고려해 kotlinx-datetime 또는 epoch millis를 검토한다.
- UI 텍스트는 enum 내부에 넣지 않는다. 리소스 매핑은 UI 계층에서 처리한다.

테스트:

- `CharacterProfileTest`: 기본 캐릭터 생성 값 검증
- `DiaryEntryTest`: 필수 값 없는 일기 생성 방지
- `PatternDesignTest`: palette/pixels 크기 검증
- `ConsentStateTest`: 필수 동의 계산 검증

완료 조건:

- 도메인 테스트 전체 통과
- Android 의존성 없이 JVM unit test로 실행 가능

---

## Step 3. 도메인 정책과 Validator 구현

목표: UI와 DB에 흩어지기 쉬운 규칙을 순수 도메인 정책으로 고립한다.

수정 범위:

- `domain/onboarding/*`
- `domain/persona/*`
- `domain/diary/*`
- `domain/pattern/*`
- `domain/safety/*`
- 테스트 파일

구현 작업:

1. `AgeModePolicy`
   - Teen 모드에서 로맨틱/성적 페르소나 제한
   - Child 모드에서 보호자 동의 요구
2. `PersonaPolicy`
   - 페르소나별 답변 목적, 금지 규칙, 질문 전략 정의
3. `DiaryValidator`
   - mood 1개 이상
   - eventText 최소 길이
   - AI 답장 2-5문장 규칙 검증
4. `PatternValidator`
   - canvasSize는 16 또는 32
   - palette는 2-8색
   - pixel index가 palette 범위를 벗어나지 않음
5. `MemoryPolicy`
   - sensitive 타입 자동 저장 금지
   - userApproved 없는 기억 저장 금지

테스트:

- `AgeModePolicyTest`
- `PersonaPolicyTest`
- `DiaryValidatorTest`
- `PatternValidatorTest`
- `MemoryPolicyTest`

완료 조건:

- 정책 테스트 통과
- feature/UI 코드에서 동일 규칙을 중복 구현하지 않기로 확정

---

## Step 4. 로컬 DB 스키마 설계

목표: Character, DiaryEntry, Memory, Pattern을 Room에 독립적으로 저장할 수 있게 한다.

수정 범위:

- `data/local/entity/*`
- `data/local/dao/*`
- `data/local/mapper/*`
- `data/local/DanjjakDatabase.kt`
- Room 테스트

구현 엔티티:

- `CharacterEntity`
- `DiaryEntryEntity`
- `DiaryQuestionAnswerEntity` 또는 JSON column 전략
- `MemoryEntity`
- `PatternEntity`
- `UserSettingsEntity`

권장 설계:

- MVP에서는 복잡한 nested list를 JSON string으로 저장해 migration 비용을 줄인다.
- mapper에서 JSON 직렬화/역직렬화를 담당한다.
- schema version은 명확히 올리고 exportSchema 정책을 정한다.

DAO:

- `CharacterDao`
- `DiaryDao`
- `MemoryDao`
- `PatternDao`
- `UserSettingsDao`

테스트:

- in-memory Room DB로 DAO 테스트
- insert/get/update/delete 검증
- 날짜별 Diary 조회 검증
- 캐릭터별 Memory 조회 검증
- Pattern 저장 슬롯 제한은 repository 또는 domain에서 검증

완료 조건:

- Room instrumentation 또는 Robolectric 테스트 통과
- mapper round-trip 테스트 통과
- 기존 DB와 충돌 없거나 migration 계획 명시

---

## Step 5. Repository 계층 구현

목표: UI/ViewModel이 DAO나 AI Gateway를 직접 만지지 않도록 repository 경계를 만든다.

수정 범위:

- `data/repository/*`
- `domain/*Repository.kt` interface
- fake repository 테스트

Repository 목록:

- `OnboardingRepository`
- `CharacterRepository`
- `DiaryRepository`
- `MemoryRepository`
- `PatternRepository`
- `SettingsRepository`

구현 규칙:

- domain에 interface를 두고 data에서 구현한다.
- ViewModel은 interface만 의존한다.
- 테스트에서는 fake repository를 사용한다.
- repository는 Flow를 반환하되, 단발성 저장은 suspend 함수로 둔다.

테스트:

- `CharacterRepositoryTest`: 생성/수정/현재 캐릭터 조회
- `DiaryRepositoryTest`: 일기 저장/날짜별 조회
- `MemoryRepositoryTest`: 승인/삭제/민감 기억 차단
- `PatternRepositoryTest`: 패턴 저장/적용 대상 업데이트

완료 조건:

- repository 테스트 통과
- UI 없는 상태에서 MVP 데이터 흐름이 재현 가능

---

## Step 6. 안전 필터와 위기 플로우 로직

목표: AI 호출 전후에 적용할 안전 분류와 위기 응답 정책을 먼저 완성한다.

수정 범위:

- `domain/safety/*`
- `data/safety/*`
- 테스트 파일

구현 작업:

1. `SafetyClassifier` interface 정의
2. `KeywordSafetyClassifier` MVP 구현
3. `CrisisPolicy` 구현
4. `SafetyResponseBuilder` 구현
5. Teen/Child 모드에서 더 엄격한 threshold 적용

분류 결과:

- `Normal`
- `Sensitive`
- `Crisis`

위기 응답 필수 요소:

- 일반 캐릭터 답장 중단
- 즉시 도움 안내
- 한국 기준 112/119/109 안내
- 장기 기억 자동 저장 금지

테스트:

- 자해 표현 crisis 분류
- 폭력 표현 crisis 분류
- 가벼운 고민 normal 또는 sensitive 분류
- crisis에서는 AI Gateway 호출하지 않음
- crisis memoryCandidates는 빈 배열

완료 조건:

- 안전 테스트 통과
- Diary/Chat 기능이 이 classifier를 사용하도록 다음 단계에서 연결 가능

---

## Step 7. AI Gateway 계약과 Mock 구현

목표: 실제 Gemini 연결 전에 앱 전체가 안정적으로 동작하도록 Mock AI Gateway를 완성한다.

수정 범위:

- `data/ai/AiGateway.kt`
- `data/ai/MockAiGateway.kt`
- `data/ai/model/*`
- `domain/diary/GenerateDiaryReplyUseCase.kt`
- 테스트 파일

AI 요청 DTO:

- ageMode
- characterName
- personaType
- speechStyle
- moods
- eventText
- questionAnswers
- approvedMemories
- safetyPolicy

AI 응답 DTO:

- reply
- followUpQuestion
- memoryCandidates
- safetyLevel
- suggestedAction

구현 작업:

1. `AiGateway` interface 정의
2. `MockAiGateway`가 페르소나별 다른 질문/답장 반환
3. 응답 validator 작성
4. safetyLevel이 crisis면 mock 답장을 생성하지 않도록 use case에서 차단
5. JSON 파싱/검증은 실제 Remote 단계 전 미리 테스트

테스트:

- 친구 페르소나는 공감형 질문 생성
- 가족 페르소나는 생활 루틴 질문 생성
- 선생님 페르소나는 학습 회고 질문 생성
- 멘토 페르소나는 다음 행동 질문 생성
- 응답이 2-5문장 규칙을 만족
- memoryCandidates는 사용자 승인 전 저장되지 않음

완료 조건:

- AI Gateway 테스트 통과
- 네트워크 없이 일기 작성 플로우 구현 가능

---

## Step 8. Onboarding 상태 머신 구현

목표: 로그인 → 연령 모드 → 동의 → 캐릭터 생성 필요 여부를 독립 상태 머신으로 구현한다.

수정 범위:

- `domain/onboarding/*`
- `feature/onboarding/OnboardingViewModel.kt`
- `feature/onboarding/*Screen.kt`
- 테스트 파일

상태:

- `NotStarted`
- `LoginRequired`
- `AgeModeRequired`
- `ConsentRequired`
- `CharacterRequired`
- `Ready`

구현 작업:

1. `ResolveStartupDestinationUseCase` 작성
2. Guest login 저장
3. AgeMode 저장
4. Consent 저장
5. Character 존재 여부 확인
6. ViewModel 이벤트 처리

테스트:

- 첫 실행은 `LoginRequired`
- 로그인 후 연령 미설정이면 `AgeModeRequired`
- 연령 후 동의 없으면 `ConsentRequired`
- 동의 후 캐릭터 없으면 `CharacterRequired`
- 캐릭터 있으면 `Ready`

완료 조건:

- ViewModel 상태 전이 테스트 통과
- UI는 아직 단순해도 됨

---

## Step 9. 앱 내비게이션 재구성

목표: 하단 탭 4개와 온보딩 플로우를 연결하되, 각 feature 화면은 placeholder로 시작한다.

수정 범위:

- `app/navigation/AppRoute.kt`
- `app/navigation/AppNavHost.kt`
- `app/DanjjakApp.kt`
- `MainActivity.kt`
- route 테스트 또는 ViewModel 테스트

하단 탭:

- Home
- Diary
- Character
- Memory

구현 작업:

1. Route sealed class 정의
2. Onboarding route와 Main tab route 분리
3. 하단 탭 placeholder 화면 구현
4. 기존 dashboard/registration/timeline 화면은 즉시 삭제하지 말고 새 route 밖으로 분리 또는 deprecated 처리

테스트:

- Startup state에 따라 올바른 route 결정
- Main tab route 목록이 4개인지 검증
- tab 선택 상태 유지 검증

완료 조건:

- `assembleDebug` 통과
- placeholder 앱 실행 가능

---

## Step 10. 캐릭터 생성 도메인과 ViewModel

목표: UI와 무관하게 캐릭터 생성 플로우를 완성한다.

수정 범위:

- `domain/character/CreateCharacterUseCase.kt`
- `domain/persona/*`
- `feature/character/create/CharacterCreateViewModel.kt`
- 테스트 파일

입력 단계:

1. 이름
2. baseType
3. personaType
4. speechStyle
5. visualParts
6. patternSlots

구현 작업:

- 이름 validation
- persona 선택 validation
- Teen/Child 정책 반영
- 기본 visualParts 제공
- 기본 patternSlots 제공
- 저장 후 currentCharacter로 설정

테스트:

- 정상 캐릭터 생성
- 빈 이름 차단
- Teen 모드에서 제한 페르소나 차단
- 기본 파츠 누락 없음
- 생성 후 repository에 저장됨

완료 조건:

- 캐릭터 생성 도메인/ViewModel 테스트 통과

---

## Step 11. 캐릭터 생성 UI

목표: 캐릭터 생성 화면을 구현하고 ViewModel과 연결한다.

수정 범위:

- `feature/character/create/CharacterCreateScreen.kt`
- `feature/character/create/components/*`
- Compose UI test

화면 구성:

- 이름 입력
- 페르소나 segmented control
- 말투 선택 chips
- 기본 아바타 미리보기
- 다음/완료 버튼

구현 규칙:

- 처음에는 한 화면 또는 간단한 stepper로 구현한다.
- 복잡한 애니메이션은 넣지 않는다.
- 캐릭터 미리보기는 파츠 ID를 바탕으로 단순 2D Compose drawing 또는 placeholder component로 시작한다.

테스트:

- 이름 입력 시 완료 버튼 활성화
- 페르소나 선택 반영
- 완료 클릭 시 저장 이벤트 호출
- validation error 표시

완료 조건:

- Compose UI test 통과
- 캐릭터 생성 후 Home으로 이동

---

## Step 12. 패턴 도메인과 기본 패턴 MVP

목표: 동물의 숲 감성의 패턴 커스터마이즈 기반을 만들되, MVP에서는 기본 패턴+색상 변경으로 제한한다.

수정 범위:

- `domain/pattern/*`
- `data/repository/PatternRepositoryImpl.kt`
- `feature/character/pattern/PatternViewModel.kt`
- 테스트 파일

구현 작업:

1. 기본 패턴 seed 정의
   - check
   - stripe
   - star
   - flower
   - note
   - pixel
   - fabric
2. palette 변경 use case
3. repeatMode 정의
4. appliedTarget 정의
5. 패턴 저장 슬롯 12개 제한

테스트:

- 기본 패턴 목록 반환
- palette 변경 후 pixel index 유지
- canvasSize validation
- 12개 초과 저장 차단
- outfitTop/diaryPaper/roomWallpaper target 적용 검증

완료 조건:

- 패턴 도메인/repository/ViewModel 테스트 통과

---

## Step 13. 패턴 커스터마이즈 UI

목표: 기본 패턴 선택, 색상 변경, 캐릭터/일기지 적용 화면을 구현한다.

수정 범위:

- `feature/character/pattern/PatternCustomizeScreen.kt`
- `feature/character/pattern/components/*`
- Compose UI test

화면 구성:

- 패턴 리스트
- 색상 팔레트
- 적용 대상 선택: 의상, 방 벽지, 일기지
- 미리보기
- 저장 버튼

테스트:

- 패턴 선택 시 미리보기 변경
- 색상 변경 시 palette 상태 변경
- 적용 대상 선택 저장
- 슬롯 초과 에러 표시

완료 조건:

- UI 테스트 통과
- 캐릭터 생성/수정 화면에서 패턴 화면으로 진입 가능

---

## Step 14. Home 화면 ViewModel

목표: 현재 캐릭터, 오늘 질문, 최근 답장을 보여주는 홈 상태를 만든다.

수정 범위:

- `feature/home/HomeViewModel.kt`
- `domain/home/*` 필요 시
- 테스트 파일

Home 상태:

- currentCharacter
- todayQuestion
- todayDiaryStatus: none/draft/completed
- recentReply
- safetyModeLabel

구현 작업:

- 캐릭터 없으면 CharacterRequired 상태
- 오늘 일기 없으면 오늘 질문 생성
- 오늘 일기 있으면 최근 답장 표시
- 빠른 일기 작성 이벤트 route 생성

테스트:

- 캐릭터 없을 때 empty state
- 오늘 일기 없을 때 질문 노출
- 일기 완료 후 reply 노출
- 빠른 작성 클릭 이벤트 검증

완료 조건:

- Home ViewModel 테스트 통과

---

## Step 15. Home UI

목표: 사용자가 앱을 열면 단짝과 오늘의 질문이 바로 보이도록 구현한다.

수정 범위:

- `feature/home/HomeScreen.kt`
- `feature/home/components/*`
- Compose UI test

화면 구성:

- 캐릭터 미리보기
- 오늘의 질문 카드
- “오늘 일기 쓰기” 버튼
- “단짝에게 묻기” 버튼
- 최근 답장 카드

테스트:

- 오늘 질문 표시
- 일기 쓰기 버튼 클릭 route
- 단짝에게 묻기 버튼 클릭 route
- 최근 답장 표시

완료 조건:

- UI 테스트 통과
- 하단 탭에서 Home 정상 표시

---

## Step 16. 교환일기 작성 도메인

목표: 감정 선택 → 한 줄 기록 → AI 질문 → 답장 생성 → 저장 흐름을 순수 UseCase로 구현한다.

수정 범위:

- `domain/diary/StartDiaryUseCase.kt`
- `domain/diary/GenerateFollowUpQuestionUseCase.kt`
- `domain/diary/GenerateDiaryReplyUseCase.kt`
- `domain/diary/SaveDiaryEntryUseCase.kt`
- 테스트 파일

구현 작업:

1. mood 선택 validation
2. eventText validation
3. 안전 분류
4. normal이면 AI Gateway 호출
5. crisis이면 CrisisPolicy 응답 반환
6. memoryCandidates는 저장하지 않고 후보로만 반환
7. 최종 저장

테스트:

- mood 없으면 진행 불가
- eventText 짧으면 진행 불가
- normal 입력은 AI 답장 생성
- crisis 입력은 AI 호출 없이 crisis response
- 저장 후 DiaryEntry 조회 가능

완료 조건:

- 교환일기 use case 테스트 통과

---

## Step 17. 교환일기 작성 ViewModel

목표: 작성 화면의 상태 전이를 구현한다.

수정 범위:

- `feature/diary/write/DiaryWriteViewModel.kt`
- 테스트 파일

상태:

- `MoodSelect`
- `EventInput`
- `FollowUpQuestion`
- `GeneratingReply`
- `ReplyReady`
- `Saved`
- `Crisis`
- `Error`

이벤트:

- mood selected
- text changed
- request question
- answer follow-up
- generate reply
- save diary
- approve memory candidate later

테스트:

- 상태 순서 검증
- 로딩 중 중복 클릭 방지
- AI 오류 시 Error 상태
- crisis 입력 시 Crisis 상태
- save 후 Saved 상태

완료 조건:

- ViewModel 테스트 통과

---

## Step 18. 교환일기 작성 UI

목표: 90초 안에 작성 가능한 모바일 UI를 구현한다.

수정 범위:

- `feature/diary/write/DiaryWriteScreen.kt`
- `feature/diary/write/components/*`
- Compose UI test

화면 구성:

- 감정 chips
- 한 줄 입력
- AI 질문 카드
- 답변 입력
- AI 답장 카드
- 저장 버튼
- 기억 후보 표시

테스트:

- 감정 선택 UI
- 텍스트 입력
- 질문 생성 버튼
- 답장 생성 로딩 표시
- 저장 완료 표시
- crisis 안내 표시

완료 조건:

- Compose UI test 통과
- Home에서 DiaryWrite로 이동 가능

---

## Step 19. 일기 조회와 날짜별 목록

목표: 저장된 교환일기를 날짜별로 볼 수 있게 한다.

수정 범위:

- `domain/diary/GetDiaryEntriesUseCase.kt`
- `feature/diary/list/DiaryListViewModel.kt`
- `feature/diary/list/DiaryListScreen.kt`
- 테스트 파일

구현 작업:

- 날짜별 entry 조회
- 최신순 목록
- 상세 보기 route
- empty state

테스트:

- 날짜별 조회 정렬
- empty state
- item click route
- detail 화면에 userFinalText/aiReply 표시

완료 조건:

- ViewModel + UI 테스트 통과

---

## Step 20. 기억 후보 승인/삭제 도메인

목표: AI가 제안한 memoryCandidates를 사용자가 통제하도록 구현한다.

수정 범위:

- `domain/memory/*`
- `data/repository/MemoryRepositoryImpl.kt`
- 테스트 파일

구현 작업:

- memory candidate를 pending 상태로 저장하거나 DiaryEntry 안에 보관
- approve 시 MemoryItem 생성
- sensitive 후보는 추가 확인 필요
- delete 시 완전 삭제
- pinned 지원은 MVP에서 optional

테스트:

- 승인 전에는 AI context에 포함되지 않음
- 승인 후에는 AI context에 포함됨
- 삭제 후 context에서 제외
- sensitive 자동 승인 차단

완료 조건:

- memory domain/repository 테스트 통과

---

## Step 21. 기억 관리 UI

목표: 사용자가 단짝이 기억하는 내용을 직접 보고 삭제할 수 있게 한다.

수정 범위:

- `feature/memory/MemoryViewModel.kt`
- `feature/memory/MemoryScreen.kt`
- Compose UI test

화면 구성:

- 승인된 기억 목록
- 기억 타입 라벨
- 삭제 버튼
- 민감 기억 안내
- 데이터 설정 진입

테스트:

- 기억 목록 표시
- 삭제 클릭 시 목록에서 제거
- empty state 표시
- sensitive 라벨 표시

완료 조건:

- UI 테스트 통과
- Diary reply에서 제안된 기억을 Memory 탭에서 승인/삭제 가능

---

## Step 22. 단짝에게 묻기 기능

목표: 일기와 별도로 질문을 하고, 답변을 오늘 일기에 붙일 수 있는 기반을 만든다.

수정 범위:

- `domain/diary/AskCharacterUseCase.kt`
- `feature/diary/ask/AskCharacterViewModel.kt`
- `feature/diary/ask/AskCharacterScreen.kt`
- 테스트 파일

구현 작업:

- 질문 입력 validation
- approved memories만 context에 포함
- safety classifier 적용
- AI Gateway 호출
- 답변 표시
- “오늘 일기에 붙이기”는 MVP에서 optional draft append로 구현

테스트:

- 질문 입력 후 답변 생성
- crisis 질문은 위기 플로우
- approved memory만 context 포함
- append 이벤트 검증

완료 조건:

- Ask 기능 테스트 통과

---

## Step 23. 연령 모드와 동의 UI 완성

목표: 안전 정책과 데이터 정책을 온보딩 UI에 명확하게 반영한다.

수정 범위:

- `feature/onboarding/AgeModeScreen.kt`
- `feature/onboarding/ConsentScreen.kt`
- `feature/settings/DataConsentScreen.kt`
- 테스트 파일

동의 항목:

- diaryStorage
- aiReply
- memory
- sensorHints
- modelImprovement

구현 규칙:

- MVP 필수: diaryStorage, aiReply
- memory는 opt-in
- sensorHints는 기본 off
- modelImprovement는 기본 off

테스트:

- 필수 동의 없으면 시작 버튼 비활성화
- Teen 선택 시 안전 모드 활성
- memory off이면 기억 승인 UI 비활성 또는 안내
- 동의 철회 시 관련 기능 제한

완료 조건:

- 온보딩 UI 테스트 통과

---

## Step 24. Remote Gemini Gateway 연결

목표: Mock AI Gateway 뒤에 실제 Gemini 호출을 붙이되, 앱의 나머지 기능은 변경하지 않는다.

수정 범위:

- `data/ai/RemoteAiGateway.kt`
- `data/ai/AiGatewayFactory.kt`
- backend가 있다면 `backend/src/services/aiGateway.service.ts`
- parser/contract 테스트

구현 방식 선택:

1. Android 앱이 기존 Node.js backend에 요청한다.
2. backend가 Gemini API를 호출한다.
3. 앱은 backend JSON 응답만 받는다.

권장 이유:

- 모바일 앱에 API key를 넣지 않는다.
- PII 마스킹과 safety policy를 backend에서 한 번 더 적용할 수 있다.
- Mock/Remote 전환이 쉬워진다.

요청/응답 계약:

- Request DTO는 Step 7의 AI 요청 DTO 유지
- Response DTO는 Step 7의 AI 응답 DTO 유지
- 실패 시 Mock fallback 또는 사용자 친화적 Error 상태

테스트:

- JSON serialization test
- invalid JSON 파싱 실패 처리
- network error 처리
- timeout 처리
- safetyLevel crisis 응답 처리

완료 조건:

- Remote 연결 없이도 Mock 테스트 통과
- Remote contract 테스트 통과
- API key 없는 환경에서도 앱 빌드 가능

---

## Step 25. 설정 화면과 데이터 삭제

목표: 프라이버시 우선 제품으로서 사용자의 통제권을 UI로 제공한다.

수정 범위:

- `feature/settings/*`
- `domain/settings/*`
- repository 테스트
- UI 테스트

기능:

- 동의 상태 보기/변경
- 일기 전체 삭제
- 기억 전체 삭제
- 패턴 삭제
- 로그아웃/게스트 초기화
- 앱 정보/AI 한계 안내

테스트:

- 기억 전체 삭제 후 context 비어 있음
- 일기 삭제 후 목록 empty
- 동의 철회 후 AI reply 기능 제한
- 로그아웃 후 onboarding으로 이동

완료 조건:

- 설정 기능 테스트 통과

---

## Step 26. 주간 편지 MVP+

목표: 누적된 일기를 바탕으로 주간 회고 편지를 생성한다. MVP 완료 후 진행한다.

수정 범위:

- `domain/weekly/*`
- `feature/memory/weekly/*`
- 테스트 파일

구현 작업:

- 최근 7일 일기 조회
- mood count
- keyword 간단 추출
- approved memories만 사용
- Mock AI Gateway로 letter 생성

테스트:

- 7일 데이터 집계
- 민감 기억 제외
- 감정 점수 단정 표현 금지 validator
- empty week 처리

완료 조건:

- MVP 핵심 테스트 전체 통과 후에만 시작

---

## Step 27. 알림 MVP+

목표: 오늘의 질문 리마인더를 로컬 알림으로 제공한다. MVP 완료 후 진행한다.

수정 범위:

- `data/notification/*`
- `feature/settings/NotificationSettingsScreen.kt`
- 테스트 파일

구현 작업:

- 알림 시간 설정
- Android 13+ notification permission 처리
- WorkManager 또는 AlarmManager 선택
- 푸시 문구는 캐릭터 이름 기반으로 생성

테스트:

- 알림 설정 저장
- permission denied 처리
- schedule/cancel 호출 검증

완료 조건:

- 핵심 MVP 완료 후 구현

---

## 6. Feature별 독립성 매트릭스

| Feature | Domain | Data | UI | AI | Safety | 독립 테스트 가능 여부 |
|---|---|---|---|---|---|---|
| Onboarding | 있음 | settings repo | 있음 | 없음 | age policy | 가능 |
| Character | 있음 | character repo | 있음 | 없음 | age policy | 가능 |
| Pattern | 있음 | pattern repo | 있음 | 없음 | 없음 | 가능 |
| Diary | 있음 | diary repo | 있음 | 있음 | 있음 | 가능 |
| Memory | 있음 | memory repo | 있음 | AI 후보 사용 | sensitivity policy | 가능 |
| Ask | 있음 | optional diary repo | 있음 | 있음 | 있음 | 가능 |
| Settings | 있음 | all repos | 있음 | 없음 | consent policy | 가능 |
| Weekly | 있음 | diary/memory repo | 있음 | 있음 | 있음 | MVP+ |

---

## 7. 파일 변경 단위 규칙

각 단계에서 권장 최대 변경 파일 수:

- 도메인 단계: 5-10개
- repository 단계: 6-12개
- UI 단계: 3-8개
- navigation 단계: 3-5개
- AI Gateway 단계: 4-8개

파일이 이보다 늘어나면 단계를 더 쪼갠다.

예시:

- `DiaryWriteScreen`과 `DiaryListScreen`은 같은 단계에서 구현하지 않는다.
- `PatternValidator`와 `PatternCustomizeScreen`은 같은 단계에서 구현하지 않는다.
- `RemoteAiGateway`와 `DiaryWriteViewModel`은 같은 단계에서 수정하지 않는다.

---

## 8. PR/커밋 단위 제안

각 Step은 1개 PR 또는 1개 커밋 후보가 된다.

권장 커밋 메시지:

```text
feat(domain): add core Danjjak models
feat(data): add room storage for diary and memory
feat(character): implement character creation flow
feat(pattern): add pattern customization MVP
feat(diary): implement exchange diary generation flow
feat(memory): add user-approved memory manager
test(safety): cover crisis policy and teen constraints
```

---

## 9. Definition of Done

MVP 전체 완료 조건:

- 첫 실행부터 캐릭터 생성까지 완료 가능
- 캐릭터 생성 후 홈 진입 가능
- 오늘의 감정과 한 줄 기록으로 교환일기 작성 가능
- AI 질문과 AI 답장 표시 가능
- 일기 저장 후 날짜별 조회 가능
- 기억 후보 승인/삭제 가능
- 패턴 선택/색상 변경/적용 가능
- Teen 모드 안전 제한 적용
- crisis 표현 입력 시 위기 플로우 작동
- Mock AI Gateway만으로 전체 플로우 동작
- 모든 unit test 통과
- 핵심 Compose UI test 통과
- `assembleDebug` 통과

---

## 10. MVP 이후 작업 순서

MVP가 안정화된 뒤 다음 순서로 확장한다.

1. Remote Gemini Gateway 실제 연결
2. 주간 편지
3. 로컬 알림
4. 고급 패턴 에디터 16x16
5. 보호자/가족 공유 모드
6. 사람과 함께 쓰는 공유 교환일기
7. 센서 기반 생활 루틴 Nudge
8. 식단/수면/공부 특화 페르소나
9. 패턴 공유 ID
10. 프리미엄 캐릭터 슬롯과 패턴팩

---

## 11. 구현 프롬프트 템플릿

각 기능을 vibe coding으로 구현할 때 아래 템플릿을 사용한다.

```text
현재 단계는 Step N: [기능명]입니다.
수정 허용 파일은 아래로 제한합니다.
- file A
- file B
- test file C

목표:
[한 문장 목표]

요구사항:
- [구체 요구사항 1]
- [구체 요구사항 2]

테스트:
- [테스트 1]
- [테스트 2]

작업 순서:
1. 테스트 작성
2. 최소 구현
3. 테스트 실행
4. 실패 수정
5. 전체 unit test 실행

완료 조건:
- 해당 테스트 통과
- 기존 테스트 통과
- assembleDebug 통과
```

---

## 12. 첫 번째 구현 세션 추천

첫 세션에서는 앱 기능을 만들지 말고 기준선만 잡는다.

추천 작업:

1. 현재 Android 프로젝트가 있는 위치 확인
2. Gradle 테스트 실행
3. 테스트 의존성 부족 여부 확인
4. `MainDispatcherRule` 추가
5. `BuildSmokeTest` 추가
6. `:app:testDebugUnitTest` 통과 확인
7. `:app:assembleDebug` 통과 확인

첫 세션 완료 전에는 캐릭터, 일기, AI 기능을 구현하지 않는다. 이 기준선이 잡히면 이후 모든 단계에서 디버깅 비용이 크게 줄어든다.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Office Hours | `/office-hours` | Product wedge and design doc | 1 | DONE_WITH_CONCERNS | Saved `gstack-office-hours.md`; recommends exchange-diary-first MVP |
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | ISSUES_OPEN | Saved `gstack-ceo-review.md`; HOLD_SCOPE with 4 critical planning gaps |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_OPEN | Saved `gstack-plan-eng-review.md`; produced architecture diagram, coverage diagram, 6 test gaps, 3 critical failure modes |
| Design Consultation | `/design-consultation` | Design system proposal | 1 | PROPOSED | Saved `gstack-design-consultation.md`; proposes warm diary/character-room design system and future `DESIGN.md` content |
| Design Plan Review | `/plan-design-review` | UI/UX plan quality | 1 | ISSUES_OPEN | Saved `gstack-plan-design-review.md`; initial design completeness 6/10, strongest gaps are trust/safety, interaction states, accessibility |
| DevEx Review | `/plan-devex-review` | Developer workflow and onboarding | 1 | ISSUES_OPEN | Saved `gstack-plan-devex-review.md`; current TTHW blocked until Android repo root is found |
| Investigation | `/investigate` | Root cause of blocked workflows | 1 | BLOCKED_ROOT_CAUSE_FOUND | Saved `gstack-investigate.md`; root cause is current folder is a planning workspace, not a git-backed Android app repo |
| QA | `/qa` | User-flow verification | 1 | BLOCKED_NO_RUNNING_APP | Saved `gstack-qa-plan.md`; real QA blocked until Android build/emulator exists |
| Review | `/review` | Pre-landing diff review | 1 | NO_DIFF_TO_REVIEW | Saved `gstack-review.md`; real code review blocked because current folder is not a git repo and no implementation diff exists |
| Design Review | `/design-review` | Rendered visual QA | 1 | BLOCKED_NO_RENDERED_UI | Saved `gstack-design-review.md`; real visual audit blocked until rendered Android screens/screenshots exist |
| Ship | `/ship` | Release/PR gate | 0 | BLOCKED | Must wait for real Android repo, passing tests, executed QA, real diff review, rendered design review, and ship-ready branch |

- **ORDER:** `/ship` must run after `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, executed `/qa`, real diff `/review`, and rendered `/design-review` where UI changed.
- **OFFICE HOURS:** Core recommendation is to keep the MVP centered on AI exchange diary rather than broad personal assistant features.
- **CEO REVIEW:** No scope expansion accepted; added stronger privacy, observability, and test cadence gates.
- **ENG REVIEW:** Added architecture boundaries, test coverage diagram, and P0/P1 failure-mode registry.
- **DESIGN CONSULTATION:** Proposed a warm diary utility + character room design system; promote to `DESIGN.md` in the real repo.
- **DESIGN PLAN REVIEW:** Requires explicit UI states, crisis visual treatment, accessibility rules, and preset-first pattern MVP.
- **DEVEX REVIEW:** Requires `START_HERE.md`, `TESTING.md`, troubleshooting table, and repo discovery before implementation.
- **INVESTIGATE:** Confirmed root cause of blocked executable workflows: no git-backed Android repo in current folder.
- **QA:** Current artifact is a QA plan, not executed evidence; emulator/device QA remains required.
- **REVIEW:** Current artifact is a no-diff review; run again after implementation diff exists.
- **DESIGN REVIEW:** Current artifact is a pre-audit checklist; run again after rendered screens exist.
- **UNRESOLVED:** Android project root, teen vs adult beta, pattern editor MVP depth, Room encryption/PIN timing.
- **VERDICT:** Planning package is ready for repo discovery and Step 1; implementation and release remain blocked.

---



---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Office Hours | `/office-hours` | Product wedge and design doc | 1 | DONE_WITH_CONCERNS | Saved `gstack-office-hours.md`; recommends exchange-diary-first MVP |
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | ISSUES_OPEN | Saved `gstack-ceo-review.md`; HOLD_SCOPE with 4 critical planning gaps |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_OPEN | Saved `gstack-plan-eng-review.md`; produced architecture diagram, coverage diagram, 6 test gaps, 3 critical failure modes |
| Design Consultation | `/design-consultation` | Design system proposal | 1 | PROPOSED | Saved `gstack-design-consultation.md`; proposes warm diary/character-room design system and future `DESIGN.md` content |
| Design Plan Review | `/plan-design-review` | UI/UX plan quality | 1 | ISSUES_OPEN | Saved `gstack-plan-design-review.md`; initial design completeness 6/10, strongest gaps are trust/safety, interaction states, accessibility |
| Design Shotgun | `/design-shotgun` | Visual direction exploration | 1 | TEXT_AND_HTML_VARIANTS_CREATED | Saved `gstack-design-shotgun.md` and `gstack-design-shotgun-board.html`; recommends A+B+C hybrid direction |
| Design HTML | `/design-html` | Finalized HTML design reference | 1 | FINALIZED_HTML_CREATED | Saved `gstack-design-html.md`, `gstack-design-html-finalized.html`, and metadata JSON |
| DevEx Review | `/plan-devex-review` | Developer workflow and onboarding | 1 | ISSUES_OPEN | Saved `gstack-plan-devex-review.md`; current TTHW blocked until Android repo root is found |
| Investigation | `/investigate` | Root cause of blocked workflows | 1 | BLOCKED_ROOT_CAUSE_FOUND | Saved `gstack-investigate.md`; root cause is current folder is a planning workspace, not a git-backed Android app repo |
| QA | `/qa` | User-flow verification | 1 | BLOCKED_NO_RUNNING_APP | Saved `gstack-qa-plan.md`; real QA blocked until Android build/emulator exists |
| Review | `/review` | Pre-landing diff review | 1 | NO_DIFF_TO_REVIEW | Saved `gstack-review.md`; real code review blocked because current folder is not a git repo and no implementation diff exists |
| Design Review | `/design-review` | Rendered visual QA | 1 | BLOCKED_NO_RENDERED_UI | Saved `gstack-design-review.md`; real visual audit blocked until rendered Android screens/screenshots exist |
| Ship | `/ship` | Release/PR gate | 0 | BLOCKED | Must wait for real Android repo, passing tests, executed QA, real diff review, rendered design review, and ship-ready branch |

- **ORDER:** `/ship` must run after `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, executed `/qa`, real diff `/review`, and rendered `/design-review` where UI changed.
- **OFFICE HOURS:** Core recommendation is to keep the MVP centered on AI exchange diary rather than broad personal assistant features.
- **CEO REVIEW:** No scope expansion accepted; added stronger privacy, observability, and test cadence gates.
- **ENG REVIEW:** Added architecture boundaries, test coverage diagram, and P0/P1 failure-mode registry.
- **DESIGN CONSULTATION:** Proposed a warm diary utility + character room design system; promote to `DESIGN.md` in the real repo.
- **DESIGN PLAN REVIEW:** Requires explicit UI states, crisis visual treatment, accessibility rules, and preset-first pattern MVP.
- **DESIGN SHOTGUN:** Explored three visual directions; approved working direction is Quiet Paper Room + Pattern Studio + Calm Safety.
- **DESIGN HTML:** Created a self-contained mobile HTML prototype as a Compose implementation reference.
- **DEVEX REVIEW:** Requires `START_HERE.md`, `TESTING.md`, troubleshooting table, and repo discovery before implementation.
- **INVESTIGATE:** Confirmed root cause of blocked executable workflows: no git-backed Android repo in current folder.
- **QA:** Current artifact is a QA plan, not executed evidence; emulator/device QA remains required.
- **REVIEW:** Current artifact is a no-diff review; run again after implementation diff exists.
- **DESIGN REVIEW:** Current artifact is a pre-audit checklist; run again after rendered screens exist.
- **UNRESOLVED:** Android project root, teen vs adult beta, pattern editor MVP depth, Room encryption/PIN timing.
- **VERDICT:** Planning package is ready for repo discovery and Step 1; implementation and release remain blocked.

---
