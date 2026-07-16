import re
import json

def parse_questions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    blocks = re.split(r'Câu \d+:', content)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        
        lines = [line.strip() for line in block.split('\n') if line.strip()]
        if len(lines) < 6:
            continue
            
        question_text = lines[0]
        options = []
        answer_line = ""
        
        for line in lines[1:]:
            if line.startswith('A. ') or line.startswith('B. ') or line.startswith('C. ') or line.startswith('D. '):
                options.append(line[3:].strip())
            elif line.startswith('Đáp án đúng:'):
                answer_line = line.replace('Đáp án đúng:', '').strip()
                break
                
        answer_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
        correct_index = answer_map.get(answer_line, 0)
        
        if len(options) == 4:
            questions.append({
                "question": question_text,
                "options": options,
                "correctAnswer": correct_index,
                "explanation": f"Đáp án đúng là {answer_line}."
            })
            
    return questions

def update_gamedata(questions):
    with open('gamedata.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find PVP_POOL section
    start_str = '"id": "pvp_easy_pool",'
    start_idx = content.find(start_str)
    if start_idx == -1:
        print("Could not find pvp_easy_pool")
        return
        
    q_start = content.find('"questions": [', start_idx)
    if q_start == -1:
        print("Could not find questions array in pvp_easy_pool")
        return
        
    # Find the end of this array
    # We count brackets to find the end
    bracket_count = 0
    in_string = False
    escape = False
    end_idx = -1
    
    for i in range(q_start + 13, len(content)):
        char = content[i]
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            continue
            
        if not in_string:
            if char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    end_idx = i
                    break
                    
    if end_idx != -1:
        new_questions_json = json.dumps(questions, indent=8, ensure_ascii=False)
        # Fix indentation to match the file
        new_questions_json = new_questions_json.replace('\n', '\n    ')
        
        new_content = content[:q_start + 13] + new_questions_json + content[end_idx + 1:]
        
        with open('gamedata.js', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully inserted {len(questions)} questions!")
    else:
        print("Could not find end of questions array")

qs = parse_questions('questions.txt')
print(f"Parsed {len(qs)} questions")
update_gamedata(qs)
