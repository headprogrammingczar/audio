// functions that make the ui behave nicely

// when interacting with an AngleControl, translate click location to an angle
function getAngle(element, e) {
  // get position of click relative to top-left corner of element
  // need to do this in screen-space to account for nested elements
  var rect = element.getBoundingClientRect();

  var x = e.clientX;
  var y = e.clientY;

  // center point of element is rect corner plus half {width,height}
  var centerX = rect.x + rect.width / 2;
  var centerY = rect.y + rect.height / 2;

  // click position relative to center is minus the center position
  var vx = x - centerX;
  var vy = y - centerY;

  // compute the angle clockwise relative to up, in radians
  var radians = (-1 * Math.atan2(-1 * vy, vx)) + (Math.PI / 2);

  // then convert to degrees for convenient use with snapping angles
  var degrees = radians * 360 / (2 * Math.PI);

  // normalize the angle value
  while (degrees < 0) {
    degrees += 360;
  }
  while (degrees >= 360) {
    degrees -= 360;
  }

  return degrees;
}

// find the nearest angle in snapAngles, accounting for looping
function snapAngle(angle, snapAngles) {
  var minDistance = 360;
  var index = null;
  snapAngles.forEach(function(candidate, i) {
    var forwarddistance = Math.abs(candidate % 360 - angle % 360);
    var distance = Math.min(forwarddistance, 360 - forwarddistance);
    if (distance < minDistance) {
      minDistance = distance;
      index = i;
    }
  });

  return snapAngles[index];
}

// a ui element that is interacted with by rotating around its center
function AngleControl(angle, domElement, isSnappy, snapAngles, valueFunction) {
  this.isSnappy = isSnappy;
  this.snapAngles = snapAngles;
  this.valueFunction = valueFunction;

  // the position of the element in the ui
  this.angle = angle;

  // the value represented by the current position in the ui
  this.value = null;

  // this ui element in the dom
  this.domElement = domElement;

  // set the inside of the ui element
  // include css, add a base div, then place the dial html inside the div
  this.shadowElement = domElement.attachShadow({mode: 'closed'});
  var commonstyle = document.createElement('link');
  commonstyle.setAttribute('rel', 'stylesheet');
  commonstyle.setAttribute('href', 'css/shadow-common.css');
  var dialstyle = document.createElement('link');
  dialstyle.setAttribute('rel', 'stylesheet');
  dialstyle.setAttribute('href', 'css/shadow-dial.css');
  this.shadowDiv = document.createElement('div');
  this.shadowDiv.setAttribute('class', 'base');
  this.shadowElement.appendChild(commonstyle);
  this.shadowElement.appendChild(dialstyle);
  this.shadowElement.appendChild(this.shadowDiv);
  this.shadowDiv.innerHTML = '<div class="dial"><div class="base"><div class="handle"><div class="handlecap"><div class="indicator"></div></div></div></div></div>';

  // helper state
  this.isMouseDown = false;

  // handler for real value change events
  this.onchange = () => {};

  // handle mouse events, ensuring that "this" is this object
  domElement.onmousedown = e => this.handleOnMouseDown(e);
  domElement.onmousemove = e => this.handleOnMouseMove(e);
  domElement.onmouseup = e => this.handleOnMouseUp(e);
  domElement.onmouseleave = e => this.handleOnMouseLeave(e);

  // things that require a mostly-valid object
  this.setAngle(this.angle);
}

AngleControl.prototype.handleOnMouseDown = function(e) {
  angle = getAngle(this.domElement, e);
  this.setAngle(angle);
  this.isMouseDown = true;
};

AngleControl.prototype.handleOnMouseMove = function(e) {
  if (this.isMouseDown) {
    angle = getAngle(this.domElement, e);
    this.setAngle(angle);
  }
};

AngleControl.prototype.handleOnMouseUp = function(e) {
  this.isMouseDown = false;
};

AngleControl.prototype.handleOnMouseLeave = function(e) {
  this.isMouseDown = false;
};

AngleControl.prototype.setAngle = function(angle) {
  if (this.isSnappy) {
    angle = snapAngle(angle, this.snapAngles);
  }
  this.shadowDiv.style.setProperty('--value', angle);
  this.angle = angle;
  var newvalue = this.valueFunction(angle);
  if (newvalue != this.value) {
    this.value = newvalue;
    this.onchange();
  }
};

