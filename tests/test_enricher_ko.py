"""Tests for Korean enrichment metadata handling."""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from src.ai.enricher import ContentEnricher
from src.models import ContentItem, SourceType


def _run_async(coro):
    return asyncio.run(coro)


def _make_item() -> ContentItem:
    item = ContentItem(
        id="rss:item-1",
        source_type=SourceType.RSS,
        title="Important Item",
        url="https://example.com/items/1",
        content="Body text",
        author="tester",
        published_at=datetime(2026, 4, 25, 8, 0, tzinfo=timezone.utc),
    )
    item.ai_score = 8.0
    item.ai_summary = "Summary text"
    item.ai_tags = ["AI"]
    return item


def test_enrich_item_stores_ko_metadata(monkeypatch):
    item = _make_item()
    client = MagicMock()
    client.complete = AsyncMock(
        return_value=(
            '{"queries": []}'
            if client.complete.await_count == 0
            else ""
        )
    )

    enrichment_json = """
    {
      "title_en": "English title",
      "title_zh": "中文标题",
      "title_ko": "한국어 제목",
      "whats_new_en": "Something happened.",
      "whats_new_zh": "发生了某事。",
      "whats_new_ko": "무언가 일어났습니다.",
      "why_it_matters_en": "It matters.",
      "why_it_matters_zh": "这很重要。",
      "why_it_matters_ko": "중요합니다.",
      "key_details_en": "Details here.",
      "key_details_zh": "细节在此。",
      "key_details_ko": "세부 정보입니다.",
      "background_en": "Background info.",
      "background_zh": "背景信息。",
      "background_ko": "배경 정보입니다.",
      "community_discussion_en": "",
      "community_discussion_zh": "",
      "community_discussion_ko": "",
      "sources": []
    }
    """

    call_count = {"n": 0}

    async def fake_complete(*args, **kwargs):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return '{"queries": []}'
        return enrichment_json

    client.complete = AsyncMock(side_effect=fake_complete)
    enricher = ContentEnricher(client)
    monkeypatch.setattr(enricher, "_web_search", AsyncMock(return_value=[]))

    _run_async(enricher._enrich_item(item))

    assert item.metadata["title_ko"] == "한국어 제목"
    assert "무언가 일어났습니다." in item.metadata["detailed_summary_ko"]
    assert item.metadata["background_ko"] == "배경 정보입니다."
