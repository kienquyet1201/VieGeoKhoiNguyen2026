import sys

def check_brackets(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        text = f.read()

    stack = []
    in_string = False
    string_char = ''
    in_comment = False
    
    i = 0
    while i < len(text):
        char = text[i]
        
        if in_comment:
            if char == '\n':
                in_comment = False
            i += 1
            continue
            
        if not in_string and char == '/' and i+1 < len(text) and text[i+1] == '/':
            in_comment = True
            i += 2
            continue
            
        if in_string:
            if char == string_char and text[i-1] != '\\':
                in_string = False
            i += 1
            continue
            
        if char in ['"', "'", '`']:
            in_string = True
            string_char = char
            i += 1
            continue
            
        if char in '{[(':
            stack.append((char, i))
        elif char in '}])':
            if not stack:
                print(f'{filename}: Unmatched closing bracket {char} at index {i} (line {text[:i].count(chr(10))+1})')
                return
            last_char, pos = stack.pop()
            if (char == '}' and last_char != '{') or \
               (char == ']' and last_char != '[') or \
               (char == ')' and last_char != '('):
                print(f'{filename}: Mismatched brackets: {last_char} at {pos} closed by {char} at {i} (line {text[:i].count(chr(10))+1})')
                return
        i += 1
        
    if stack:
        last_char, pos = stack[-1]
        print(f'{filename}: Unclosed brackets left: {last_char} at line {text[:pos].count(chr(10))+1}')
        return
    print(f'{filename}: Brackets are perfectly balanced!')

check_brackets('gamedata.js')
check_brackets('app-core.js')
check_brackets('map.js')
