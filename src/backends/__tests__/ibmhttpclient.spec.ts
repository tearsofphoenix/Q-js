/*
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

import {expect} from 'chai'

const _api_url = 'https://quantumexperience.ng.bluemix.net/api/'
const _api_url_status = 'https://quantumexperience.ng.bluemix.net/api/'

describe('ibm http client test', () => {
  it('should test_send_real_device_online_verbose', () => {
    const qasms = {'qasms': [{'qasm': 'my qasm'}]}
    const json_qasm = JSON.stringify(qasms)
    const name = 'projectq_test'
    const access_token = 'access'
    const user_id = 2016
    const code_id = 11
    const name_item = `"name":"${name}", "jsonQASM":`
    const json_body = [name_item, json_qasm].join('')
    const json_data = ['{', json_body, '}'].join('')
    const shots = 1
    const device = 'ibmqx4'
    const json_data_run = ['{"qasm":', json_qasm, '}'].join('')
    const execution_id = 3
    const result_ready = [false]
    const result = 'my_result'
    const request_num = [0] // To assert correct order of calls
  });
})
