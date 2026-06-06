# Korean (ko) Language Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class Korean (`ko`) output across summarizer, AI enrichment, webhooks, GitHub Pages UI, and configuration — matching existing `en`/`zh` behavior.

**Architecture:** Extend the existing per-language metadata pattern (`title_{lang}`, `background_{lang}`, etc.) with a third language. Summarizer gets `LABELS["ko"]` and `language == "ko"` formatting branches. Enrichment prompts request `*_ko` JSON fields alongside `*_en`/`*_zh`. Pages site adds a third `lang-ko` section and 3-way toggle in `horizon.js`.

**Tech Stack:** Python 3.12, pytest, Jekyll (GitHub Pages), vanilla JS

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/ai/summarizer.py` | Korean labels, date/prefix formatting |
| `src/ai/prompts.py` | Enrichment prompt `*_ko` fields |
| `src/ai/enricher.py` | Parse/store `*_ko` metadata |
| `src/services/webhook.py` | Korean webhook titles/overviews |
| `docs/index.md` | Korean home section + post list |
| `docs/feed-ko.xml` | Korean RSS feed |
| `docs/assets/js/horizon.js` | 3-way language toggle |
| `data/config.github.json` | Add `"ko"` to languages |
| `docs/configuration.md` | Document `ko` language code |

---

### Task 1: Summarizer Korean labels and rendering

**Files:**
- Modify: `src/ai/summarizer.py`
- Test: `tests/test_summarizer.py`

- [ ] **Step 1: Write failing tests**

```python
def test_generate_summary_ko_uses_localized_header_and_date():
    summarizer = DailySummarizer()
    item = _make_item(1)
    item.metadata["title_ko"] = "중요한 항목 1"

    result = _run_async(
        summarizer.generate_summary([item], "2026-04-25", 10, language="ko")
    )

    assert "# Horizon 일간 브리핑 - 2026-04-25" in result
    assert "> 10개 항목 중 1개의 중요 콘텐츠를 선별했습니다." in result
    assert "4월 25일 08:00" in result
    assert "**태그**:" in result
    assert "**배경**:" not in result  # no background in fixture


def test_generate_webhook_item_ko_uses_korean_labels():
    summarizer = DailySummarizer()
    item = _make_item(1)
    item.metadata["discussion_url"] = "https://news.ycombinator.com/item?id=1"

    result = summarizer.generate_webhook_item(item, language="ko", index=1, total=2)

    assert result.startswith("1/2번째 항목")
    assert "[토론](https://news.ycombinator.com/item?id=1)" in result


def test_generate_webhook_overview_ko():
    summarizer = DailySummarizer()
    items = [_make_item(1)]

    result = summarizer.generate_webhook_overview(items, "2026-04-25", 10, language="ko")

    assert "10개 항목 중 1개의 중요 콘텐츠를 선별했습니다." in result
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `uv run pytest tests/test_summarizer.py -k ko -v`

- [ ] **Step 3: Implement `LABELS["ko"]` and `language == "ko"` branches in summarizer.py**

- [ ] **Step 4: Run tests — expect PASS**

Run: `uv run pytest tests/test_summarizer.py -v`

---

### Task 2: Webhook Korean message titles

**Files:**
- Modify: `src/services/webhook.py`
- Test: `tests/test_webhook.py`

- [ ] **Step 1: Write failing test**

```python
def test_build_daily_summary_messages_ko_title():
    config = WebhookConfig(enabled=True, url_env="HORIZON_WEBHOOK_URL", request_body={"content": "#{message_title}"})
    notifier = WebhookNotifier(config)
    summarizer = DailySummarizer()

    messages = notifier.build_daily_summary_messages(
        summary="# Horizon 일간 브리핑",
        important_items=[],
        all_items_count=5,
        date="2026-04-25",
        lang="ko",
        summarizer=summarizer,
    )

    assert messages[0]["message_title"] == "Horizon 2026-04-25 일간 브리핑"
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `uv run pytest tests/test_webhook.py -k ko_title -v`

- [ ] **Step 3: Add `_message_title_for_lang(date, lang)` helper or inline `ko` branches in webhook.py**

- [ ] **Step 4: Run tests — expect PASS**

Run: `uv run pytest tests/test_webhook.py -v`

---

### Task 3: AI enrichment Korean fields

**Files:**
- Modify: `src/ai/prompts.py`, `src/ai/enricher.py`
- Test: `tests/test_analyzer.py` or new `tests/test_enricher_ko.py`

- [ ] **Step 1: Write failing test for enricher language loop**

```python
def test_apply_enrichment_stores_ko_metadata(monkeypatch):
    # mock client.complete to return JSON with title_ko, whats_new_ko, etc.
    # assert item.metadata["title_ko"] is set
```

- [ ] **Step 2: Extend CONTENT_ENRICHMENT prompts with `*_ko` fields and Korean language rules**

- [ ] **Step 3: Change enricher loop to `for lang in ("en", "zh", "ko")`**

- [ ] **Step 4: Run enrichment-related tests**

Run: `uv run pytest tests/test_analyzer.py tests/test_enricher_ko.py -v`

---

### Task 4: GitHub Pages Korean UI

**Files:**
- Modify: `docs/index.md`, `docs/assets/js/horizon.js`
- Create: `docs/feed-ko.xml`
- Modify: `docs/assets/js/horizon.js` (tag pattern for `태그`)

- [ ] **Step 1: Add `lang-ko` section to docs/index.md** (mirror en/zh structure)

- [ ] **Step 2: Create docs/feed-ko.xml** (copy feed-en.xml, filter `lang: ko`)

- [ ] **Step 3: Update horizon.js** — 3-button toggle (EN / 中文 / 한국어), show/hide `#lang-ko`, article URL swap for `-ko` suffix

- [ ] **Step 4: Add `태그` to markSemanticElements regex**

---

### Task 5: Configuration and documentation

**Files:**
- Modify: `data/config.github.json`, `data/config.json` (local, gitignored)
- Modify: `docs/configuration.md`
- Modify: `src/services/webhook_cli.py` (help text: en, zh, or ko)

- [ ] **Step 1: Add `"ko"` to `ai.languages` in config.github.json**

- [ ] **Step 2: Document `ko` in configuration.md languages section**

- [ ] **Step 3: Update webhook_cli `--lang` help**

---

### Task 6: Full verification

- [ ] **Step 1: Run full test suite**

Run: `uv run pytest -q`

Expected: all pass

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Korean (ko) language support across pipeline and Pages"
```
