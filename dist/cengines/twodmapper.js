'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Position = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _itertools = require('itertools');

var _basicmapper = require('./basicmapper');

var _basicmapper2 = _interopRequireDefault(_basicmapper);

var _linearmapper = require('./linearmapper');

var _linearmapper2 = _interopRequireDefault(_linearmapper);

var _cppsim = require('../backends/simulators/cppsim');

var _cppsim2 = _interopRequireDefault(_cppsim);

var _polyfill = require('../libs/polyfill');

var _ops = require('../ops');

var _util = require('../libs/util');

var _command = require('../ops/command');

var _command2 = _interopRequireDefault(_command);

var _qubit = require('../types/qubit');

var _meta = require('../meta');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /*
                                                                                                                                                          Mapper for a quantum circuit to a 2D square grid.
                                                                                                                                                          
                                                                                                                                                              Input: Quantum circuit with 1 and 2 qubit gates on n qubits. Gates are assumed
                                                                                                                                                          to be applied in parallel if they act on disjoint qubit(s) and any pair
                                                                                                                                                          of qubits can perform a 2 qubit gate (all-to-all connectivity)
                                                                                                                                                          Output: Quantum circuit in which qubits are placed in 2-D square grid in which
                                                                                                                                                          only nearest neighbour qubits can perform a 2 qubit gate. The mapper
                                                                                                                                                          uses Swap gates in order to move qubits next to each other.
                                                                                                                                                          */


/**
 * @class Position
 */
var Position =
/**
 * @constructor
 * @param {number} current_row
 * @param {number} current_column
 * @param {number} final_row
 * @param {number} final_column
 * @param {number} row_after_step_1
 */
exports.Position = function Position(current_row, current_column, final_row, final_column, row_after_step_1) {
  _classCallCheck(this, Position);

  this.current_row = current_row;
  this.current_column = current_column;
  this.final_row = final_row;
  this.final_column = final_column;
  this.row_after_step_1 = row_after_step_1;
};

/**
 * @class GridMapper
 * @desc
Mapper to a 2-D grid graph.

    Mapped qubits on the grid are numbered in row-major order. E.g. for
3 rows and 2 columns:
  ```js
    0 - 1
    |   |
    2 - 3
    |   |
    4 - 5
  ```
The numbers are the mapped qubit ids. The backend might number
the qubits on the grid differently (e.g. not row-major), we call these
backend qubit ids. If the backend qubit ids are not row-major, one can
pass a dictionary translating from our row-major mapped ids to these
backend ids.

    Note: The algorithm sorts twice inside each column and once inside each
row.

 @property current_mapping Stores the mapping: key is logical qubit id, value is backend qubit id.
storage(int): Number of gate it caches before mapping.
num_rows(int): Number of rows in the grid
num_columns(int): Number of columns in the grid
num_qubits(int): num_rows x num_columns = number of qubits
num_mappings (int): Number of times the mapper changed the mapping
depth_of_swaps (dict): Key are circuit depth of swaps, value is the
number of such mappings which have been
applied
num_of_swaps_per_mapping (dict): Key are the number of swaps per
mapping, value is the number of such
mappings which have been applied
 */


var GridMapper = function (_BasicMapperEngine) {
  _inherits(GridMapper, _BasicMapperEngine);

  /**
   * @constructor
  Initialize a GridMapper compiler engine.
      @param {{num_rows: number, num_columns: number, mapped_ids_to_backend_ids: ?Object, storage: ?number, optimization_function: ?function, num_optimization_steps: ?number}} args
    @throws {Error} if incorrect `mapped_ids_to_backend_ids` parameter
   */
  function GridMapper(args) {
    _classCallCheck(this, GridMapper);

    /**
     * @type {Object}
     * @property {number} args.num_rows
     */
    var _this = _possibleConstructorReturn(this, (GridMapper.__proto__ || Object.getPrototypeOf(GridMapper)).call(this));

    var num_rows = args.num_rows,
        num_columns = args.num_columns,
        mapped_ids_to_backend_ids = args.mapped_ids_to_backend_ids,
        _args$storage = args.storage,
        storage = _args$storage === undefined ? 1000 : _args$storage,
        _args$optimization_fu = args.optimization_function,
        optimization_function = _args$optimization_fu === undefined ? function (x) {
      return (0, _linearmapper.return_swap_depth)(x);
    } : _args$optimization_fu,
        _args$num_optimizatio = args.num_optimization_steps,
        num_optimization_steps = _args$num_optimizatio === undefined ? 50 : _args$num_optimizatio;

    /**
     * @property {number} this.num_rows Number of rows in the grid
     * @property {number} this.num_columns Number of columns in the grid.
     * @property {number} this.num_qubits
     * @property {Object<number, number>} this._mapped_ids_to_backend_ids
     * @property {Object<number, number>} this._backend_ids_to_mapped_ids
     *      Stores a mapping from mapped ids which are 0,...,this.num_qubits-1 in row-major order
     *      on the grid to the corresponding qubit ids of the backend. Key: mapped id. Value: corresponding backend id.
     *      Default is None which means backend ids are identical to mapped ids.
     * @property {Object<number, number>} this._current_row_major_mapping
     * @property {number} this.storage Number of gates to temporarily store
     * @property {function} this.optimization_function
     *      Function which takes a list of swaps and returns a cost value. Mapper chooses a permutation
     *      which minimizes this cost. Default optimizes for circuit depth.
     * @property {number} this.num_optimization_steps
     *      Number of different permutations to of the matching to try and minimize the cost.
     * @property {number} this.num_mappings
     * @property {Object<number, number>} this.depth_of_swaps
     * @property {Object<number, number>} this.num_of_swaps_per_mapping
     */

    _this.num_rows = num_rows;
    _this.num_columns = num_columns;
    _this.num_qubits = num_rows * num_columns;
    // Internally we use the mapped ids until sending a command.
    // Before sending we use this map to translate to backend ids:
    _this._mapped_ids_to_backend_ids = mapped_ids_to_backend_ids;
    if (typeof _this._mapped_ids_to_backend_ids === 'undefined' || _this._mapped_ids_to_backend_ids === null) {
      _this._mapped_ids_to_backend_ids = {};
      for (var i = 0; i < _this.num_qubits; ++i) {
        _this._mapped_ids_to_backend_ids[i] = i;
      }
    }

    var f1 = (0, _polyfill.setEqual)(new Set(Object.keys(_this._mapped_ids_to_backend_ids).map(function (k) {
      return parseInt(k, 10);
    })), (0, _polyfill.setFromRange)(_this.num_qubits));
    var f2 = new Set(Object.values(_this._mapped_ids_to_backend_ids)).size === _this.num_qubits;
    if (!f1 || !f2) {
      throw new Error('Incorrect mapped_ids_to_backend_ids parameter');
    }
    _this._backend_ids_to_mapped_ids = {};

    Object.keys(_this._mapped_ids_to_backend_ids).forEach(function (mapped_id) {
      var backend_id = _this._mapped_ids_to_backend_ids[mapped_id];
      _this._backend_ids_to_mapped_ids[backend_id] = mapped_id;
    });
    // As we use internally the mapped ids which are in row-major order,
    // we have an internal current mapping which maps from logical ids to
    // these mapped ids:
    _this._current_row_major_mapping = Object.assign({}, _this._currentMapping);
    _this.storage = storage;
    _this.optimization_function = optimization_function;
    _this.num_optimization_steps = num_optimization_steps;
    // Randomness to pick permutations if there are too many.
    // This creates an own instance of Random in order to not influence
    // the bound methods of the random module which might be used in other
    // places.
    // TODO
    // this._rng = random.Random(11)
    /**
     * Storing commands
     * @property {Command[]} this._stored_commands
     */
    _this._stored_commands = [];
    /** Logical qubit ids for which the Allocate gate has already been
      processed and sent to the next engine but which are not yet deallocated:
      @property {Set<number>} this._currently_allocated_ids
     */
    _this._currently_allocated_ids = new Set();
    /**
     * Change between 2D and 1D mappings (2D is a snake like 1D chain)
        Note it translates to our mapped ids in row major order and not
        backend ids which might be different.
     * @property {Object<number, number>} this._map_2d_to_1d
     * @property {Object<number, number>} this._map_1d_to_2d
    */
    _this._map_2d_to_1d = {};
    _this._map_1d_to_2d = {};
    for (var row_index = 0; row_index < _this.num_rows; ++row_index) {
      for (var column_index = 0; column_index < _this.num_columns; ++column_index) {
        if (row_index % 2 === 0) {
          var mapped_id = row_index * _this.num_columns + column_index;
          _this._map_2d_to_1d[mapped_id] = mapped_id;
          _this._map_1d_to_2d[mapped_id] = mapped_id;
        } else {
          var mapped_id_2d = row_index * _this.num_columns + column_index;
          var mapped_id_1d = (row_index + 1) * _this.num_columns - column_index - 1;
          _this._map_2d_to_1d[mapped_id_2d] = mapped_id_1d;
          _this._map_1d_to_2d[mapped_id_1d] = mapped_id_2d;
        }
      }
    }

    /**
     * Statistics
      */
    _this.num_mappings = 0;
    _this.depth_of_swaps = {};
    _this.num_of_swaps_per_mapping = {};
    return _this;
  }

  _createClass(GridMapper, [{
    key: 'isAvailable',


    // Only allows 1 || two qubit gates.
    value: function isAvailable(cmd) {
      var num_qubits = 0;
      cmd.allQubits.forEach(function (qureg) {
        return num_qubits += qureg.length;
      });
      return num_qubits <= 2;
    }

    /**
    Returns a new mapping of the qubits.
        It goes through this._saved_commands and tries to find a
    mapping to apply these gates on a first come first served basis.
      It reuses the function of a 1D mapper and creates a mapping for a
    1D linear chain and then wraps it like a snake onto the square grid.
        One might create better mappings by specializing this function for a
    square grid.
        @return {Object} A new mapping as a dict. key is logical qubit id, value is mapped id
     */

  }, {
    key: 'returnNewMapping',
    value: function returnNewMapping() {
      var _this2 = this;

      // Change old mapping to 1D in order to use LinearChain heuristic
      var old_mapping_1d = void 0;
      if (this._current_row_major_mapping) {
        old_mapping_1d = {};
        Object.keys(this._current_row_major_mapping).forEach(function (logical_id) {
          var mapped_id = _this2._current_row_major_mapping[logical_id];
          old_mapping_1d[logical_id] = _this2._map_2d_to_1d[mapped_id];
        });
      } else {
        old_mapping_1d = this._current_row_major_mapping;
      }

      var new_mapping_1d = _linearmapper2.default.returnNewMapping(this.num_qubits, false, this._currently_allocated_ids, this._stored_commands, old_mapping_1d);

      var new_mapping_2d = {};
      Object.keys(new_mapping_1d).forEach(function (logical_id) {
        var mapped_id = new_mapping_1d[logical_id];
        new_mapping_2d[logical_id] = _this2._map_1d_to_2d[mapped_id];
      });

      return new_mapping_2d;
    }

    /**
     * If swapped (inplace), then return swap operation so that `key(element0) < key(element1)`
     @param {Position} element0
     @param {Position} element1
     @param {function(arg: Position): number} key
     @return {Array<number>|undefined}
     */

  }, {
    key: '_compareAndSwap',
    value: function _compareAndSwap(element0, element1, key) {
      if (key(element0) > key(element1)) {
        var mapped_id0 = element0.current_column + element0.current_row * this.num_columns;
        var mapped_id1 = element1.current_column + element1.current_row * this.num_columns;
        var swap_operation = [mapped_id0, mapped_id1];
        // swap elements but update also current position:
        var tmp_0 = element0.final_row;
        var tmp_1 = element0.final_column;
        var tmp_2 = element0.row_after_step_1;
        element0.final_row = element1.final_row;
        element0.final_column = element1.final_column;
        element0.row_after_step_1 = element1.row_after_step_1;
        element1.final_row = tmp_0;
        element1.final_column = tmp_1;
        element1.row_after_step_1 = tmp_2;
        return swap_operation;
      }
      return undefined;
    }

    /**
     * @param {Array<Position[]>} final_positions
     * @param {function(arg: Position): number} key
     * @return {Array<number[]>}
     * @private
     */

  }, {
    key: '_sortWithinRows',
    value: function _sortWithinRows(final_positions, key) {
      var swap_operations = [];
      for (var row = 0; row < this.num_rows; ++row) {
        var finished_sorting = false;
        while (!finished_sorting) {
          finished_sorting = true;
          for (var column = 1; column < this.num_columns - 1; column += 2) {
            var element0 = final_positions[row][column];
            var element1 = final_positions[row][column + 1];
            var swap = this._compareAndSwap(element0, element1, key);
            if (typeof swap !== 'undefined') {
              finished_sorting = false;
              swap_operations.push(swap);
            }
          }

          for (var _column = 0; _column < this.num_columns - 1; _column += 2) {
            var _element = final_positions[row][_column];
            var _element2 = final_positions[row][_column + 1];
            var _swap = this._compareAndSwap(_element, _element2, key);
            if (typeof _swap !== 'undefined') {
              finished_sorting = false;
              swap_operations.push(_swap);
            }
          }
        }
      }
      return swap_operations;
    }

    /**
     * @param {Array<Position[]>} final_positions
     * @param {function(arg: Position): number} key
     * @return {Array<number[]>}
     * @private
     */

  }, {
    key: '_sortWithinColumns',
    value: function _sortWithinColumns(final_positions, key) {
      var swap_operations = [];
      for (var column = 0; column < this.num_columns; ++column) {
        var finished_sorting = false;
        while (!finished_sorting) {
          finished_sorting = true;
          for (var row = 1; row < this.num_rows - 1; row += 2) {
            var element0 = final_positions[row][column];
            var element1 = final_positions[row + 1][column];
            var swap = this._compareAndSwap(element0, element1, key);
            if (typeof swap !== 'undefined') {
              finished_sorting = false;
              swap_operations.push(swap);
            }
          }

          for (var _row = 0; _row < this.num_rows - 1; _row += 2) {
            var _element3 = final_positions[_row][column];
            var _element4 = final_positions[_row + 1][column];
            var _swap2 = this._compareAndSwap(_element3, _element4, key);
            if (typeof _swap2 !== 'undefined') {
              finished_sorting = false;
              swap_operations.push(_swap2);
            }
          }
        }
      }
      return swap_operations;
    }

    /**
    Creates a new mapping and executes possible gates.
        It first allocates all 0, ..., this.num_qubits-1 mapped qubit ids, if
      they are not already used because we might need them all for the
    swaps. Then it creates a new map, swaps all the qubits to the new map,
      executes all possible gates, and finally deallocates mapped qubit ids
    which don't store any information.
     */

  }, {
    key: '_run',
    value: function _run() {
      var _this3 = this;

      var num_of_stored_commands_before = (0, _polyfill.len)(this._stored_commands);
      if (!this._currentMapping) {
        this.currentMapping = {};
      } else {
        this._sendPossibleCommands();
        if ((0, _polyfill.len)(this._stored_commands) === 0) {
          return;
        }
      }

      var new_row_major_mapping = this.returnNewMapping();
      // Find permutation of matchings with lowest cost
      var swaps = void 0;
      var lowest_cost = void 0;
      var matchings_numbers = (0, _polyfill.arrayFromRange)(this.num_rows);
      var ps = [];
      if (this.num_optimization_steps <= _mathjs2.default.factorial(this.num_rows)) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _itertools.permutations)(matchings_numbers, this.num_rows)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var looper = _step.value;

            ps.push(looper);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else {
        for (var i = 0; i < this.num_optimization_steps; ++i) {
          ps.push((0, _polyfill.randomSample)(matchings_numbers, this.num_rows));
        }
      }

      ps.forEach(function (permutation) {
        var trial_swaps = _this3.returnSwaps(_this3._current_row_major_mapping, new_row_major_mapping, permutation);
        if (typeof swaps === 'undefined') {
          swaps = trial_swaps;
          lowest_cost = _this3.optimization_function(trial_swaps);
        } else if (lowest_cost > _this3.optimization_function(trial_swaps)) {
          swaps = trial_swaps;
          lowest_cost = _this3.optimization_function(trial_swaps);
        }
      });
      if (swaps.length > 0) {
        // first mapping requires no swaps
        // Allocate all mapped qubit ids (which are not already allocated,
        // i.e., contained in this._currently_allocated_ids)
        var mapped_ids_used = new Set();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this._currently_allocated_ids[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var logical_id = _step2.value;

            mapped_ids_used.add(this._current_row_major_mapping[logical_id]);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        var not_allocated_ids = (0, _polyfill.setDifference)((0, _polyfill.setFromRange)(this.num_qubits), mapped_ids_used);
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = not_allocated_ids[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var mapped_id = _step3.value;

            var qb = new _qubit.BasicQubit(this, this._mapped_ids_to_backend_ids[mapped_id]);
            var cmd = new _command2.default(this, new _ops.AllocateQubitGate(), (0, _util.tuple)([qb]));
            this.send([cmd]);
          }

          // Send swap operations to arrive at new_mapping:
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        swaps.forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              qubit_id0 = _ref2[0],
              qubit_id1 = _ref2[1];

          var q0 = new _qubit.BasicQubit(_this3, _this3._mapped_ids_to_backend_ids[qubit_id0]);
          var q1 = new _qubit.BasicQubit(_this3, _this3._mapped_ids_to_backend_ids[qubit_id1]);
          var cmd = new _command2.default(_this3, _ops.Swap, (0, _util.tuple)([q0], [q1]));
          _this3.send([cmd]);
        });
        // Register statistics:
        this.num_mappings += 1;
        var depth = (0, _linearmapper.return_swap_depth)(swaps);
        if (!(depth in this.depth_of_swaps)) {
          this.depth_of_swaps[depth] = 1;
        } else {
          this.depth_of_swaps[depth] += 1;
        }
        if (!((0, _polyfill.len)(swaps) in this.num_of_swaps_per_mapping)) {
          this.num_of_swaps_per_mapping[(0, _polyfill.len)(swaps)] = 1;
        } else {
          this.num_of_swaps_per_mapping[(0, _polyfill.len)(swaps)] += 1;
        }
        // Deallocate all previously mapped ids which we only needed for the
        // swaps:
        mapped_ids_used = new Set();
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this._currently_allocated_ids[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _logical_id = _step4.value;

            mapped_ids_used.add(new_row_major_mapping[_logical_id]);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        var not_needed_anymore = (0, _polyfill.setDifference)((0, _polyfill.setFromRange)(this.num_qubits), mapped_ids_used);
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = not_needed_anymore[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _mapped_id = _step5.value;

            var qb = new _qubit.BasicQubit(this, this._mapped_ids_to_backend_ids[_mapped_id]);
            var cmd = new _command2.default(this, new _ops.DeallocateQubitGate(), (0, _util.tuple)([qb]));
            this.send([cmd]);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }

      // Change to new map:
      this._current_row_major_mapping = new_row_major_mapping;
      var new_mapping = {};
      Object.keys(new_row_major_mapping).forEach(function (logical_id) {
        var mapped_id = new_row_major_mapping[logical_id];
        new_mapping[logical_id] = _this3._mapped_ids_to_backend_ids[mapped_id];
      });

      this.currentMapping = new_mapping;
      // Send possible gates
      this._sendPossibleCommands();
      // Check that mapper actually made progress
      if ((0, _polyfill.len)(this._stored_commands) === num_of_stored_commands_before) {
        throw new Error('Mapper is potentially in an infinite loop. ' + 'It is likely that the algorithm requires ' + 'too many qubits. Increase the number of ' + 'qubits for this mapper.');
      }
    }

    /**
    Sends the stored commands possible without changing the mapping.
      Note: this._current_row_major_mapping (hence also this.currentMapping) must exist already
     */

  }, {
    key: '_sendPossibleCommands',
    value: function _sendPossibleCommands() {
      var active_ids = new Set(Array.from(this._currently_allocated_ids).map(function (k) {
        return parseInt(k, 10);
      }));
      Object.keys(this._current_row_major_mapping).forEach(function (logical_id) {
        return active_ids.add(parseInt(logical_id, 10));
      });

      var new_stored_commands = [];
      for (var i = 0; i < this._stored_commands.length; ++i) {
        var cmd = this._stored_commands[i];
        if ((0, _polyfill.len)(active_ids) === 0) {
          new_stored_commands = new_stored_commands.concat(this._stored_commands.slice(i));
          break;
        }
        if (cmd.gate instanceof _ops.AllocateQubitGate) {
          var qid = cmd.qubits[0][0].id;
          if (qid in this._current_row_major_mapping) {
            this._currently_allocated_ids.add(qid);
            var mapped_id = this._current_row_major_mapping[qid];
            var qb = new _qubit.BasicQubit(this, this._mapped_ids_to_backend_ids[mapped_id]);
            var new_cmd = new _command2.default(this, new _ops.AllocateQubitGate(), (0, _util.tuple)([qb]), [], [new _meta.LogicalQubitIDTag(qid)]);
            this.send([new_cmd]);
          } else {
            new_stored_commands.push(cmd);
          }
        } else if (cmd.gate instanceof _ops.DeallocateQubitGate) {
          var _qid = cmd.qubits[0][0].id;
          if (active_ids.has(_qid)) {
            var _mapped_id2 = this._current_row_major_mapping[_qid];
            var _qb = new _qubit.BasicQubit(this, this._mapped_ids_to_backend_ids[_mapped_id2]);
            var _new_cmd = new _command2.default(this, new _ops.DeallocateQubitGate(), (0, _util.tuple)([_qb]), [], [new _meta.LogicalQubitIDTag(_qid)]);
            this._currently_allocated_ids.delete(_qid);
            active_ids.delete(_qid);
            delete this._current_row_major_mapping[_qid];
            delete this._currentMapping[_qid];
            this.send([_new_cmd]);
          } else {
            new_stored_commands.push(cmd);
          }
        } else {
          var send_gate = true;
          var mapped_ids = new Set();

          for (var k = 0; k < cmd.allQubits.length; ++k) {
            var qureg = cmd.allQubits[k];
            for (var j = 0; j < qureg.length; ++j) {
              var qubit = qureg[j];
              if (!active_ids.has(qubit.id)) {
                send_gate = false;
                break;
              }
              mapped_ids.add(this._current_row_major_mapping[qubit.id]);
            }
          }

          // Check that mapped ids are nearest neighbour on 2D grid
          if ((0, _polyfill.len)(mapped_ids) === 2) {
            var _Array$from$sort = Array.from(mapped_ids).sort(function (a, b) {
              return a - b;
            }),
                _Array$from$sort2 = _slicedToArray(_Array$from$sort, 2),
                qb0 = _Array$from$sort2[0],
                qb1 = _Array$from$sort2[1];

            send_gate = false;
            if (qb1 - qb0 === this.num_columns) {
              send_gate = true;
            } else if (qb1 - qb0 === 1 && qb1 % this.num_columns !== 0) {
              send_gate = true;
            }
          }
          if (send_gate) {
            // Note: This sends the cmd correctly with the backend ids
            //       as it looks up the mapping in this.currentMapping
            //       and not our internal mapping
            //       this._current_row_major_mapping
            this.sendCMDWithMappedIDs(cmd);
          } else {
            cmd.allQubits.forEach(function (qureg) {
              return qureg.forEach(function (qubit) {
                return active_ids.delete(qubit.id);
              });
            });
            new_stored_commands.push(cmd);
          }
        }
      }

      this._stored_commands = new_stored_commands;
    }

    /**
    Receives a command list and, for each command, stores it until
    we do a mapping (FlushGate || Cache of stored commands is full).
     @param {Command[]} command_list  list of commands to receive.
    */

  }, {
    key: 'receive',
    value: function receive(command_list) {
      var _this4 = this;

      command_list.forEach(function (cmd) {
        if (cmd.gate instanceof _ops.FlushGate) {
          while (_this4._stored_commands.length > 0) {
            _this4._run();
          }
          _this4.send([cmd]);
        } else {
          _this4._stored_commands.push(cmd);
        }

        if (_this4._stored_commands.length >= _this4.storage) {
          _this4._run();
        }
      });
    }

    /**
    Returns the swap operation to change mapping
        @param {Object} old_mapping dict keys are logical ids and values are mapped qubit ids
      @param {Object} new_mapping dict keys are logical ids and values are mapped qubit ids
      @param {Array.<number[]>} permutation list of int from 0, 1, ..., this.num_rows-1. It is
        used to permute the found perfect matchings. Default is None which keeps the original order.
      @return {Array.<number[]>} List of tuples. Each tuple is a swap operation which needs to be
        applied. Tuple contains the two mapped qubit ids for the Swap.
     */

  }, {
    key: 'returnSwaps',
    value: function returnSwaps(old_mapping, new_mapping, permutation) {
      var _this5 = this;

      if (typeof permutation === 'undefined') {
        permutation = (0, _polyfill.arrayFromRange)(this.num_rows);
      }
      var swap_operations = [];

      // final_positions contains info containers
      // final_position[i][j] contains info container with
      // current_row == i and current_column == j
      var final_positions = new Array(this.num_rows);
      for (var i = 0; i < this.num_rows; ++i) {
        final_positions[i] = new Array(this.num_columns);
      }

      // move qubits which are in both mappings
      var used_mapped_ids = new Set();

      Object.keys(old_mapping).forEach(function (logical_id) {
        if (logical_id in new_mapping) {
          used_mapped_ids.add(new_mapping[logical_id]);
          var old_column = old_mapping[logical_id] % _this5.num_columns;
          var old_row = Math.floor(old_mapping[logical_id] / _this5.num_columns);
          var new_column = new_mapping[logical_id] % _this5.num_columns;
          var new_row = Math.floor(new_mapping[logical_id] / _this5.num_columns);
          var info_container = new Position(old_row, old_column, new_row, new_column);
          final_positions[old_row][old_column] = info_container;
        }
      });
      // exchange all remaining None with the not yet used mapped ids
      var all_ids = (0, _polyfill.setFromRange)(this.num_qubits);
      var not_used_mapped_ids = Array.from((0, _polyfill.setDifference)(all_ids, used_mapped_ids));
      not_used_mapped_ids = not_used_mapped_ids.sort(function (a, b) {
        return b - a;
      });

      for (var row = 0; row < this.num_rows; ++row) {
        for (var column = 0; column < this.num_columns; ++column) {
          if (typeof final_positions[row][column] === 'undefined') {
            var mapped_id = not_used_mapped_ids.pop();
            var new_column = mapped_id % this.num_columns;
            var new_row = Math.floor(mapped_id / this.num_columns);
            var info_container = new Position(row, column, new_row, new_column);
            final_positions[row][column] = info_container;
          }
        }
      }

      (0, _assert2.default)((0, _polyfill.len)(not_used_mapped_ids) === 0);
      var positions = [];
      final_positions.forEach(function (row) {
        return positions.push(row.map(function (item) {
          return item.final_column;
        }));
      });
      var matchings = _cppsim2.default.returnNewSwap(this.num_rows, this.num_columns, positions);
      var offset = this.num_columns;
      // permute the matchings
      var tmp = matchings.map(function (looper) {
        return Object.assign({}, looper);
      });
      for (var _i = 0; _i < this.num_rows; ++_i) {
        matchings[_i] = tmp[permutation[_i]];
      }
      // Assign row_after_step_1
      for (var _column2 = 0; _column2 < this.num_columns; ++_column2) {
        for (var row_after_step_1 = 0; row_after_step_1 < this.num_rows; ++row_after_step_1) {
          var dest_column = matchings[row_after_step_1][_column2] - offset;
          var best_element = void 0;
          for (var _row2 = 0; _row2 < this.num_rows; ++_row2) {
            var element = final_positions[_row2][_column2];
            if (typeof element.row_after_step_1 !== 'undefined') {
              continue;
            } else if (element.final_column === dest_column) {
              if (typeof best_element === 'undefined') {
                best_element = element;
              } else if (best_element.final_row > element.final_row) {
                best_element = element;
              }
            }
          }
          best_element.row_after_step_1 = row_after_step_1;
        }
      }

      // 2. Sort inside all the rows
      var swaps = this._sortWithinColumns(final_positions, function (x) {
        return x.row_after_step_1;
      });
      swap_operations = swap_operations.concat(swaps);
      // 3. Sort inside all the columns
      swaps = this._sortWithinRows(final_positions, function (x) {
        return x.final_column;
      });
      swap_operations = swap_operations.concat(swaps);
      // 4. Sort inside all the rows
      swaps = this._sortWithinColumns(final_positions, function (x) {
        return x.final_row;
      });
      swap_operations = swap_operations.concat(swaps);
      return swap_operations;
    }
  }, {
    key: 'currentMapping',
    get: function get() {
      return _get(GridMapper.prototype.__proto__ || Object.getPrototypeOf(GridMapper.prototype), 'currentMapping', this);
    },
    set: function set(newMapping) {
      var _this6 = this;

      this._currentMapping = newMapping;
      if (typeof newMapping === 'undefined' || newMapping === null) {
        this._current_row_major_mapping = newMapping;
      } else {
        this._current_row_major_mapping = {};

        Object.keys(newMapping).forEach(function (logical_id) {
          var backend_id = newMapping[logical_id];
          var value = _this6._backend_ids_to_mapped_ids[backend_id];
          _this6._current_row_major_mapping[logical_id] = parseInt(value, 10);
        });
      }
    }
  }]);

  return GridMapper;
}(_basicmapper2.default);

exports.default = GridMapper;