import assert from 'assert'
import {BasicEngine} from './basics'
import {ComputeTag, UncomputeTag} from '../meta/tag'
import {instanceOf} from '../libs/util'

/*
TagRemover is a compiler engine which removes temporary command tags (see
the tag classes such as LoopTag in projectq.meta._loop).

Removing tags is important (after having handled them if necessary) in
order to enable optimizations across meta-function boundaries (compute/
action/uncompute or loops after unrolling)
 */
export default class TagRemover extends BasicEngine {
  /*
    Construct the TagRemover.

    Args:
tags: A list of meta tag classes (e.g., [ComputeTag, UncomputeTag])
denoting the tags to remove
     */
  constructor(tags = [ComputeTag, UncomputeTag]) {
    super()
    assert(Array.isArray(tags))
    this._tags = tags
  }

  _isTagIn(tag) {
    return instanceOf(tag, this._tags)
  }

  /*
    Receive a list of commands from the previous engine, remove all tags
which are an instance of at least one of the meta tags provided in the
constructor, and then send them on to the next compiler engine.

    Args:
command_list (list<Command>): List of commands to receive and then
(after removing tags) send on.
     */
  receive(commandList) {
    commandList.forEach((cmd) => {
      cmd.tags = cmd.tags.filter(t => !this._isTagIn(t))
      this.send([cmd])
    })
  }
}
