export function parseFingerprintScan(text) {
  if (/Not collected|collecting…/.test(text)) return null;
  const match=text.match(/Bot\s+(?:risk\s+)?score\s*(\d{1,3})\s*\/\s*100/i);
  if(!match) return null;
  const score=Number(match[1]);
  return score>=0 && score<=100 ? score : null;
}
export function findRecaptchaScore(response) {
  // Only Google's demo verification response is accepted, never arbitrary page text.
  if (!response || response.success !== true || typeof response.score !== 'number' || response.score < 0 || response.score > 1)
    return null;
  if (response.action !== 'examples/v3scores') return null;
  return response.score;
}
export async function extract(page, target, responses) {
  const text=await page.locator('body').innerText();
  if(target.adapter==='fingerprint-scan') {
    const score=parseFingerprintScan(text);
    return {status:score===null?'unavailable':score<=target.threshold?'pass':'fail', score, threshold:target.threshold};
  }
  if(target.adapter==='recaptcha') {
    const verified=responses.map(r=>({...r, score:findRecaptchaScore(r.body)})).find(r=>r.score!==null);
    return {status:verified?verified.score>=target.threshold?'pass':'fail':'unavailable', score:verified?.score ?? null, threshold:target.threshold, evidence:verified?'demo-server-verification':'no-valid-server-score'};
  }
  if(target.adapter==='sannysoft') {
    const checks=await page.locator('table tr').evaluateAll(rows=>rows.flatMap(row=>{
      const cells=row.querySelectorAll('td');
      if(cells.length<2) return [];
      const result=cells[1];
      if(!/passed|failed/.test(result.className)) return [];
      return [{name:cells[0].innerText,value:result.innerText,failed:result.classList.contains('failed')}];
    }));
    return {status:checks.length?checks.some(c=>c.failed)?'fail':'pass':'unavailable',checks};
  }
  if(target.adapter==='rebrowser') {
    const data=await page.locator('#detections-json').inputValue().then(JSON.parse).catch(()=>null);
    if(!Array.isArray(data) || !data.length) return {status:'unavailable'};
    const triggered=data.filter(t=>t.rating===1 || t.rating===-1);
    return {status:data.some(t=>t.rating===1)?'fail':triggered.length===data.length?'pass':'inconclusive',checks:data};
  }
  if(target.adapter==='device') {
    const match=text.match(/"isBot"\s*:\s*(true|false)/);
    return {status:match?match[1]==='true'?'fail':'pass':'unavailable',isBot:match?match[1]==='true':null};
  }
  return {status:'captured',note:'No validated verdict adapter yet; inspect raw evidence'};
}
