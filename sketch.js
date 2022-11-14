var angle = 2.0;
var offset = 300;
var scalar = 5.5;
var speed = 0.25;
var col = {
  r: 255,
  g: 0,
  b: 0
};

let cnv;
let a = 255;

function setup() { 
  cnv = createCanvas(1024, 1024);
  offset = 1024/2;
  noStroke();
  background (0,0);
} 

function draw() { 
  var x = offset + cos(angle) * scalar;
  var y = offset + sin(angle) * scalar;
  
  let alp = 0;

  fill(255, 94, 242, a);
  noStroke();
  ellipse(x, y, 5, 5);
  angle += speed;
  scalar += speed;
  a -= 0.2;
  
  
}

// function mousePressed() {
//   //declared the canvas above, so I can access it here
//   saveCanvas(cnv, 'myCanvas', 'png');
// }