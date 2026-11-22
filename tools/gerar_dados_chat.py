"""Gera os dados que o assistente de dúvidas consulta (somente leitura), a partir de tabelas/index.html.
Rode de novo sempre que as tabelas de lentes forem atualizadas:  python3 tools/gerar_dados_chat.py"""
import re,json,html
s=open('tabelas/index.html',encoding='utf-8').read();L=s.split('\n');dec=json.JSONDecoder()
def arr(prefix):
    l=next(x for x in L if x.startswith(prefix));return dec.raw_decode(l[l.index('['):])[0]
C=arr('var C=[');LC=arr('var LC=[')
out=[]
for tipo,lst in (('lente de grau',C),('lente de contato',LC)):
    for x in lst:
        out.append({'t':tipo,'f':x['f'],'n':x['n'],'s':x.get('s',''),'c':x['c'],'r':x['r']})
json.dump(out,open('netlify/functions/data/lentes.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
b=s[s.index('<body'):]
b=re.sub(r'<script.*?</script>|<style.*?</style>|<img[^>]*>','',b,flags=re.S)
b=re.sub(r'<(br|/p|/div|/li|/tr|/h\d|/section)[^>]*>','\n',b);b=re.sub(r'</t[dh]>',' | ',b)
t=html.unescape(re.sub(r'<[^>]+>','',b));t=re.sub(r'[ \t]+',' ',t);t=re.sub(r'\n\s*\n+','\n',t).strip()
json.dump({'texto':t},open('netlify/functions/data/guia.json','w',encoding='utf-8'),ensure_ascii=False)
print(len(out),'famílias;',len(t),'caracteres de guia')
