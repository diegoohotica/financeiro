#!/usr/bin/env python3
"""Monta index.html a partir de src/. Uso: python3 build.py"""
import json
enc=lambda t: json.dumps(t,ensure_ascii=False).replace('</','<\\/')
rd=lambda n: open('src/'+n,encoding='utf-8').read()
mods='const MODS={'+','.join(k+':'+enc(rd(k+'.html')) for k in ['caixa','ferias','escala','publico'])+'};'
open('index.html','w',encoding='utf-8').write(rd('shell_head.txt')+mods+rd('shell_tail.txt'))
print('index.html gerado')
