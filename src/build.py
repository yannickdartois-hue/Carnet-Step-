#!/usr/bin/env python3
"""Assemble index.html (racine du dépôt) à partir des sources de ce dossier.
   Usage : python3 src/build.py   (depuis la racine du dépôt ou depuis src/)
   Puis augmenter le numéro de cache dans sw.js avant de publier."""
import json, re, os
S = os.path.dirname(os.path.abspath(__file__))
R = lambda n: open(os.path.join(S, n), encoding='utf-8').read()
keep = json.loads(R('keep.json'))
keep['chunk'] = keep['chunk'].replace("'DFP|'", "'SPP|'")
def fill(t):
    for k, v in keep.items(): t = t.replace('{{' + k + '}}', v)
    left = re.findall(r'\{\{\w+\}\}', t); assert not left, left
    return t
app = fill(R('core.js')) + '\n' + fill(R('ui.js')) + '\nlet LIVE=null;function liveStop(){}\n' + fill(R('prof.js'))
css = R('style.css') + '\n' + R('extra.css')
scripts = '<script>' + R('qrgen.js') + '</script>\n<script>' + R('jsqr.js') + '</script>\n<script>' + app + '</script>'
html = R('page.html').replace('{{CSS}}', css).replace('{{SCRIPTS}}', scripts)
out = os.path.join(S, '..', 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print('index.html :', len(html), 'caractères')
