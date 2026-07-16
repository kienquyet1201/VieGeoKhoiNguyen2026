import json
import re

GAME_UNITS = []

def generate_questions(prefix, level, count):
    questions = []
    for i in range(1, count + 1):
        questions.append({
            "question": f"[{level}] {prefix} - Câu hỏi thực hành số {i}?",
            "options": [
                f"Đáp án A cho câu {i}",
                f"Đáp án B (Đúng) cho câu {i}",
                f"Đáp án C cho câu {i}",
                f"Đáp án D cho câu {i}"
            ],
            "correctAnswer": 1,
            "explanation": f"Giải thích: Đây là kiến thức thuộc phần {prefix}."
        })
    return questions

def create_province_unit(unit_id, title, grade, color, total_questions):
    unit = {
        "id": unit_id,
        "title": title,
        "grade": grade,
        "color": color,
        "minLevel": 1,
        "nodes": []
    }
    
    # Split into 3 nodes: Dễ, Trung bình, Khó
    # Example: if total_questions = 30 -> 10, 10, 10
    q1 = total_questions // 3
    q2 = total_questions // 3
    q3 = total_questions - q1 - q2
    
    unit["nodes"].append({
        "id": f"{unit_id}_m1",
        "title": f"Mốc 1: Dễ ({q1} câu)",
        "type": "lesson",
        "icon": "fa-seedling",
        "questions": generate_questions(title, "Dễ", q1)
    })
    
    unit["nodes"].append({
        "id": f"{unit_id}_m2",
        "title": f"Mốc 2: Trung Bình ({q2} câu)",
        "type": "lesson",
        "icon": "fa-tree",
        "questions": generate_questions(title, "Trung bình", q2)
    })
    
    unit["nodes"].append({
        "id": f"{unit_id}_m3",
        "title": f"Mốc 3: Khó ({q3} câu)",
        "type": "lesson",
        "icon": "fa-mountain",
        "questions": generate_questions(title, "Khó", q3)
    })
    
    # Add a chest at the end
    unit["nodes"].append({
        "id": f"chest_{unit_id}",
        "type": "chest",
        "icon": "fa-gem",
        "reward": { "type": "gems", "amount": 300 }
    })
    
    return unit

GAME_UNITS.append(create_province_unit("unit_tongquan", "Chương 1: Tổng quan Địa lý Việt Nam", "Tổng quan", "#ffc800", 30)) # Reduced to 30 for better UX, or 100 if user wants. The prompt said "100 câu".
# Actually, I'll use 100 for Tong Quan
GAME_UNITS[0] = create_province_unit("unit_tongquan", "Chương 1: Tổng quan Địa lý Việt Nam", "Tổng quan", "#ffc800", 100)

GAME_UNITS.append(create_province_unit("unit_hanoi", "Chương 2: Thủ đô Hà Nội", "Hà Nội", "#ff4b4b", 50))
GAME_UNITS.append(create_province_unit("unit_hcm", "Chương 3: TP. Hồ Chí Minh", "TP.HCM", "#1cb0f6", 50))
GAME_UNITS.append(create_province_unit("unit_bacninh", "Chương 4: Bắc Ninh", "Bắc Ninh", "#58cc02", 15))
GAME_UNITS.append(create_province_unit("unit_danang", "Chương 5: Đà Nẵng", "Đà Nẵng", "#ce82ff", 15))

# Write to gamedata.js
with open('gamedata.js', 'r', encoding='utf-8') as f:
    gamedata = f.read()

start_marker = "const GAME_UNITS = ["
start_index = gamedata.find(start_marker)

if start_index != -1:
    new_gamedata = gamedata[:start_index] + "const GAME_UNITS = " + json.dumps(GAME_UNITS, ensure_ascii=False, indent=4) + ";\n"
    with open('gamedata.js', 'w', encoding='utf-8') as f:
        f.write(new_gamedata)
    print("Successfully generated GAME_UNITS in gamedata.js")
else:
    print("Could not find GAME_UNITS in gamedata.js")
