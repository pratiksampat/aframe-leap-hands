import { HandMesh } from '../lib/leap.hand-mesh';
import { HandBody } from './helpers/hand-body';
import { Intersector } from './helpers/intersector';
import { CircularArray } from '../lib/circular-array';
// import { throws } from 'assert';

var nextID = 1;

var rawColor = 'red';
var rawThickness = '0.01';
var path = "";
/**
 * A-Frame component for a single Leap Motion hand.
 */
const Component = AFRAME.registerComponent('leap-hand', {
  schema: {
    hand:               {default: '', oneOf: ['left', 'right'], required: true},
    enablePhysics:      {default: false},
    holdDistance:       {default: 0.2}, // m
    holdDebounce:       {default: 100}, // ms
    holdSelector:       {default: '[holdable]'},
    tapSelector:        {default: '[tappable]'},
    holdSensitivity:    {default: 0.95}, // [0,1]
    releaseSensitivity: {default: 0.75}, // [0,1]
    debug:              {default: false},
    rawMode:            {default: false}
  },

  init: function () {
    console.log(this.data.rawMode);
    this.system = this.el.sceneEl.systems.leap;
    this.handID = nextID++;
    this.hand = /** @type {Leap.Hand} */ null;
    this.handBody = /** @type {HandBody} */ null;
    this.handMesh = new HandMesh();

    this.isVisible = false;
    this.isHolding = false;

    var bufferLen = Math.floor(this.data.holdDebounce / (1000 / 120));
    this.grabStrength = 0;
    this.pinchStrength = 0;
    this.grabStrengthBuffer = /** @type {CircularArray<number>} */ new CircularArray(bufferLen);
    this.pinchStrengthBuffer = /** @type {CircularArray<number>} */ new CircularArray(bufferLen);

    this.intersector = new Intersector();
    this.holdTarget = /** @type {AFRAME.Element} */ null;

    this.el.setObject3D('mesh', this.handMesh.getMesh());
    this.handMesh.hide();

    if (this.data.debug) {
      this.el.object3D.add(this.intersector.getMesh());
    }

    this.safeDetect = true;
    this.tickCount = 0;
    this.thresholdTickCount = 100;
    this.rawColorArr = ["blue","green","yellow","red", "orange", "black"];
    this.rawThicknessrArr = ["0.01", "0.005", "0.015", "0.001"];
  },

  update: function () {
    var data = this.data;
    if (data.enablePhysics && !this.handBody) {
      this.handBody = new HandBody(this.el, this);
    } else if (!data.enablePhysics && this.handBody) {
      this.handBody.remove();
      this.handBody = null;
    }
  },

  remove: function () {
    if (this.handMesh) {
      this.el.removeObject3D('mesh');
      this.handMesh = null;
    }
    if (this.handBody) {
      this.handBody.remove();
      this.handBody = null;
    }
    if (this.intersector.getMesh()) {
      this.el.object3D.remove(this.intersector.getMesh());
      this.intersector = null;
    }
  },

  tick: function (time) {
    var hand = this.getHand();
    if (hand && hand.valid) {
      this.handMesh.scaleTo(hand);
      this.handMesh.formTo(hand);
      if(!this.data.rawMode)
        this.detect(hand,time);
      //================== Raw mode ====================
      else{ 
        var self = this;
        // console.log(hand.indexFinger.dipPosition);
        if(hand.type == "left"){ // when left hand detected don't draw. 
          // First of all take everything off the screen
          if(hand.indexFinger.extended && !hand.middleFinger.extended 
            && !hand.ringFinger.extended && !hand.pinky.extended){ // Single finger extended
              // Make all the objects invisible
              objects = this.el.sceneEl.querySelectorAll("a-sphere")
              for(var i=0; i<objects.length; i++){
                objects[i].setAttribute('visible',false);
              }
              rawColor = this.rawColorArr[Math.floor(Math.random() * this.rawColorArr.length)];
              console.log(rawColor);
              var s = document.getElementById("rawColor");
              var t = document.getElementById("rawColorText");
              var s1 = document.getElementById('rawThinkness')
              var t1 = document.getElementById('rawThicknessText')
              if(s)
                s.outerHTML = "";
              if(t)
                t.outerHTML = "";
              if(s1)
                s1.outerHTML = "";
              if(t1)
                t1.outerHTML = "";
              var sphere = document.createElement('a-sphere');
              sphere.setAttribute('id','rawColor');
              sphere.setAttribute('color',rawColor);
              sphere.setAttribute('radius','0.1');
              sphere.setAttribute('position','0 1.6 -2');
              this.el.sceneEl.appendChild(sphere);

              var text = document.createElement('a-text');
              text.setAttribute('id','rawColorText');
              text.setAttribute('color','black');
              text.setAttribute('value',"Color");
              text.setAttribute('position','0.2 1.6 -2')
              this.el.sceneEl.appendChild(text);
          }
          else if(hand.indexFinger.extended && hand.middleFinger.extended 
            && !hand.ringFinger.extended && !hand.pinky.extended){ // Dual finger extended
              // Make all the objects invisible
              objects = this.el.sceneEl.querySelectorAll("a-tube")
              for(var i=0; i<objects.length; i++){
                objects[i].setAttribute('visible',false);
              }
              rawThickness = this.rawThicknessrArr[Math.floor(Math.random() * this.rawThicknessrArr.length)];
              console.log(rawThickness);
              var s = document.getElementById("rawColor");
              var t = document.getElementById("rawColorText");
              var s1 = document.getElementById('rawThinkness')
              var t1 = document.getElementById('rawThicknessText')
              if(s)
                s.outerHTML = "";
              if(t)
                t.outerHTML = "";
              if(s1)
                s1.outerHTML = "";
              if(t1)
                t1.outerHTML = "";
              var sphere = document.createElement('a-sphere');
              sphere.setAttribute('id','rawThinkness');
              sphere.setAttribute('color',rawColor);
              sphere.setAttribute('radius',rawThickness);
              sphere.setAttribute('position','0 0 -0.150');
              this.el.sceneEl.appendChild(sphere);

              var text = document.createElement('a-text');
              text.setAttribute('id','rawThicknessText');
              text.setAttribute('color','black');
              text.setAttribute('value',"Brush");
              text.setAttribute('position','0.2 1.6 -2')
              this.el.sceneEl.appendChild(text);
          }
        }
        else{
          objects = this.el.sceneEl.querySelectorAll("a-tube")
          for(var i=0; i<objects.length; i++){
            objects[i].setAttribute('visible',true);
          }
          
          var s = document.getElementById('rawColor')
          var t = document.getElementById('rawColorText');
          var s1 = document.getElementById('rawThinkness')
          var t1 = document.getElementById('rawThicknessText')
          if(s)
            s.setAttribute('visible',false);
          if(t)
            t.setAttribute('visible',false);
          if(s1)
            s1.setAttribute('visible',false);
          if(t1)
            t1.setAttribute('visible',false);
          
          this.grabStrengthBuffer.push(hand.grabStrength);
          this.pinchStrengthBuffer.push(hand.pinchStrength);
          this.grabStrength = circularArrayAvg(this.grabStrengthBuffer);
          this.pinchStrength = circularArrayAvg(this.pinchStrengthBuffer);
          var isHolding = Math.max(this.grabStrength, this.pinchStrength)
            > (this.isHolding ? this.data.releaseSensitivity : this.data.holdSensitivity);
          if ( isHolding && !this.isHolding){
            var pos = hand.indexFinger.dipPosition[0] + ' '
            + hand.indexFinger.dipPosition[1] + ' '
            + hand.indexFinger.dipPosition[2];

            path += pos + ', ';
            console.log(path);
            var tube = document.createElement('a-tube');
            tube.setAttribute('material',"color: "+rawColor);
            tube.setAttribute('color',rawColor);
            tube.setAttribute('radius',rawThickness);
            // sphere.setAttribute('position',pos);
            tube.setAttribute('path',path);
            // console.log(sphere);
            // console.log(this.el.sceneEl);
            document.getElementById('paint').appendChild(tube);
            this.el.sceneEl.appendChild(tube);
          }
          else{
            path = "";
          }
        }
        // console.log("No more detection. It's raw mode baby");
      }
    }

    if (hand && !this.isVisible) {
      this.handMesh.show();
      this.intersector.show();
    }

    if (!hand && this.isVisible) {
      this.handMesh.hide();
      this.intersector.hide();
    }
    this.isVisible = !!hand;
  },

  detect: function(hand,time){
    // Default gestures
    var self = this;
    // console.log(hand);
    if(self.safeDetect == true){
      if(hand.frame.gestures.length > 0){
        // using some helps us break from the forEach loop
        hand.frame.gestures.some(function(gesture){
          // console.log(gesture);
          if(gesture.type == "circle" && gesture.state == "stop"){
            var eventDetail = self.getEventDetail(hand);
            self.el.emit('leap-circle',eventDetail);
            self.safeDetect = false;
            return true;
          }
          else if(gesture.type == "swipe") {
            //Classify swipe as either horizontal or vertical
            var isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
            var swipeDirection = 'left';
            //Classify as right-left or up-down
            if(isHorizontal){
              if(gesture.direction[0] > 0){
                swipeDirection = "right";
              } 
              else {
                swipeDirection = "left";
              }
            } 
            else { //vertical
              if(gesture.direction[1] > 0){
                swipeDirection = "up";
              } 
              else {
                swipeDirection = "down";
              }                  
            }
            var eventDetail = self.getEventDetail(hand);
            eventDetail.swipeDirection = swipeDirection;
            self.el.emit('leap-swipe',eventDetail);
            self.safeDetect = false;
            return true;
          }
        });
      }
      // Tap gesture
      if(hand.indexFinger.extended && !hand.middleFinger.extended 
        && !hand.ringFinger.extended && !hand.pinky.extended){ // Kinda works for now, will do other checks like rotation later
          console.log("Keytap");
          // Update the intersector to change the raycaster position to the distal point on the index finger
          this.intersector.update(this.data, this.el.object3D, hand, "tap");
          var objects, results,
          eventDetail = self.getEventDetail(hand);
          objects = [].slice.call(self.el.sceneEl.querySelectorAll(self.data.tapSelector))
            .map(function (el) { return el.object3D; });
          console.log(objects);
          results = self.intersector.intersectObjects(objects, true);
          console.log(results);
          self.holdTarget = results[0] && results[0].object && results[0].object.el;
          if (self.holdTarget) {
            console.log("Keytap-emitted");
            self.holdTarget.emit('leap-tap', eventDetail);
          }
          self.safeDetect = false;
          self.thresholdTickCount = 30; // Play around with this rate to get it just right
        }
      // Simple Finger gestures
      else if(hand.indexFinger.extended && hand.middleFinger.extended 
        && !hand.ringFinger.extended && !hand.pinky.extended){
          var eventDetail = self.getEventDetail(hand);
          console.log("peace");
          self.el.emit('leap-peace',eventDetail);
          self.safeDetect = false;
      }
      else if(!hand.indexFinger.extended && !hand.middleFinger.extended 
        && !hand.ringFinger.extended && !hand.pinky.extended){
          var eventDetail = self.getEventDetail(hand);
          console.log("fist");
          self.el.emit('leap-fist',eventDetail);
          self.safeDetect = false;
      }
      else{
        this.grabStrengthBuffer.push(hand.grabStrength);
        this.pinchStrengthBuffer.push(hand.pinchStrength);
        this.grabStrength = circularArrayAvg(this.grabStrengthBuffer);
        this.pinchStrength = circularArrayAvg(this.pinchStrengthBuffer);
        var isHolding = Math.max(this.grabStrength, this.pinchStrength)
          > (this.isHolding ? this.data.releaseSensitivity : this.data.holdSensitivity);
        this.intersector.update(this.data, this.el.object3D, hand, isHolding);
        if ( isHolding && !this.isHolding){
          this.hold(hand);
        }         
        if (!isHolding &&  this.isHolding) this.release(hand); 
       }
    }
    else{ // Not safe to detect just yet - must detect at human speeds
      self.tickCount+=1;
      // Don't detect anything for the next 100 frames. 
      //(Current frame-rate 60FPS, So about 1.5 seconds) - Change this if you're doing for a different frame rate
      if(self.tickCount >= self.thresholdTickCount){ 
        self.safeDetect = true;
        self.tickCount = 0;
        self.thresholdTickCount = 100;
        console.log("Gesture unlocked");
      }
    }
  },
  getHand: function ()   {
    var data = this.data,
        frame = this.system.getFrame();
    return frame.hands.length ? frame.hands[frame.hands[0].type === data.hand ? 0 : 1] : null;
  },
  hold: function (hand) {
    var objects, results,
        eventDetail = this.getEventDetail(hand);

    this.el.emit('leap-holdstart', eventDetail);

    objects = [].slice.call(this.el.sceneEl.querySelectorAll(this.data.holdSelector))
      .map(function (el) { return el.object3D; });
    results = this.intersector.intersectObjects(objects, true);
    this.holdTarget = results[0] && results[0].object && results[0].object.el;
    if (this.holdTarget) {
      this.holdTarget.emit('leap-holdstart', eventDetail);
    }
    this.isHolding = true;
  },

  release: function (hand) {
    var eventDetail = this.getEventDetail(hand);

    this.el.emit('leap-holdstop', eventDetail);

    if (this.holdTarget) {
      this.holdTarget.emit('leap-holdstop', eventDetail);
      this.holdTarget = null;
    }
    this.isHolding = false;
  },

  getEventDetail: function (hand) {
    return {
      hand: hand,
      handID: this.handID,
      body: this.handBody ? this.handBody.palmBody : null
    };
  }
});

function circularArrayAvg (array) {
  var avg = 0;
  array = array.array();
  for (var i = 0; i < array.length; i++) {
    avg += array[i];
  }
  return avg / array.length;
}

export { Component };
