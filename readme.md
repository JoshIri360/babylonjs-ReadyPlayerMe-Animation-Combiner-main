# BabylonJS ReadyPlayerMe Animation-Combiner

<br>

<a href="https://www.viseni.com" target="_blank"><img src="https://www.viseni.com/viseni_logo_2.png" style="width: 200px; margin-bottom: 50px"></a>
<br>
<br>

Babylon JS & ReadyPlayerMe -- <b>Combining multiple animations to a ReadyPlayerMe Character</b>
<br>
<br>
Used animations from:
<br>
https://github.com/readyplayerme/animation-library

<br>
And converted from FBX to GLB using this simple NodeJS APP:
<br>
https://github.com/crazyramirez/FBX2GLB-Batch-Convert-Optimizer

<br>
<br>
Of course, current Player is from <b>ReadyPlayerMe</b>
<br>
Animations use Blending 
<br>
<br>

<b><span>&#10003;</span>
Setup NPM and Install BJS</b>

- Install NodeJS from https://nodejs.org/en
- Download or Clone this Repository
- Open a Terminal (Usign for example VSCode)
- RUN: <b>npm install</b> (To Install BJS Libraries from NPM)
  <br>

<b><span>&#10003;</span>
Main Code</b>

- Everything is in main.js in js folder.
- I use Blending function to smooth the movement between animations.
- Very simple, take a look and I hope you enjoy it
  <br>

<b><span>&#10003;</span>
Features</b>

- Name and save custom names for animations
- Export animation names as JSON file
- Filter animations by category (Male, Female, Dance, Idle, Expression, Locomotion)
- Search animations by name
- Create video compilations showing multiple characters with dramatic camera movements
- Create 360° panoramic animations with frame export for video creation
  <br>

<b><span>&#10003;</span>
360° Pan Animation Export</b>

- Select any character and animation
- Click the "Create 360° Video" button from the animation info panel
- The camera will perform a smooth 360° pan around the character while the selected animation plays
- A WebM video file is automatically created and downloaded when the animation completes
- No additional software needed - the video is ready to view immediately!
  <br>

<b><span>&#10003;</span>
Development and Deployment</b>

- Run locally: <b>npm start</b> (Serves on http://localhost:8080)
- Deploy to GitHub Pages: <b>npm run deploy</b>
  <br>

<b><span>&#10003;</span>
Try the Live DEMO</b>

<b>GitHub Pages:</b> https://joshiri360.github.io/babylonjs-ReadyPlayerMe-Animation-Combiner-main/
