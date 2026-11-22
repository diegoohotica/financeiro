// Assistente de dúvidas sobre as Tabelas de lentes. SOMENTE LEITURA: só consulta os dados embutidos
// (data/lentes.json e data/guia.txt) e responde. Não grava nada e não acessa o banco de dados.
import LENTES from './data/lentes.json';
import GUIA_J from './data/guia.json';
const GUIA = GUIA_J.texto;

const MODEL = () => Netlify.env.get('CHAT_MODEL') || 'claude-haiku-5-5';
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const brl = v => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function buscar(texto) {
  const toks = norm(texto).split(/[^a-z0-9.,+-]+/).filter(t => t.length > 1);
  if (!toks.length) {
    const g = {};
    LENTES.forEach(x => (g[x.f] = g[x.f] || []).push(x.n));
    return Object.entries(g).map(([f, ns]) => `${f}: ${ns.join('; ')}`).join('\n').slice(0, 9000);
  }
  const achar = modo => LENTES.map(x => {
    const fam = norm(x.f + ' ' + x.n);
    const rows = x.r.filter(r => { const h = fam + ' ' + norm(r[0]); return modo === 'all' ? toks.every(t => h.includes(t)) : toks.some(t => h.includes(t)); });
    return { x, rows };
  }).filter(o => o.rows.length).sort((a, b) => b.rows.length - a.rows.length);
  let res = achar('all'); if (!res.length) res = achar('any');
  if (!res.length) return 'Nenhuma lente encontrada para essa busca. Tente outra palavra (marca, linha, material ou tratamento).';
  return res.slice(0, 6).map(({ x, rows }) =>
    `## ${x.f} — ${x.n} (${x.t})\n${x.s.slice(0, 450)}\nColunas de preço: ${x.c.join(' | ')}\n` +
    rows.slice(0, 12).map(r => `- ${r[0]}${r[1] ? ' [' + r[1] + ']' : ''}: ` + r[2].map((v, i) => `${x.c[i] || 'preço'} ${brl(v)}`).join('; ')).join('\n') +
    (rows.length > 12 ? `\n(+${rows.length - 12} linhas; refine a busca)` : '')
  ).join('\n\n').slice(0, 9000);
}

const SYSTEM = `Você é o assistente de dúvidas das Tabelas de lentes de uma rede de óticas. Quem pergunta são funcionários do balcão.
Regras:
- Responda em português do Brasil, de forma curta, clara e prática (como falaria no balcão).
- Só fale de lentes: preços sugeridos, materiais, índices, tratamentos, lentes de contato e como usar a busca das Tabelas. Para qualquer outro assunto, diga com educação que só pode ajudar com as Tabelas de lentes.
- Para preços e faixas de grau, SEMPRE consulte a ferramenta buscar_lentes antes de responder; nunca invente valores. Se não encontrar, diga que não achou na tabela.
- Os preços são sugeridos ao consumidor, por par, e podem mudar; confirme com o laboratório em graus especiais. Informe a data da tabela quando citar preço.
- Você é somente consulta: não consegue alterar, salvar, apagar nem cadastrar nada no site. Se pedirem isso, explique que não pode e como fazer pela própria tela.
- Não dê orientação médica nem de prescrição; indique o profissional.
Guia das Tabelas (resumo do site):
${GUIA}`;

const TOOLS = [{
  name: 'buscar_lentes',
  description: 'Busca lentes e preços nas tabelas (Essilor, Zeiss, INDO, Hoya, OH!, Segment, Imperial, Acuvue etc.). Passe palavras-chave como marca, linha, material ou tratamento (ex.: "varilux airwear", "hoya 1.67 blue", "acuvue astigmatismo"). Sem texto, lista todas as famílias disponíveis.',
  input_schema: { type: 'object', properties: { texto: { type: 'string', description: 'Palavras-chave da busca' } } },
}];

const hits = new Map(); let gHora = { t: 0, n: 0 };
function limite(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (h.length >= 15) return true; h.push(now); hits.set(ip, h);
  if (now - gHora.t > 3600000) gHora = { t: now, n: 0 }; return ++gHora.n > 400;
}
const json = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export default async (req, context) => {
  if (req.method !== 'POST') return json({ erro: 'Método não permitido.' }, 405);
  const origin = req.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== new URL(req.url).host) return json({ erro: 'Origem não permitida.' }, 403) } catch (e) { return json({ erro: 'Origem inválida.' }, 403) } }
  const key = Netlify.env.get('ANTHROPIC_API_KEY');
  if (!key) return json({ erro: 'O assistente ainda não foi ativado neste site.' }, 503);
  if (limite(context.ip || 'x')) return json({ erro: 'Muitas perguntas em pouco tempo. Aguarde alguns minutos e tente de novo.' }, 429);
  let body; try { body = await req.json() } catch (e) { return json({ erro: 'Pedido inválido.' }, 400) }
  let msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-10)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, 600) }));
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ erro: 'Escreva sua pergunta.' }, 400);
  try {
    for (let i = 0; i < 5; i++) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL(), max_tokens: 700, system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }], tools: TOOLS, messages: msgs }),
      });
      if (!r.ok) { console.error('anthropic', r.status, (await r.text()).slice(0, 300)); return json({ erro: 'O assistente não conseguiu responder agora. Tente de novo em instantes.' }, 502) }
      const d = await r.json();
      const uses = (d.content || []).filter(b => b.type === 'tool_use');
      if (d.stop_reason === 'tool_use' && uses.length) {
        msgs.push({ role: 'assistant', content: d.content });
        msgs.push({ role: 'user', content: uses.map(u => ({ type: 'tool_result', tool_use_id: u.id, content: u.name === 'buscar_lentes' ? buscar((u.input || {}).texto) : 'Ferramenta desconhecida.' })) });
        continue;
      }
      const txt = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      return json({ resposta: txt || 'Não consegui montar uma resposta. Reformule a pergunta.' });
    }
    return json({ resposta: 'Não consegui concluir a busca. Tente perguntar de forma mais específica.' });
  } catch (e) { console.error(e); return json({ erro: 'Erro ao falar com o assistente.' }, 502) }
};
