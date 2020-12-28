/*
good audio stuff goes here
TODO figure out what else goes here
TODO stuff that gets rid of undesired wave discontinuities
TODO predefined useful stuff
TODO lots of good predefined WaveShaperNode and AudioWorkletNode stuff?
*/

/*
audio graph stuff
TODO stuff that makes it easier to build an audio graph
TODO stuff that makes it easier to interact with audio graph
*/
function AudioGraph() {
  // graph is in an audio context
  this.audioContext = null;

  // the nodes and connections of the graph
  this.audioGraphNodes = null;
  this.audioConnections = null;

  // can receive connections in, and direct them into the graph
  this.inputs = null;

  // can have connections out, from nodes in the graph
  this.outputs = null;

  // has a separate debug output that can be attached anywhere in the graph
  this.debugOutputs = null;

  // contains a graph that can be looked at to show how stuff is connected
  this.visualGraph = null;

  // also contains some preferences for how the graph should be displayed
  this.visualPreferences = null;
}

function AudioGraphNode() {
  // the AudioNode in the browser's audio graph
  this.audioNode = null;

  // graph node inputs are:
  //   audio node a-rate parameters or audio node inputs
  //   maybe some description stuff
  // graph node outputs are:
  //   audio node outputs
  //   maybe some description stuff
  // nodes in this graph always have the same context
  // nodes in this graph default to mono
}

function AudioGraphConnection() {
  // graph connections have:
  //   source: graph output
  //   destination: graph input
  //   maybe some description stuff
}
