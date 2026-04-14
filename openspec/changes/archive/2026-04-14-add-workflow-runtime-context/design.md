## Context

`packages/flow` публикует `Flow`, который сейчас всегда рендерит `WorkflowEditor` внутри `WorkflowStoreProvider` без каких-либо входных параметров. При этом сама store-инфраструктура уже поддерживает initial props через `createContextStore`, но `WorkflowStoreInitialProps` использует это только для `initialGraph`.

Новая потребность находится на пересечении store и UI: при нажатии `Export Domain` toolbar вызывает `state.exportDomain()`, а тот сейчас сразу возвращает сериализованную JSON-строку. Это работает для внутренних сценариев, но не позволяет внешнему потребителю встроить свою доменную адаптацию на уровне DTO перед копированием в clipboard. Одновременно важно не открыть путь к бесконтрольному росту API вида `onExportDomain`, `onImportDomain`, `variableOptions`, `featureFlags` отдельными пропсами у `Flow`.

Ограничения:
- `createContextStore.Provider` инициализирует store один раз и игнорирует последующие изменения props. Значит runtime-конфиг здесь должен считаться immutable per mount.
- Базовый export/import codec уже специфицирован как schema-driven и не должен деградировать в ad-hoc сериализацию.
- Текущее поведение нельзя ломать: без внешнего runtime всё должно работать как сейчас.

## Goals / Non-Goals

**Goals:**
- Добавить одну универсальную точку для внешних runtime-настроек workflow вместо накопления точечных пропсов.
- Дать `export domain` опциональный mapper, который получает domain DTO до сериализации и может безопасно его преобразовать.
- Сохранить базовое построение domain DTO и финальную сериализацию JSON как внутренние стабильные шаги, независимые от внешних интеграций.
- Сделать runtime-конфиг доступным и store-слайсам, и UI-слою без отдельного глобального контекста.
- Зафиксировать поведение тестами и OpenSpec-спеками, чтобы будущие runtime-расширения шли через тот же контракт.

**Non-Goals:**
- Делать runtime-конфиг реактивным после mount.
- Менять schema/формат базового domain export.
- Добавлять новую систему плагинов или event bus внутри workflow.
- Расширять import pipeline пользовательскими хуками в рамках этого change.

## Decisions

### 1. Ввести `runtime`-объект в `WorkflowStoreInitialProps`, а не набор отдельных пропсов

**Decision**: расширить `WorkflowStoreInitialProps` полем `runtime?: WorkflowRuntimeConfig` и пробросить его через `Flow` в `WorkflowStoreProvider`. В публичном API верхнего уровня это выглядит как один namespaced prop, например `runtime`, внутри которого постепенно появляются новые опции.

**Alternatives considered**:
- *Добавить отдельный prop вроде `exportDomainMapper` в `Flow` и `WorkflowStoreProvider`*: решает только текущий кейс, но быстро превращает provider в «мешок пропсов».
- *Добавить новый React context рядом со store*: создаёт второй источник правды и усложняет доступ из store slices, хотя нужная инициализационная точка уже есть в `createContextStore`.

**Why this approach**: `runtime`-объект универсален и даёт понятную эволюцию API. Мы используем уже существующую модель initial props, не плодим лишние provider layers и явно сигнализируем, что это интеграционный surface.

### 2. Хранить runtime-конфиг как immutable runtime state store

**Decision**: при создании store сохранить `runtime` в состоянии/queries как неизменяемую конфигурацию текущего mount. IO-slice и другие части workflow читают её через `get()`, но не мутируют.

**Alternatives considered**:
- *Читать runtime только в компоненте toolbar и передавать mapper вниз пропсами*: решает только кнопку export и не открывает путь для будущих runtime-зависимых store-команд.
- *Хранить runtime вне store в модульной переменной*: нарушает изоляцию между инстансами и повторяет уже решённые ранее проблемы shared mutable state.

**Why this approach**: runtime становится доступен в любом store command без prop drilling и без cross-instance leakage. При этом он соответствует semantics `createContextStore`: конфиг задаётся один раз на mount и дальше используется как read-only.

### 3. Разделить базовое построение DTO, внешний mapper и финальную сериализацию

**Decision**: выделить явный двухшаговый pipeline:
1. Базовый codec строит schema-valid `DomainWorkflowDTO`.
2. Если задан `runtime.exportDomain.mapper`, store применяет его к этому DTO и получает итоговый domain object.
3. Только после этого store сериализует финальный DTO в JSON-строку для clipboard/UI.

**Alternatives considered**:
- *Давать mapper только raw graph state*: слишком сильно связывает внешнего потребителя с внутренними типами editor state и дублирует responsibility базового codec.
- *Давать mapper уже готовую JSON-строку*: слишком поздний слой; пользователь не может безопасно изменять структуру без лишнего parse/stringify и без знания сериализационных деталей.

**Why this approach**: DTO-based mapper даёт более чистый контракт, сохраняет ответственность codec-слоя за построение canonical domain object и оставляет сериализацию внутренней деталью export pipeline.

### 4. Не расширять runtime до безтипового словаря

**Decision**: `WorkflowRuntimeConfig` должен быть typed-объектом с именованными секциями (`exportDomain`, далее при необходимости другие). Мы сознательно не вводим `Record<string, unknown>` для произвольных данных.

**Alternatives considered**:
- *Полностью свободный словарь внешних параметров*: быстрее на старте, но быстро размывает контракт и убирает type-guided discoverability.
- *Сразу ввести полноценную plugin API систему*: преждевременно для текущего масштаба задачи.

**Why this approach**: typed runtime сохраняет универсальность, но не теряет управляемость. Новые настройки добавляются через осмысленные секции, а не через невалидируемый bag of options.

## Risks / Trade-offs

- **[Risk]** Provider props в `createContextStore` не реактивны → **Mitigation**: явно документировать runtime как mount-time config и покрыть тестом, что runtime не переинициализируется на rerender.
- **[Risk]** Внешний mapper может вернуть schema-invalid DTO → **Mitigation**: базовый codec остаётся canonical source, а mapper контракт явно привязан к `DomainWorkflowDTO`; при необходимости можно позже добавить validation-after-mapping без смены surface API.
- **[Risk]** Runtime surface начнёт разрастаться без структуры → **Mitigation**: все новые расширения добавлять только в typed `WorkflowRuntimeConfig` секции и фиксировать отдельными spec delta.
- **[Risk]** UI- и store-слой будут дублировать логику around runtime → **Mitigation**: держать применение mapper внутри store `exportDomain`, а toolbar оставить только потребителем итоговой строки.

## Migration Plan

1. Расширить типы store initial props и верхнеуровневый `Flow` API новым `runtime`-prop с безопасным default.
2. Сохранить runtime-конфиг в store creation path и сделать его доступным для slices/селекторов.
3. Обновить IO-slice: базовый export сначала строит DTO, затем опционально прогоняет его через runtime mapper и только потом сериализует в JSON.
4. Обновить тесты provider/store/toolbar на дефолтное и кастомное поведение.
5. Rollback простой: удалить `runtime` из initial props и вернуть `exportDomain` к прямому вызову `exportDomainJson`.

## Open Questions

- Нужен ли mapper-у второй аргумент с metadata (`graph`, `source: "toolbar"`) уже в первой версии, или достаточно одного `DomainWorkflowDTO`? Базовая рекомендация: оставить только DTO и расширять сигнатуру лишь при реальной потребности.
- Стоит ли сразу в этом же change экспортировать `WorkflowRuntimeConfig` из публичного entrypoint `packages/flow`, чтобы consumers могли типизировать свои props без deep import? Вероятнее всего да, если `Flow` действительно получает новый публичный prop.
