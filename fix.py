import json

with open("AI_VIDEO_WORKER.ipynb", "r", encoding="utf-8") as f:
    data = json.load(f)

data["cells"][2]["source"][9] = 'SUPABASE_KEY = "<YOUR_SUPABASE_SECRET_KEY>"\n'

with open("AI_VIDEO_WORKER.ipynb", "w", encoding="utf-8") as f:
    json.dump(data, f)
