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
  _angle;
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
    this._angle = defAttribute(this, 'data-angle', 0, s => parseInt(s, 10));
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

  handleOnMouseDown(e) {
    this.angle = getAngle(this, e);
    this.isMouseDown = true;
  }

  handleOnMouseMove(e) {
    if (this.isMouseDown) {
      this.angle = getAngle(this, e);
    }
  }

  handleOnMouseUp(e) {
    this.isMouseDown = false;
  }

  handleOnMouseLeave(e) {
    this.isMouseDown = false;
  }

  setAngle(angle, doEvent=true) {
    if (this.isSnappy) {
      angle = snapAngle(angle, this.snapAngles);
    }
    this.shadowDiv.style.setProperty('--value', angle);
    this._angle = angle;
    var newvalue = this.valueFunction();
    if (newvalue != this.value) {
      this.value = newvalue;
      if (doEvent) {
        var changeEvent = new Event("change");
        this.dispatchEvent(changeEvent);
      }
    }
  }

  set angle(newangle) {
    this.setAngle(newangle);
  }

  get angle() {
    return this._angle;
  }
}

customElements.define('x-dial', HTMLAngleControl);

class HTMLJack extends HTMLElement {
  shadow;
  shadowDiv;

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

// TODO key element construction
// TODO key element api
// TODO replace mockup
// TODO finalize key element styling
class HTMLKey extends HTMLElement {
  _pressed;
  _now;
  shadow;
  shadowDiv;
  onnow;
  onpressed;

  constructor() {
    super();
  }

  connectedCallback() {
    this._pressed = defAttribute(this, 'data-pressed', false, s => true);
    this._now = defAttribute(this, 'data-pressed', false, s => true);
    this.onnow = defAttribute(this, 'data-onnow', () => {}, s => new Function(s));
    this.onpressed = defAttribute(this, 'data-onpressed', () => {}, s => new Function(s));

    this.shadow = this.attachShadow({mode: 'closed'});
    var keystyle = document.createElement('link');
    keystyle.setAttribute('rel', 'stylesheet');
    keystyle.setAttribute('href', 'css/shadow-key.css');
    this.shadowDiv = document.createElement('div');
    this.shadowDiv.setAttribute('class', 'outerdiv');
    this.shadow.appendChild(keystyle);
    this.shadow.appendChild(this.shadowDiv);
    this.shadowDiv.innerHTML = '<div class="base"><div class="outline"><div class="label" part="label"></div><div class="bump"></div></div></div>';
    while(this.firstChild) {
      this.shadowDiv.querySelector('.label').appendChild(this.firstChild);
    }

    this.setdom();
  }

  set text(newtext) {
    this.shadowDiv.querySelector('.label').innerHTML = newtext;
  }

  get text() {
    return this.shadowDiv.querySelector('.label').innerHTML;
  }

  set now(newnow) {
    var oldnow = this._now;
    if (newnow != oldnow) {
      this._now = newnow;
      this.setdom();
      this.onnow();
    }
  }

  get now() {
    return this._now;
  }

  set pressed(newpressed) {
    var oldpressed = this._pressed;
    if (newpressed != oldpressed) {
      this._pressed = newpressed;
      this.setdom();
      this.onpressed();
    }
  }

  get pressed() {
    return this._pressed;
  }

  setdom() {
    this.shadowDiv.setAttribute('data-now', this._now);
    this.shadowDiv.setAttribute('data-pressed', this._pressed);
  }

  handleOnClick(e) {
  }
}

customElements.define('x-key', HTMLKey);
