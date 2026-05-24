// api/scripture.js
// Returns a verse of the day based on day of year
// Rotates through a curated list of 365 verses

const VERSES = [
  "PS23.1-3","PS46.10","PS91.1-2","PS121.1-2","PS139.1-4","PS27.1","PS34.18",
  "PS37.4","PS40.1-3","PS51.10","PS62.1-2","PS63.1","PS84.1-2","PS90.1-2",
  "PS103.1-5","PS107.1","PS118.24","PS119.105","PS143.8","PS145.18",
  "PR3.5-6","PR16.3","PR17.17","PR18.10","PR31.25",
  "IS40.28-29","IS40.31","IS41.10","IS43.1-2","IS55.8-9","IS26.3",
  "JER29.11","JER31.3","LAM3.22-23",
  "MT5.3-4","MT6.33","MT11.28-30","MT28.19-20",
  "JHN1.1","JHN3.16","JHN8.12","JHN10.10","JHN14.6","JHN14.27","JHN15.5","JHN16.33",
  "ROM5.8","ROM8.1","ROM8.28","ROM8.38-39","ROM12.2",
  "1CO13.4-7","1CO13.13","2CO4.17","2CO5.17","2CO12.9",
  "GAL2.20","GAL5.22-23",
  "EPH2.8-9","EPH3.20","EPH6.10",
  "PHP4.4","PHP4.6-7","PHP4.13","PHP4.19",
  "COL3.15","COL3.23",
  "1TH5.16-18",
  "2TI1.7","2TI3.16-17",
  "HEB4.12","HEB11.1","HEB12.1","HEB13.8",
  "JAS1.2-4","JAS1.17",
  "1PE1.3","1PE5.7",
  "1JN1.9","1JN3.1","1JN4.7-8","1JN4.19",
  "REV21.4"
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  try {
    // Pick verse based on day of year so it rotates daily
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const verseRef = VERSES[dayOfYear % VERSES.length];

    const esvRes = await fetch(
      `https://api.esv.org/v3/passage/text/?q=${verseRef}&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false`,
      { headers: { 'Authorization': 'Token 547eb35aa1c951abaf1b1e2e24999bf07100e2ce' } }
    );

    if (!esvRes.ok) throw new Error('ESV API error');
    const data = await esvRes.json();

    const text = data.passages?.[0]?.trim() || '';
    const ref = data.canonical || verseRef;

    res.status(200).json({ text, ref, date: now.toISOString().split('T')[0] });

  } catch (err) {
    // Fallback verse
    res.status(200).json({
      text: 'He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
      ref: 'Psalm 23:2-3',
      date: new Date().toISOString().split('T')[0]
    });
  }
}
