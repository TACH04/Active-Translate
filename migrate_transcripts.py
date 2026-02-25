import os
import json
import glob

staging_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "staging")
files = glob.glob(os.path.join(staging_dir, "**", "transcript.json"), recursive=True)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    modified = False
    for item in data:
        if 'start_time' in item:
            item['start'] = item.pop('start_time')
            modified = True
        if 'end_time' in item:
            item['end'] = item.pop('end_time')
            modified = True
            
    if modified:
        with open(f, 'w', encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
        print(f"Migrated {f}")
    else:
        print(f"No changes needed for {f}")
