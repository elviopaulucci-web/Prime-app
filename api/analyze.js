export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { imageBase64, imageMime } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'Imagem nao enviada' });
  const prompt = 'Analise a lista de materiais de marcenaria. Extraia todas as pecas. Para cada linha: qtd, comp(mm), larg(mm), esp(mm), descricao, face1 e face2. Regras: A=lamina boa, B=interna, C=ruim. area_m2=(COMP/1000)x(LARG/1000)xQTD. Se A|A: area_A=area_m2*2. Se A|C: area_A=area_m2, area_C=area_m2. Responda SOMENTE JSON sem markdown: {"obra":"","op":"","material":"","data":"","pecas":[{"qtd":1,"comp":0,"larg":0,"esp":0,"descricao":"","face1":"A","face2":"C","area_m2":0,"area_A":0,"area_B":0,"area_C":0}],"totais":{"A":0,"B":0,"C":0,"geral":0},"observacoes":""}';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: imageMime || 'image/jpeg', data: imageBase64 } }, { type: 'text', text: prompt }] }] })
    });
    const d = await r.json();
    if (d.error) return res.status(500).json({ error: d.error.message });
    const text = d.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
    res.status(200).json(JSON.parse(text));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
