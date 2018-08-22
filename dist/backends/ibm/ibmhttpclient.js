'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
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

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _api_url = 'https://quantumexperience.ng.bluemix.net/api/';
/**
 * @class IBMHTTPClient
 */

var IBMHTTPClient = function () {
  function IBMHTTPClient() {
    _classCallCheck(this, IBMHTTPClient);
  }

  _createClass(IBMHTTPClient, null, [{
    key: 'isOnline',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(device) {
        var url, result;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                url = 'Backends/' + device + '/queue/status';
                _context.next = 3;
                return _axios2.default.get('' + _api_url + url);

              case 3:
                result = _context.sent;
                return _context.abrupt('return', result.state);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function isOnline(_x) {
        return _ref.apply(this, arguments);
      }

      return isOnline;
    }()

    /**
    Retrieves a previously run job by its ID.
        @param {string} device Device on which the code was run / is running.
      @param {string} user IBM quantum experience user (e-mail)
      @param {string} password IBM quantum experience password
      @param {string} jobid Id of the job to retrieve
    */

  }, {
    key: 'retrieve',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(device, user, password, jobid) {
        var _ref3, _ref4, user_id, access_token;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return IBMHTTPClient.authenticate(user, password);

              case 2:
                _ref3 = _context2.sent;
                _ref4 = _slicedToArray(_ref3, 2);
                user_id = _ref4[0];
                access_token = _ref4[1];
                return _context2.abrupt('return', IBMHTTPClient.getResult(device, jobid, access_token));

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function retrieve(_x2, _x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
      }

      return retrieve;
    }()
  }, {
    key: 'sleep',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(interval) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt('return', new Promise(function (resolve) {
                  setTimeout(resolve, interval);
                }));

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function sleep(_x6) {
        return _ref5.apply(this, arguments);
      }

      return sleep;
    }()

    /**
    Sends QASM through the IBM API and runs the quantum circuit.
       @param {string} info Contains QASM representation of the circuit to run.
     @param {string} device Either 'simulator', 'ibmqx4', or 'ibmqx5'.
     @param {string} user IBM quantum experience user.
     @param {string} password IBM quantum experience user password.
     @param {number} shots Number of runs of the same circuit to collect statistics.
     @param {boolean} verbose If true, additional information is printed, such as
    measurement statistics. Otherwise, the backend simply registers
    one measurement result (same behavior as the projectq Simulator).
     */

  }, {
    key: 'send',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(info) {
        var device = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'sim_trivial_2';
        var user = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
        var password = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
        var shots = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
        var verbose = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

        var online, _ref7, _ref8, user_id, access_token, obj, execution_id, res;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;

                if (!['ibmqx4', 'ibmqx5'].includes(device)) {
                  _context4.next = 8;
                  break;
                }

                _context4.next = 4;
                return IBMHTTPClient.isOnline(device);

              case 4:
                online = _context4.sent;

                if (online) {
                  _context4.next = 8;
                  break;
                }

                console.log('The device is offline (for maintenance?). Use the simulator instead or try again later.');
                throw new Error('Device is offline');

              case 8:
                if (verbose) {
                  console.log('- Authenticating...');
                }
                _context4.next = 11;
                return IBMHTTPClient.authenticate(user, password);

              case 11:
                _ref7 = _context4.sent;
                _ref8 = _slicedToArray(_ref7, 2);
                user_id = _ref8[0];
                access_token = _ref8[1];

                if (verbose) {
                  obj = JSON.parse(info);

                  console.log('- Running code: ' + obj.qasms[0].qasm);
                }
                _context4.next = 18;
                return IBMHTTPClient.run(info, device, user_id, access_token, shots);

              case 18:
                execution_id = _context4.sent;

                if (verbose) {
                  console.log('- Waiting for results...');
                }
                _context4.next = 22;
                return IBMHTTPClient.getResult(device, execution_id, access_token);

              case 22:
                res = _context4.sent;

                if (verbose) {
                  console.log('- Done.');
                }
                return _context4.abrupt('return', res);

              case 27:
                _context4.prev = 27;
                _context4.t0 = _context4['catch'](0);

                console.log(_context4.t0);

              case 30:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[0, 27]]);
      }));

      function send(_x7) {
        return _ref6.apply(this, arguments);
      }

      return send;
    }()
  }, {
    key: 'authenticate',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
        var email = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        var password = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

        var result, _result$data, userId, id;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return _axios2.default.post(_api_url + 'users/login', { email: email, password: password });

              case 2:
                result = _context5.sent;
                _result$data = result.data, userId = _result$data.userId, id = _result$data.id;
                return _context5.abrupt('return', [userId, id]);

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function authenticate() {
        return _ref9.apply(this, arguments);
      }

      return authenticate;
    }()
  }, {
    key: 'run',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(qasm, device, user_id, access_token, shots) {
        var suffix, params, resp;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                suffix = 'Jobs';
                params = {
                  'access_token': access_token,
                  'deviceRunType': device,
                  'fromCache': 'false',
                  'shots': shots
                };
                _context6.next = 4;
                return (0, _axios2.default)({
                  method: 'post',
                  url: '' + _api_url + suffix,
                  headers: { 'Content-Type': 'application/json' },
                  data: qasm,
                  params: params
                });

              case 4:
                resp = _context6.sent;
                return _context6.abrupt('return', resp.data.id);

              case 6:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function run(_x15, _x16, _x17, _x18, _x19) {
        return _ref10.apply(this, arguments);
      }

      return run;
    }()
  }, {
    key: 'getResult',
    value: function () {
      var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(device, execution_id, access_token) {
        var num_retries = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 3000;
        var interval = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

        var suffix, status_url, retries, resp, data, qasms, result, stateResp, _stateResp$data, state, lengthQueue;

        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                suffix = 'Jobs/' + execution_id;
                status_url = _api_url + 'Backends/' + device + '/queue/status';


                console.log('Waiting for results. [Job ID: ' + execution_id + ']');

                retries = 0;

              case 4:
                if (!(retries < num_retries)) {
                  _context7.next = 27;
                  break;
                }

                _context7.next = 7;
                return _axios2.default.get('' + _api_url + suffix, { params: { access_token: access_token } });

              case 7:
                resp = _context7.sent;
                data = resp.data;
                qasms = data.qasms;

                if (!qasms) {
                  _context7.next = 14;
                  break;
                }

                result = qasms[0].result;

                if (!result) {
                  _context7.next = 14;
                  break;
                }

                return _context7.abrupt('return', result);

              case 14:
                _context7.next = 16;
                return IBMHTTPClient.sleep(interval);

              case 16:
                if (!(['ibmqx4', 'ibmqx5'].includes(device) && retries % 60 === 0)) {
                  _context7.next = 24;
                  break;
                }

                _context7.next = 19;
                return _axios2.default.get(status_url);

              case 19:
                stateResp = _context7.sent;
                _stateResp$data = stateResp.data, state = _stateResp$data.state, lengthQueue = _stateResp$data.lengthQueue;

                if (!(typeof state !== 'undefined' && !state)) {
                  _context7.next = 23;
                  break;
                }

                throw new Error('Device went offline. The ID of your submitted job is ' + execution_id);

              case 23:

                if (lengthQueue) {
                  console.log('Currently there are ' + lengthQueue + ' jobs queued for execution on ' + device + '.');
                }

              case 24:
                ++retries;
                _context7.next = 4;
                break;

              case 27:
                throw new Error('Timeout. The ID of your submitted job is ' + execution_id + '.');

              case 28:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function getResult(_x20, _x21, _x22) {
        return _ref11.apply(this, arguments);
      }

      return getResult;
    }()
  }]);

  return IBMHTTPClient;
}();

exports.default = IBMHTTPClient;