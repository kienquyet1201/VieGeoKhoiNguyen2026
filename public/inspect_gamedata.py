import json
import re

with open('gamedata.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract LEARNING_REGIONS using a naive approach
# We know it starts with "const LEARNING_REGIONS = [" and ends somewhere before "const DAILY_QUESTS"
start_str = "const LEARNING_REGIONS = ["
start_idx = content.find(start_str)

if start_idx != -1:
    print(f"Found LEARNING_REGIONS at {start_idx}")
    # find the end of the array. It's followed by "const INVENTORY_ITEMS" or something similar.
    # Let's just find the next "const "
    end_idx = content.find("\nconst ", start_idx + len(start_str))
    if end_idx != -1:
        array_str = content[start_idx + 25:end_idx].strip()
        if array_str.endswith(';'):
            array_str = array_str[:-1]
        
        # print some info about the array string
        print(f"Array string length: {len(array_str)}")
        print("First 200 chars:")
        print(array_str[:200])
        print("Last 200 chars:")
        print(array_str[-200:])
