# horizon-cron (Cloudflare Worker)

GitHub Actions never triggers `schedule` (cron) events in **forked**
repositories, so this Worker dispatches the `Daily Horizon Summary` workflow
4x/day via the `workflow_dispatch` REST API instead.

Cron (UTC): `0 0,6,12,18 * * *`
→ KST: **09:00 / 15:00 / 21:00 / 03:00** 매일 4회

## Setup (1회)

```bash
cd cloudflare/horizon-cron

# 1) 로그인 (qudtnrh@gmail.com)
wrangler login

# 2) GitHub PAT 생성 후 시크릿으로 등록
#    - Classic token: `workflow` (and `repo`) scope
#    - 또는 Fine-grained: 대상 repo에 Actions: Read & write
# 등록은 stdin으로 (화면에 값 노출 방지):
# echo '<YOUR_PAT>' | wrangler secret put GH_PAT

# 3) 배포
wrangler deploy
```

## 확인

```bash
# 헬스체크
curl https://horizon-cron-eclipse1228.<your-subdomain>.workers.dev/health

# 즉시 1회 수동 트리거 (GH_PAT 검증 겸)
curl https://horizon-cron-eclipse1228.<your-subdomain>.workers.dev/

# 배포된 트리거 확인
wrangler deployments list
```

## 동작 요약

- `scheduled` 핸들러가 매일 4회 GitHub `workflow_dispatch`를 호출합니다.
- `workflow_dispatch`는 fork에서도 정상 동작하므로, GitHub Pages(gh-pages) 및
  웹훅/이메일 발행까지 기존 파이프라인이 그대로 실행됩니다.
- 실패/재시도: 429(rate limit) 및 5xx만 최대 3회 후속 재시도합니다.
