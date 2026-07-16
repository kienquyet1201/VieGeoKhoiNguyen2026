import os, glob

extensions = ['*.html', '*.js', '*.css']
skip_prefixes = ['vercel_', 'clean_', 'check_', 'gen_', 'generate_', 'update_', 'replace_', 'append_', 'get_', 'run_', 'error_', 'rename_']

files = []
for ext in extensions:
    files.extend(glob.glob(ext))

count = 0
for f in files:
    if any(f.startswith(p) for p in skip_prefixes):
        continue
    
    # Try utf-8 first, then latin-1 as fallback
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
    except UnicodeDecodeError:
        with open(f, 'r', encoding='latin-1') as fh:
            content = fh.read()
    
    if 'LearnMatch' not in content and 'learnmatch.css' not in content:
        continue
    
    new_content = content.replace('LearnMatch', 'VieGeo')
    new_content = new_content.replace('learnmatch.css', 'viegeo.css')
    
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(new_content)
    
    changes = content.count('LearnMatch') + content.count('learnmatch.css')
    print(f'{f}: {changes} replacements')
    count += changes

print(f'\nTotal: {count} replacements across all files')
