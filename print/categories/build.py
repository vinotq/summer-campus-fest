#!/usr/bin/env python3
"""Собирает постер «Выбери свою категорию» в HTML для рендера в PNG.

Данные карточек отдельно от вёрстки: править текст и цвета можно здесь,
не трогая разметку.
"""
import pathlib, re

OUT = pathlib.Path(__file__).parent

# ── Иконки ──────────────────────────────────────────────────────────────────
# Все в системе координат 0 0 100 100, плоские заливки с чёрным контуром.
# Контур общий, поэтому задаётся один раз в CSS через stroke у группы.

ICONS = {
"school": """
<rect x="22" y="30" width="56" height="52" rx="10" fill="#E8843C"/>
<path d="M36 30V24a14 14 0 0 1 28 0v6" fill="none"/>
<rect x="30" y="52" width="40" height="30" rx="6" fill="#F6C89A"/>
<rect x="42" y="52" width="16" height="13" rx="3" fill="#fff"/>
<rect x="14" y="62" width="12" height="24" rx="4" fill="#4FC3E8"/>
<path d="M78 58l10-4 4 10-10 4z" fill="#F5D93B"/>
<path d="M88 54l6-2 2 5-6 2z" fill="#fff"/>
""",
"math": """
<rect x="12" y="18" width="76" height="64" rx="12" fill="#fff"/>
<g text-anchor="middle" font-family="Stapel" font-weight="800" font-size="27" stroke="none">
  <text x="31" y="48" fill="#1565C0">1</text>
  <text x="50" y="48" fill="#E03A2D">2</text>
  <text x="69" y="48" fill="#2E7D32">3</text>
</g>
<path d="M24 65h14M31 58v14" stroke-width="4.5" fill="none"/>
<path d="M44 59l12 12M56 59L44 71" stroke-width="4.5" fill="none"/>
<path d="M62 65h14" stroke-width="4.5" fill="none"/>
<circle cx="69" cy="58" r="2.8" fill="#141414" stroke="none"/>
<circle cx="69" cy="72" r="2.8" fill="#141414" stroke="none"/>
""",
"society": """
<path d="M50 16v14" fill="none"/>
<circle cx="50" cy="14" r="5" fill="#F5D93B"/>
<path d="M22 30h56" fill="none"/>
<path d="M22 30L10 56h24z" fill="#4FC3E8"/>
<path d="M78 30L66 56h24z" fill="#4FC3E8"/>
<path d="M10 56a12 12 0 0 0 24 0" fill="none"/>
<path d="M66 56a12 12 0 0 0 24 0" fill="none"/>
<rect x="40" y="30" width="20" height="44" rx="4" fill="#E8843C"/>
<rect x="28" y="74" width="44" height="12" rx="5" fill="#fff"/>
""",
"sport": """
<path d="M32 20h36v20a18 18 0 0 1-36 0z" fill="#F5D93B"/>
<path d="M32 24H20a10 10 0 0 0 12 12" fill="none"/>
<path d="M68 24h12a10 10 0 0 1-12 12" fill="none"/>
<rect x="44" y="58" width="12" height="12" fill="#E8843C"/>
<rect x="32" y="70" width="36" height="12" rx="4" fill="#4FC3E8"/>
<path d="M40 82h20" fill="none"/>
""",
"cinema": """
<rect x="16" y="38" width="52" height="42" rx="6" fill="#37474F"/>
<path d="M16 38l52-10 4 12-52 10z" fill="#546E7A"/>
<path d="M28 30l6 12M42 27l6 12M56 24l6 12" stroke-width="4" fill="none"/>
<path d="M72 50h18l-4 32H76z" fill="#fff"/>
<path d="M72 50h18" fill="none"/>
<circle cx="78" cy="44" r="6" fill="#E03A2D"/>
<circle cx="88" cy="46" r="5" fill="#F5D93B"/>
""",
"logic": """
<path d="M50 14a22 22 0 0 1 13 40v8H37v-8A22 22 0 0 1 50 14z" fill="#F5D93B"/>
<rect x="37" y="66" width="26" height="8" rx="3" fill="#fff"/>
<rect x="40" y="78" width="20" height="7" rx="3" fill="#fff"/>
<path d="M50 34v18" stroke-width="4" fill="none"/>
<path d="M14 26h14v8a5 5 0 0 0 0 10v8H14z" fill="#E03A2D"/>
<path d="M86 60H72v-8a5 5 0 0 1 0-10v-8h14z" fill="#4FC3E8"/>
""",
"football": """
<circle cx="42" cy="52" r="26" fill="#fff"/>
<path d="M42 36l12 9-5 14H35l-5-14z" fill="#1A1A1A" stroke="none"/>
<path d="M42 26v10M20 46l10 6M64 46l-10 6M30 72l5-13M54 72l-5-13" stroke-width="3" fill="none"/>
<path d="M72 24h20v52H72" fill="none"/>
<path d="M76 30h12M76 40h12M76 50h12M76 60h12M82 26v48" stroke-width="2" fill="none"/>
""",
"records": """
<path d="M26 18h44a6 6 0 0 1 6 6v58H26a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="#E6457F"/>
<path d="M26 74h50" fill="none"/>
<path d="M34 18v56" stroke-width="3" fill="none"/>
<path d="M56 30l5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z" fill="#F5D93B"/>
<circle cx="84" cy="66" r="12" fill="#fff"/>
<path d="M84 58v8l5 4" stroke-width="3" fill="none"/>
""",
"food": """
<path d="M30 40a14 14 0 0 1 8-26 14 14 0 0 1 24 0 14 14 0 0 1 8 26z" fill="#fff"/>
<rect x="30" y="40" width="40" height="12" rx="4" fill="#fff"/>
<path d="M38 44v6M50 44v6M62 44v6" stroke-width="3" fill="none"/>
<ellipse cx="50" cy="70" rx="28" ry="12" fill="#E8843C"/>
<ellipse cx="50" cy="67" rx="20" ry="7" fill="#F6C89A"/>
<path d="M78 66h16" stroke-width="5" fill="none"/>
""",
"literature": """
<path d="M18 24h28a8 8 0 0 1 8 8v48a8 8 0 0 0-8-6H18z" fill="#fff"/>
<path d="M82 24H54a8 8 0 0 0-8 8v48a8 8 0 0 1 8-6h28z" fill="#EDEDED"/>
<path d="M50 32v42" stroke-width="3" fill="none"/>
<path d="M26 40h18M26 50h18M56 40h18M56 50h18" stroke-width="3" fill="none"/>
<path d="M74 70c8-14 16-20 22-22-2 8-8 18-22 24z" fill="#F5D93B"/>
<path d="M70 82l10-10" stroke-width="4" fill="none"/>
""",
}

# ── Карточки ────────────────────────────────────────────────────────────────
# (номер, заголовок, подпись, фон, цвет текста, иконка)
# Цвет текста выбран по контрасту с фоном, а не на глаз: см. build-лог.
CARDS = [
 (1,  "Школьные<br>вопросы", "Вопросы из школьной программы — от лёгких до каверзных", "#2BA9D1", "dark",  "school"),
 (2,  "Математика",          "Примеры и задачи: посчитай и выбери верный ответ",        "#5FB94A", "dark",  "math"),
 (3,  "Обществознание",      "Право, экономика и устройство общества",                  "#CE3226", "light", "society"),
 (4,  "Спорт",               "Виды спорта, рекорды и знаменитые спортсмены",            "#F08119", "dark",  "sport"),
 (5,  "Кино",                "Угадай фильм по кадру, цитате и саундтреку",              "#8E4B9E", "light", "cinema"),
 (6,  "Логика",              "Головоломки и задачи на сообразительность",               "#F5CE2A", "dark",  "logic"),
 (7,  "Футбол",              "Клубы, игроки и легендарные матчи",                       "#1FAFA6", "dark",  "football"),
 (8,  "Рекорды<br>Гиннесса", "Самые невероятные рекорды планеты",                       "#E6457F", "dark",  "records"),
 (9,  "Кухня<br>и блюда",    "Блюда и рецепты кухонь со всего мира",                    "#8CBE3F", "dark",  "food"),
 (10, "Литература",          "Авторы, книги и герои русской и мировой классики",        "#1B3C6E", "light", "literature"),
]

# Раскладка повторяет ритм исходника: 3-2-3-2. В оригинале короткие ряды
# прижаты к краям, потому что пустоту закрывала девушка с планшетом. Её нет —
# короткие ряды центрируем, иначе постер заваливается на бок.
ROWS = [[1,2,3], [4,5], [6,7,8], [9,10]]

BY_NUM = {c[0]: c for c in CARDS}


def icon(name):
    body = ICONS[name].strip()
    return (f'<svg class="ic" viewBox="0 0 100 100" aria-hidden="true">'
            f'<g stroke="#141414" stroke-width="3" stroke-linejoin="round" '
            f'stroke-linecap="round">{body}</g></svg>')


def card_html(num):
    n, title, desc, bg, tone, ic = BY_NUM[num]
    return f"""
      <article class="card {tone}" style="--bg:{bg}">
        <span class="num">{n}</span>
        <div class="icw">{icon(ic)}</div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </article>"""


logo = pathlib.Path(__file__).parent.parent / 'logo.svg'
logo_paths = re.findall(r'<path[^>]*/>', logo.read_text(encoding='utf-8'))
logo_inner = "".join(logo_paths)

rows_html = "\n".join(
    f'<div class="row r{len(r)}">' + "".join(card_html(n) for n in r) + '</div>'
    for r in ROWS)

HTML = f"""<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<style>
@font-face {{ font-family:'Stapel Expanded'; src:url('fonts/Stapel-ExpandedBlack.ttf') format('truetype'); font-weight:900; font-display:block; }}
@font-face {{ font-family:'Stapel Expanded'; src:url('fonts/Stapel-ExpandedExtraBold.ttf') format('truetype'); font-weight:800; font-display:block; }}
@font-face {{ font-family:'Stapel'; src:url('fonts/Stapel-ExtraBold.ttf') format('truetype'); font-weight:800; font-display:block; }}
@font-face {{ font-family:'Stapel'; src:url('fonts/Stapel-Bold.ttf') format('truetype'); font-weight:700; font-display:block; }}
@font-face {{ font-family:'Stapel Text'; src:url('fonts/StapelText-Bold.ttf') format('truetype'); font-weight:700; font-display:block; }}

* {{ margin:0; padding:0; box-sizing:border-box; }}

.poster {{
  width:1080px; height:1920px; background:#fff;
  padding:58px 44px 44px; display:flex; flex-direction:column;
  font-family:'Stapel', sans-serif; -webkit-font-smoothing:antialiased;
}}

/* ── Шапка ── */
.head {{ text-align:center; flex-shrink:0; }}
.head h1 {{
  font-family:'Stapel Expanded', sans-serif; font-weight:900;
  text-transform:uppercase; line-height:.94; letter-spacing:-.015em;
  white-space:nowrap;
}}
.l1 {{ font-size:46px; color:#1B3C6E; }}
.l1 em {{ font-style:normal; color:#E03A2D; }}
.l2 {{ font-size:68px; color:#141414; margin-top:2px; }}
.sub {{
  font-family:'Stapel', sans-serif; font-weight:800; font-size:26px;
  text-transform:uppercase; color:#141414; margin-top:16px;
}}

/* ── Сетка ── */
.grid {{ flex:1; display:flex; flex-direction:column; gap:20px; margin:30px 0 26px; }}
.row  {{ flex:1; display:flex; gap:20px; justify-content:center; }}
.card {{
  --bg:#ccc; width:316px; background:var(--bg);
  border:4px solid #141414; border-radius:30px;
  padding:22px 16px 20px; position:relative;
  display:flex; flex-direction:column; align-items:center; text-align:center;
  box-shadow:0 6px 0 rgba(20,20,20,.18);
}}
.num {{
  position:absolute; top:-4px; left:-4px; width:56px; height:56px;
  background:#fff; color:#141414; border:4px solid #141414;
  border-radius:26px 0 22px 0;
  font-family:'Stapel Expanded', sans-serif; font-weight:900; font-size:25px;
  display:flex; align-items:center; justify-content:center;
}}
/* Иконка в блоке фиксированной высоты: так она стоит на одном уровне во
   всех карточках, независимо от того, в одну заголовок строку или в две. */
.icw {{ height:180px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }}
.ic  {{ width:172px; height:172px; }}
.card h3 {{
  font-family:'Stapel', sans-serif; font-weight:800;
  font-size:31px; line-height:1; text-transform:uppercase;
  margin-top:8px; letter-spacing:-.01em; white-space:nowrap;
}}
.card p {{
  font-family:'Stapel Text', sans-serif; font-weight:700;
  font-size:18px; line-height:1.28; margin-top:11px; max-width:264px;
}}
.card.dark  h3 {{ color:#141414; }}
.card.dark  p  {{ color:#141414; opacity:.84; }}
.card.light h3 {{ color:#fff; }}
.card.light p  {{ color:#fff; opacity:.94; }}

/* ── Подвал ── */
.foot {{ flex-shrink:0; display:flex; justify-content:center; align-items:center; }}
.foot svg {{ width:360px; height:auto; display:block; }}
</style></head>
<body data-fit="pending">
<div class="poster">

  <header class="head">
    <h1 class="l1">Выбери свою <em>категорию</em></h1>
    <h1 class="l2">И начни игру!</h1>
    <div class="sub">Подходи, выбирай и будь в игре!</div>
  </header>

  <main class="grid">
{rows_html}
  </main>

  <footer class="foot">
    <svg viewBox="65 251 501 127" xmlns="http://www.w3.org/2000/svg">{logo_inner}</svg>
  </footer>

</div>

<script>
// Подгонка кегля под ширину контейнера.
//
// Обязательно ПОСЛЕ document.fonts.ready: до загрузки Stapel строки меряются
// подменным шрифтом, он заметно уже, замер показывает «всё влезает», а потом
// подъезжает настоящий — и заголовки вылезают за карточки. Ровно это и
// случилось на первом прогоне.
// Ширина самой длинной строки. Не scrollWidth: у блочного элемента он равен
// clientWidth, пока текст влезает, поэтому сравнение с запасом по бокам
// всегда срабатывало и кегль уезжал в минимум. Range меряет именно текст,
// а при переносах через <br> отдаёт габарит самой широкой строки.
function textWidth(el) {{
  const r = document.createRange();
  r.selectNodeContents(el);
  return r.getBoundingClientRect().width;
}}

function fit(el, start, min, limit) {{
  let size = start;
  el.style.fontSize = size + 'px';
  while (size > min && textWidth(el) > limit) {{
    size -= 0.5;
    el.style.fontSize = size + 'px';
  }}
  return size;
}}

// Доступная ширина берётся у родителя, а не у самого заголовка: карточка —
// flex-колонка с align-items:center, её дети ужимаются по содержимому, и
// clientWidth заголовка равен ширине его же текста. Сравнение с ним всегда
// давало «не влезает» и загоняло кегль в минимум.
function innerWidth(el) {{
  const cs = getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}}

document.fonts.ready.then(() => {{
  const report = [];
  document.querySelectorAll('.l1, .l2').forEach(el => {{
    const s0 = parseFloat(getComputedStyle(el).fontSize);
    report.push(el.className + ':' + fit(el, s0, 20, innerWidth(el.parentElement) - 8));
  }});
  document.querySelectorAll('.card h3').forEach(el => {{
    const s0 = parseFloat(getComputedStyle(el).fontSize);
    const limit = innerWidth(el.closest('.card')) - 14;
    report.push(el.textContent.trim().replace(/\\s+/g, '').slice(0, 10) + ':' + fit(el, s0, 13, limit));
  }});
  document.body.setAttribute('data-fit', report.join(' | '));
}});
</script>
</body></html>
"""

(OUT / 'poster.html').write_text(HTML, encoding='utf-8')
print(f"poster.html собран: {len(HTML)} байт, карточек {len(CARDS)}")
