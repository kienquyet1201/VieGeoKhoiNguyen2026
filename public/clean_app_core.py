import re

with open('app-core.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove renderPath function entirely
# We'll use a regex to match the function block.
# Since the function is quite large, we'll find "function renderPath()" and its matching closing brace.
def remove_function(text, func_name):
    start_idx = text.find(f"function {func_name}()")
    if start_idx == -1:
        return text
    
    # find the opening brace
    brace_start = text.find("{", start_idx)
    stack = 1
    end_idx = brace_start + 1
    
    while stack > 0 and end_idx < len(text):
        if text[end_idx] == '{':
            stack += 1
        elif text[end_idx] == '}':
            stack -= 1
        end_idx += 1
        
    return text[:start_idx] + text[end_idx:]

content = remove_function(content, 'renderPath')

# 2. Remove the filter chips event listeners
# document.querySelectorAll('.filter-chip').forEach(btn => { ... });
filter_start = content.find("document.querySelectorAll('.filter-chip').forEach(btn => {")
if filter_start != -1:
    filter_end = content.find("});\n}", filter_start) # wait, it's inside a DOMContentLoaded?
    if filter_end == -1:
        # just find the end of the forEach
        brace_start = content.find("{", filter_start)
        stack = 1
        end_idx = brace_start + 1
        while stack > 0 and end_idx < len(content):
            if content[end_idx] == '{':
                stack += 1
            elif content[end_idx] == '}':
                stack -= 1
            end_idx += 1
        # Also remove the }); after it
        end_idx = content.find(");", end_idx) + 2
        content = content[:filter_start] + content[end_idx:]

# 3. Remove calls to renderPath()
content = content.replace("renderPath();\n", "")
content = content.replace("renderPath();", "")
content = content.replace("setTimeout(() => renderPath(), 500);", "")

with open('app-core.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed renderPath from app-core.js")
