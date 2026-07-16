import re
import json

def check_js_files():
    with open('gamedata.js', 'r', encoding='utf-8') as f:
        content = f.read()

    print("Checking gamedata.js...")
    try:
        # Extract LEARNING_REGIONS
        lr_start = content.find('const LEARNING_REGIONS = ')
        if lr_start != -1:
            lr_end = content.find('const PVP_POOL', lr_start)
            lr_json = content[lr_start + len('const LEARNING_REGIONS = '):lr_end].strip()
            if lr_json.endswith(';'): lr_json = lr_json[:-1]
            json.loads(lr_json)
            print("LEARNING_REGIONS is valid JSON")
    except Exception as e:
        print("Error parsing LEARNING_REGIONS:", e)

    try:
        # Extract PVP_POOL
        pvp_start = content.find('const PVP_POOL = ')
        if pvp_start != -1:
            pvp_json = content[pvp_start + len('const PVP_POOL = '):].strip()
            if pvp_json.endswith(';'): pvp_json = pvp_json[:-1]
            json.loads(pvp_json)
            print("PVP_POOL is valid JSON")
    except Exception as e:
        print("Error parsing PVP_POOL:", e)

if __name__ == '__main__':
    check_js_files()
