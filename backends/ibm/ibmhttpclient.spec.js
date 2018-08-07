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
  it('should test_send_real_device_online_verbose', function () {
    const qasms = {'qasms': [{'qasm': 'my qasm'}]}
    const json_qasm = JSON.stringify(qasms)
    const name = 'projectq_test'
    const access_token = "access"
    const user_id = 2016
    const code_id = 11
    const name_item = `"name":"${name}", "jsonQASM":`
    const json_body = [name_item, json_qasm].join('')
    const json_data = ['{', json_body, '}'].join('')
    const shots = 1
    const device = "ibmqx4"
    const json_data_run = ['{"qasm":', json_qasm, '}'].join('')
    const execution_id = 3
    const result_ready = [false]
    const result = "my_result"
    const request_num = [0]  // To assert correct order of calls

    // Mock of IBM server:

    // Accessing status of device. Return online.
        const status_url = 'Backends/ibmqx4/queue/status'
    if (args[0] == urljoin(_api_url_status, status_url) and
    (request_num[0] == 0 or request_num[0] == 3)):
    request_num[0] += 1
    return MockResponse({"state": True}, 200)
    // Getting result
    elif (args[0] == urljoin(_api_url,
        "Jobs/{execution_id}".format(execution_id=execution_id)) and
    kwargs["params"]["access_token"] == access_token and not
    result_ready[0] and request_num[0] == 3):
    result_ready[0] = True
    return MockResponse({"status": {"id": "NotDone"}}, 200)
    elif (args[0] == urljoin(_api_url,
        "Jobs/{execution_id}".format(execution_id=execution_id)) and
    kwargs["params"]["access_token"] == access_token and
    result_ready[0] and request_num[0] == 4):
    print("state ok")
    return MockResponse({"qasms": [{"result": result}]}, 200)

    def mocked_requests_post(*args, **kwargs):
    class MockRequest:
    def __init__(self, body="", url=""):
    this.body = body
    this.url = url

    class MockPostResponse:
    def __init__(self, json_data, text=" "):
    this.json_data = json_data
    this.text = text
    this.request = MockRequest()

    def json(self):
    return this.json_data

    def raise_for_status(self):
    pass

    # Authentication
    if (args[0] == urljoin(_api_url, "users/login") and
    kwargs["data"]["email"] == email and
    kwargs["data"]["password"] == password and
    request_num[0] == 1):
    request_num[0] += 1
    return MockPostResponse({"userId": user_id, "id": access_token})
    # Run code
    elif (args[0] == urljoin(_api_url, "Jobs") and
    kwargs["data"] == json_qasm and
    kwargs["params"]["access_token"] == access_token and
    kwargs["params"]["deviceRunType"] == device and
    kwargs["params"]["fromCache"] == "false" and
    kwargs["params"]["shots"] == shots and
    kwargs["headers"]["Content-Type"] == "application/json" and
    request_num[0] == 2):
    request_num[0] += 1
    return MockPostResponse({"id": execution_id})

    monkeypatch.setattr("requests.get", mocked_requests_get)
    monkeypatch.setattr("requests.post", mocked_requests_post)
    # Patch login data
    password = 12345
    email = "test@projectq.ch"
    monkeypatch.setitem(__builtins__, "input", lambda x: email)
    monkeypatch.setitem(__builtins__, "raw_input", lambda x: email)

    def user_password_input(prompt):
    if prompt == "IBM QE password > ":
    return password

    monkeypatch.setattr("getpass.getpass", user_password_input)

    # Code to test:
        res = _ibm_http_client.send(json_qasm,
            device="ibmqx4",
            user=None, password=None,
            shots=shots, verbose=True)
    print(res)
    assert res == result
  });
})
