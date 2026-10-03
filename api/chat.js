// ============================================================
//  青翎 · AI 对话接口（Vercel Edge Function）
//
//  浏览器 → 这个文件 → 模型服务 → 把回答一段段流式吐回去
//
//  支持两家服务，按环境变量自动选：
//    · 配了 DEEPSEEK_KEY        → 用 DeepSeek 官方接口（优先）
//    · 没配，只有 SILICONFLOW_KEY → 用硅基流动的模型
//
//  密钥放在 Vercel 的环境变量里（Settings → Environment Variables），
//  绝对不要写在这个文件里 —— 这个文件是要推到 GitHub 的。
//
//  换模型／换服务只改下面 PROVIDERS 里对应的几行。
// ============================================================

export const config = { runtime: "edge" };

const PROVIDERS = {
  deepseek: {
    name: "DeepSeek",
    url: "https://api.deepseek.com/chat/completions",
    key: process.env.DEEPSEEK_KEY,
    /* DeepSeek 官方接口的模型 ID 只有这两个：
         deepseek-chat      —— 直接回答，快，适合这种游客问答（默认用这个）
         deepseek-reasoner  —— 先长篇推理再回答，更慢、更贵
       登录 platform.deepseek.com 的「模型 & 价格」页可以看到当前可用的 ID。 */
    model: "deepseek-chat",
    extra: {},
  },
  siliconflow: {
    name: "硅基流动",
    url: "https://api.siliconflow.cn/v1/chat/completions",
    key: process.env.SILICONFLOW_KEY,
    model: "Qwen/Qwen2.5-7B-Instruct",
    extra: {},
  },
};

/* 配了 DeepSeek 的密钥就优先用它，否则回落到硅基流动 —— 两套都配着，随时能切回来 */
const active = PROVIDERS.deepseek.key ? PROVIDERS.deepseek : PROVIDERS.siliconflow;

const MAX_CHARS = 300;                        // 单条提问最长多少字
const HISTORY = 6;                            // 带上最近几条上下文

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function fail(message, status = 200) {
  return new Response(message, {
    status,
    headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/* 两种形态共享的白洋淀资料。资料里没有的，要求它说不知道，不许编。 */
const FACTS = `【白洋淀资料】
- 位于河北雄安新区，华北平原最大的淡水湖泊，总面积约 360 平方公里，由 140 多个淀泊组成，素有“华北明珠”“华北之肾”之称。
- 有 12 万亩芦苇荡。自 2021 年起，水质连续 5 年稳定保持Ⅲ类。
- 野生鸟类 296 种，较新区设立前增加 90 种；野生鱼类恢复至 50 种。极危物种青头潜鸭已在白洋淀繁衍至百只左右。
- 红色文化：抗日战争时期的雁翎队是水上游击队，因“大抬杆”土枪点火口插雁翎防潮而得名。白洋淀雁翎队纪念馆是雄安新区最大的红色文化纪念馆。安新县还建成嘎子村、徐光耀文学馆，推出沉浸式抗战情景剧。
- 民俗非遗：白洋淀芦苇画需十余道纯手工工序，2009 年列入河北省非物质文化遗产；2024 年 5 月《万里长城》亮相法国巴黎国际博览会。安新县赵北口镇杨庄子村重拾蒲草编织，开办“创富工坊”，年销售额突破 80 万元，带动 1500 多人加入上下游产业。
- 三条主题游览线路：①生态民俗体验线，面向家庭游客，1～2 天，主码头—芦苇荡—王家寨民俗村—望月岛—邵庄子渔村；②红色生态研学线，面向中小学研学与党政群体，1～1.5 天，主码头—荷花大观园—雁翎队纪念馆—嘎子村—研学科普码头；③现代湿地科技观鸟线，面向科考与摄影爱好者，1 天，生态环境监控中心—白洋淀鸟类科普馆厅。
- “青翎”是本项目的虚拟数字人智能体，有古风与科技两种形态。`;

const RULES = `【说话要求】
- 只根据上面的资料回答。资料里没有的，直接说“这个我掌握的信息不够”，不要编造。
- 每次回答控制在 120 字以内，最多两段。
- 不要使用任何 Markdown 记号（不要 **、#、- 这类符号），直接说人话。
- 用中文回答。`;

const PERSONAS = {
  classic: `你是“青翎”的古风形态——一个穿白洋淀水乡传统装束的少年形象，头戴苇编斗笠、背着装有青头潜鸭的苇编背篓。你面向来到白洋淀的游客，用亲切、有画面感的口语，讲淀上的风景、故事、民俗和玩法，像本地人带着客人边走边聊。

${FACTS}

${RULES}`,

  tech: `你是“青翎”的科技形态——一个青绿荧光色调的科技机体，面向白洋淀本地的管理人员、技术人员、居民与商户。你说话简洁直接，先给结论再给理由，帮他们处理素材整理、经营情况、线路接入与系统操作上的问题。

${FACTS}

${RULES}`
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return fail("这个接口只接受 POST 请求。", 405);

  const key = active.key;
  if (!key || String(active.model).indexOf("填") >= 0) {
    return fail("接口还没配置好：缺少密钥或模型 ID。", 503);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("请求格式不对。", 400);
  }

  const question = String(body.message || "").slice(0, MAX_CHARS).trim();
  if (!question) return fail("没有收到问题内容。", 400);

  const persona = body.form === "tech" ? PERSONAS.tech : PERSONAS.classic;
  const history = Array.isArray(body.history) ? body.history.slice(-HISTORY) : [];

  const messages = [
    { role: "system", content: persona },
    ...history.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content || "").slice(0, 600),
    })),
    { role: "user", content: question },
  ];

  let upstream;
  try {
    upstream = await fetch(active.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: active.model,
        messages,
        stream: true,
        temperature: 0.6,
        max_tokens: 500,
        ...active.extra,
      }),
    });
  } catch {
    return fail("连不上模型服务，请稍后再试。", 502);
  }

  if (!upstream.ok || !upstream.body) {
    if (upstream.status === 401) return fail("接口密钥无效，需要重新配置。", 502);
    if (upstream.status === 429) return fail("现在问的人有点多，稍等一下再试。", 429);
    return fail("模型服务返回了错误（" + upstream.status + "）。", 502);
  }

  /* 把模型服务的 SSE 拆开，只把文字增量原样吐给浏览器（两家格式一样） */
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const text = line.trim();
            if (!text.startsWith("data:")) continue;
            const payload = text.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch { /* 半截的 JSON 丢掉就好 */ }
          }
        }
      } catch { /* 上游断了就直接结束 */ }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
