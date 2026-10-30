"""Exercise preview isolation over real HTTP, including encoded private paths."""
from pathlib import Path
import importlib.util
import threading
import unittest
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


class PreviewIsolation(unittest.TestCase):
    def test_only_public_website_files_are_served(self):
        source = ROOT / 'preview.py'
        self.assertTrue(source.exists(), 'An isolated local preview server is required')
        spec = importlib.util.spec_from_file_location('site_preview', source)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        server = module.make_server(0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f'http://127.0.0.1:{server.server_port}'
        try:
            for path in ('/', '/style.css', '/script.js', '/assets/terrain.svg',
                         '/research/shandong-water-quality/', '/research/tire-rubber-particles/'):
                with self.subTest(public=path):
                    with urllib.request.urlopen(base + path) as response:
                        self.assertEqual(response.status, 200)
                        self.assertGreater(len(response.read()), 0)
            for path in ('大学申请个人网站.docx', '网站内容规划.md', '实践证明-白晨杨(1).pdf',
                         'preview.py', 'tests/test_site.py', 'assets/', '../大学申请个人网站.docx'):
                with self.subTest(private=path):
                    request = base + '/' + urllib.parse.quote(path)
                    with self.assertRaises(urllib.error.HTTPError) as error:
                        urllib.request.urlopen(request)
                    self.assertEqual(error.exception.code, 404)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
