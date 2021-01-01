// functions that make the ui behave nicely

// when interacting with an HTMLAngleControl, translate click location to an angle
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

function defAttribute(elem, attribute, defaultValue, f = s => s) {
  return elem.hasAttribute(attribute) ? f(elem.getAttribute(attribute)) : defaultValue;
}

class HTMLAngleControl extends HTMLElement {
  angle;
  snapAngles;
  valueFunction = () => this.angle;
  value;
  shadow;
  shadowDiv;
  isSnappy = false;
  isMouseDown = false;

  constructor() {
    super();
  }

  connectedCallback() {
    // html attributes
    this.angle = defAttribute(this, 'data-angle', 0, s => parseInt(s, 10));
    this.snapAngles = defAttribute(this, 'data-snaps', [], s => JSON.parse(s));
    this.valueFunction = defAttribute(this, 'data-getvalue', () => this.angle, s => new Function(s));

    if (this.snapAngles.length > 0) {
      this.isSnappy = true;
    }

    // set the inside of the ui element
    // include css, add a base div, then place the html inside the div
    this.shadow = this.attachShadow({mode: 'closed'});
    var dialstyle = document.createElement('link');
    dialstyle.setAttribute('rel', 'stylesheet');
    dialstyle.setAttribute('href', 'css/shadow-dial.css');
    this.shadowDiv = document.createElement('div');
    this.shadowDiv.setAttribute('class', 'outerdiv');
    this.shadow.appendChild(dialstyle);
    this.shadow.appendChild(this.shadowDiv);
    this.shadowDiv.innerHTML = '<div class="base"><div class="handle"><div class="handlecap"><div class="indicator"></div></div></div></div>';

    // default event handling
    this.onmousedown = e => this.handleOnMouseDown(e);
    this.onmousemove = e => this.handleOnMouseMove(e);
    this.onmouseup = e => this.handleOnMouseUp(e);
    this.onmouseleave = e => this.handleOnMouseLeave(e);

    // finish setting up state dependent on the initial value
    this.setAngle(this.angle, false);
  }
}

HTMLAngleControl.prototype.handleOnMouseDown = function(e) {
  angle = getAngle(this, e);
  this.setAngle(angle);
  this.isMouseDown = true;
};

HTMLAngleControl.prototype.handleOnMouseMove = function(e) {
  if (this.isMouseDown) {
    angle = getAngle(this, e);
    this.setAngle(angle);
  }
};

HTMLAngleControl.prototype.handleOnMouseUp = function(e) {
  this.isMouseDown = false;
};

HTMLAngleControl.prototype.handleOnMouseLeave = function(e) {
  this.isMouseDown = false;
};

HTMLAngleControl.prototype.setAngle = function(angle, doEvent=true) {
  if (this.isSnappy) {
    angle = snapAngle(angle, this.snapAngles);
  }
  this.shadowDiv.style.setProperty('--value', angle);
  this.angle = angle;
  var newvalue = this.valueFunction();
  if (newvalue != this.value) {
    this.value = newvalue;
    if (doEvent) {
      var changeEvent = new Event("change");
      this.dispatchEvent(changeEvent);
    }
  }
};

customElements.define('x-dial', HTMLAngleControl);

class HTMLJack extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // set the inside of the ui element
    // include css, add a base div, then place the html inside the div
    this.shadow = this.attachShadow({mode: 'closed'});
    var jackstyle = document.createElement('link');
    jackstyle.setAttribute('rel', 'stylesheet');
    jackstyle.setAttribute('href', 'css/shadow-jack.css');
    this.shadowDiv = document.createElement('div');
    this.shadowDiv.setAttribute('class', 'outerdiv');
    this.shadow.appendChild(jackstyle);
    this.shadow.appendChild(this.shadowDiv);
    this.shadowDiv.innerHTML = '<div class="base"><div class="rise"><div class="hole"><div class="pin"></div></div></div></div>';
  }
}

customElements.define('x-jack', HTMLJack);
