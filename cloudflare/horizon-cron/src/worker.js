/**
 * Horizon automated dispatcher.
 *
 * GitHub Actions does not run `schedule` (cron) events in forked repositories,
 * so this Worker fires the "Daily Horizon Summary" workflow 4x/day via the
 * workflow_dispatch REST API.
 *
 * Required secret: GH_PAT (GitHub Personal Access Token with `workflow` scope
 * on the target repo). Set with: `wrangler secret put GH_PAT`
 *
 * Cron: 0 0,6,12,18 * * * (UTC) = 09:00 / 15:00 / 21:00 / 03:00 KST.
 */

const GH_API = "https://api.github.com";

async function dispatch(env, attempt = 1) {
  const url =
    `${GH_API}/repos/${env.GH_OWNER}/${env.GH_REPO}/` +
    `actions/workflows/${env.GH_WORKFLOW}/dispatches`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_PAT}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "horizon-cron-worker",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: env.GH_REF || "main" }),
  });

  // 204 = accepted. Retry only transient failures (rate limit/5xx), max 3x.
  if (!res.ok && attempt < 3 && (res.status === 429 || res.status >= 500)) {
    await new Promise((r) => setTimeout(r, attempt * 10_000));
    return dispatch(env, attempt + 1);
  }
  return { status: res.status, body: await res.text() };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          const result = await dispatch(env);
          console.log(
            `[horizon-cron] dispatch -> ${result.status} @ ${new Date().toISOString()}`
          );
          if (result.status !== 204) {
            console.log(`[horizon-cron] response body: ${result.body.slice(0, 300)}`);
          }
        } catch (err) {
          console.error(`[horizon-cron] dispatch error: ${err.message}`);
        }
      })()
    );
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        owner: env.GH_OWNER,
        repo: env.GH_REPO,
        workflow: env.GH_WORKFLOW,
        ref: env.GH_REF,
        crons: ["0 0,6,12,18 * * *"],
        has_token: Boolean(env.GH_PAT),
        utc_now: new Date().toISOString(),
      });
    }

    // Manual trigger: GET/POST on the worker root dispatches a run now.
    try {
      const result = await dispatch(env);
      return Response.json(
        { dispatched: result.status === 204, status: result.status },
        { status: 200 }
      );
    } catch (err) {
      return Response.json({ dispatched: false, error: err.message }, { status: 500 });
    }
    void ctx;
  },
};
