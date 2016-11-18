'use babel'
/** @jsx etch.dom */

import etch from 'etch';

import Tooltip from './tooltip';

// Progress Bars
//
// This module provides an API for displaying progress bars in Atom. The methods
// below allow modifing the stack of progress bars, which is represented by
// corresponding UI elements:
//    - A "global" progress bar is shown in the status bar. In pratice, this is
//      the first determinate progress bar in the stack. If there is none, the
//      first element (which then is indeterminate) will be shown instead. If the
//      stack is empty, an empty progress bar will be shown instead.
//    - Hovering over that status bar element will show the complete stack as
//      an overlay.
//    - Hovering over the actual progress bar of one such stack element will show
//      the message correesponding to that progress bar, if there is any.
//
// Methods:
//
// add(p = {progress: 0})
//    Create and return a ProgressBar with the initial properties specified by `p`,
//    which has the following methods available to it:
//
//    p.setProgress(prog)
//        Updates `p`s progress. `prog` is a number between 0 and 1 or `null`; if
//        it is `null`, an indeterminate progress bar will be displayed.
//
//    p.setLeftText(t), p.setRightText(t), p.setMessage(t)
//        Sets the text displayed to the left of the progress bar, right of the
//        progress bar, or when hovering over it.
//
//    p.destroy()
//        Destroys `p` and removes it from the display stack.

function view(f) {
  class AnonEtch {
    constructor() { etch.initialize(this); }
    update() {}
    render() { return f(); }
  }
  let anon = new AnonEtch();
  anon.update = () => { etch.update(anon); };
  return anon;
}

class Progress {
  constructor() { etch.initialize(this); }
  update({}, [level]) {
    this.level = level;
    etch.update(this);
  }
  render() {
    return <progress className="ink" value={this.level} />;
  }
  writeAfterUpdate() {
    if (this.level == null) {
      this.element.removeAttribute('value');
    }
  }
}

class StackView {
  stack = [];
  constructor() { etch.initialize(this); }
  update({}, [stack]) {
    this.stack = stack;
    etch.update(this);
  }
  render() {
    return <table>{
      this.stack.slice().reverse().map(({left, right, level}) =>
        <tr>
          <td className="progress-tr">{left}</td>
          <td className="progress-tr"><Progress>{level}</Progress></td>
          <td className="progress-tr">{right}</td>
        </tr>
      )
    }</table>;
  }
}

class TileView {
  constructor() { etch.initialize(this); }
  update({level}) {
    this.level = level;
    etch.update(this);
  }
  render() {
    return <span className="inline-block">
      <Progress>{this.level}</Progress>
    </span>;
  }
}

let stack = [];

function globalLevel() {
  if (stack.length == 0) return 0;
  let global = stack.find(({level})=>level!=null);
  if (global && global.level > 0.01) return global.level;
}

let overlay = view(() => <StackView>{stack}</StackView>);
let tileView = view(() => <TileView level={globalLevel()} />);

function update() {
  overlay.update();
  tileView.update()
}

export function activate() {
  if (this.activated) return;
  this.activated = true;

  this.tooltip = new Tooltip(tileView.element, overlay.element, {cond: () => stack.length});

  if (this.statusBar) {
    this.tile = this.statusBar.addLeftTile({item: tileView.element, priority: -1});
  }
}

export function deactivate() {
  this.activated = false;
  if (this.tooltip) this.tooltip.destroy();
  if (this.tile) this.tile.destroy();
}

export function consumeStatusBar(bar) {
  return this.statusBar = bar;
}

export function create(p = {level: 0}) {
  this.activate();

  p.setProgress = prog => {
    p.level = prog;
    update();
  };
  p.setLeftText = t => {
    p.leftText = t;
    update();
  };
  p.setRightText = t => {
    p.rightText = t;
    update();
  };
  p.setMessage = t => {
    p.msg = t;
    update();
  };
  p.destroy = () => {
    let i = stack.indexOf(p);
    if (i < 0) { return; }
    stack.splice(i, 1);
    update();
  };
  p.register = () => {
    stack.push(p);
    update();
  };

  return p;
}

  // Public API
export function add(prog) {
  let p = create(prog);
  p.register();
  return p;
}

// update logic
function hasDeterminateBars() {
  return stack.filter(p => p.progress != null).length > 0;
}
