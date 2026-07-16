import json
import re
import random

def generate_regions():
    regions = [
        {
            "id": "region_north",
            "name": "Miền Bắc",
            "color": "#ff4b4b",
            "provinces": [
                {
                    "id": "prov_hanoi",
                    "name": "Hà Nội",
                    "color": "#1cb0f6",
                    "lessons": [
                        {
                            "id": "hanoi_1",
                            "type": "theory",
                            "title": "Lý thuyết: Vị trí Địa lí",
                            "content": "Hà Nội là thủ đô của nước Cộng hòa Xã hội chủ nghĩa Việt Nam, nằm ở phía tây bắc trung tâm đồng bằng châu thổ sông Hồng. Hà Nội có vị trí từ 20°34' đến 21°18' vĩ độ Bắc và từ 105°17' đến 106°02' kinh độ Đông, tiếp giáp với các tỉnh Thái Nguyên, Vĩnh Phúc ở phía Bắc, Hà Nam, Hòa Bình ở phía Nam, Bắc Giang, Bắc Ninh và Hưng Yên ở phía Đông, Hòa Bình cùng Phú Thọ ở phía Tây.",
                            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Ho_Hoan_Kiem.jpg/800px-Ho_Hoan_Kiem.jpg"
                        },
                        {
                            "id": "hanoi_2",
                            "type": "quiz",
                            "title": "Luyện tập: Vị trí Địa lí",
                            "questions": [
                                {
                                    "question": "Hà Nội nằm ở đồng bằng nào?",
                                    "options": ["Đồng bằng sông Hồng", "Đồng bằng sông Cửu Long", "Đồng bằng duyên hải miền Trung", "Đồng bằng Bắc Bộ"],
                                    "correctAnswer": 0,
                                    "explanation": "Hà Nội nằm ở trung tâm đồng bằng châu thổ sông Hồng."
                                },
                                {
                                    "question": "Thủ đô Hà Nội không tiếp giáp với tỉnh nào sau đây?",
                                    "options": ["Bắc Ninh", "Hải Phòng", "Hưng Yên", "Vĩnh Phúc"],
                                    "correctAnswer": 1,
                                    "explanation": "Hà Nội không giáp với Hải Phòng."
                                }
                            ]
                        },
                        {
                            "id": "hanoi_mid",
                            "type": "quiz_midterm",
                            "title": "Kiểm tra Giữa khóa (Hà Nội)",
                            "questions": [
                                {
                                    "question": "Phía Bắc của Hà Nội giáp với tỉnh nào?",
                                    "options": ["Thái Nguyên, Vĩnh Phúc", "Bắc Giang, Bắc Ninh", "Hà Nam, Hòa Bình", "Phú Thọ"],
                                    "correctAnswer": 0,
                                    "explanation": "Hà Nội tiếp giáp với Thái Nguyên và Vĩnh Phúc ở phía Bắc."
                                }
                            ]
                        },
                        {
                            "id": "hanoi_3",
                            "type": "theory",
                            "title": "Văn hóa & Lịch sử",
                            "content": "Hà Nội có lịch sử ngàn năm văn hiến, nổi tiếng với 36 phố phường, Văn Miếu Quốc Tử Giám - trường đại học đầu tiên của Việt Nam, và Lăng Chủ tịch Hồ Chí Minh. Ẩm thực Hà Nội phong phú với các món ăn đặc trưng như Phở, Bún chả, Cốm làng Vòng...",
                            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Van_Mieu.jpg/800px-Van_Mieu.jpg"
                        },
                        {
                            "id": "hanoi_final",
                            "type": "quiz_final",
                            "title": "Đại Thử Thách (Hà Nội)",
                            "questions": [
                                {
                                    "question": "Trường đại học đầu tiên của Việt Nam nằm ở Hà Nội là gì?",
                                    "options": ["Quốc Học Huế", "Văn Miếu Quốc Tử Giám", "Đại học Đông Dương", "Đại học Tổng hợp"],
                                    "correctAnswer": 1,
                                    "explanation": "Văn Miếu Quốc Tử Giám là trường đại học đầu tiên của Việt Nam."
                                },
                                {
                                    "question": "Món ăn nào sau đây là đặc sản nổi tiếng của Hà Nội?",
                                    "options": ["Mì Quảng", "Hủ tiếu", "Cốm làng Vòng", "Bánh xèo"],
                                    "correctAnswer": 2,
                                    "explanation": "Cốm làng Vòng là đặc sản rất nổi tiếng của Hà Nội."
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "prov_quangninh",
                    "name": "Quảng Ninh",
                    "color": "#ce82ff",
                    "lessons": [
                        {
                            "id": "qn_1",
                            "type": "theory",
                            "title": "Vịnh Hạ Long",
                            "content": "Quảng Ninh nổi tiếng với Vịnh Hạ Long, một Di sản Thiên nhiên Thế giới được UNESCO công nhận. Nơi đây có hàng ngàn hòn đảo đá vôi nhô lên từ mặt nước biển xanh biếc, tạo nên một cảnh quan thiên nhiên hùng vĩ và thơ mộng.",
                            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ha_Long_Bay_Vietnam.jpg/800px-Ha_Long_Bay_Vietnam.jpg"
                        },
                        {
                            "id": "qn_final",
                            "type": "quiz_final",
                            "title": "Kiểm tra Tổng hợp (Quảng Ninh)",
                            "questions": [
                                {
                                    "question": "Di sản thiên nhiên thế giới nào nằm ở Quảng Ninh?",
                                    "options": ["Vịnh Nha Trang", "Vịnh Lăng Cô", "Vịnh Hạ Long", "Vịnh Cam Ranh"],
                                    "correctAnswer": 2,
                                    "explanation": "Vịnh Hạ Long được UNESCO công nhận là di sản thiên nhiên thế giới."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "region_central",
            "name": "Miền Trung",
            "color": "#ffc800",
            "provinces": [
                {
                    "id": "prov_danang",
                    "name": "Đà Nẵng",
                    "color": "#1cb0f6",
                    "lessons": [
                        {
                            "id": "dn_1",
                            "type": "theory",
                            "title": "Thành phố Đáng Sống",
                            "content": "Đà Nẵng là trung tâm kinh tế, văn hóa, giáo dục và khoa học công nghệ của miền Trung - Tây Nguyên. Nơi đây có các danh thắng nổi tiếng như Ngũ Hành Sơn, Bà Nà Hills, Bán đảo Sơn Trà và bãi biển Mỹ Khê.",
                            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Da_Nang_Skyline.jpg/800px-Da_Nang_Skyline.jpg"
                        },
                        {
                            "id": "dn_final",
                            "type": "quiz_final",
                            "title": "Kiểm tra Tổng hợp (Đà Nẵng)",
                            "questions": [
                                {
                                    "question": "Bãi biển nào sau đây thuộc Đà Nẵng?",
                                    "options": ["Bãi biển Nha Trang", "Bãi biển Mỹ Khê", "Bãi biển Cửa Lò", "Bãi biển Sầm Sơn"],
                                    "correctAnswer": 1,
                                    "explanation": "Bãi biển Mỹ Khê là một trong những bãi biển đẹp nhất ở Đà Nẵng."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "region_south",
            "name": "Miền Nam",
            "color": "#58cc02",
            "provinces": [
                {
                    "id": "prov_hcm",
                    "name": "TP. Hồ Chí Minh",
                    "color": "#1cb0f6",
                    "lessons": [
                        {
                            "id": "hcm_1",
                            "type": "theory",
                            "title": "Trung tâm Kinh tế",
                            "content": "TP. Hồ Chí Minh (Sài Gòn) là thành phố lớn nhất Việt Nam về dân số và quy mô kinh tế. Thành phố có nhiều công trình kiến trúc mang đậm dấu ấn lịch sử như Dinh Độc Lập, Nhà thờ Đức Bà, Bưu điện trung tâm Sài Gòn, Chợ Bến Thành.",
                            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Ho_Chi_Minh_City_skyline.jpg/800px-Ho_Chi_Minh_City_skyline.jpg"
                        },
                        {
                            "id": "hcm_final",
                            "type": "quiz_final",
                            "title": "Kiểm tra Tổng hợp (TP.HCM)",
                            "questions": [
                                {
                                    "question": "Công trình nào sau đây biểu tượng của TP.HCM?",
                                    "options": ["Chùa Một Cột", "Chợ Bến Thành", "Cầu Rồng", "Tháp Chàm"],
                                    "correctAnswer": 1,
                                    "explanation": "Chợ Bến Thành là một trong những biểu tượng nổi tiếng của TP.HCM."
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]

    return json.dumps(regions, ensure_ascii=False, indent=4)

def rewrite_gamedata():
    with open('gamedata.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract the PvP pool before we overwrite GAME_UNITS
    # The PvP pool is the last element in GAME_UNITS, with id "pvp_easy_pool"
    pvp_start = content.find('"id": "pvp_easy_pool"')
    if pvp_start != -1:
        # Walk back to find the starting brace of the pvp object
        obj_start = content.rfind('{', 0, pvp_start)
        # Walk forward to find the ending brace of the array
        array_end = content.find('];', obj_start)
        pvp_obj = content[obj_start:array_end].strip()
        if pvp_obj.endswith(','):
            pvp_obj = pvp_obj[:-1].strip()
            
        # Write PVP_POOL as a separate constant
        pvp_code = f"\n// ── KHO CÂU HỎI PVP (Đấu trường) ──\nconst PVP_POOL = [\n    {pvp_obj}\n];\n"
    else:
        pvp_code = "\n// ── KHO CÂU HỎI PVP (Đấu trường) ──\nconst PVP_POOL = [];\n"
        
    # Now replace GAME_UNITS entirely
    start_idx = content.find('const GAME_UNITS = [')
    end_idx = content.find('];', start_idx) + 2
    
    new_regions = generate_regions()
    regions_code = f"const LEARNING_REGIONS = {new_regions};\n"
    
    new_content = content[:start_idx] + regions_code + pvp_code + content[end_idx:]
    
    with open('gamedata.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Rewrote gamedata.js successfully.")

if __name__ == '__main__':
    rewrite_gamedata()
