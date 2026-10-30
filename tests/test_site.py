"""Content acceptance tests. Run: python3 -m unittest discover -s tests -v."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.links, self.assets, self.headings = set(), [], [], []
        self.text = []
        self.lang = None
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "a":
            self.links.append(a.get("href", ""))
        if tag in ("script", "img") and a.get("src"):
            self.assets.append(a["src"])
        if tag == "link" and a.get("href"):
            self.assets.append(a["href"])
        if tag == "h1":
            self.headings.append(tag)

    def handle_data(self, data):
        self.text.append(data)


class HomepageAcceptance(unittest.TestCase):
    def test_homepage_is_readable_english_with_real_navigation(self):
        path = ROOT / "index.html"
        self.assertTrue(path.is_file(), "The requested homepage does not exist yet")
        doc = Document(path)
        text = " ".join(doc.text)
        self.assertEqual(doc.lang, "en")
        self.assertEqual(len(doc.headings), 1)
        for section in ("main", "research", "practice", "about", "contact"):
            self.assertIn(section, doc.ids)
        for phrase in ("Chenyang Bai", "Reading", "landscapes", "Geospatial Data Science", "Calligraphy", "Tire rubber"):
            self.assertIn(phrase, text)
        self.assertIn("mailto:bcyxyhysj@163.com", doc.links)
        self.assertIn("research/shandong-water-quality/", doc.links)
        self.assertIn("research/tire-rubber-particles/", doc.links)
        for href in doc.links:
            self.assertNotIn(href, ("", "#"), "No dummy links")
            if href.startswith("#"):
                self.assertIn(href[1:], doc.ids)
        for forbidden in ("Scopus", "80+", "top 10%", "sole author", "[confirmed", "Coming soon", "独立开发"):
            self.assertNotIn(forbidden, text)
        for source in ("大学申请个人网站.docx", "网站内容规划.md", "实践证明-白晨杨(1).pdf"):
            self.assertFalse(any(source in href for href in doc.links))


class AssetsAcceptance(unittest.TestCase):
    def test_homepage_assets_and_detail_pages_exist(self):
        for name in ('style.css', 'script.js', 'assets/favicon.svg', 'assets/terrain.svg',
                     'research/shandong-water-quality/index.html', 'research/tire-rubber-particles/index.html'):
            with self.subTest(file=name):
                self.assertTrue((ROOT / name).is_file(), f'Missing implementation: {name}')
        for relative in ('research/shandong-water-quality/index.html', 'research/tire-rubber-particles/index.html'):
            path = ROOT / relative
            if path.is_file():
                doc = Document(path)
                self.assertEqual(doc.lang, 'en')
                self.assertEqual(len(doc.headings), 1)
                for asset in doc.assets:
                    if not asset.startswith('http'):
                        self.assertTrue((path.parent / asset).is_file(), asset)
        water = ROOT / 'research/shandong-water-quality/index.html'
        if water.is_file():
            text = ' '.join(Document(water).text)
            for phrase in ('Zhengwu Bai', 'descriptive', 'May 18, 2026'):
                self.assertIn(phrase, text)
            self.assertNotIn('Scopus', text)


if __name__ == "__main__":
    unittest.main()
