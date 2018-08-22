'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._Circ2Tikz = exports._exports = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _decimal = require('decimal.js');

var _polyfill = require('../../libs/polyfill');

var _ops = require('../../ops');

var _cycle = require('../../ops/_cycle');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /*
                                                                                                                                                                                                     * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
                                                                                                                                                                                                     *
                                                                                                                                                                                                     * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                     * you may not use this file except in compliance with the License.
                                                                                                                                                                                                     * You may obtain a copy of the License at
                                                                                                                                                                                                     *
                                                                                                                                                                                                     * http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                     *
                                                                                                                                                                                                     * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                     * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                     * See the License for the specific language governing permissions and
                                                                                                                                                                                                     * limitations under the License.
                                                                                                                                                                                                     */

// decimalToString
function dts(number) {
  return new _decimal.Decimal(number).toString();
}

function minmax(array) {
  var min = Math.min.apply(Math, _toConsumableArray(array));
  var max = Math.max.apply(Math, _toConsumableArray(array));
  return [min, max];
}

function maxOfDecimals() {
  var decimals = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  var max = new _decimal.Decimal(0);
  decimals.forEach(function (d) {
    if (d.greaterThan(max)) {
      max = d;
    }
  });
  return max;
}

/**
 * @ignore
 * @type {{write_settings(Object): *, get_default_settings(): Object, _header(*): string, _body(Array<CircuitItem[]>, Object): string, _footer(): string}}
 * @private
 */
var _exports = exports._exports = {
  /**
  Write all settings to a json-file.
      @param {Object} settings: Settings dict to write.
  */
  write_settings: function write_settings(settings) {
    _fs2.default.writeFileSync('settings.json', JSON.stringify(settings));
    return settings;
  },

  /**
  Return the default settings for the circuit drawing function to_latex().
  @return {Object} settings: Default circuit settings
  */
  get_default_settings: function get_default_settings() {
    var settings = {};
    settings.gate_shadow = true;
    settings.lines = {
      'style': 'very thin',
      'double_classical': true,
      'init_quantum': true,
      'double_lines_sep': 0.04
    };
    settings.gates = {
      'HGate': {
        'width': 0.5,
        'offset': 0.3,
        'pre_offset': 0.1
      },
      'XGate': {
        'width': 0.35,
        'height': 0.35,
        'offset': 0.1
      },
      'SqrtXGate': {
        'width': 0.7,
        'offset': 0.3,
        'pre_offset': 0.1
      },
      'SwapGate': {
        'width': 0.35,
        'height': 0.35,
        'offset': 0.1
      },
      'SqrtSwapGate': {
        'width': 0.35,
        'height': 0.35,
        'offset': 0.1
      },
      'Rx': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'Ry': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'Rz': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'Ph': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'EntangleGate': {
        'width': 1.8,
        'offset': 0.2,
        'pre_offset': 0.2
      },
      'DeallocateQubitGate': {
        'height': 0.15,
        'offset': 0.2,
        'width': 0.2,
        'pre_offset': 0.1
      },
      'AllocateQubitGate': {
        'height': 0.15,
        'width': 0.2,
        'offset': 0.1,
        'pre_offset': 0.1,
        'draw_id': false,
        'allocate_at_zero': false
      },
      'MeasureGate': {
        'width': 0.75,
        'offset': 0.2,
        'height': 0.5,
        'pre_offset': 0.2
      }
    };
    settings.control = { 'size': 0.1, 'shadow': false };
    return settings;
  },

  /**
  Writes the Latex header using the settings file.
      The header includes all packages and defines all tikz styles.
      @return {string} Header of the Latex document.
  */
  _header: function _header(settings) {
    var packages = '\\documentclass{standalone}\n\\usepackage[margin=1in]' + '{geometry}\n\\usepackage[hang,small,bf]{caption}\n' + '\\usepackage{tikz}\n' + '\\usepackage{braket}\n\\usetikzlibrary{backgrounds,shadows.' + 'blur,fit,decorations.pathreplacing,shapes}\n\n';

    var init = '\\begin{document}\n' + '\\begin{tikzpicture}[scale=0.8, transform shape]\n\n';

    var gate_style = '\\tikzstyle{basicshadow}=[blur shadow={shadow blur steps=8,' + ' shadow xshift=0.7pt, shadow yshift=-0.7pt, shadow scale=' + '1.02}]';

    if (!(settings.gate_shadow || settings.control.shadow)) {
      gate_style = '';
    }
    gate_style += '\\tikzstyle{basic}=[draw,fill=white,';
    if (settings.gate_shadow) {
      gate_style += 'basicshadow';
    }
    gate_style += ']\n';

    gate_style += '\\tikzstyle{operator}=[basic,minimum size=1.5em]\n\\tikzstyle{phase}=[fill=black,shape=circle,minimum size=' + settings.control.size + 'cm,inner sep=0pt,outer sep=0pt,draw=black';
    if (settings.control.shadow) {
      gate_style += ',basicshadow';
    }
    gate_style += ']\n\\tikzstyle{none}=[inner sep=0pt,outer sep=-.5pt,minimum height=0.5cm+1pt]\n\\tikzstyle{measure}=[operator,inner sep=0pt,minimum height=' + settings.gates.MeasureGate.height + 'cm, minimum width=' + settings.gates.MeasureGate.width + 'cm]\n\\tikzstyle{xstyle}=[circle,basic,minimum height=';
    var x_gate_radius = Math.min(settings.gates.XGate.height, settings.gates.XGate.width);
    gate_style += x_gate_radius + 'cm,minimum width=' + x_gate_radius + 'cm,inner sep=-1pt,' + settings.lines.style + ']\n';
    if (settings.gate_shadow) {
      gate_style += '\\tikzset{\nshadowed/.style={preaction={transform ' + 'canvas={shift={(0.5pt,-0.5pt)}}, draw=gray, opacity=' + '0.4}},\n}\n';
    }
    gate_style += '\\tikzstyle{swapstyle}=[';
    gate_style += 'inner sep=-1pt, outer sep=-1pt, minimum width=0pt]\n';
    var edge_style = '\\tikzstyle{edgestyle}=[' + settings.lines.style + ']\n';

    return packages + init + gate_style + edge_style;
  },

  /**
  Return the body of the Latex document, including the entire circuit in
  TikZ format.
      @param {Array.<CircuitItem[]>} circuit Circuit to draw.
    @param {Object} settings
    @return {string} Latex string to draw the entire circuit.
  */
  _body: function _body(circuit, settings) {
    var code = [];

    var conv = new _Circ2Tikz(settings, (0, _polyfill.len)(circuit));
    Object.keys(circuit).forEach(function (_, line) {
      return code.push(conv.to_tikz(line, circuit));
    });

    return code.join('');
  },


  /**
  Return the footer of the Latex document.
        @return {string} Latex document footer.
   */
  _footer: function _footer() {
    return '\n\n\\end{tikzpicture}\n\\end{document}';
  }
};

/**
Translates a given circuit to a TikZ picture in a Latex document.

    It uses a json-configuration file which (if it does not exist) is created
automatically upon running this function for the first time. The config
file can be used to determine custom gate sizes, offsets, etc.

    New gate options can be added under settings['gates'], using the gate
class name string as a key. Every gate can have its own width, height, pre
offset and offset.

    @example
 settings['gates']['HGate'] = {'width': .5, 'offset': .15}

The default settings can be acquired using the get_default_settings()
function, and written using write_settings().

    @param {Array.<CircuitItem[]>} circuit Each qubit line is a list of
CircuitItem objects, i.e., in circuit[line].

    @return {string} Latex document string which can be compiled using, e.g., pdflatex.
 */
function toLatex(circuit) {
  var content = void 0;
  var settings = void 0;
  var text = void 0;
  if (_fs2.default.existsSync('settings.json')) {
    content = _fs2.default.readFileSync('settings.json');
    try {
      settings = JSON.parse(content);
    } catch (e) {
      settings = _exports.get_default_settings();
      _exports.write_settings(settings);
    }
  } else {
    settings = _exports.get_default_settings();
    _exports.write_settings(settings);
  }

  text = _exports._header(settings);
  text += _exports._body(circuit, settings);
  text += _exports._footer(settings);

  return text;
}

_exports.toLatex = toLatex;

/**
 * @class _Circ2Tikz
 * @desc
The Circ2Tikz class takes a circuit (list of lists of CircuitItem objects)
and turns them into Latex/TikZ code.

    It uses the settings dictionary for gate offsets, sizes, spacing, ...
 */

var _Circ2Tikz = exports._Circ2Tikz = function () {
  /**
   * @constructor
  Initialize a circuit to latex converter object.
      @param {Object} settings Dictionary of settings to use for the TikZ image.
    @param {number} num_lines Number of qubit lines to use for the entire
  circuit.
   */
  function _Circ2Tikz(settings, num_lines) {
    _classCallCheck(this, _Circ2Tikz);

    this.settings = settings;
    this.pos = (0, _polyfill.narray)(function () {
      return new _decimal.Decimal(0.0);
    }, num_lines);
    this.op_count = (0, _polyfill.narray)(0, num_lines);
    this.is_quantum = (0, _polyfill.narray)(settings.lines.init_quantum, num_lines);
  }

  /**
  Generate the TikZ code for one line of the circuit up to a certain
  gate.
    It modifies the circuit to include only the gates which have not been
  drawn. It automatically switches to other lines if the gates on those
  lines have to be drawn earlier.
     @param {number} line Line to generate the TikZ code for.
   @param {Array.<CircuitItem[]>} circuit The circuit to draw.
   @param {number} end Gate index to stop at (for recursion).
    @return {string} TikZ code representing the current qubit line
  and, if it was necessary to draw other lines, those lines as
  well.
   */


  _createClass(_Circ2Tikz, [{
    key: 'to_tikz',
    value: function to_tikz(line, circuit, end) {
      var _this = this;

      if (typeof end === 'undefined') {
        end = (0, _polyfill.len)(circuit[line]);
      }
      var tikz_code = [];

      var cmds = circuit[line];

      var _loop = function _loop(i) {
        var _cmds$i = cmds[i],
            gate = _cmds$i.gate,
            lines = _cmds$i.lines,
            ctrl_lines = _cmds$i.ctrl_lines;

        var all_lines = lines.concat(ctrl_lines);
        var idx = all_lines.indexOf(line);
        all_lines.splice(idx, 1); // remove current line
        all_lines.forEach(function (l) {
          var gate_idx = 0;
          while (!circuit[l][gate_idx].equal(cmds[i])) {
            gate_idx += 1;
          }

          tikz_code.push(_this.to_tikz(l, circuit, gate_idx));
          // we are taking care of gate 0 (the current one)
          circuit[l] = circuit[l].slice(1);
        });

        all_lines = lines.concat(ctrl_lines);
        var tmp = [];

        var _minmax = minmax(all_lines),
            _minmax2 = _slicedToArray(_minmax, 2),
            min = _minmax2[0],
            max = _minmax2[1];

        for (var l = min; l < max + 1; ++l) {
          tmp.push(_this.pos[l]);
        }
        var pos = maxOfDecimals(tmp);
        for (var _l = min; _l < max + 1; ++_l) {
          _this.pos[_l] = pos.add(_this._gate_offset(gate));
        }

        var connections = '';
        all_lines.forEach(function (l) {
          connections += _this._line(_this.op_count[l] - 1, _this.op_count[l], l);
        });

        var add_str = '';
        if (gate.equal(_ops.X)) {
          // draw NOT-gate with controls
          add_str = _this._x_gate(lines, ctrl_lines);
          // and make the target qubit quantum if one of the controls is
          if (!_this.is_quantum[lines[0]]) {
            var sum = 0;
            ctrl_lines.forEach(function (iL) {
              return sum += _this.is_quantum[iL];
            });
            if (sum > 0) {
              _this.is_quantum[lines[0]] = true;
            }
          }
        } else if (gate.equal(_ops.Z) && (0, _polyfill.len)(ctrl_lines) > 0) {
          add_str = _this._cz_gate(lines.concat(ctrl_lines));
        } else if (gate.equal(_ops.Swap)) {
          add_str = _this._swap_gate(lines, ctrl_lines);
        } else if (gate.equal(_ops.SqrtSwap)) {
          add_str = _this._sqrtswap_gate(lines, ctrl_lines, false);
        } else if (gate.equal((0, _cycle.getInverse)(_ops.SqrtSwap))) {
          add_str = _this._sqrtswap_gate(lines, ctrl_lines, true);
        } else if (gate.equal(_ops.Measure)) {
          // draw measurement gate
          lines.forEach(function (l) {
            var op = _this._op(l);
            var width = _this._gate_width(_ops.Measure);
            var height = _this._gate_height(_ops.Measure);
            var shift0 = new _decimal.Decimal(height).mul(0.07);
            var shift1 = new _decimal.Decimal(height).mul(0.36);
            var shift2 = new _decimal.Decimal(width).mul(0.1);

            add_str += '\n\\node[measure,edgestyle] (' + op + ') at (' + dts(_this.pos[l]) + ',-' + l + ') {};';
            add_str += '\n\\draw[edgestyle] ([yshift=-' + shift1 + 'cm,xshift=' + shift2 + 'cm]' + op + '.west) to [out=60,in=180] ([yshift=' + shift0 + 'cm]' + op + '.center) to [out=0, in=120] ([yshift=-' + shift1 + 'cm,xshift=-' + shift2 + 'cm]' + op + '.east);';
            add_str += '\n\\draw[edgestyle] ([yshift=-' + shift1 + 'cm]' + op + '.center) to ([yshift=-' + shift2 + 'cm,xshift=-' + shift1 + 'cm]' + op + '.north east);';

            _this.op_count[l] += 1;
            _this.pos[l] = _this.pos[l].add(_this._gate_width(gate)).add(_this._gate_offset(gate));
            _this.is_quantum[l] = false;
          });
        } else if (gate.equal(_ops.Allocate)) {
          // draw 'begin line'
          var id_str = '';
          if (_this.settings.gates.AllocateQubitGate.draw_id) {
            id_str = '^{\\textcolor{red}{' + cmds[i].id + '}}';
          }
          var xpos = _this.pos[line];

          if (_this.settings.gates.AllocateQubitGate.allocate_at_zero) {
            _this.pos[line] = xpos.sub(_this._gate_pre_offset(gate));
            xpos = new _decimal.Decimal(_this._gate_pre_offset(gate));
          }
          _this.pos[line] = maxOfDecimals([xpos.add(_this._gate_offset(gate)).add(_this._gate_width(gate)), _this.pos[line]]);
          add_str = '\n\\node[none] (' + _this._op(line) + ') at (' + dts(xpos) + ',-' + line + ') {$\\Ket{0}' + id_str + '$};';
          _this.op_count[line] += 1;
          _this.is_quantum[line] = _this.settings.lines.init_quantum;
        } else if (gate.equal(_ops.Deallocate)) {
          // draw 'end of line'
          var op = _this._op(line);
          add_str = '\n\\node[none] (' + op + ') at (' + dts(_this.pos[line]) + ',-' + line + ') {};';
          var yshift = _this._gate_height(gate) + 'cm]';
          add_str += '\n\\draw ([yshift=' + yshift + op + '.center) edge [edgestyle] ([yshift=-' + yshift + op + '.center);';

          _this.op_count[line] += 1;
          _this.pos[line] = _this.pos[line].add(_this._gate_width(gate)).add(_this._gate_offset(gate));
        } else {
          // regular gate must draw the lines it does not act upon
          // if it spans multiple qubits
          add_str = _this._regular_gate(gate, lines, ctrl_lines);
          lines.forEach(function (l) {
            return _this.is_quantum[l] = true;
          });
        }
        tikz_code.push(add_str);
        if (!gate.equal(_ops.Allocate)) {
          tikz_code.push(connections);
        }
      };

      for (var i = 0; i < end; ++i) {
        _loop(i);
      }

      circuit[line] = circuit[line].slice(end);
      return tikz_code.join('');
    }

    /**
      Return the string representation of the gate.
      Tries to use gate.tex_str and, if that is not available, uses str(gate) instead.
        @param {BasicGate} gate Gate object of which to get the name / latex representation.
      @return {string} Latex gate name.
    */

  }, {
    key: '_gate_name',
    value: function _gate_name(gate) {
      var name = void 0;
      if (gate.texString) {
        name = gate.texString();
      }
      name = gate.toString();
      return name;
    }

    /**
    Return the TikZ code for a Square-root Swap-gate.
        @param {number[]} lines List of length 2 denoting the target qubit of the Swap gate.
      @param {number[]} ctrl_lines List of qubit lines which act as controls.
      @param {boolean} daggered Show the daggered one if true.
     */

  }, {
    key: '_sqrtswap_gate',
    value: function _sqrtswap_gate(lines, ctrl_lines, daggered) {
      var _this2 = this;

      (0, _assert2.default)((0, _polyfill.len)(lines) === 2); // sqrt swap gate acts on 2 qubits
      var delta_pos = this._gate_offset(_ops.SqrtSwap);
      var gate_width = this._gate_width(_ops.SqrtSwap);
      lines.sort();

      var gate_str = '';
      lines.forEach(function (line) {
        var op = _this2._op(line);
        var w = new _decimal.Decimal(gate_width).mul(0.5).toString() + 'cm';
        var s1 = '[xshift=-' + w + ',yshift=-' + w + ']' + op + '.center';
        var s2 = '[xshift=' + w + ',yshift=' + w + ']' + op + '.center';
        var s3 = '[xshift=-' + w + ',yshift=' + w + ']' + op + '.center';
        var s4 = '[xshift=' + w + ',yshift=-' + w + ']' + op + '.center';
        var swap_style = 'swapstyle,edgestyle';
        if (_this2.settings.gate_shadow) {
          swap_style += ',shadowed';
        }
        gate_str += '\n\\node[swapstyle] (' + op + ') at (' + dts(_this2.pos[line]) + ',-' + line + ') {};';
        gate_str += '\n\\draw[' + swap_style + '] (' + s1 + ')--(' + s2 + ');';
        gate_str += '\n\\draw[' + swap_style + '] (' + s3 + ')--(' + s4 + ');';
      });

      // add a circled 1/2
      var midpoint = (lines[0] + lines[1]) / 2.0;
      var pos = this.pos[lines[0]];
      var op_mid = 'line' + lines[0] + '-' + lines[1] + '_gate' + this.op_count[lines[0]];
      gate_str += '\n\\node[xstyle] (' + op_mid + ') at (' + dts(pos) + ',-' + midpoint + ')                {\\scriptsize $\\frac{1}{2}' + (daggered ? '^{{\\dagger}}' : '') + '$};';

      // add two vertical lines to connect circled 1/2
      gate_str += '\n\\draw (' + this._op(lines[0]) + ') edge[edgestyle] (' + op_mid + ');';
      gate_str += '\n\\draw (' + op_mid + ') edge[edgestyle] (' + this._op(lines[1]) + ');';

      ctrl_lines.forEach(function (ctrl) {
        gate_str += _this2._phase(ctrl, _this2.pos[lines[0]]);
        if (ctrl > lines[1] || ctrl < lines[0]) {
          var closer_line = lines[0];
          if (ctrl > lines[1]) {
            closer_line = lines[1];
          }
          gate_str += _this2._line(ctrl, closer_line);
        }
      });

      var all_lines = ctrl_lines.concat(lines);
      var new_pos = this.pos[lines[0]].add(delta_pos).add(gate_width);
      all_lines.forEach(function (i) {
        return _this2.op_count[i] += 1;
      });

      var _minmax3 = minmax(all_lines),
          _minmax4 = _slicedToArray(_minmax3, 2),
          min = _minmax4[0],
          max = _minmax4[1];

      for (var i = min; i < max + 1; ++i) {
        this.pos[i] = new_pos;
      }
      return gate_str;
    }

    /**
    Return the TikZ code for a Swap-gate.
        @param {number[]} lines List of length 2 denoting the target qubit of the Swap gate.
      @param {number[]} ctrl_lines List of qubit lines which act as controls.
    */

  }, {
    key: '_swap_gate',
    value: function _swap_gate(lines, ctrl_lines) {
      var _this3 = this;

      (0, _assert2.default)((0, _polyfill.len)(lines) === 2); // swap gate acts on 2 qubits
      var delta_pos = this._gate_offset(_ops.Swap);
      var gate_width = this._gate_width(_ops.Swap);
      lines.sort();

      var gate_str = '';
      lines.forEach(function (line) {
        var op = _this3._op(line);
        var w = new _decimal.Decimal(gate_width).mul(0.5) + 'cm';
        var s1 = '[xshift=-' + w + ',yshift=-' + w + ']' + op + '.center';
        var s2 = '[xshift=' + w + ',yshift=' + w + ']' + op + '.center';
        var s3 = '[xshift=-' + w + ',yshift=' + w + ']' + op + '.center';
        var s4 = '[xshift=' + w + ',yshift=-' + w + ']' + op + '.center';
        var swap_style = 'swapstyle,edgestyle';
        if (_this3.settings.gate_shadow) {
          swap_style += ',shadowed';
        }
        gate_str += '\n\\node[swapstyle] (' + op + ') at (' + dts(_this3.pos[line]) + ',-' + line + ') {};';
        gate_str += '\n\\draw[' + swap_style + '] (' + s1 + ')--(' + s2 + ');';
        gate_str += '\n\\draw[' + swap_style + '] (' + s3 + ')--(' + s4 + ');';
      });

      gate_str += this._line(lines[0], lines[1]);

      ctrl_lines.forEach(function (ctrl) {
        gate_str += _this3._phase(ctrl, _this3.pos[lines[0]]);
        if (ctrl > lines[1] || ctrl < lines[0]) {
          var closer_line = lines[0];
          if (ctrl > lines[1]) {
            closer_line = lines[1];
          }
          gate_str += _this3._line(ctrl, closer_line);
        }
      });

      var all_lines = ctrl_lines.concat(lines);
      var new_pos = this.pos[lines[0]].add(delta_pos).add(gate_width);
      all_lines.forEach(function (i) {
        return _this3.op_count[i] += 1;
      });

      var _minmax5 = minmax(all_lines),
          _minmax6 = _slicedToArray(_minmax5, 2),
          min = _minmax6[0],
          max = _minmax6[1];

      for (var i = min; i < max + 1; ++i) {
        this.pos[i] = new_pos;
      }
      return gate_str;
    }

    /**
    Return the TikZ code for a NOT-gate.
        @param {number[]} lines List of length 1 denoting the target qubit of the NOT / X gate.
      @param {number[]} ctrl_lines List of qubit lines which act as controls.
     */

  }, {
    key: '_x_gate',
    value: function _x_gate(lines) {
      var _this4 = this;

      var ctrl_lines = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      (0, _assert2.default)((0, _polyfill.len)(lines) === 1); // NOT gate only acts on 1 qubit
      var line = lines[0];
      var delta_pos = this._gate_offset(_ops.X);
      var gate_width = this._gate_width(_ops.X);
      var op = this._op(line);
      var gate_str = '\n\\node[xstyle] (' + op + ') at (' + dts(this.pos[line]) + ',-' + line + ') {};';
      gate_str += '\n\\draw[edgestyle] (' + op + '.north)--(' + op + '.south);';
      gate_str += '\n\\draw[edgestyle] (' + op + '.west)--(' + op + '.east);';

      ctrl_lines.forEach(function (ctrl) {
        gate_str += _this4._phase(ctrl, _this4.pos[line]);
        gate_str += _this4._line(ctrl, line);
      });

      ctrl_lines.push(line);
      var all_lines = ctrl_lines;
      var new_pos = this.pos[line].add(delta_pos).add(gate_width);
      all_lines.forEach(function (i) {
        return _this4.op_count[i] += 1;
      });

      var _minmax7 = minmax(all_lines),
          _minmax8 = _slicedToArray(_minmax7, 2),
          min = _minmax8[0],
          max = _minmax8[1];

      for (var i = min; i < max + 1; ++i) {
        this.pos[i] = new_pos;
      }
      return gate_str;
    }

    /**
    Return the TikZ code for an n-controlled Z-gate.
        @param {number[]} lines List of all qubits involved.
     */

  }, {
    key: '_cz_gate',
    value: function _cz_gate(lines) {
      var _this5 = this;

      (0, _assert2.default)((0, _polyfill.len)(lines) > 1);
      var line = lines[0];
      var delta_pos = this._gate_offset(_ops.Z);
      var gate_width = this._gate_width(_ops.Z);
      var gate_str = this._phase(line, this.pos[line]);

      lines.slice(1).forEach(function (ctrl) {
        gate_str += _this5._phase(ctrl, _this5.pos[line]);
        gate_str += _this5._line(ctrl, line);
      });

      var new_pos = this.pos[line].add(delta_pos).add(gate_width);
      lines.forEach(function (i) {
        return _this5.op_count[i] += 1;
      });

      var _minmax9 = minmax(lines),
          _minmax10 = _slicedToArray(_minmax9, 2),
          min = _minmax10[0],
          max = _minmax10[1];

      for (var i = min; i < max + 1; ++i) {
        this.pos[i] = new_pos;
      }
      return gate_str;
    }

    /**
    Return the gate width, using the settings (if available).
        @return {number} Width of the gate. (settings['gates'][gate_class_name]['width'])
    */

  }, {
    key: '_gate_width',
    value: function _gate_width(gate) {
      if (gate instanceof _ops.DaggeredGate) {
        gate = gate.gate;
      }

      var gates = this.settings.gates;

      var config = gates[gate.constructor.name] || {};
      return config.width || 0.5;
    }

    /**
    Return the offset to use before placing this gate.
        @return {number} Offset to use before the gate. (settings['gates'][gate_class_name]['pre_offset'])
     */

  }, {
    key: '_gate_pre_offset',
    value: function _gate_pre_offset(gate) {
      if (gate instanceof _ops.DaggeredGate) {
        gate = gate._gate;
      }

      var gates = this.settings.gates;

      return gates[gate.constructor.name].pre_offset || this._gate_offset(gate);
    }

    /**
    Return the offset to use after placing this gate and, if no pre_offset
    is defined, the same offset is used in front of the gate.
        @return {number} Offset. (settings['gates'][gate_class_name]['offset'])
     */

  }, {
    key: '_gate_offset',
    value: function _gate_offset(gate) {
      if (gate instanceof _ops.DaggeredGate) {
        gate = gate.gate;
      }
      var gates = this.settings.gates;

      var config = gates[gate.constructor.name] || {};
      return config.offset || 0.2;
    }

    /**
    Return the height to use for this gate.
        @return {number} Height of the gate. (settings['gates'][gate_class_name]['height'])
     */

  }, {
    key: '_gate_height',
    value: function _gate_height(gate) {
      if (gate instanceof _ops.DaggeredGate) {
        gate = gate.gate;
      }
      var config = this.settings.gates[gate.constructor.name] || {};
      return config.height || 0.5;
    }

    /**
    Places a phase / control circle on a qubit line at a given position.
        @param {number} line Qubit line at which to place the circle.
      @param {number} pos Position at which to place the circle.
      @return {string} Latex string representing a control circle at the given position.
     */

  }, {
    key: '_phase',
    value: function _phase(line, pos) {
      return '\n\\node[phase] (' + this._op(line) + ') at (' + dts(pos) + ',-' + line + ') {};';
    }

    /**
    Returns the gate name for placing a gate on a line.
        @param {number} line Line number.
      @param {?number} op Operation number or, by default, uses the current op count.
      @param {number} offset
      @return {string} Gate name.
     */

  }, {
    key: '_op',
    value: function _op(line) {
      var op = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (op === null) {
        op = this.op_count[line] || 0;
      }
      return 'line' + line + '_gate' + (op + offset);
    }

    /**
    Connects p1 and p2, where p1 and p2 are either to qubit line indices,
    in which case the two most recent gates are connected, or two gate
    indices, in which case line denotes the line number and the two gates
    are connected on the given line.
        @param {number} p1 Index of the first object to connect.
      @param {number} p2 Index of the second object to connect.
      @param {number} line (int or null) Line index - if provided, p1 and p2 are gate indices.
        @return {string} Latex code to draw this / these line(s).
     */

  }, {
    key: '_line',
    value: function _line(p1, p2) {
      var line = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      var dbl_classical = this.settings.lines.double_classical;

      var quantum = void 0;
      var op1 = void 0;
      var op2 = void 0;
      var loc1 = void 0;
      var loc2 = void 0;
      var shift = void 0;
      if (line === null) {
        quantum = !dbl_classical || this.is_quantum[p1];
        op1 = this._op(p1);
        op2 = this._op(p2);
        loc1 = 'north';
        loc2 = 'south';
        shift = 'xshift=';
      } else {
        quantum = !dbl_classical || this.is_quantum[line];
        op1 = this._op(line, p1);
        op2 = this._op(line, p2);
        loc1 = 'west';
        loc2 = 'east';
        shift = 'yshift=';
      }
      if (quantum) {
        return '\n\\draw (' + op1 + ') edge[edgestyle] (' + op2 + ');';
      } else {
        if (p2 > p1) {
          var _tmp = loc1;
          loc1 = loc2;
          loc2 = _tmp;
        }
        var line_sep = this.settings.lines.double_lines_sep;
        var shift1 = '' + shift + line_sep / 2.0 + 'cm';
        var shift2 = '' + shift + -line_sep / 2.0 + 'cm';
        var edges_str = '\n\\draw ([' + shift1 + ']' + op1 + '.' + loc1 + ') edge[edgestyle] ([' + shift2 + ']' + op2 + '.' + loc2 + ');';
        edges_str += '\n\\draw ([' + shift2 + ']' + op1 + '.' + loc1 + ') edge[edgestyle] ([' + shift2 + ']' + op2 + '.' + loc2 + ');';
        return edges_str;
      }
    }

    /**
    Draw a regular gate.
        @param {BasicGate} gate Gate to draw.
      @param {number[]} lines Lines the gate acts on.
     @param {number[]} ctrl_lines Control lines.
        @return {string} Latex string drawing a regular gate at the given location
     */

  }, {
    key: '_regular_gate',
    value: function _regular_gate(gate, lines, ctrl_lines) {
      var _this6 = this;

      var _minmax11 = minmax(lines),
          _minmax12 = _slicedToArray(_minmax11, 2),
          imin = _minmax12[0],
          imax = _minmax12[1];

      var gate_lines = lines.concat(ctrl_lines);

      var delta_pos = this._gate_offset(gate);
      var gate_width = this._gate_width(gate);
      var gate_height = this._gate_height(gate);

      var name = this._gate_name(gate);

      lines = [];
      for (var i = imin; i < imax + 1; ++i) {
        lines.push(i);
      }

      var tex_str = '';
      var pos = this.pos[lines[0]];

      lines.forEach(function (l) {
        var node1 = '\n\\node[none] (' + _this6._op(l) + ') at (' + dts(pos) + ',-' + l + ') {};';
        var at = pos.add(new _decimal.Decimal(gate_width).div(2.0)).toString();
        var node2 = '\n\\node[none,minimum height=' + gate_height + 'cm,outer sep=0] (' + _this6._op(l, null, 1) + ') at (' + at + ',-' + l + ') {};';
        var node3 = '\n\\node[none] (' + _this6._op(l, null, 2) + ') at (' + dts(pos.add(gate_width)) + ',-' + l + ') {};';
        tex_str += node1 + node2 + node3;
        if (!gate_lines.includes(l)) {
          tex_str += _this6._line(_this6.op_count[l] - 1, _this6.op_count[l], l);
        }
      });

      var half_height = 0.5 * gate_height;
      var op1 = this._op(imin);
      var op2 = this._op(imax, null, 2);
      tex_str += '\n\\draw[operator,edgestyle,outer sep=' + gate_width + 'cm] ([yshift=' + half_height + 'cm]' + op1 + ') rectangle ([yshift=-' + half_height + 'cm]' + op2 + ') node[pos=.5] {' + name + '};';

      lines.forEach(function (l) {
        _this6.pos[l] = new _decimal.Decimal(pos).add(new _decimal.Decimal(gate_width).div(2.0));
        _this6.op_count[l] += 1;
      });

      ctrl_lines.forEach(function (ctrl) {
        if (!lines.includes(ctrl)) {
          tex_str += _this6._phase(ctrl, pos.add(new _decimal.Decimal(gate_width).div(2.0)));
          var connect_to = imax;
          if (Math.abs(connect_to - ctrl) > Math.abs(imin - ctrl)) {
            connect_to = imin;
          }
          tex_str += _this6._line(ctrl, connect_to);
          _this6.pos[ctrl] = new _decimal.Decimal(pos).add(delta_pos).add(gate_width);
          _this6.op_count[ctrl] += 1;
        }
      });

      lines.forEach(function (l) {
        return _this6.op_count[l] += 2;
      });

      var all = ctrl_lines.concat(lines);

      var _minmax13 = minmax(all),
          _minmax14 = _slicedToArray(_minmax13, 2),
          min = _minmax14[0],
          max = _minmax14[1];

      for (var l = min; l < max + 1; ++l) {
        this.pos[l] = pos.add(delta_pos).add(gate_width);
      }
      return tex_str;
    }
  }]);

  return _Circ2Tikz;
}();

/**
 * @ignore
 */


exports.default = _exports;