import pandas as pd
import json

df = pd.read_excel('./../cards.xlsx')
obj = df.to_json(orient='table')
result = json.loads(obj)
text = json.dumps(result, indent=4)

with open('board_json.json', 'w') as f:
    f.write(text)