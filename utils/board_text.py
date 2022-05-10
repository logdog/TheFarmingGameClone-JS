import pandas as pd
import re
'''
<div id="row-1" class="top-row">
    <div class="cell-corner" >Christmas Vacation</div>
    <div class="cell">
        <span class="date">Jan 1</span>
        <span class="description">Pay 10% interest on Bank Notes on hand.</span>
        <div class="players-on-me">
            <div class="player blue"></div>
            <div class="player yellow"></div>
        </div>
    </div>
    <div class="cell">Jan 2</div>
    <div class="cell">Jan 3</div>
    <div class="cell">Jan 4</div>
    <div class="cell">Feb 1</div>
    <div class="cell">Feb 2</div>
    <div class="cell">Feb 3</div>
    <div class="cell">Feb 4</div>
    <div class="cell">Mar 1</div>
    <div class="cell">Mar 2</div>
    <div class="cell">Mar 3</div>
    <div class="cell">Mar 4</div>
    <div class="cell">Apr 1</div>
    <div class="cell-corner" >Spring Planting</div>
</div>

<div id="row-2">
    <div id="column-left" class="side-row">
        <div class="cell">Sep 3</div>
        <div class="cell">Sep 4</div>
        <div class="cell">Oct 1</div>
        <div class="cell">Oct 2</div>
        <div class="cell">Oct 3</div>
        <div class="cell">Oct 4</div>
        <div class="cell">Nov 1</div>
        <div class="cell">Nov 2</div>
        <div class="cell">Nov 3</div>
        <div class="cell">Nov 4</div>
        <div class="cell">Dec 1</div>
        <div class="cell">Dec 2</div>
    </div>
    <canvas></canvas>
    <div id="column-right" class="side-row">
        <div class="cell">Apr 3</div>
        <div class="cell">Apr 4</div>
        <div class="cell">May 3</div>
        <div class="cell">May 4</div>
        <div class="cell">May 1</div>
        <div class="cell">May 2</div>
        <div class="cell">June 1</div>
        <div class="cell">June 2</div>
        <div class="cell">June 3</div>
        <div class="cell">June 4</div>
    </div>
</div>
<div id="row-3" class="top-row">
    <div class="cell-corner" >Independence Day Bash</div>
    <div class="cell">July 1</div>
    <div class="cell">July 2</div>
    <div class="cell">July 3</div>
    <div class="cell">July 4</div>
    <div class="cell">Aug 1</div>
    <div class="cell">Aug 2</div>
    <div class="cell">Aug 3</div>
    <div class="cell">Aug 4</div>
    <div class="cell">Sep 1</div>
    <div class="cell">Sep 2</div>
    <div class="cell-corner" >Harvest Moon</div>
</div>
'''
df = pd.read_excel('./../cards.xlsx')


def create_cell(date, text, id):
    return f'''
	<div class="cell" id="cell-{id}">
		<span class="date">{date}</span>
		<span class="description">{text}</span>
		<div class="players-on-me"></div>
	</div>'''

def create_cell_corner(date, text, id):
    return f'''
	<div class="cell-corner" id="cell-{id}">
		<span class="date">{date}</span>
		<span class="description">{text}</span>
		<div class="players-on-me"></div>
	</div>'''


dates = df['Date']
texts = df['Text']

master_str = ''

# create row one
master_str += '<div id="row-1" class="top-row">'
master_str += create_cell_corner(dates[0], texts[0], 0)
for id in range(1,14):
    master_str += create_cell(dates[id], texts[id], id)
master_str += create_cell_corner(dates[14], texts[14], 14)
master_str += '''
</div>'''

# create row 2
master_str += '''
<div id="row-2">
	<div id="column-left" class="side-row">'''
for id in range(37,49):
    master_str += create_cell(dates[id], texts[id], id)
master_str += '''
</div>
	<canvas></canvas>
	<div id="column-right" class="side-row">'''
for id in range(15,25):
    master_str += create_cell(dates[id], texts[id], id)
master_str += '''</div>
</div>'''

# create row 3
master_str += '<div id="row-3" class="top-row">'
master_str += create_cell_corner(dates[25], texts[25], 25)
for id in range(26,35):
    master_str += create_cell(dates[id], texts[id], id)
master_str += create_cell_corner(dates[36], texts[36], 36)
master_str += '''
</div>'''

with open('board.txt', 'w') as f:
    f.write(re.sub(r'[\n\t\r]*','', master_str))