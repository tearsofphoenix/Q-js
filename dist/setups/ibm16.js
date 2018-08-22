'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ibmqx5_connections = undefined;
exports.getEngineList = getEngineList;

var _decompositionruleset = require('../cengines/replacer/decompositionruleset');

var _decompositionruleset2 = _interopRequireDefault(_decompositionruleset);

var _cengines = require('../cengines');

var _tagremover = require('../cengines/tagremover');

var _tagremover2 = _interopRequireDefault(_tagremover);

var _optimize = require('../cengines/optimize');

var _optimize2 = _interopRequireDefault(_optimize);

var _twodmapper = require('../cengines/twodmapper');

var _twodmapper2 = _interopRequireDefault(_twodmapper);

var _defaultrules = require('../libs/math/defaultrules');

var _defaultrules2 = _interopRequireDefault(_defaultrules);

var _decompositions = require('./decompositions');

var _decompositions2 = _interopRequireDefault(_decompositions);

var _swapandcnotflipper = require('../cengines/swapandcnotflipper');

var _swapandcnotflipper2 = _interopRequireDefault(_swapandcnotflipper);

var _grid = require('./grid');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var ibmqx5_connections = exports.ibmqx5_connections = new Set(['1,0', '1,2', '2,3', '3,4', '3,14', '5,4', '6,5', '6,7', '6,11', '7,10', '8,7', '9,8', '9,10', '11,10', '12,5', '12,11', '12,13', '13,4', '13,14', '15,0', '15,2', '15,14']);

var grid_to_physical = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 0,
  9: 15,
  10: 14,
  11: 13,
  12: 12,
  13: 11,
  14: 10,
  15: 9

  /**
   *
   * @return {BasicEngine[]}
   */
};function getEngineList() {
  var rule_set = new _decompositionruleset2.default([].concat(_toConsumableArray(_defaultrules2.default), _toConsumableArray(_decompositions2.default)));
  return [new _tagremover2.default(), new _optimize2.default(5), new _cengines.AutoReplacer(rule_set), new _cengines.InstructionFilter(_grid.high_level_gates), new _tagremover2.default(), new _optimize2.default(5), new _cengines.AutoReplacer(rule_set), new _tagremover2.default(), new _twodmapper2.default({ num_rows: 2, num_columns: 8, mapped_ids_to_backend_ids: grid_to_physical }), new _optimize2.default(5), new _swapandcnotflipper2.default(ibmqx5_connections), new _optimize2.default(5)];
}