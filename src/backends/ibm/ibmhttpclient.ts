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

import axios from 'axios'
const _api_url = 'https://quantumexperience.ng.bluemix.net/api/';

export default class IBMHTTPClient {
  static async isOnline(device: string) {
    const url = `Backends/${device}/queue/status`
    const result = await axios.get(`${_api_url}${url}`)
    // @ts-ignore
    return result.state;
  }

  /**
  Retrieves a previously run job by its ID.

    @param device Device on which the code was run / is running.
    @param user IBM quantum experience user (e-mail)
    @param password IBM quantum experience password
    @param jobid Id of the job to retrieve
  */
  static async retrieve(device: string, user: string, password: string, jobid: string) {
    const [user_id, access_token] = await IBMHTTPClient.authenticate(user, password)
    return IBMHTTPClient.getResult(device, jobid, access_token)
  }

  static async sleep(interval: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, interval)
    })
  }

  /**
  Sends QASM through the IBM API and runs the quantum circuit.

   @param info Contains QASM representation of the circuit to run.
   @param device Either 'simulator', 'ibmqx4', or 'ibmqx5'.
   @param user IBM quantum experience user.
   @param password IBM quantum experience user password.
   @param shots Number of runs of the same circuit to collect statistics.
   @param verbose If true, additional information is printed, such as
measurement statistics. Otherwise, the backend simply registers
one measurement result (same behavior as the projectq Simulator).
   */
  static async send(info: string, device: string = 'sim_trivial_2', user: string = '',
    password: string = '', shots: number = 1, verbose: boolean = false) {
    try {
      // check if the device is online
      if (['ibmqx4', 'ibmqx5'].includes(device)) {
        const online = await IBMHTTPClient.isOnline(device)
        if (!online) {
          console.log('The device is offline (for maintenance?). Use the simulator instead or try again later.')
          throw new Error('Device is offline')
        }
      }
      if (verbose) {
        console.log('- Authenticating...')
      }
      const [user_id, access_token] = await IBMHTTPClient.authenticate(user, password)
      if (verbose) {
        const obj = JSON.parse(info)
        console.log(`- Running code: ${obj.qasms[0].qasm}`)
      }
      const execution_id = await IBMHTTPClient.run(info, device, user_id, access_token, shots)
      if (verbose) {
        console.log('- Waiting for results...')
      }
      const res = await IBMHTTPClient.getResult(device, execution_id, access_token)
      if (verbose) {
        console.log('- Done.')
      }
      return res
    } catch (e) {
      console.log(e)
    }
  }

  static async authenticate(email = '', password = '') {
    const result = await axios.post(`${_api_url}users/login`, { email, password })
    const { userId, id } = result.data
    return [userId, id]
  }

  static async run(qasm: string, device: string, user_id: string, access_token: string, shots: number) {
    const suffix = 'Jobs'
    const params = {
      'access_token': access_token,
      'deviceRunType': device,
      'fromCache': 'false',
      'shots': shots
    }
    const resp = await axios({
      method: 'post',
      url: `${_api_url}${suffix}`,
      headers: { 'Content-Type': 'application/json' },
      data: qasm,
      params
    })

    return resp.data.id
  }

  static async getResult(device: string, execution_id: string, access_token: string, num_retries: number = 3000,
    interval: number = 1) {
    const suffix = `Jobs/${execution_id}`
    const status_url = `${_api_url}Backends/${device}/queue/status`

    console.log(`Waiting for results. [Job ID: ${execution_id}]`)

    for (let retries = 0; retries < num_retries; ++retries) {
      const resp = await axios.get(`${_api_url}${suffix}`, { params: { access_token } })
      const { data } = resp
      const { qasms } = data
      if (qasms) {
        const { result } = qasms[0]
        if (result) {
          return result
        }
      }
      await IBMHTTPClient.sleep(interval)
      if (['ibmqx4', 'ibmqx5'].includes(device) && retries % 60 === 0) {
        const stateResp = await axios.get(status_url)
        const { state, lengthQueue } = stateResp.data
        if (typeof state !== 'undefined' && !state) {
          throw new Error(`Device went offline. The ID of your submitted job is ${execution_id}`)
        }

        if (lengthQueue) {
          console.log(`Currently there are ${lengthQueue} jobs queued for execution on ${device}.`)
        }
      }
    }
    throw new Error(`Timeout. The ID of your submitted job is ${execution_id}.`)
  }
}
